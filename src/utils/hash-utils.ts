/**
 * Utility functions for hash operations
 */

import { createHash } from 'crypto';

/**
 * Compute the UNIX epoch time from 'now' up to the specified amount of hours
 * @param hoursFromNow - Hours from now
 * @returns UNIX epoch time
 */
export function computeEpochTimeFromTtl(hoursFromNow: number): number {
  const now = getNow();
  const ttlDate = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
  return Math.floor(ttlDate.getTime() / 1000);
}

/**
 * Compute the hash of a given URL as Base62-encoded string
 * @param url - URL to hash
 * @returns Base62-encoded hash
 */
export function computeHash(url: string): string {
  const hash = BigInt('0x' + createHash('sha256').update(url).digest('hex')) % BigInt(10**12);
  return toBase62(Number(hash));
}

const BASE62_ENCODING_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Encode a number into its Base62 representation
 * @param someNumber - Number to encode
 * @returns Base62-encoded string
 */
export function toBase62(someNumber: number): string {
  let hashStr = "";
  
  while (someNumber > 0) {
    hashStr = BASE62_ENCODING_CHARS[someNumber % 62] + hashStr;
    someNumber = Math.floor(someNumber / 62);
  }
  
  return hashStr;
}

/**
 * Get current date (this is needed for testing, since we cannot mock Date directly)
 * @returns Current date
 */
export function getNow(): Date {
  return new Date();
}