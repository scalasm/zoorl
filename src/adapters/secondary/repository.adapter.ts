/**
 * Repository interface for accessing URL Hash model entities
 */

import { UrlHashDto } from '../../dto/url-hash.dto';

export interface UrlHashRepository {
  /**
   * Save a URL hash within the repository
   * @param urlHash - the URL Hash to save
   */
  save(urlHash: UrlHashDto): Promise<void>;

  /**
   * Returns the UrlHash, if present
   * @param hash - the required hash
   * @returns the requested UrlHash or undefined if no such hash was found
   */
  getByHash(hash: string): Promise<UrlHashDto | undefined>;
}