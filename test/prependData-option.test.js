import {
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getWarnings,
} from './helpers';

jest.setTimeout(30000);

describe('prependData option', () => {
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
      prependData: `@background: coral;`,
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
