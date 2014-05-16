/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var less = require("less");
var path = require("path");
var fs = require("fs");
var loaderUtils = require("loader-utils");

var backslash = /\\/g;
var trailingSlash = /[\\\/]$/;

function formatLessError(e, filename) {
	return new Error(e.message + "\n @ " + filename +
		" (line " + e.line + ", column " + e.column + ")");
}

module.exports = function(input) {
	this.cacheable && this.cacheable();
	var loaderContext = this;
	var cb = this.async();
	var errored = false;
	var rootContext = this.context;
	less.Parser.fileLoader = function (url, currentFileInfo, callback) {
		var context = currentFileInfo.currentDirectory.replace(trailingSlash, "");
		var newFileInfo = {
			relativeUrls: true,
			entryPath: currentFileInfo.entryPath,
			rootFilename: currentFileInfo.rootFilename
		};
		var moduleRequest = loaderUtils.urlToRequest(url, currentFileInfo.rootpath);

		if(cb) {
			loaderContext.resolve(context, moduleRequest, function(err, filename) {
				if(err) {
					if(!errored)
						loaderContext.callback(err);
					errored = true;
					return;
				}
				loaderContext.dependency && loaderContext.dependency(filename);
				filename = normalizePath(filename);
				updateFileInfo(newFileInfo, rootContext, filename);
				// The default (asynchronous)
				loaderContext.loadModule("-!" + __dirname + "/stringify.loader.js!" + filename, function(err, data) {
					if(err) {
						if(!errored)
							loaderContext.callback(err);
						errored = true;
						return;
					}

					callback(null, JSON.parse(data), filename, newFileInfo);
				});
			});
		} else {
			// Make it synchronous
			try {
				var filename = loaderContext.resolveSync(context, moduleRequest);
				loaderContext.dependency && loaderContext.dependency(filename);
				filename = normalizePath(filename);
				updateFileInfo(newFileInfo, rootContext, filename);
				var data = fs.readFileSync(filename, 'utf-8');
				callback(null, data, filename, newFileInfo);
			} catch(e) {
				try {
					callback(e);
				} catch(e) {
					loaderContext.callback(formatLessError(e, filename));
				}
			}
		}
	};
	var resultcb = cb || this.callback;

	less.render(input, {
		filename: normalizePath(this.resource),
		paths: [],
		relativeUrls: true,
		compress: !!this.minimize
	}, function(e, result) {
		if(e) return resultcb(e);
		resultcb(null, result);
	});
}

function updateFileInfo(fileInfo, rootContext, filename) {
	fileInfo.filename = filename;
	fileInfo.currentDirectory = path.dirname(filename);
	fileInfo.rootpath = (path.relative(rootContext, fileInfo.currentDirectory).replace(/\\/g, "/") || ".") + "/";
}

function normalizePath(path) {
	if (path.sep === "\\") {
		path = path.replace(backslash, "/");
	}

	return path;
}
