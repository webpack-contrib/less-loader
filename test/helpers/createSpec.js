

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const removeSourceMappingUrl = require('../../src/removeSourceMappingUrl');

const projectPath = path.resolve(__dirname, '..', '..');
const lessFixtures = path.resolve(__dirname, '..', 'fixtures', 'less');
const cssFixtures = path.resolve(__dirname, '..', 'fixtures', 'css');
const matchWebpackImports = /(@import\s+(\([^)]+\))?\s*["'])~/g;
const lessBin = require.resolve('.bin/lessc');
const ignore = [
  'error',
];
/**
 * This object specifies the replacements for the ~-character per test.
 *
 * Since less doesn't understand the semantics of ~, we need to replace the
 * import path with a relative path.
 *
 * The object keys are the test ids.
 */
const tildeReplacements = {
  imports: '../node_modules/',
  'imports-node': '../node_modules/',
  'source-map': '../node_modules/',
};
// Maps test ids on cli arguments
const lessOptions = {
  'source-map': [
    '--source-map',
    `--source-map-basepath=${projectPath}`,
    `--source-map-rootpath=${projectPath}`,
  ],
};
const testIds = fs.readdirSync(lessFixtures)
  .filter(name =>
    path.extname(name) === '.less' && ignore.indexOf(path.basename(name, '.less')) === -1,
  )
  .map(name =>
    path.basename(name, '.less'),
  );

testIds
  .forEach((testId) => {
    const lessFile = path.resolve(lessFixtures, `${testId}.less`);
    const cssFile = path.resolve(cssFixtures, `${testId}.css`);
    const tildeReplacement = tildeReplacements[testId];
    const originalLessContent = fs.readFileSync(lessFile, 'utf8');

    // It's safer to change the file and write it back to disk instead of piping it to the Less process
    // because Less tends to create broken paths in url() statements and source maps when the content is read from stdin
    // See also https://github.com/less/less.js/issues/3038
    fs.writeFileSync(lessFile, originalLessContent.replace(matchWebpackImports, `$1${tildeReplacement}`), 'utf8');

    exec(
      [lessBin, '--relative-urls', ...lessOptions[testId] || '', lessFile, cssFile].join(' '),
      { cwd: projectPath },
      (err, stdout, stderr) => {
        if (err || stdout || stderr) {
          throw (err || new Error(stdout || stderr));
        }

        // We remove the source mapping url because the less-loader will do it also.
        // See removeSourceMappingUrl.js for the reasoning behind this.
        const cssContent = removeSourceMappingUrl(
          fs.readFileSync(cssFile, 'utf8')
            // Change back tilde replacements
            .replace(new RegExp(`(@import\\s+["'])${tildeReplacement}`, 'g'), '$1~'),
        );

        fs.writeFileSync(lessFile, originalLessContent, 'utf8');
        fs.writeFileSync(cssFile, cssContent, 'utf8');
      },
    );
  });
