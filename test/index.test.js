"use strict";

var should = require("should");
var path = require("path");
var webpack = require("webpack");
var enhancedReqFactory = require("enhanced-require");
var fs = require("fs");
var moveModulesDir = require("./helpers/moveModulesDir.js");

var CR = /\r/g;
var bowerComponents = path.resolve(__dirname, "./bower_components");
var pathToLessLoader = path.resolve(__dirname, "../index.js");

describe("less-loader", function() {
	this.timeout(5000);
	test("should compile simple less without errors", "basic");
	test("should resolve all imports", "imports");
	test("should resolve all imports from bower_components", "imports-bower", {
		before: function(config) {
			config.resolve.root.push(bowerComponents);
		}
	});
	test("should resolve all imports from node_modules", "imports-node", {
		before: function() {
			moveModulesDir.moveBcToNm();
		},
		after: function() {
			moveModulesDir.moveNmToBc();
		}
	});
	test("should not try to resolve import urls", "imports-url");
	test("should compile data-uri function", "data-uri");
	test("should transform urls", "url-path");
	test("should transform urls to files above the current directory", "folder/url-path");
	test("should transform urls to files above the sibling directory", "folder2/url-path");
	test("should interpolate modifyVars arguments", "interpolate-modifyVars", { 
		query: "?{'modifyVars':{'[name]':'block','override':'relative'}}"
	});
	test("should interpolate globalVars arguments", "interpolate-globalVars", { 
		query: "?{'globalVars':{'[name]':'block','global':'red'}}"
	});
	test("should generate source-map", "source-map", {
		query: "?sourceMap",
		devtool: "source-map"
	});
	test("should install plugins", "url-path", {
		query: "?config=lessLoaderTest",
		lessPlugins: [
			{ wasCalled: false, install: function() {this.wasCalled = true;} }
		],
		after: function(testVariables) {
			this.lessPlugins[0].wasCalled.should.be.true;
		}
	});
	it("should report error correctly", function(done) {
		webpack({
			entry: path.resolve(__dirname, "../index.js") + "!" +
				path.resolve(__dirname, "./less/error.less"),
			output: {
				path: __dirname + "/output",
				filename: "bundle.js"
			}
		}, function(err, stats) {
			if(err) throw err;
			var json = stats.toJson();
			json.warnings.should.be.eql([]);
			json.errors.length.should.be.eql(1);
			var theError = json.errors[0];
			theError.should.match(/not-existing/);
			done();
		});
	});
});

function readCss(id) {
	return fs.readFileSync(path.resolve(__dirname, "./css/" + id + ".css") ,"utf8").replace(CR, "");
}

function tryMkdirSync(dirname) {
	try {
		fs.mkdirSync(dirname);
	} catch(e) {
		if (!e || e.code !== "EEXIST")
			throw e;
	}
}

function test(name, id, testOptions) {
	testOptions = testOptions || {};
	testOptions.query = testOptions.query || "";

	it(name, function (done) {
		var expectedCss = readCss(id);
		var lessFile = "raw!" +
			pathToLessLoader + testOptions.query + "!" +
			path.resolve(__dirname, "./less/" + id + ".less");
		var actualCss;
		var config = {
			resolve: {
				root: [
					__dirname
				]
			}
		};
		var enhancedReq;

		testOptions.before && testOptions.before(config);

		enhancedReq = enhancedReqFactory(module, config);

		// run synchronously
		actualCss = enhancedReq(lessFile);
		// writing the actual css to output-dir for better debugging
		tryMkdirSync(__dirname + "/output/");
		fs.writeFileSync(__dirname + "/output/" + name + ".sync.css", actualCss, "utf8");

		actualCss.should.eql(expectedCss);

		// run asynchronously
		webpack({
			entry: lessFile,
			devtool: testOptions.devtool,
			resolve: config.resolve,
			output: {
				path: __dirname + "/output",
				filename: "bundle.js",
				libraryTarget: "commonjs2"
			},
			lessLoaderTest: {
				lessPlugins: testOptions.lessPlugins || []
			}
		}, function onCompilationFinished(err, stats) {
			var actualMap;

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

			testOptions.after && testOptions.after();

			if (testOptions.devtool === "source-map") {
				actualMap = fs.readFileSync(__dirname + "/output/bundle.js.map", "utf8");
				fs.writeFileSync(__dirname + "/output/" + name + ".sync.css.map", actualMap, "utf8");
				actualMap = JSON.parse(actualMap);
				actualMap.sources.should.containEql("webpack:///./test/less/" + id + ".less");
			}

			done();
		});
	});
}
