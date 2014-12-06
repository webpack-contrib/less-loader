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

function formatLessLoaderError(e, filename) {
	return new Error(e.message + "\n @ " + filename +
		" (line " + e.line + ", column " + e.column + ")");
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

module.exports = function(input) {
	this.cacheable && this.cacheable();
	var loaderContext = this;
	var query = loaderUtils.parseQuery(this.query);
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
		var moduleRequest = loaderUtils.urlToRequest(url, query.root);

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
					if(!errored)
						loaderContext.callback(formatLessLoaderError(e, filename));
					errored = true;
				}
			}
		}
	};
	var resultcb = cb || this.callback;

	var lessOptions = [
		'paths', 'optimization', 'filename', 'strictImports', 'syncImport', 'dumpLineNumbers', 'relativeUrls',
		'rootpath', 'compress', 'cleancss', 'cleancssOptions', 'ieCompat', 'strictMath', 'strictUnits', 'urlArgs',
		'sourceMap', 'sourceMapFilename', 'sourceMapURL', 'sourceMapBasepath', 'sourceMapRootpath', 'outputSourceFiles'
	];

	var config = {
		filename: normalizePath(this.resource),
		paths: [],
		relativeUrls: true,
		compress: !!this.minimize
	};

	Object.keys(query).forEach(function(attr) {
		if (lessOptions.indexOf(attr) >= 0) {
			config[attr] = query[attr];
		} else if(attr !== "root") {
			throw new Error('less-loader: attr ' + attr + ' is not a valid less configuration option')
		}
	});

	less.render(input, config, function(e, result) {
		if(errored) return;
		if(e) return resultcb(formatLessRenderError(e));
		resultcb(null, result);
	});
};

function updateFileInfo(fileInfo, rootContext, filename) {
	fileInfo.filename = filename;
	fileInfo.currentDirectory = path.dirname(filename);
	fileInfo.rootpath = (path.relative(rootContext, fileInfo.currentDirectory).replace(/\\/g, "/") || ".") + "/";
}

function normalizePath(path) {
	if(path.sep === "\\") {
		path = path.replace(backslash, "/");
	}

	return path;
}
