import path from "path";
import fs from "fs";

import {
  compile,
  getCodeFromBundle,
  getCodeFromLess,
  getCompiler,
  getErrors,
  getWarnings,
} from "./helpers";

describe('"sourceMap" options', () => {
  it('should generate source maps when value is "true"', async () => {
    const testId = "./source-map.less";
    const compiler = getCompiler(testId, {
      sourceMap: true,
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      expect(path.isAbsolute(source)).toBe(true);
      expect(source).toBe(path.normalize(source));
      expect(fs.existsSync(path.resolve(map.sourceRoot, source))).toBe(true);

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replace(/\\/g, "/");
    });

    expect(css).toBe(codeFromLess.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when the "devtool" value is "source-map"', async () => {
    const testId = "./source-map.less";
    const compiler = getCompiler(
      testId,
      {},
      {
        devtool: "source-map",
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      expect(path.isAbsolute(source)).toBe(true);
      expect(source).toBe(path.normalize(source));
      expect(fs.existsSync(path.resolve(map.sourceRoot, source))).toBe(true);

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replace(/\\/g, "/");
    });

    expect(css).toBe(codeFromLess.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when value is "true" and the "devtool" value is "false"', async () => {
    const testId = "./source-map.less";
    const compiler = getCompiler(
      testId,
      {
        sourceMap: true,
      },
      {
        devtool: false,
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      expect(path.isAbsolute(source)).toBe(true);
      expect(source).toBe(path.normalize(source));
      expect(fs.existsSync(path.resolve(map.sourceRoot, source))).toBe(true);

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replace(/\\/g, "/");
    });

    expect(css).toBe(codeFromLess.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should generate source maps when value has "false" value, but the "lessOptions.sourceMap.outputSourceFiles" is "true"', async () => {
    const testId = "./source-map.less";
    const compiler = getCompiler(testId, {
      sourceMap: false,
      lessOptions: {
        sourceMap: { outputSourceFiles: true },
      },
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);
    const { css, map } = codeFromBundle;

    map.sourceRoot = "";
    map.sources = map.sources.map((source) => {
      expect(path.isAbsolute(source)).toBe(true);
      expect(fs.existsSync(path.resolve(map.sourceRoot, source))).toBe(true);

      return path
        .relative(path.resolve(__dirname, ".."), source)
        .replace(/\\/g, "/");
    });

    expect(css).toBe(codeFromLess.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toMatchSnapshot("source map");
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should not generate source maps when value is "false"', async () => {
    const testId = "./source-map.less";
    const compiler = getCompiler(testId, {
      sourceMap: false,
    });
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);
    const { css, map } = codeFromBundle;

    expect(css).toBe(codeFromLess.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toBeUndefined();
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should not generate source maps when the "devtool" value is "false"', async () => {
    const testId = "./source-map.less";
    const compiler = getCompiler(
      testId,
      {},
      {
        devtool: false,
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);
    const { css, map } = codeFromBundle;

    expect(css).toBe(codeFromLess.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toBeUndefined();
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });

  it('should not generate source maps when value is "false" and the "devtool" value is "source-map"', async () => {
    const testId = "./source-map.less";
    const compiler = getCompiler(
      testId,
      {
        sourceMap: false,
      },
      {
        devtool: "source-map",
      }
    );
    const stats = await compile(compiler);
    const codeFromBundle = getCodeFromBundle(stats, compiler);
    const codeFromLess = await getCodeFromLess(testId);
    const { css, map } = codeFromBundle;

    expect(css).toBe(codeFromLess.css);
    expect(css).toMatchSnapshot("css");
    expect(map).toBeUndefined();
    expect(getWarnings(stats)).toMatchSnapshot("warnings");
    expect(getErrors(stats)).toMatchSnapshot("errors");
  });
});
