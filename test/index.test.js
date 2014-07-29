"use strict";

var should = require("should");
var path = require("path");
var webpack = require("webpack");
var enhancedReqFactory = require("enhanced-require");
var fs = require("fs");

var CR = /\r/g;
var resolveBowerComponents = {
	modulesDirectories: ["bower_components"]
};

function readCss(id) {
	return fs.readFileSync(path.resolve(__dirname, "./css/" + id + ".css") ,"utf8").replace(CR, "");
}

function tryMkdirSync(dirname) {
	try {
		fs.mkdirSync(dirname);
	} catch(e) {
		if (!e || e.code != 'EEXIST')
			throw e;
	}
}

function test(name, id) {
	it(name, function (done) {
		var expectedCss = readCss(id);
		var lessFile = "raw!" +
			path.resolve(__dirname, "../index.js") + "!" +
			path.resolve(__dirname, "./less/" + id + ".less");
		var actualCss;
		var config = {
			resolve: id === "imports-bower"? resolveBowerComponents : {}
		};
		var enhancedReq = enhancedReqFactory(module, config);

		// run synchronously
		actualCss = enhancedReq(lessFile);
		// writing the actual css to output-dir for better debugging
		tryMkdirSync(__dirname + "/output/");
		fs.writeFileSync(__dirname + "/output/" + name + ".sync.css", actualCss, "utf8");
		actualCss.should.eql(expectedCss);

		// run asynchronously
		webpack({
			entry: lessFile,
			resolve: config.resolve,
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

			actualCss = require("./output/bundle.js");
			// writing the actual css to output-dir for better debugging
			fs.writeFileSync(__dirname + "/output/" + name + ".async.css", actualCss, "utf8");
			actualCss.should.eql(expectedCss);

			done();
		});
	});
}

describe("less-loader", function () {
	test("should compile simple less without errors", "basic");
	test("should resolve all imports", "imports");
	test("should resolve all imports of bower dependencies", "imports-bower");
	test("should transform urls", "url-path");
	test("should transform urls to files above the current directory", "folder/url-path");
	test("should transform urls to files above the sibling directory", "folder2/url-path");
});
