const compile = require('./helpers/compile');
const moduleRules = require('./helpers/moduleRules');
const { readCssFixture, readSourceMap } = require('./helpers/readFixture');

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

test('should not try to resolve import urls', async () => {
  await compileAndCompare('imports-url');
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
  const err = await compile('error')
    .catch(e => e);

  expect(err).toBeInstanceOf(Error);
  expect(err.message).toMatch(/not-existing/);
});
