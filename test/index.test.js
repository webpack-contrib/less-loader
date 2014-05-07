"use strict";

var should = require("should");
var path = require("path");
var webpack = require("webpack");
var enhancedReq = require("enhanced-require")(module);
var fs = require("fs");

var CR = /\r/g;

function readCss(id) {
	return fs.readFileSync(path.resolve(__dirname, "./css/" + id + ".css") ,"utf8").replace(CR, "");
}

function test(name, id) {
	it(name, function (done) {
		var css = readCss(id);
		var lessFile = "raw!" +
			path.resolve(__dirname, "../index.js") + "!" +
			path.resolve(__dirname, "./less/" + id + ".less");

		// run synchronously
		enhancedReq(lessFile).should.eql(css);

		// run asynchronously
		webpack({
			entry: lessFile,
			output: {
				path: __dirname + "/output",
				filename: "bundle.js",
				libraryTarget: "commonjs2"
			}
		}, function onCompilationFinished(err, stats) {
			if (err) {
				return done(err);
			}
			if (stats.hasErrors()) {
				return done(stats.compilation.errors[0]);
			}
			if (stats.hasWarnings()) {
				return done(stats.compilation.warnings[0]);
			}
			delete require.cache[path.resolve(__dirname, "./output/bundle.js")];
			require("./output/bundle.js").should.eql(css);
			done();
		});
	});
}

describe("less-loader", function () {
	test("should compile simple less without errors", "basic");
	test("should resolve all imports of less-files", "imports");
	test("should transform urls", "url-path");
	test("should transform urls to files above the current directory", "folder/url-path");
});