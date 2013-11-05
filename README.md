# less loader for webpack

## Usage

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

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
