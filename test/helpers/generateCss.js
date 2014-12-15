"use strict";

var spawn = require("child_process").spawn;
var fs = require("fs");
var path = require("path");
var moveModulesDir = require("./moveModulesDir.js");

/**
 * This object specifies the replacements for the ~-character per test.
 *
 * Since less doesn't understand the semantics of ~, we need to replace the
 * import path with a relative path.
 *
 * The object keys are the test ids.
 */
var tildeReplacements = {
	"imports": "../node_modules/",
	"imports-bower": "../bower_components/",
	"imports-node": "../node_modules/"
};
var matchLessFolder = /[\/\\]test[\/\\]less[\/\\]/g;
var matchWebpackImports = /(@import\s+(\([^)]+\))?\s*["'])~/g;

var testId = process.argv[2];
if (!testId) {
	throw new Error("Cannot gerenate css: You need to specify a test id");
}
var lessFile = path.resolve(__dirname, "../less/", testId) + ".less";
var lessBin = path.resolve(__dirname, "../../node_modules/less/bin/lessc");
var less;
var lessContent;
var cssFile;
var cssContent = "";
var tildeReplacement = tildeReplacements[testId];

if (testId === "imports-node") {
	moveModulesDir.moveBcToNm();
}

console.log("Generating css for " + lessFile);

lessContent = fs.readFileSync(lessFile, "utf8");
lessContent = lessContent.replace(matchWebpackImports, "$1" + tildeReplacement);

// Ensure that less is properly installed
require.resolve(lessBin);

less = spawn("node", [lessBin, "-", "-ru"], {
	cwd: path.dirname(lessFile)
});
less.stdout.setEncoding("utf8");
less.stdout.on("data", function (data) {
	cssContent += data;
});
less.stderr.pipe(process.stderr);
less.stdout.on("close", processCss);

less.stdin.end(lessContent);

function processCss() {
	cssContent = cssContent.replace(new RegExp("(@import\\s+[\"'])" + tildeReplacement, "g"), "$1~");

	cssFile = lessFile.replace(matchLessFolder, path.sep + "test" + path.sep + "css" + path.sep);
	cssFile = path.dirname(cssFile) + path.sep + path.basename(cssFile, ".less") + ".css";

	console.log("Writing css to " + cssFile);

	fs.writeFileSync(cssFile, cssContent, "utf8");

	if (testId === "imports-node") {
		moveModulesDir.moveNmToBc();
	}
}