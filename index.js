/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var less = require("less");
var path = require("path");
var fs = require("fs");

var startsWithTilde = /^~/;
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
	less.Parser.fileLoader = function (file, currentFileInfo, callback) {
		var context = currentFileInfo.currentDirectory.replace(trailingSlash, "");
		var newFileInfo = {
			relativeUrls: true,
			entryPath: currentFileInfo.entryPath,
			rootpath: currentFileInfo.rootpath,
			rootFilename: currentFileInfo.rootFilename
		};
		var moduleName = urlToRequire(file);

		if(cb) {
			loaderContext.resolve(context, moduleName, function(err, filename) {
				if(err) {
					if(!errored)
						loaderContext.callback(err);
					errored = true;
					return;
				}
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
			var filename = loaderContext.resolveSync(context, moduleName);
			loaderContext.dependency && loaderContext.dependency(filename);
			updateFileInfo(newFileInfo, rootContext, filename);
			// Make it synchronous
			try {
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
		filename: this.resource,
		paths: [],
		rootpath: this.context,
		compress: !!this.minimize
	}, function(e, result) {
		if(e) return resultcb(e);
		resultcb(null, result);
	});
}
function urlToRequire(url) {
	if(startsWithTilde.test(url))
		return url.substring(1);
	else
		return "./"+url;
}

function updateFileInfo(fileInfo, rootContext, filename) {
	fileInfo.filename = filename;
	fileInfo.currentDirectory = path.dirname(filename);
	fileInfo.rootpath = "./";
	var relativePath = path.relative(rootContext, fileInfo.currentDirectory);
	if(relativePath) {
		fileInfo.rootpath += relativePath.replace(/\\/g, "/") + "/";
	}
}