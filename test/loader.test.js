import path from 'path';

import CustomImportPlugin from './fixtures/folder/customImportPlugin';
import CustomFileLoaderPlugin from './fixtures/folder/customFileLoaderPlugin';

import {
  compile,
  getCodeFromBundle,
  getCodeFromLess,
  getCompiler,
  getErrors,
  getWarnings,
} from './helpers';

const nodeModulesPath = path.resolve(__dirname, 'fixtures', 'node_modules');

jest.setTimeout(30000);

describe('loader', () => {
  it('should work', async () => {
    const testId = './basic.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should compile data-uri function', async () => {
    const testId = './data-uri.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should transform urls', async () => {
    const testId = './url-path.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should install plugins', async () => {
    let pluginInstalled = false;
    // Using prototype inheritance here since Less plugins are usually instances of classes
    // See https://github.com/webpack-contrib/less-loader/issues/181#issuecomment-288220113
    const testPlugin = Object.create({
      install() {
        pluginInstalled = true;
      },
    });

    const testId = './basic.less';
    const compiler = await getCompiler(testId, {
      lessOptions: {
        plugins: [testPlugin],
      },
    });
    const stats = await compile(compiler);

    expect(pluginInstalled).toBe(true);
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should import from plugins', async () => {
    const testId = './empty.less';
    const compiler = getCompiler(testId, {
      lessOptions: {
        plugins: [new CustomImportPlugin()],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId, {
      lessOptions: {
        plugins: [new CustomImportPlugin()],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work third-party plugins as fileLoader', async () => {
    const testId = './file-load.less';
    const compiler = getCompiler(testId, {
      lessOptions: {
        plugins: [new CustomFileLoaderPlugin()],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId, {
      lessOptions: {
        plugins: [new CustomFileLoaderPlugin()],
      },
    });

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should not alter the original options object', async () => {
    const options = { lessOptions: { plugins: [] } };
    const copiedOptions = { ...options };

    const testId = './empty.less';
    const compiler = getCompiler(testId, options);
    const stats = await compile(compiler);

    expect(copiedOptions).toEqual(options);
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should resolve all imports', async () => {
    const testId = './import.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should resolve nested imports', async () => {
    const testId = './import-nested.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it("should resolve all imports from node_modules using webpack's resolver", async () => {
    const testId = './import-webpack.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it("should resolve all imports from node_modules using webpack's resolver", async () => {
    const testId = './import-scope.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should resolve aliases in diffrent variants', async () => {
    const testId = './import-webpack-aliases.less';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            fileAlias: path.resolve(__dirname, 'fixtures', 'img.less'),
            assets: path.resolve(__dirname, 'fixtures'),
          },
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should resolve all imports from the given paths using Less resolver', async () => {
    const testId = './import-paths.less';
    const compiler = getCompiler(testId, {
      lessOptions: {
        paths: [path.resolve(nodeModulesPath, 'some')],
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it("should not to disable webpack's resolver by passing an empty paths array", async () => {
    const testId = './import-webpack-aliases.less';
    const compiler = getCompiler(
      testId,
      {
        lessOptions: {
          paths: [],
        },
      },
      {
        resolve: {
          alias: {
            fileAlias: path.resolve(__dirname, 'fixtures', 'img.less'),
            assets: path.resolve(__dirname, 'fixtures'),
          },
        },
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should not try to resolve CSS imports with URLs', async () => {
    const testId = './import-url.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should delegate resolving (LESS) imports with URLs to "less" package', async () => {
    const testId = './import-keyword-url.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should allow to import non-less files', async () => {
    const testId = './import-non-less.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should provide a useful error message if the import could not be found', async () => {
    const testId = './error-import-not-existing.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should provide a useful error message if there was a syntax error', async () => {
    const testId = './error-syntax.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should be able to import a file with an absolute path', async () => {
    const importedFilePath = path.resolve(
      __dirname,
      'fixtures',
      'import-absolute-target.less'
    );

    const testId = './import-absolute.less';
    const compiler = getCompiler(testId, {
      lessOptions: {
        globalVars: {
          absolutePath: `'${importedFilePath}'`,
        },
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should add all resolved imports as dependencies', async () => {
    const testId = './import.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const dependencies = stats.compilation.fileDependencies;

    const fixtures = [
      path.resolve(__dirname, 'fixtures', 'import.less'),
      path.resolve(__dirname, 'fixtures', 'css.css'),
      path.resolve(__dirname, 'fixtures', 'basic.less'),
    ];

    fixtures.forEach((fixture) => {
      expect(dependencies.has(fixture)).toBe(true);
    });
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should add all resolved imports as dependencies, including aliased ones', async () => {
    const testId = './import-webpack-alias.less';
    const compiler = getCompiler(
      testId,
      {},
      {
        resolve: {
          alias: {
            'aliased-some': 'some',
          },
        },
      }
    );
    const stats = await compile(compiler);
    const dependencies = stats.compilation.fileDependencies;

    const fixtures = [
      path.resolve(__dirname, 'fixtures', 'import-webpack-alias.less'),
      path.resolve(
        __dirname,
        'fixtures',
        'node_modules',
        'some',
        'module.less'
      ),
    ];

    fixtures.forEach((fixture) => {
      expect(dependencies.has(fixture)).toBe(true);
    });
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should add all resolved imports as dependencies, including those from the Less resolver', async () => {
    const testId = './import-dependency.less';
    const compiler = getCompiler(testId, {
      lessOptions: {
        paths: [__dirname, nodeModulesPath],
      },
    });
    const stats = await compile(compiler);
    const dependencies = stats.compilation.fileDependencies;

    const fixtures = [
      path.resolve(__dirname, 'fixtures', 'import-dependency.less'),
      path.resolve(
        __dirname,
        'fixtures',
        'node_modules',
        'some',
        'module.less'
      ),
    ];

    fixtures.forEach((fixture) => {
      expect(dependencies.has(fixture)).toBe(true);
    });
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should add a file with an error as dependency so that the watcher is triggered when the error is fixed', async () => {
    const testId = './error-import-file-with-error.less';
    const compiler = getCompiler(testId, {
      lessOptions: {
        paths: [__dirname, nodeModulesPath],
      },
    });
    const stats = await compile(compiler);
    const dependencies = stats.compilation.fileDependencies;

    const fixtures = [
      path.resolve(__dirname, 'fixtures', 'error-import-file-with-error.less'),
      path.resolve(__dirname, 'fixtures', 'error-syntax.less'),
    ];

    fixtures.forEach((fixture) => {
      expect(dependencies.has(fixture)).toBe(true);
    });
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should add all resolved imports as dependencies, including node_modules', async () => {
    const testId = './import-webpack.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const dependencies = stats.compilation.fileDependencies;

    const fixtures = [
      path.resolve(__dirname, 'fixtures', 'import-webpack.less'),
      path.resolve(
        __dirname,
        'fixtures',
        'node_modules',
        'some',
        'module.less'
      ),
    ];

    fixtures.forEach((fixture) => {
      expect(dependencies.has(fixture)).toBe(true);
    });
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should watch imports correctly', async () => {
    const testId = './watch.less';
    const compiler = getCompiler(testId);
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);
    const { fileDependencies } = stats.compilation;

    const fixtures = [
      path.resolve(__dirname, 'fixtures', 'watch.less'),
      path.resolve(
        __dirname,
        'fixtures',
        'node_modules',
        'package',
        'style.less'
      ),
    ];

    fixtures.forEach((fixture) => {
      expect(fileDependencies.has(fixture)).toBe(true);
    });

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
