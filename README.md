# less loader for webpack

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

``` javascript
var css = require("!raw!less!./file.less");
// => returns compiled css code from file.less, resolves imports
var css = require("!css!less!./file.less");
// => returns compiled css code from file.less, resolves imports and url(...)s
```

Use in tandem with the [`style-loader`](https://github.com/webpack/style-loader) to add the css rules to your document:

``` javascript
require("!style!css!less!./file.less");
```

### webpack config

``` javascript
module.exports = {
  module: {
    loaders: [
      {
        test: /\.less$/,
        loader: "style-loader!css-loader!less-loader"
      }
    ]
  }
};
```

Then you only need to write: `require("./file.less")`

### webpack config options

You can pass LESS specific configuration options through to the render function via loader
parameters.

Acceptable config options that can be appended to the loader as parameters are:

paths, optimization, filename, strictImports, syncImport, dumpLineNumbers, relativeUrls, rootpath, compress, cleancss, cleancssOptions, ieCompat, strictMath, strictUnits, urlArgs, sourceMap, sourceMapFilename, sourceMapURL, sourceMapBasepath, sourceMapRootpath, outputSourceFiles'

``` javascript
module.exports = {
  module: {
    loaders: [
      {
        test: /\.less$/,
        loader: "style-loader!css-loader!less-loader?strictMath&cleancss"
      }
    ]
  }
};
```


## Note on imports

webpack provides an [advanced mechanism to resolve files](http://webpack.github.io/docs/resolving.html). The less-loader stubs less' `fileLoader` and passes all queries to the webpack resolving engine. Thus you can import your less-modules from `node_modules` or `bower_components`. Just prepend them with a `~` which tells webpack to look-up the [`modulesDirectories`](http://webpack.github.io/docs/configuration.html#resolve-modulesdirectories)

```css
@import "~bootstrap/less/bootstrap";
```

It's important to only prepend it with `~`, because `~/` resolves to the home-directory. webpack needs to distinguish `bootstrap` from `~bootstrap` because css- and less-files have no special syntax for importing relative files:

```css
@import "file";
```

is the same as

```css
@import "./file";
```

## Contribution

Don't hesitate to create a pull request. Every contribution is appreciated. In development you can start the tests by calling `npm test`.

The tests are basically just comparing the generated css with a reference css-file located under `test/css`. You can easily generate a reference css-file by calling `node test/helpers/generateCss.js <less-file-without-less-extension>`. It passes the less-file to less and writes the output to the `test/css`-folder.

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
