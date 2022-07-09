const illegalSymbol = process.platform === "win32" ? "/" : "\\";

module.exports = (dependencies) => {
  for (const item of Array.from(dependencies)) {
    if (item.includes(illegalSymbol)) {
      throw new Error(
        `The file path "${item}" should not contain "${illegalSymbol}"`
      );
    }
  }

  return true;
};
