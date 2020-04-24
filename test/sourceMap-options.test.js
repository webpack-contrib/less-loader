import {
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getWarnings,
} from './helpers';

jest.setTimeout(30000);

describe('sourceMap options', () => {
  it('should generate source maps with sourcesContent by default', async () => {
    const testId = './source-map.less';
    const compiler = getCompiler(testId, {
      sourceMap: true,
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);

    expect(codeFromBundle.css).toBeDefined();
    expect(codeFromBundle.map).toBeDefined();
    expect(getWarnings(stats)).toMatchSnapshot('warnings');
    expect(getErrors(stats)).toMatchSnapshot('errors');
  });
});
