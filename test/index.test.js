"use strict";

var should = require("should");
var path = require("path");
var webpack = require("webpack");
var fs = require("fs");
var moveModulesDir = require("./helpers/moveModulesDir.js");

var CR = /\r/g;
var bowerComponents = path.resolve(__dirname, "./bower_components");
var pathToLessLoader = path.resolve(__dirname, "../lib/loader.js");

describe("less-loader", function() {
	this.timeout(5000);
	test("should compile simple less without errors", "basic");
	test("should resolve all imports", "imports");
	test("should resolve all imports from bower_components", "imports-bower", {
		before: function(config) {
			config.resolve.modules.push(bowerComponents);
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
	test("should generate source-map", "source-map", {
		options: {
			sourceMap: true
		},
		devtool: "source-map"
	});
	test("should install plugins", "url-path", {
		options: {
			lessPlugins: [
				{ wasCalled: false, install: function() {this.wasCalled = true;} }
			]
		},
		after: function(testVariables) {
			this.options.lessPlugins[0].wasCalled.should.be.true;
		}
	});
	// See https://github.com/webpack/loader-utils/issues/56
	test("should not alter the original options object", "basic", {
		options: {
			lessPlugins: []
		},
		after: function() {
			// We know that the loader will add its own plugin, but it should not alter the original array
			this.options.lessPlugins.should.have.length(0);
		}
	});
	it("should report error correctly", function(done) {
		webpack({
			entry: pathToLessLoader + "!" +
				path.resolve(__dirname, "./less/error.less"),
			output: {
				path: path.resolve(__dirname, "output"),
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

function test(name, id, testOptions) {
	testOptions = testOptions || {};
	testOptions.options = testOptions.options || "";

	it(name, function (done) {
		var expectedCss = readCss(id);
		var lessFile = path.resolve(__dirname, "./less/" + id + ".less");
		var actualCss;
		var config = {
			resolve: {
				modules: [
					"node_modules"
				]
			}
		};

		testOptions.before && testOptions.before(config);

		// run asynchronously
		webpack({
			entry: lessFile,
			context: __dirname,
			devtool: testOptions.devtool,
			resolve: config.resolve,
			output: {
				path: path.resolve(__dirname, "output"),
				filename: "bundle.js",
				libraryTarget: "commonjs2"
			},
			module: {
				rules: [
					{
						test: /\.less$/,
						use: [
							"raw-loader",
							{
								loader: pathToLessLoader,
								options: testOptions.options
							}
						]
					}
				]
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
			fs.writeFileSync(path.resolve(__dirname, "output", name + ".async.css"), actualCss, "utf8");
			actualCss.should.eql(expectedCss);

			testOptions.after && testOptions.after();

			if (testOptions.devtool === "source-map") {
				actualMap = fs.readFileSync(path.resolve(__dirname, "output", "bundle.js.map"), "utf8");
				fs.writeFileSync(path.resolve(__dirname, "output", name + ".sync.css.map"), actualMap, "utf8");
				actualMap = JSON.parse(actualMap);
				actualMap.sources.should.containEql("webpack:///./less/" + id + ".less");
			}

			done();
		});
	});
}
