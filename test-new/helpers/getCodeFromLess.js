import path from 'path';
import fs from 'fs';
import less from 'less';

const pathMap = {
  "~some/css.css": path.resolve(__dirname, '..', 'fixtures', 'node_modules', 'some', 'css.css'),
  "~some/module": path.resolve(__dirname, '..', 'fixtures', 'node_modules', 'some', 'module.less'),
  "some/module.less": path.resolve(__dirname, '..', 'fixtures', 'node_modules', 'some', 'module.less'),
  "module.less": path.resolve(__dirname, '..', 'fixtures', 'node_modules', 'some', 'module.less'),
  "~@scope/css.css": path.resolve(__dirname, '..', 'fixtures', 'node_modules', '@scope', 'css.css'),
  "~@scope/module": path.resolve(__dirname, '..', 'fixtures', 'node_modules', '@scope', 'module.less'),
  "~fileAlias": path.resolve(__dirname, '..', 'fixtures', 'img.less'),
  "fileAlias": path.resolve(__dirname, '..', 'fixtures', 'img.less'),
  "~assets/basic.less": path.resolve(__dirname, '..', 'fixtures', 'basic.less'),
  "assets/basic.less": path.resolve(__dirname, '..', 'fixtures', 'basic.less'),
};

class ResolvePlugin extends less.FileManager {
  supports() {
    return true;
  }

  async loadFile(filename, ...args) {
    const result = pathMap[filename] || path.resolve(__dirname, '..', 'fixtures', filename);

    return super.loadFile(result, ...args);
  }
}


class CustomImportPlugin {
  install(lessInstance, pluginManager) {
    pluginManager.addFileManager(new ResolvePlugin());
  }
}

async function getCodeFromLess(testId, options = {}) {
  const lessOptions = options.lessOptions || {};
  const data = await fs.promises.readFile(
    path.resolve(__dirname, '..', 'fixtures', testId)
  );

  lessOptions.plugins = [new CustomImportPlugin()];

  const result = await less.render(data.toString(), lessOptions);

  return result;
}

export default getCodeFromLess;
