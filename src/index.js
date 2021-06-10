import path from "path";

import less from "less";

import schema from "./options.json";
import {
  getLessOptions,
  isUnsupportedUrl,
  normalizeSourceMap,
  getLessImplementation,
} from "./utils";
import LessError from "./LessError";

async function lessLoader(source) {
  const options = this.getOptions(schema);
  const callback = this.async();
  const implementation = getLessImplementation(this, options.implementation);

  if (!implementation) {
    callback();

    return;
  }

  const webpackContextSymbol = Symbol("loaderContext");
  const lessOptions = getLessOptions(this, {
    ...options,
    webpackContextSymbol,
  });
  const useSourceMap =
    typeof options.sourceMap === "boolean" ? options.sourceMap : this.sourceMap;

  if (useSourceMap) {
    lessOptions.sourceMap = {
      outputSourceFiles: true,
    };
  }

  let data = source;

  if (typeof options.additionalData !== "undefined") {
    data =
      typeof options.additionalData === "function"
        ? `${await options.additionalData(data, this)}`
        : `${options.additionalData}\n${data}`;
  }

  let result;

  try {
    result = await implementation.render(data, lessOptions);
  } catch (error) {
    if (error.filename) {
      // `less` returns forward slashes on windows when `webpack` resolver return an absolute windows path in `WebpackFileManager`
      // Ref: https://github.com/webpack-contrib/less-loader/issues/357
      this.addDependency(path.normalize(error.filename));
    }

    callback(new LessError(error));

    return;
  }

  delete less[webpackContextSymbol];

  const { css, imports } = result;

  imports.forEach((item) => {
    if (isUnsupportedUrl(item)) {
      return;
    }

    // `less` return forward slashes on windows when `webpack` resolver return an absolute windows path in `WebpackFileManager`
    // Ref: https://github.com/webpack-contrib/less-loader/issues/357
    this.addDependency(path.normalize(item));
  });

  let map =
    typeof result.map === "string" ? JSON.parse(result.map) : result.map;

  if (map && useSourceMap) {
    map = normalizeSourceMap(map, this.rootContext);
  }

  callback(null, css, map);
}

export default lessLoader;
