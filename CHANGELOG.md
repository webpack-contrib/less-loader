Changelog
---------

### 3.0.0

- **Breaking**: Remove node 0.10 and 0.12 support
- **Breaking**: Remove official webpack 1 support. There are no breaking changes for webpack 1 with `3.0.0`, but future release won't be tested against webpack 1
- **Breaking**: Remove synchronous compilation support [#152](https://github.com/webpack-contrib/less-loader/pull/152) [#84](https://github.com/webpack-contrib/less-loader/issues/84)
- Reduce npm package size by using the [files](https://docs.npmjs.com/files/package.json#files) property in the `package.json`


### 2.2.3

- Fix missing path information in source map [#73](https://github.com/webpack/less-loader/pull/73)
- Add deprecation warning [#84](https://github.com/webpack/less-loader/issues/84)

### 2.2.2

- Fix issues with synchronous less functions like `data-uri()`, `image-size()`, `image-width()`, `image-height()` [#31](https://github.com/webpack/less-loader/issues/31) [#38](https://github.com/webpack/less-loader/issues/38) [#43](https://github.com/webpack/less-loader/issues/43) [#58](https://github.com/webpack/less-loader/pull/58)

### 2.2.1

- Improve Readme

### 2.2.0

- Added option to specify LESS plugins [#40](https://github.com/webpack/less-loader/pull/40)
