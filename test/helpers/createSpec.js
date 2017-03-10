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
    "imports-node": "../node_modules/",
    "source-map": "../node_modules/"
};
const lessFixtures = path.resolve(__dirname, "..", "fixtures", "less");
const matchLessFolder = /[\/\\]fixtures[\/\\]less[\/\\]/g;
const matchWebpackImports = /(@import\s+(\([^)]+\))?\s*["'])~/g;
const lessBin = require.resolve(".bin/lessc");
const ignore = [
    "error"
];
const testIds = fs.readdirSync(lessFixtures)
    .filter((name) =>
        path.extname(name) === ".less" && ignore.indexOf(path.basename(name, ".less")) === -1
    )
    .map((name) =>
        path.basename(name, ".less")
    );

testIds
    .forEach((testId) => {
        const lessFile = path.resolve(lessFixtures, testId + ".less");
        const tildeReplacement = tildeReplacements[testId];
        let cssContent = "";
        let lessContent;
        let cssFile;

        lessContent = fs.readFileSync(lessFile, "utf8");
        lessContent = lessContent.replace(matchWebpackImports, "$1" + tildeReplacement);

        // There is a Less bug where URLs are not rewritten correctly when the stdin option is used
        // @see https://github.com/less/less.js/issues/3038
        // That's why our fake node_modules must stay within the fixtures folder
        const less = spawn(lessBin, ["--relative-urls", "-"], {
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

            cssFile = lessFile.replace(matchLessFolder, path.sep + "fixtures" + path.sep + "css" + path.sep);
            cssFile = path.dirname(cssFile) + path.sep + path.basename(cssFile, ".less") + ".css";

            fs.writeFileSync(cssFile, cssContent, "utf8");
        }
    });
