function nestedFileLoader(source) {
  return source.replace('<%= color %>', 'hotpink');
}

module.exports = nestedFileLoader;
