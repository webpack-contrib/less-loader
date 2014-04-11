/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var less = require("less");
var path = require("path");
var fs = require("fs");
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
	less.Parser.fileLoader = function (file, currentFileInfo, callback, env) {
		var context = currentFileInfo.currentDirectory.replace(/[\\\/]$/, "");
		var newFileInfo = {
			relativeUrls: env.relativeUrls || true,
			entryPath: currentFileInfo.entryPath,
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
				newFileInfo.filename = filename;
				newFileInfo.currentDirectory = path.dirname(filename);
				// The default (asynchron)
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
			newFileInfo.filename = filename;
			newFileInfo.currentDirectory = path.dirname(filename);
			// Make it synchron
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
	}
	var resultcb = cb || this.callback;

	less.render(input, {
		filename: this.resource,
		paths: [],
		rootpath: this.context,
		relativeUrls: true,
		compress: !!this.minimize
	}, function(e, result) {
		if(e) return resultcb(e);
		resultcb(null, result);
	});
}
function urlToRequire(url) {
	if(/^~/.test(url))
		return url.substring(1);
	else
		return "./"+url;
}