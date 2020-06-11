import path from 'path';
import fs from 'fs';

import less from 'less';

const pathMap = {
  '~some/css.css': path.resolve(
    __dirname,
    '..',
    'fixtures',
    'node_modules',
    'some',
    'css.css'
  ),
  '~some/module': path.resolve(
    __dirname,
    '..',
    'fixtures',
    'node_modules',
    'some',
    'module.less'
  ),
  'some/module.less': path.resolve(
    __dirname,
    '..',
    'fixtures',
    'node_modules',
    'some',
    'module.less'
  ),
  'module.less': path.resolve(
    __dirname,
    '..',
    'fixtures',
    'node_modules',
    'some',
    'module.less'
  ),
  '~@scope/css.css': path.resolve(
    __dirname,
    '..',
    'fixtures',
    'node_modules',
    '@scope',
    'css.css'
  ),
  '~@scope/module': path.resolve(
    __dirname,
    '..',
    'fixtures',
    'node_modules',
    '@scope',
    'module.less'
  ),
  '~fileAlias': path.resolve(__dirname, '..', 'fixtures', 'img.less'),
  fileAlias: path.resolve(__dirname, '..', 'fixtures', 'img.less'),
  '~assets/basic.less': path.resolve(__dirname, '..', 'fixtures', 'basic.less'),
  'assets/basic.less': path.resolve(__dirname, '..', 'fixtures', 'basic.less'),
  '@{absolutePath}': path.resolve(
    __dirname,
    '..',
    'fixtures',
    'import-absolute-target.less'
  ),
  '~package/style.less': path.resolve(
    __dirname,
    '..',
    'fixtures',
    'node_modules',
    'package',
    'style.less'
  ),
};

class ResolvePlugin extends less.FileManager {
  supports(filename) {
    if (this.isPathAbsolute(filename)) {
      return false;
    }

    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  supportsSync() {
    return false;
  }

  async loadFile(filename, ...args) {
    const result =
      pathMap[filename] || path.resolve(__dirname, '..', 'fixtures', filename);

    return super.loadFile(result, ...args);
  }
}

class CustomImportPlugin {
  // eslint-disable-next-line class-methods-use-this
  install(lessInstance, pluginManager) {
    pluginManager.addFileManager(new ResolvePlugin());
  }
}

async function getCodeFromLess(testId, options = {}) {
  const pathToFile = path.resolve(__dirname, '..', 'fixtures', testId);
  const defaultOptions = {
    plugins: [],
    relativeUrls: true,
    filename: pathToFile,
  };
  const lessOptions = options.lessOptions || {};
  const data = await fs.promises.readFile(pathToFile);
  const mergedOptions = {
    ...defaultOptions,
    ...lessOptions,
  };

  mergedOptions.plugins.unshift(new CustomImportPlugin());

  const result = await less.render(data.toString(), mergedOptions);

  return result;
}

export default getCodeFromLess;
