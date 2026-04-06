/**
 * Fractional string ranking implementation for ordering items in columns.
 * Based on Jira's Lexorank algorithm concept.
 */

const MIN_CHAR = "a";
const MAX_CHAR = "z";
const MIDDLE_CHAR = "n";

/**
 * Calculate the middle string between two strings for fractional ranking
 * @param prevRank Previous rank string or null if at start
 * @param nextRank Next rank string or null if at end
 * @returns New rank string between prevRank and nextRank
 */
export function getRankBetween(
  prevRank: string | null,
  nextRank: string | null
): string {
  // If both are null, return middle of alphabet
  if (prevRank === null && nextRank === null) {
    return MIDDLE_CHAR;
  }
  
  // If prevRank is null, we're inserting at beginning
  if (prevRank === null) {
    return getPreviousRank(nextRank!);
  }
  
  // If nextRank is null, we're inserting at end
  if (nextRank === null) {
    return getNextRank(prevRank);
  }
  
  // Find middle rank between prevRank and nextRank
  let newRank = "";
  let i = 0;
  
  while (true) {
    const prevChar = i < prevRank.length ? prevRank[i] : MIN_CHAR;
    const nextChar = i < nextRank.length ? nextRank[i] : MAX_CHAR;
    
    if (prevChar === nextChar) {
      newRank += prevChar;
      i++;
      continue;
    }
    
    // Find middle character between prevChar and nextChar
    const prevCode = prevChar.charCodeAt(0);
    const nextCode = nextChar.charCodeAt(0);
    
    if (nextCode - prevCode > 1) {
      const middleCode = Math.floor((prevCode + nextCode) / 2);
      newRank += String.fromCharCode(middleCode);
      break;
    } else {
      newRank += prevChar;
      i++;
      
      // If we've reached end of prevRank, append middle char
      if (i === prevRank.length) {
        newRank += MIDDLE_CHAR;
        break;
      }
      
      // Continue to next character position
      if (i >= nextRank.length) {
        // Need to find a spot between prevRank[i] and MAX_CHAR
        const nextPrevChar = prevRank[i];
        if (nextPrevChar < MAX_CHAR) {
          newRank += String.fromCharCode(nextPrevChar.charCodeAt(0) + 1);
        } else {
          newRank += MIDDLE_CHAR;
        }
        break;
      }
    }
  }
  
  return newRank;
}

/**
 * Get the previous rank (for inserting before a rank)
 */
function getPreviousRank(rank: string): string {
  if (rank === MIN_CHAR.repeat(rank.length)) {
    // If rank is all 'a's, prepend 'a' to make room
    return rank.slice(0, -1) + MIN_CHAR + MAX_CHAR;
  }
  
  // Find last non-'a' character and decrement it
  const chars = rank.split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] !== MIN_CHAR) {
      const newCharCode = chars[i].charCodeAt(0) - 1;
      chars[i] = String.fromCharCode(newCharCode);
      
      // Fill rest with 'z's to stay between current and previous
      for (let j = i + 1; j < chars.length; j++) {
        chars[j] = MAX_CHAR;
      }
      
      return chars.join("");
    }
  }
  
  // Should not reach here
  return rank + MIDDLE_CHAR;
}

/**
 * Get the next rank (for inserting after a rank)
 */
function getNextRank(rank: string): string {
  if (rank === MAX_CHAR.repeat(rank.length)) {
    // If rank is all 'z's, append 'a' to make room
    return rank + MIDDLE_CHAR;
  }
  
  // Find last non-'z' character and increment it
  const chars = rank.split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] !== MAX_CHAR) {
      const newCharCode = chars[i].charCodeAt(0) + 1;
      chars[i] = String.fromCharCode(newCharCode);
      
      // Fill rest with 'a's to stay between current and next
      for (let j = i + 1; j < chars.length; j++) {
        chars[j] = MIN_CHAR;
      }
      
      return chars.join("");
    }
  }
  
  // Should not reach here
  return rank + MIDDLE_CHAR;
}

/**
 * Generate initial ranks for a set of items
 * @param count Number of ranks to generate
 * @returns Array of rank strings
 */
export function generateInitialRanks(count: number): string[] {
  if (count <= 0) return [];
  
  const ranks: string[] = [];
  const step = Math.floor((MAX_CHAR.charCodeAt(0) - MIN_CHAR.charCodeAt(0)) / (count + 1));
  
  for (let i = 1; i <= count; i++) {
    const charCode = MIN_CHAR.charCodeAt(0) + step * i;
    ranks.push(String.fromCharCode(charCode));
  }
  
  return ranks;
}

/**
 * Rebalance ranks when they become too long or inefficient
 * @param ranks Array of rank strings to rebalance
 * @returns Rebalanced array of rank strings
 */
export function rebalanceRanks(ranks: string[]): string[] {
  if (ranks.length <= 1) return ranks;
  
  const newRanks: string[] = [];
  const stepSize = Math.floor((MAX_CHAR.charCodeAt(0) - MIN_CHAR.charCodeAt(0)) / (ranks.length + 1));
  
  for (let i = 0; i < ranks.length; i++) {
    const charCode = MIN_CHAR.charCodeAt(0) + stepSize * (i + 1);
    newRanks.push(String.fromCharCode(charCode));
  }
  
  return newRanks;
}