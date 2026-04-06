/**
 * LexoRank implementation for fractional indexing.
 * Generates sortable string keys between two other keys.
 * Based on Jira's LexoRank algorithm.
 */

export class LexoRank {
  private static readonly MIN_CHAR = '0';
  private static readonly MAX_CHAR = 'z';
  private static readonly MID_CHAR = '5';

  /**
   * Generate a rank between two ranks
   * @param prevRank Previous rank (null for start)
   * @param nextRank Next rank (null for end)
   * @returns New rank string
   */
  static between(prevRank: string | null, nextRank: string | null): string {
    if (prevRank === null && nextRank === null) {
      return this.MID_CHAR;
    }

    if (prevRank === null) {
      return this.generateRankBefore(nextRank!);
    }

    if (nextRank === null) {
      return this.generateRankAfter(prevRank);
    }

    // Find first differing character
    let i = 0;
    while (
      i < prevRank.length &&
      i < nextRank.length &&
      prevRank[i] === nextRank[i]
    ) {
      i++;
    }

    if (i === prevRank.length && i === nextRank.length) {
      // Strings are identical - append a character
      return prevRank + this.MID_CHAR;
    }

    if (i < prevRank.length && i < nextRank.length) {
      const prevChar = prevRank[i];
      const nextChar = nextRank[i];
      const betweenChar = this.betweenChars(prevChar, nextChar);

      if (betweenChar !== null) {
        return prevRank.substring(0, i) + betweenChar;
      }
    }

    // Need to extend the shorter string
    if (prevRank.length < nextRank.length && i === prevRank.length) {
      const nextChar = nextRank[i];
      const betweenChar = this.betweenChars(this.MIN_CHAR, nextChar);

      if (betweenChar !== null) {
        return prevRank.substring(0, i) + betweenChar;
      }
    }

    // Default: append to prevRank
    return prevRank + this.MID_CHAR;
  }

  /**
   * Generate a rank that comes after the given rank
   */
  static generateRankAfter(rank: string): string {
    // Try to increment the last character
    for (let i = rank.length - 1; i >= 0; i--) {
      const char = rank[i];
      const nextChar = this.incrementChar(char);

      if (nextChar !== null) {
        return rank.substring(0, i) + nextChar;
      }
    }

    // Need to extend the string
    return rank + this.MID_CHAR;
  }

  /**
   * Generate a rank that comes before the given rank
   */
  static generateRankBefore(rank: string): string {
    // Try to decrement the last character
    for (let i = rank.length - 1; i >= 0; i--) {
      const char = rank[i];
      const prevChar = this.decrementChar(char);

      if (prevChar !== null) {
        return rank.substring(0, i) + prevChar;
      }
    }

    // Need to prepend a character
    return this.MID_CHAR + rank;
  }

  /**
   * Get a character between two characters
   */
  private static betweenChars(a: string, b: string): string | null {
    const aCode = a.charCodeAt(0);
    const bCode = b.charCodeAt(0);

    if (bCode - aCode > 1) {
      const midCode = Math.floor((aCode + bCode) / 2);
      return String.fromCharCode(midCode);
    }

    return null;
  }

  /**
   * Increment a character, wrapping if necessary
   */
  private static incrementChar(char: string): string | null {
    const code = char.charCodeAt(0);
    if (code < this.MAX_CHAR.charCodeAt(0)) {
      return String.fromCharCode(code + 1);
    }
    return null;
  }

  /**
   * Decrement a character, wrapping if necessary
   */
  private static decrementChar(char: string): string | null {
    const code = char.charCodeAt(0);
    if (code > this.MIN_CHAR.charCodeAt(0)) {
      return String.fromCharCode(code - 1);
    }
    return null;
  }

  /**
   * Generate initial ranks for a sequence
   */
  static generateInitialRanks(count: number): string[] {
    const ranks: string[] = [];
    let currentRank = this.MID_CHAR;

    for (let i = 0; i < count; i++) {
      ranks.push(currentRank);
      currentRank = this.generateRankAfter(currentRank);
    }

    return ranks;
  }

  /**
   * Validate if a rank string is valid
   */
  static isValid(rank: string): boolean {
    return /^[0-9a-z]+$/.test(rank);
  }
}