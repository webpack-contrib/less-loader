import {
  compile,
  getCodeFromBundle,
  getCodeFromLess,
  getCompiler,
  getErrors,
  getWarnings,
} from "./helpers";

describe('"additionalData" option', () => {
  it("should work as string", async () => {
    const testId = "./additional-data.less";
    const additionalData = "@background: coral;";
    const compiler = getCompiler(testId, { additionalData });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId, { additionalData });

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot("css");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should as function", async () => {
    const testId = "./additional-data.less";
    const additionalData = (content, loaderContext) => {
      const { resourcePath, rootContext } = loaderContext;
      // eslint-disable-next-line global-require
      const relativePath = require("path").relative(rootContext, resourcePath);

      return `
          /* RelativePath: ${relativePath}; */

          @background: coral;
          ${content};
          .custom-class {color: red};
        `;
    };
    const compiler = getCompiler(testId, { additionalData });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId, { additionalData });

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot("css");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it("should work as async function", async () => {
    const testId = "./additional-data.less";
    const additionalData = async (content, loaderContext) => {
      const { resourcePath, rootContext } = loaderContext;
      // eslint-disable-next-line global-require
      const relativePath = require("path").relative(rootContext, resourcePath);

      return `
          /* RelativePath: ${relativePath}; */

          @background: coral;
          ${content};
          .custom-class {color: red};
        `;
    };
    const compiler = getCompiler(testId, { additionalData });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId, { additionalData });

    expect(codeFromBundle.css).toBe(codeFromLess.css);
    expect(codeFromBundle.css).toMatchSnapshot("css");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
