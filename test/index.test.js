const path = require('path');
const compile = require('./helpers/compile');
const moduleRules = require('./helpers/moduleRules');
const { readCssFixture, readSourceMap } = require('./helpers/readFixture');

const nodeModulesPath = path.resolve(__dirname, 'fixtures', 'node_modules');

async function compileAndCompare(fixture, lessLoaderOptions, lessLoaderContext) {
  let inspect;
  const rules = moduleRules.basic(lessLoaderOptions, lessLoaderContext, (i) => {
    inspect = i;
  });
  const [expectedCss] = await Promise.all([
    readCssFixture(fixture),
    compile(fixture, rules),
  ]);
  const [actualCss] = inspect.arguments;

  return expect(actualCss).toBe(expectedCss);
}

test('should compile simple less without errors', async () => {
  await compileAndCompare('basic');
});

test('should resolve all imports', async () => {
  await compileAndCompare('imports');
});

test('should resolve all imports from node_modules', async () => {
  await compileAndCompare('imports-node');
});

test('should resolve imports from given paths', async () => {
  await compileAndCompare('imports-paths', { paths: [__dirname, nodeModulesPath] });
});

test('should not try to resolve import urls', async () => {
  await compileAndCompare('imports-url');
});

test('should allow non-less-import', async () => {
  let inspect;
  const rules = moduleRules.nonLessImport((i) => {
    inspect = i;
  });

  await compile('non-less-import', rules);

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
  const [expectedMap] = await Promise.all([
    readSourceMap('source-map'),
    compile('source-map', rules),
  ]);
  const [, actualMap] = inspect.arguments;

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
