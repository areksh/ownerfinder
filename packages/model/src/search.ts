/**
 * Folds a name for matching: lower case, accents removed, typographic
 * apostrophes made ASCII, whitespace collapsed. The data build folds
 * names with it and the API folds queries with it, so both agree.
 */
export function foldForSearch(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[‘’ʼ]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
