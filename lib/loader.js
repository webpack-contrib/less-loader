"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors
		Tobias Koppers @sokra
		Johannes Ewald @jhnns
*/
var less = require("less");
var loaderUtils = require("loader-utils");
var cloneDeep = require("clone-deep");

var trailingSlash = /[\\\/]$/;

module.exports = function(source) {
	var loaderContext = this;
	var options = Object.assign(
		{
			filename: this.resource,
			paths: [],
			plugins: [],
			relativeUrls: true,
			compress: Boolean(this.minimize)
		},
		cloneDeep(loaderUtils.getOptions(this))
	);
	var cb = this.async();
	var isSync = typeof cb !== "function";
	var finalCb = cb || this.callback;
	var webpackPlugin = {
		install: function(less, pluginManager) {
			var WebpackFileManager = getWebpackFileManager(less, loaderContext, options);

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

	less.render(source, options, function(e, result) {
		var cb = finalCb;
		// Less is giving us double callbacks sometimes :(
		// Thus we need to mark the callback as "has been called"
		if(!finalCb) return;
		finalCb = null;
		if(e) return cb(formatLessRenderError(e));

		cb(null, result.css, result.map);
	});
};

function getWebpackFileManager(less, loaderContext, query, isSync) {

	function WebpackFileManager() {
		less.FileManager.apply(this, arguments);
	}

	WebpackFileManager.prototype = Object.create(less.FileManager.prototype);

	WebpackFileManager.prototype.supports = function(filename, currentDirectory, options, environment) {
		// Our WebpackFileManager handles all the files
		return true;
	};

	WebpackFileManager.prototype.supportsSync = function(filename, currentDirectory, options, environment) {
		return false;
	};

	WebpackFileManager.prototype.loadFile = function(filename, currentDirectory, options, environment, callback) {
		var moduleRequest = loaderUtils.urlToRequest(filename, query.root);
		// Less is giving us trailing slashes, but the context should have no trailing slash
		var context = currentDirectory.replace(trailingSlash, "");

		loaderContext.resolve(context, moduleRequest, function(err, filename) {
			if(err) {
				callback(err);
				return;
			}

			loaderContext.dependency && loaderContext.dependency(filename);
			// The default (asynchronous)
			loaderContext.loadModule("-!" + __dirname + "/stringify.loader.js!" + filename, function(err, data) {
				if(err) {
					callback(err);
					return;
				}

				callback(null, {
					contents: JSON.parse(data),
					filename: filename
				});
			});
		});
	};

	return WebpackFileManager;
}

function formatLessRenderError(e) {
	// Example ``e``:
	//	{ type: 'Name',
	//		message: '.undefined-mixin is undefined',
	//		filename: '/path/to/style.less',
	//		index: 352,
	//		line: 31,
	//		callLine: NaN,
	//		callExtract: undefined,
	//		column: 6,
	//		extract:
	//		 [ '    .my-style {',
	//		 '      .undefined-mixin;',
	//		 '      display: block;' ] }
	var extract = e.extract? "\n near lines:\n   " + e.extract.join("\n   ") : "";
	var err = new Error(
		e.message + "\n @ " + e.filename +
		" (line " + e.line + ", column " + e.column + ")" +
		extract
	);
	err.hideStack = true;
	return err;
}
