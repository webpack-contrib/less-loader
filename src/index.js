"use strict";

const less = require("less");
const loaderUtils = require("loader-utils");
const cloneDeep = require("clone-deep");

const trailingSlash = /[\\\/]$/;

module.exports = function (source) {
    const loaderContext = this;
    const options = Object.assign(
        {
            filename: this.resource,
            paths: [],
            plugins: [],
            relativeUrls: true,
            compress: Boolean(this.minimize)
        },
        cloneDeep(loaderUtils.getOptions(this))
    );
    const cb = this.async();
    const isSync = typeof cb !== "function";
    let finalCb = cb || this.callback;
    const webpackPlugin = {
        install(less, pluginManager) {
            const WebpackFileManager = getWebpackFileManager(less, loaderContext, options);

            pluginManager.addFileManager(new WebpackFileManager());
        },
        minVersion: [2, 1, 1]
    };

    if (isSync) {
        throw new Error("Synchronous compilation is not supported anymore. See https://github.com/webpack-contrib/less-loader/issues/84");
    }

    options.plugins.push(webpackPlugin);

    if (options.sourceMap) {
        options.sourceMap = {
            outputSourceFiles: true
        };
    }

    less.render(source, options, (e, result) => {
        const cb = finalCb;
        // Less is giving us double callbacks sometimes :(
        // Thus we need to mark the callback as "has been called"

        if (!finalCb) {
            return;
        }
        finalCb = null;
        if (e) {
            cb(formatLessRenderError(e));
            return;
        }

        cb(null, result.css, result.map);
    });
};

function getWebpackFileManager(less, loaderContext, query, isSync) {
    function WebpackFileManager() {
        less.FileManager.apply(this, arguments);
    }

    WebpackFileManager.prototype = Object.create(less.FileManager.prototype);

    WebpackFileManager.prototype.supports = function (filename, currentDirectory, options, environment) {
        // Our WebpackFileManager handles all the files
        return true;
    };

    WebpackFileManager.prototype.supportsSync = function (filename, currentDirectory, options, environment) {
        return false;
    };

    WebpackFileManager.prototype.loadFile = function (filename, currentDirectory, options, environment, callback) {
        const moduleRequest = loaderUtils.urlToRequest(filename, query.root);
        // Less is giving us trailing slashes, but the context should have no trailing slash
        const context = currentDirectory.replace(trailingSlash, "");

        loaderContext.resolve(context, moduleRequest, (err, filename) => {
            if (err) {
                callback(err);
                return;
            }

            loaderContext.dependency && loaderContext.dependency(filename);
            // The default (asynchronous)
            // loadModule() accepts a request. Thus it's ok to not use path.resolve()
            loaderContext.loadModule("-!" + __dirname + "/stringify.loader.js!" + filename, (err, data) => { // eslint-disable-line no-path-concat
                if (err) {
                    callback(err);
                    return;
                }

                callback(null, {
                    contents: JSON.parse(data),
                    filename
                });
            });
        });
    };

    return WebpackFileManager;
}

function formatLessRenderError(e) {
    // Example ``e``:
    //    { type: 'Name',
    //        message: '.undefined-mixin is undefined',
    //        filename: '/path/to/style.less',
    //        index: 352,
    //        line: 31,
    //        callLine: NaN,
    //        callExtract: undefined,
    //        column: 6,
    //        extract:
    //         [ '    .my-style {',
    //         '      .undefined-mixin;',
    //         '      display: block;' ] }
    const extract = e.extract ? "\n near lines:\n   " + e.extract.join("\n   ") : "";
    const err = new Error(
        e.message + "\n @ " + e.filename +
        " (line " + e.line + ", column " + e.column + ")" +
        extract
    );

    err.hideStack = true;
    return err;
}
