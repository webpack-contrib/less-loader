const path = require('path');
const compile = require('./helpers/compile');
const moduleRules = require('./helpers/moduleRules');
const { readCssFixture, readSourceMap } = require('./helpers/readFixture');

const nodeModulesPath = path.resolve(__dirname, 'fixtures', 'node_modules');

async function compileAndCompare(fixture, { lessLoaderOptions, lessLoaderContext, resolveAlias } = {}) {
  let inspect;
  const rules = moduleRules.basic(lessLoaderOptions, lessLoaderContext, (i) => {
    inspect = i;
  });
  const [expectedCss] = await Promise.all([
    readCssFixture(fixture),
    compile(fixture, rules, resolveAlias),
  ]);
  const [actualCss] = inspect.arguments;

  return expect(actualCss).toBe(expectedCss);
}

test('should compile simple less without errors', async () => {
  await compileAndCompare('basic');
});

test('should resolve all imports', async () => {
  await compileAndCompare('import');
});

test('should resolve all imports from node_modules using webpack\'s resolver', async () => {
  await compileAndCompare('import-webpack');
});

test('should resolve aliases as configured', async () => {
  await compileAndCompare('import-webpack-alias', {
    resolveAlias: {
      'aliased-some': 'some',
    },
  });
});

test('should resolve all imports from the given paths using Less\' resolver', async () => {
  await compileAndCompare('import-paths', {
    lessLoaderOptions: { paths: [__dirname, nodeModulesPath] },
  });
});

test('should allow to disable webpack\'s resolver by passing an empty paths array', async () => {
  const err = await compile('import-webpack', moduleRules.basic({ paths: [] }))
    .catch(e => e);

  expect(err).toBeInstanceOf(Error);
  expect(err.message).toMatch(/'~some\/css\.css' wasn't found/);
});

test('should not try to resolve import urls', async () => {
  await compileAndCompare('import-url');
});

test('should allow to import non-less files', async () => {
  let inspect;
  const rules = moduleRules.nonLessImport((i) => {
    inspect = i;
  });

  await compile('import-non-less', rules);

  const [css] = inspect.arguments;

  expect(css).toMatch(/\.some-file {\s*background: hotpink;\s*}\s*/);
});

test('should compile data-uri function', async () => {
  await compileAndCompare('data-uri');
});

test('should transform urls', async () => {
  await compileAndCompare('url-path');
});

test('should generate source maps', async () => {
  let inspect;
  const rules = moduleRules.basic({ sourceMap: true }, {}, (i) => {
    inspect = i;
  });
  const [expectedCss, expectedMap] = await Promise.all([
    readCssFixture('source-map'),
    readSourceMap('source-map'),
    compile('source-map', rules),
  ]);
  const [actualCss, actualMap] = inspect.arguments;

  expect(actualCss).toEqual(expectedCss);
  expect(actualMap).toEqual(expectedMap);
});

test('should install plugins', async () => {
  let pluginInstalled = false;
  const testPlugin = {
    install() {
      pluginInstalled = true;
    },
  };

  await compile('basic', moduleRules.basic({ plugins: [testPlugin] }));

  expect(pluginInstalled).toBe(true);
});

test('should not alter the original options object', async () => {
  const options = { plugins: [] };
  const copiedOptions = { ...options };

  await compile('basic', moduleRules.basic(options));

  expect(copiedOptions).toEqual(options);
});

test('should report error correctly', async () => {
  const err = await compile('error-import-not-existing')
    .catch(e => e);

  expect(err).toBeInstanceOf(Error);
  expect(err.message).toMatch(/not-existing/);
});

test('should fail if a file is tried to be loaded from include paths and with webpack\'s resolver simultaneously', async () => {
  const err = await compile('error-mixed-resolvers', moduleRules.basic({ paths: [nodeModulesPath] }))
    .catch(e => e);

  expect(err).toBeInstanceOf(Error);
  expect(err.message).toMatch(/'~some\/module\.less' wasn't found/);
});
