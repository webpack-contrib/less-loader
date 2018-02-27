module.exports.pitch = function lessFileLoader() {
  const callback = this.async();
  const { resource } = this;

  this.addDependency(resource);
  this.fs.readFile(resource, (err, contents) => {
    if (err) throw err;
    callback(null, JSON.stringify(JSON.stringify({
      contents: contents.toString('utf8'),
      filename: resource,
    })));
  });
  return JSON.stringify('');
};
