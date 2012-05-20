/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var less = require("less");
var path = require("path");
var fs = require("fs");
module.exports = function(input) {
	this.cacheable && this.cacheable();
	var options = this;
	var cb = this.async();
	less.Parser.importer = function (file, paths, callback, env) {
		options.resolve(path.dirname(env.filename), urlToRequire(file), function(err, filename) {
			if(err) {
				options.callback(err);
				return;
			}
			options.dependency && options.dependency(filename);
			if(cb) {
				// The default (asynchron)
				fs.readFile(filename, 'utf-8', function(e, data) {
					if (e) return callback(e);

					new(less.Parser)({
						filename: filename,
						paths: [],
						compress: env.compress
					}).parse(data, function (e, root) {
						callback(e, root, data);
					});
				});
			} else {
				// Make it synchron
				try {
					var data = fs.readFileSync(filename, 'utf-8');
					new(less.Parser)({
						filename: filename,
						paths: [],
						compress: env.compress
					}).parse(data, function (e, root) {
						callback(e, root, data);
					});
				} catch(e) {
					callback(e);
				}
			}
		});
	}
	var resultcb = this.callback;
	
	less.render(input, {
		filename: this.filenames[0],
		paths: [],
		compress: !!this.minimize
	}, function(e, result) {
		resultcb(e, e ? null : "module.exports =\n\t" + JSON.stringify(result) + ";");
	});
}
function urlToRequire(url) {
	if(/^~/.test(url))
		return url.substring(1);
	else
		return "./"+url;
}