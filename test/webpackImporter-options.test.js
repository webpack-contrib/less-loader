import {
  compile,
  getCodeFromBundle,
  getCodeFromLess,
  getCompiler,
  getErrors,
  getWarnings,
} from './helpers';

describe('webpackImporter option', () => {
  it('not specify webpackImporter option', async () => {
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

  it('webpackImporter option is true', async () => {
    const testId = './import-webpack.less';
    const compiler = getCompiler(testId, {
      webpackImporter: true,
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('webpackImporter option is false', async () => {
    const testId = './import-webpack.less';
    const compiler = getCompiler(testId, {
      webpackImporter: false,
    });
    const stats = await compile(compiler);

    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
