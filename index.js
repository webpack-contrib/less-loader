"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors
		Tobias Koppers @sokra
		Johannes Ewald @jhnns
*/
var less = require("less");
var fs = require("fs");
var loaderUtils = require("loader-utils");
var convert = require('convert-source-map');
var path = require('path');

var trailingSlash = /[\\\/]$/;

module.exports = function(input) {
	var loaderContext = this;
	var query = loaderUtils.parseQuery(this.query);
	var cb = this.async();
	var isSync = typeof cb !== "function";
	var finalCb = cb || this.callback;
	var config = {
		filename: this.resource,
		paths: [],
		relativeUrls: true,
		compress: !!this.minimize
	};
        var sourceMapEnabled = false;
	var webpackPlugin = {
		install: function(less, pluginManager) {
			var WebpackFileManager = getWebpackFileManager(less, loaderContext, query, isSync);

			pluginManager.addFileManager(new WebpackFileManager());
		},
		minVersion: [2, 1, 1]
	};

	this.cacheable && this.cacheable();

	Object.keys(query).forEach(function(attr) {
		var value = query[attr];
		if(attr === 'sourceMap') {
			sourceMapEnabled = true;
			value = {
				sourceMapFileInline : true
			}
		}
		config[attr] = value;
	});

	// Now we're adding the webpack plugin, because there might have
	// been added some before via query-options.
	config.plugins = config.plugins || [];
	config.plugins.push(webpackPlugin);

	less.render(input, config, function(e, result) {
		var cb = finalCb;
		// Less is giving us double callbacks sometimes :(
		// Thus we need to mark the callback as "has been called"
		if(!finalCb) return;
		finalCb = null;
		if(e) return cb(formatLessRenderError(e));
		var css = result.css;
		if(sourceMapEnabled) {
			var sourceMap;
			var mapObj = convert.fromSource(css);
			if (mapObj) {
				css = convert.removeComments(css);
				sourceMap = mapObj.sourcemap;
				var basePath = loaderContext.options.context;
				sourceMap.file = path.relative(basePath, config.filename);
				sourceMap.sourcesContent = [];
				for (var i = 0; i < sourceMap.sources.length; i++) {
					sourceMap.sourcesContent[i] = fs.readFileSync(sourceMap.sources[i]).toString();
					sourceMap.sources[i] =  path.relative(basePath, sourceMap.sources[i]);
				}
			}
			cb(null, css, sourceMap);
		} else {
			cb(null, css);
		}
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

	WebpackFileManager.prototype.supportsSync = WebpackFileManager.prototype.supports;

	WebpackFileManager.prototype.loadFile = function(filename, currentDirectory, options, environment, callback) {
		// Unfortunately we don't have any influence on less to call `loadFile` or `loadFileSync`
		// thus we need to decide for ourselves.
		// @see https://github.com/less/less.js/issues/2325
		if (isSync) {
			try {
				callback(null, this.loadFileSync(filename, currentDirectory, options, environment));
			} catch (err) {
				callback(err);
			}

			return;
		}

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

	WebpackFileManager.prototype.loadFileSync = function(filename, currentDirectory, options, environment) {
		var moduleRequest = loaderUtils.urlToRequest(filename, query.root);
		// Less is giving us trailing slashes, but the context should have no trailing slash
		var context = currentDirectory.replace(trailingSlash, "");
		var data;

		filename = loaderContext.resolveSync(context, moduleRequest);
		loaderContext.dependency && loaderContext.dependency(filename);
		data = fs.readFileSync(filename, "utf8");

		return {
			contents: data,
			filename: filename
		};
	};

	return WebpackFileManager;
}

function formatLessRenderError(e) {
	// Example ``e``:
	//	{ type: 'Name',
	//	  message: '.undefined-mixin is undefined',
	//	  filename: '/path/to/style.less',
	//	  index: 352,
	//	  line: 31,
	//	  callLine: NaN,
	//	  callExtract: undefined,
	//	  column: 6,
	//	  extract:
	//	   [ '    .my-style {',
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
