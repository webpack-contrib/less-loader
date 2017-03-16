function helperLoader() {
  // Discard the contents
  return '';
}

helperLoader.pitch = function pitch() {
  // Extend loader context with mocks
  Object.assign(this, this.query);
};

module.exports = helperLoader;
