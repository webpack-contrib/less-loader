"use strict";

var fs = require("fs");
var path = require("path");

var bowerComponents = path.resolve(__dirname, "../bower_components");
var nodeModules = path.resolve(__dirname, "../node_modules");

module.exports = {
	moveBcToNm: function() {
		fs.renameSync(bowerComponents, nodeModules);
	},
	moveNmToBc: function() {
		fs.renameSync(nodeModules, bowerComponents);
	}
};