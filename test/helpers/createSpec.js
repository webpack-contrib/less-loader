const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const removeSourceMappingUrl = require('../../src/removeSourceMappingUrl');

const projectPath = path.resolve(__dirname, '..', '..');
const fixturesPath = path.resolve(projectPath, 'test', 'fixtures');
const lessFixturesPath = path.resolve(fixturesPath, 'less');
const cssFixturesPath = path.resolve(fixturesPath, 'css');
const lessBin = require.resolve('.bin/lessc');
const ignore = [
  'import-non-less',
  'error-import-not-existing',
  'error-mixed-resolvers',
  'error-syntax',
  'error-import-file-with-error',
  'import-absolute',
  'import-absolute-target',
];
const lessReplacements = [
  [/~some\//g, '../node_modules/some/'],
  [/~(aliased-)?some"/g, '../node_modules/some/module.less"'],
];
const cssReplacements = [[/\.\.\/node_modules\/some\//g, '~some/']];
// Maps test ids on cli arguments
const lessOptions = {
  'source-map': [
    '--source-map',
    `--source-map-basepath=${projectPath}`,
    `--source-map-rootpath=${projectPath}`,
    '--source-map-less-inline',
  ],
  'import-paths': [
    `--include-path=${path.resolve(fixturesPath, 'node_modules')}`,
  ],
};
const testIds = fs
  .readdirSync(lessFixturesPath)
  .filter(
    (name) =>
      path.extname(name) === '.less' &&
      ignore.indexOf(path.basename(name, '.less')) === -1
  )
  .map((name) => path.basename(name, '.less'));

function replace(content, replacements) {
  return replacements.reduce(
    (intermediate, [pattern, replacement]) =>
      intermediate.replace(pattern, replacement),
    content
  );
}

testIds.forEach((testId) => {
  const lessFile = path.resolve(lessFixturesPath, `${testId}.less`);
  const cssFile = path.resolve(cssFixturesPath, `${testId}.css`);
  const originalLessContent = fs.readFileSync(lessFile, 'utf8');
  const replacedLessContent = replace(originalLessContent, lessReplacements);

  // It's safer to change the file and write it back to disk instead of piping it to the Less process
  // because Less tends to create broken paths in url() statements and source maps when the content is read from stdin
  // See also https://github.com/less/less.js/issues/3038
  fs.writeFileSync(lessFile, replacedLessContent, 'utf8');

  exec(
    [
      lessBin,
      '--rewrite-urls',
      ...(lessOptions[testId] || ''),
      lessFile,
      cssFile,
    ].join(' '),
    { cwd: projectPath },
    (err, stdout, stderr) => {
      if (err || stdout || stderr) {
        throw err || new Error(stdout || stderr);
      }

      // We remove the source mapping url because the less-loader will do it also.
      // See removeSourceMappingUrl.js for the reasoning behind this.
      const cssContent = removeSourceMappingUrl(
        replace(fs.readFileSync(cssFile, 'utf8'), cssReplacements)
      );

      fs.writeFileSync(lessFile, originalLessContent, 'utf8');
      fs.writeFileSync(cssFile, cssContent, 'utf8');
    }
  );

  // eslint-disable-next-line no-console
  console.log(`${testId}.less -> ${cssFile}`);
});
