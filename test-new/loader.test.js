import path from 'path';

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

  it('should work prepend data as function', async () => {
    const testId = './prepend-data.less';
    const compiler = getCompiler(testId, {
      prependData() {
        return `@background: coral;`;
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work prepend data as string', async () => {
    const testId = './prepend-data.less';
    const compiler = getCompiler(testId, {
      prependData: `@background: coral;`
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work append data as function', async () => {
    const testId = './append-data.less';
    const compiler = getCompiler(testId, {
      appendData() {
        return `@color: coral;`;
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work append data as string', async () => {
    const testId = './append-data.less';
    const compiler = getCompiler(testId, {
      appendData: `@color: coral;`
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  // Imports
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

  it('should resolve all imports from node_modules using webpack\'s resolver', async () => {
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

  it('should resolve all imports from node_modules using webpack\'s resolver', async () => {
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
    const compiler = getCompiler(testId, {}, {
      resolve: {
        alias: {
          fileAlias: path.resolve(__dirname, 'fixtures', 'img.less'),
          assets: path.resolve(__dirname, 'fixtures'),
        }
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

  it.only('do not should to disable webpack\'s resolver by passing an empty paths array', async () => {
    const testId = './import-webpack-aliases.less';
    const compiler = getCompiler(testId, {
      lessOptions: {
        paths: [],
      },
    }, {
      resolve: {
        alias: {
          fileAlias: path.resolve(__dirname, 'fixtures', 'img.less'),
          assets: path.resolve(__dirname, 'fixtures'),
        }
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

  // it('should add all resolved imports as dependencies', async () => {
  //   const dependencies = [];
  //   const testId = './import.less';
  //   const compiler = getCompiler(testId, {}, {
  //     addDependency(dep) {
  //       if (dependencies.indexOf(dep) === -1) {
  //         dependencies.push(dep);
  //       }
  //     },
  //   });
  //   const stats = await compile(compiler);
  //   const codeFromBundle = getCodeFromBundle(stats, compiler);
  //   const codeFromLess = await getCodeFromLess(testId);
  //
  //   expect(codeFromBundle.css).toBe(codeFromLess.css);
  //   expect(codeFromBundle.css).toMatchSnapshot('css');
  //   expect(getWarnings(stats)).toMatchSnapshot('warnings');
  //   expect(getErrors(stats)).toMatchSnapshot('errors');
  // });

  // it('should add all resolved imports as dependencies, including node_modules', async () => {
  //   const dependencies = [];
  //   const testId = './import.less';
  //   const compiler = getCompiler(testId, {}, {
  //     addDependency(dep) {
  //       if (dependencies.indexOf(dep) === -1) {
  //         dependencies.push(dep);
  //       }
  //     },
  //   });
  //   const stats = await compile(compiler);
  //   const codeFromBundle = getCodeFromBundle(stats, compiler);
  //   const codeFromLess = await getCodeFromLess(testId);
  //
  //   expect(codeFromBundle.css).toBe(codeFromLess.css);
  //   expect(codeFromBundle.css).toMatchSnapshot('css');
  //   expect(getWarnings(stats)).toMatchSnapshot('warnings');
  //   expect(getErrors(stats)).toMatchSnapshot('errors');
  // });

  // Errors
  /*
  it('should fail when passed incorrect configuration', async () => {
    const testId = './basic.less';
    const compiler = getCompiler(testId, {
      randomProperty: 'randomValue'
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(() => {throw new Error(errors[0].error.message);
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
  */

});
