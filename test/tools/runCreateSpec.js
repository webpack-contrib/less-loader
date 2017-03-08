"use strict";

const spawn = require("child_process").spawn;
const fs = require("fs");
const path = require("path");

/**
 * This object specifies the replacements for the ~-character per test.
 *
 * Since less doesn't understand the semantics of ~, we need to replace the
 * import path with a relative path.
 *
 * The object keys are the test ids.
 */
const tildeReplacements = {
    imports: "../node_modules/",
    "imports-node": "../node_modules/"
};
const ignore = [
    "error"
];
const matchLessFolder = /[\/\\]test[\/\\]less[\/\\]/g;
const matchWebpackImports = /(@import\s+(\([^)]+\))?\s*["'])~/g;

fs.readdirSync(path.resolve(__dirname, "..", "less"))
    .filter((name) =>
        path.extname(name) === ".less" && ignore.indexOf(path.basename(name, ".less")) === -1
    )
    .map((name) =>
        path.basename(name, ".less")
    )
    .forEach((testId) => {
        const lessFile = path.resolve(__dirname, "../less/", testId) + ".less";
        const lessBin = path.resolve(__dirname, "../../node_modules/less/bin/lessc");
        const tildeReplacement = tildeReplacements[testId];
        let cssContent = "";
        let lessContent;
        let cssFile;

        lessContent = fs.readFileSync(lessFile, "utf8");
        lessContent = lessContent.replace(matchWebpackImports, "$1" + tildeReplacement);

        // Ensure that less is properly installed
        require.resolve(lessBin);

        const less = spawn("node", [lessBin, "-", "-ru"], {
            cwd: path.dirname(lessFile)
        });

        less.stdout.setEncoding("utf8");
        less.stdout.on("data", (data) => {
            cssContent += data;
        });
        less.stderr.pipe(process.stderr);
        less.stdout.on("close", processCss);

        less.stdin.end(lessContent);

        function processCss() {
            cssContent = cssContent.replace(new RegExp("(@import\\s+[\"'])" + tildeReplacement, "g"), "$1~");

            cssFile = lessFile.replace(matchLessFolder, path.sep + "test" + path.sep + "css" + path.sep);
            cssFile = path.dirname(cssFile) + path.sep + path.basename(cssFile, ".less") + ".css";

            fs.writeFileSync(cssFile, cssContent, "utf8");
        }
    });
