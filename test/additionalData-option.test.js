import {
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getWarnings,
} from './helpers';

jest.setTimeout(30000);

describe('additionalData option', () => {
  it('should work additionalData data as string', async () => {
    const testId = './additional-data.less';
    const compiler = getCompiler(testId, {
      additionalData: `@background: coral;`,
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });

  it('should work additionalData data as function', async () => {
    const testId = './additional-data.less';
    const compiler = getCompiler(testId, {
      additionalData(content, loaderContext) {
        const { resourcePath, rootContext } = loaderContext;
        // eslint-disable-next-line global-require
        const relativePath = require('path').relative(
          rootContext,
          resourcePath
        );

        const result = `
          /* RelativePath: ${relativePath}; */
          
          @background: coral;
          ${content};
          .custom-class {color: red};
        `;

        return result;
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toMatchSnapshot('css');
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
