export default function dedupeFirebaseLicense() {
  return {
    name: 'dedupe-firebase-license',

    renderChunk(code) {
      const license = code.match(/\/\*\*\s+\* @license.+?\*\//s);
      if (!license) {
        return { code };
      }
      const years = new Set();
      code.matchAll(/(\d{4}) Google/g).forEach(([_full, year]) => years.add(~~year));
      const oldest = Math.min(...years);
      const newest = Math.max(...years);
      const bundledLicense = license[0].replace(
        /\* Copyright \d{4} Google/,
        `Firebase code: Copyright ${oldest}-${newest} Google`,
      );
      return {
        code: code.replaceAll(/\/\*\*\s+\* @license.+?\*\//gs, '') + bundledLicense,
      };
    },
  };
}
