class LessError extends Error {
  constructor(error) {
    super();

    this.message = [
      '\n',
      ...LessError.getFileExcerptIfPossible(error),
      error.message.charAt(0).toUpperCase() + error.message.slice(1),
      `      Error in ${error.filename} (line ${error.line}, column ${error.column})`,
    ].join('\n');

    this.hideStack = true;
  }

  static getFileExcerptIfPossible(lessErr) {
    if (typeof lessErr.extract === 'undefined') {
      return [];
    }

    const excerpt = lessErr.extract.slice(0, 2);
    const column = Math.max(lessErr.column - 1, 0);

    if (typeof excerpt[0] === 'undefined') {
      excerpt.shift();
    }

    excerpt.push(`${new Array(column).join(' ')}^`);

    return excerpt;
  }
}

export default LessError;
