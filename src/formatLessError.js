/**
 * Beautifies the error message from Less.
 *
 * @param {Error} lessErr
 * @param {string} lessErr.type - e.g. 'Name'
 * @param {string} lessErr.message - e.g. '.undefined-mixin is undefined'
 * @param {string} lessErr.filename - e.g. '/path/to/style.less'
 * @param {number} lessErr.index - e.g. 352
 * @param {number} lessErr.line - e.g. 31
 * @param {number} lessErr.callLine - e.g. NaN
 * @param {string} lessErr.callExtract - e.g. undefined
 * @param {number} lessErr.column - e.g. 6
 * @param {Array<string>} lessErr.extract - e.g. ['    .my-style {', '      .undefined-mixin;', '      display: block;']
 */
function formatLessError(lessErr) {
  const extract = lessErr.extract ? `\n near lines:\n   ${lessErr.extract.join('\n   ')}` : '';
  const err = new Error(
      `${lessErr.message}\n @ ${lessErr.filename
      } (line ${lessErr.line}, column ${lessErr.column})${
      extract}`,
  );

  err.hideStack = true;

  return err;
}

module.exports = formatLessError;
