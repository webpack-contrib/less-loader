const illegalSymbol = process.platform === "win32" ? "/" : "\\";

export default (dependencies) => {
  for (const item of dependencies) {
    if (item.includes(illegalSymbol)) {
      throw new Error(
        `The file path "${item}" should not contain "${illegalSymbol}"`,
      );
    }
  }

  return true;
};
