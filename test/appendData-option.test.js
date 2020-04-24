import {
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getWarnings,
} from './helpers';

jest.setTimeout(30000);

describe('appendData option', () => {
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
      appendData: `@color: coral;`,
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
