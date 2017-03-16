const compile = require('./helpers/compile');
const { readCssFixture, readSourceMap } = require('./helpers/readFixture');

async function compileAndCompare(fixture, loaderOptions, loaderContext) {
  const [result, expectedCss] = await Promise.all([
    compile(fixture, loaderOptions, loaderContext),
    readCssFixture(fixture),
  ]);
  const [actualCss] = result.inspect.arguments;

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
  const [{ inspect }, expectedMap] = await Promise.all([
    compile('source-map', { sourceMap: true }),
    readSourceMap('source-map'),
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

  await compile('basic', { plugins: [testPlugin] });

  expect(pluginInstalled).toBe(true);
});

test('should not alter the original options object', async () => {
  const options = { plugins: [] };
  const copiedOptions = { ...options };

  await compile('basic', options);

  expect(copiedOptions).toEqual(options);
});

test('should report error correctly', async () => {
  const err = await compile('error')
    .catch(e => e);

  expect(err).toBeInstanceOf(Error);
  expect(err.message).toMatch(/not-existing/);
});
