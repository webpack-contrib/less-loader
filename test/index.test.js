import path from 'path';

import compile from './helpers/compile';
import moduleRules from './helpers/moduleRules';
import { readCssFixture, readSourceMap } from './helpers/readFixture';
import compareErrorMessage from './helpers/compareErrorMessage';
import getErrors from './helpers/getErrors';
import CustomImportPlugin from './fixtures/less/folder/customImportPlugin';

const nodeModulesPath = path.resolve(__dirname, 'fixtures', 'node_modules');

async function compileAndCompare(
  fixture,
  { lessLoaderOptions, lessLoaderContext, resolveAlias } = {}
) {
  let inspect;
  const rules = moduleRules.basic(lessLoaderOptions, lessLoaderContext, (i) => {
    inspect = i;
  });
  const [expectedCss] = await Promise.all([
    readCssFixture(fixture),
    compile(fixture, rules, resolveAlias),
  ]);
  const [actualCss] = inspect.arguments;

  expect(actualCss).toBe(expectedCss);
}

function lessFixturePath(fixture) {
  return path.resolve(__dirname, 'fixtures', 'less', fixture);
}

test('should compile simple less without errors', async () => {
  await compileAndCompare('basic');
});

test('should resolve all imports', async () => {
  await compileAndCompare('import');
});

test('should resolve nested imports', async () => {
  await compileAndCompare('import-nested');
});

test('should fail when passed incorrect configuration', async () => {
  await expect(
    compileAndCompare('basic', {
      lessLoaderOptions: { randomProperty: 'randomValue' },
    })
  ).rejects.toThrow();
});

test('should add all resolved imports as dependencies', async () => {
  const dependencies = [];

  await compileAndCompare('import', {
    lessLoaderContext: {
      addDependency(dep) {
        if (dependencies.indexOf(dep) === -1) {
          dependencies.push(dep);
        }
      },
    },
  });

  expect(dependencies).toContain(lessFixturePath('import.less'));
  expect(dependencies).toContain(lessFixturePath('css.css'));
  expect(dependencies).toContain(lessFixturePath('basic.less'));
});

test("should resolve all imports from node_modules using webpack's resolver", async () => {
  await compileAndCompare('import-webpack');
});

test("should resolve all imports from node_modules using webpack's resolver", async () => {
  await compileAndCompare('import-scope');
});

test('should add all resolved imports as dependencies, including node_modules', async () => {
  const dependencies = [];

  await compileAndCompare('import-webpack', {
    lessLoaderContext: {
      addDependency(dep) {
        if (dependencies.indexOf(dep) === -1) {
          dependencies.push(dep);
        }
      },
    },
  });

  expect(dependencies).toContain(lessFixturePath('import-webpack.less'));
  expect(dependencies).toContain(
    lessFixturePath('../node_modules/some/module.less')
  );
  expect(dependencies).toContain(
    lessFixturePath('../node_modules/some/css.css')
  );
});

test('should resolve aliases in diffrent variants', async () => {
  await compileAndCompare('import-webpack-alias', {
    resolveAlias: {
      'aliased-some': 'some',
      fileAlias: path.resolve(__dirname, 'fixtures', 'less', 'img.less'),
      assets: path.resolve(__dirname, 'fixtures', 'less'),
    },
  });
});

test('should add all resolved imports as dependencies, including aliased ones', async () => {
  const dependencies = [];

  await compileAndCompare('import-webpack-alias', {
    resolveAlias: {
      'aliased-some': 'some',
    },
    lessLoaderContext: {
      addDependency(dep) {
        if (dependencies.indexOf(dep) === -1) {
          dependencies.push(dep);
        }
      },
    },
  });

  expect(dependencies).toContain(lessFixturePath('import-webpack-alias.less'));
  expect(dependencies).toContain(
    lessFixturePath('../node_modules/some/module.less')
  );
});

test("should resolve all imports from the given paths using Less' resolver", async () => {
  await compileAndCompare('import-paths', {
    lessLoaderOptions: {
      lessOptions: {
        paths: [__dirname, nodeModulesPath],
      },
    },
  });
});

test('should prepend data', async () => {
  const loaderOptions = {
    prependData() {
      return `@background: red;`;
    },
  };

  let inspect;

  const rules = moduleRules.basic(loaderOptions, {}, (i) => {
    inspect = i;
  });

  await compile('prepend-data', rules).catch((e) => e);

  const [css] = inspect.arguments;

  expect(css).toEqual('.background {\n  color: red;\n}\n');
});

test('should append data', async () => {
  const loaderOptions = {
    appendData() {
      return `@color1: coral;`;
    },
  };

  let inspect;

  const rules = moduleRules.basic(loaderOptions, {}, (i) => {
    inspect = i;
  });

  await compile('append-data', rules).catch((e) => e);

  const [css] = inspect.arguments;

  expect(css).toEqual('.background {\n  color: coral;\n}\n');
});

test('should allow a function to be passed through for `lessOptions`', async () => {
  await compileAndCompare('import-paths', {
    lessLoaderOptions: {
      lessOptions: () => ({
        paths: [__dirname, nodeModulesPath],
      }),
    },
  });
});

