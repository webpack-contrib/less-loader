# less loader for webpack

## Usage

``` javascript
var css = require("less!./file.less");
// => returns compiled css code from file.less, resolves imports
```

Don't forget to polyfill `require` if you want to use it in node.
See `webpack` documentation.

## License

MIT (http://www.opensource.org/licenses/mit-license.php)