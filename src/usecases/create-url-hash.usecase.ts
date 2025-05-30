/**
 * Create an hash for a given URL
 */

import { CreateUrlHashRequest, CreateUrlHashResponse } from '../dto/url-hash.dto';
import { UrlHashRepository } from '../adapters/secondary/repository.adapter';
import { computeEpochTimeFromTtl, computeHash } from '../utils/hash-utils';

// Default TTL is 1 day (24 hours)
const DEFAULT_TTL = 24;

export class CreateUrlHashUseCase {
  /**
   * Use case for creating a new URL hash
   * @param urlHashRepository - Repository for URL hash operations
   */
  constructor(private readonly urlHashRepository: UrlHashRepository) {}

  /**
   * Create a URL hash
   * @param request - URL and (optional) TTL
   * @returns the URL hash information
   */
  async create(request: CreateUrlHashRequest): Promise<CreateUrlHashResponse> {
    const ttl = request.ttl || DEFAULT_TTL;
    const hash = computeHash(request.url);
    
    const urlHash = {
      hash,
      url: request.url,
      ttl: computeEpochTimeFromTtl(ttl)
    };

    await this.urlHashRepository.save(urlHash);

    return {
      url_hash: urlHash.hash,
      url: urlHash.url,
      ttl: urlHash.ttl
    };
  }
}