test('should add all resolved imports as dependencies, including those from the Less resolver', async () => {
  const dependencies = [];

  await compileAndCompare('import-paths', {
    lessLoaderOptions: {
      lessOptions: {
        paths: [__dirname, nodeModulesPath],
      },
    },
    lessLoaderContext: {
      addDependency(dep) {
        if (dependencies.indexOf(dep) === -1) {
          dependencies.push(dep);
        }
      },
    },
  });

  expect(dependencies).toContain(lessFixturePath('import-paths.less'));
  expect(dependencies).toContain(
    lessFixturePath('../node_modules/some/module.less')
  );
});

test("should allow to disable webpack's resolver by passing an empty paths array", async () => {
  const err = await compile(
    'import-webpack',
    moduleRules.basic({ lessOptions: { paths: [] } })
  ).catch((e) => e);

  expect(err).toBeInstanceOf(Error);
  expect(err.message).toMatch(/'~some\/css\.css' wasn't found/);
});

// This test was invalid because it tested imports like this:
//   @import url("//fonts.googleapis.com/css?family=Roboto:300,400,500");
// and expected them to be preserved in the output of Less and not resolved.
// See https://github.com/less/less.js/pull/2955
// Because of a bug in Less <3.0, imports with the substring '/css' indeed were
// parsed as CSS imports, i.e. were preserved. Now that the bug has been fixed,
// if you need to preserve an import that doesn't have the `.css` extension,
// use the `(css)` import option:
//   @import (css) url("//fonts.googleapis.com/css?family=Roboto:300,400,500");
// That's how the Less language is designed to work.
test('should not try to resolve CSS imports with URLs', async () => {
  await compileAndCompare('import-url');
});

test('should delegate resolving (LESS) imports with URLs to "less" package', async () => {
  await compileAndCompare('import-keyword-url');
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

test('should generate source maps with sourcesContent by default', async () => {
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

  expect(Array.isArray(actualMap.sourcesContent)).toBe(true);
  expect(actualMap.sourcesContent.length).toBe(2);

  // We can't actually compare the sourcesContent because it's slightly different because of our import rewriting
  delete actualMap.sourcesContent;
  delete expectedMap.sourcesContent;

  expect(actualCss).toEqual(expectedCss);
  expect(actualMap).toEqual(expectedMap);
});

test('should install plugins', async () => {
  let pluginInstalled = false;
  // Using prototype inheritance here since Less plugins are usually instances of classes
  // See https://github.com/webpack-contrib/less-loader/issues/181#issuecomment-288220113
  const testPlugin = Object.create({
    install() {
      pluginInstalled = true;
    },
  });

  await compile(
    'basic',
    moduleRules.basic({ lessOptions: { plugins: [testPlugin] } })
  );

  expect(pluginInstalled).toBe(true);
});

test('should import from plugins', async () => {
  const loaderOptions = {
    lessOptions: {
      plugins: [new CustomImportPlugin()],
    },
  };

  let inspect;

  const rules = moduleRules.basic(loaderOptions, {}, (i) => {
    inspect = i;
  });

  await compile('empty', rules).catch((e) => e);

  const [css] = inspect.arguments;

  expect(css).toEqual('.imported-class {\n  color: coral;\n}\n');
});

test('should not alter the original options object', async () => {
  const options = { lessOptions: { plugins: [] } };
  const copiedOptions = { ...options };

  await compile('basic', moduleRules.basic(options));

  expect(copiedOptions).toEqual(options);
});

test("should fail if a file is tried to be loaded from include paths and with webpack's resolver simultaneously", async () => {
  const err = await compile(
    'error-mixed-resolvers',
    moduleRules.basic({ lessOptions: { paths: [nodeModulesPath] } })
  ).catch((e) => e);

  expect(err).toBeInstanceOf(Error);

  compareErrorMessage(err.message);
});

test('should provide a useful error message if the import could not be found', async () => {
  const err = await compile(
    'error-import-not-existing',
    moduleRules.basic()
  ).catch((e) => e);

  expect(getErrors(err.stats)).toMatchSnapshot('errors');
});

test('should provide a useful error message if there was a syntax error', async () => {
  const err = await compile('error-syntax', moduleRules.basic()).catch(
    (e) => e
  );

  expect(err).toBeInstanceOf(Error);

  compareErrorMessage(err.message);
});

test('should add a file with an error as dependency so that the watcher is triggered when the error is fixed', async () => {
  const dependencies = [];
  const lessLoaderContext = {
    addDependency(dep) {
      if (dependencies.indexOf(dep) === -1) {
        dependencies.push(dep);
      }
    },
  };
  const rules = moduleRules.basic({}, lessLoaderContext);

  await compile('error-import-file-with-error', rules).catch((e) => e);

  expect(dependencies).toContain(
    lessFixturePath('error-import-file-with-error.less')
  );
  expect(dependencies).toContain(lessFixturePath('error-syntax.less'));
});

test('should be able to import a file with an absolute path', async () => {
  const importedFilePath = path.resolve(
    __dirname,
    'fixtures',
    'less',
    'import-absolute-target.less'
  );
  const loaderOptions = {
    lessOptions: {
      globalVars: {
        absolutePath: `'${importedFilePath}'`,
      },
    },
  };

  let inspect;

  const rules = moduleRules.basic(loaderOptions, {}, (i) => {
    inspect = i;
  });

  await compile('import-absolute', rules).catch((e) => e);

  const [css] = inspect.arguments;

  expect(css).toEqual('.it-works {\n  color: yellow;\n}\n');
});
