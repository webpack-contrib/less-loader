import path from "path";
import less from "less";

class Plugin extends less.FileManager {
  supports(filename) {
    if (filename === 'forFileLoaderPluginResolve.less') {
      return true;
    }

    return false;
  }

  loadFile(filename, ...args) {
    const result = path.resolve(__dirname, '../', 'file-load-replacement.less');

    return super.loadFile(result, ...args);
  };
}

class CustomFileLoaderPlugin {
  install(less, pluginManager) {
    pluginManager.addFileManager(new Plugin());
  }
}

module.exports = CustomFileLoaderPlugin;
