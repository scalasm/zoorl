/**
 * Read an hash for a given URL
 */

import { ReadUrlHashRequest, ReadUrlHashResponse } from '../dto/url-hash.dto';
import { UrlHashRepository } from '../adapters/secondary/repository.adapter';

export class UrlHashNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlHashNotFoundError';
  }
}

export class ReadUrlHashUseCase {
  /**
   * Use case for reading a URL hash
   * @param urlHashRepository - Repository for URL hash operations
   */
  constructor(private readonly urlHashRepository: UrlHashRepository) {}

  /**
   * Finds the URL associated to the requested hash
   * @param request - contains the desired URL hash to lookup
   * @returns the URL, hash, and TTL, if the hash is present
   * @throws UrlHashNotFoundError if no such hash was found
   */
  async readUrl(request: ReadUrlHashRequest): Promise<ReadUrlHashResponse> {
    const urlHash = await this.urlHashRepository.getByHash(request.hash);

    if (!urlHash) {
      throw new UrlHashNotFoundError('The specified URL hash is invalid or expired!');
    }

    return {
      url_hash: urlHash.hash,
      url: urlHash.url,
      ttl: urlHash.ttl
    };
  }
}