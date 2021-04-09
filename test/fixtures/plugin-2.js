registerPlugin({
  install: function(less, pluginManager, functions) {
    functions.add('run', function() {
      if (typeof pluginManager.webpackLoaderContext !== 'undefined') {
        return 'true';
      }

      return 'false';
    });
  }
})
