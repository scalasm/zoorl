/**
 * DTOs for URL hash operations
 */

export interface UrlHashDto {
  hash: string;
  url: string;
  ttl: number;
}

export interface CreateUrlHashRequest {
  url: string;
  ttl?: number;
}

export interface CreateUrlHashResponse {
  url_hash: string;
  url: string;
  ttl: number;
}

export interface ReadUrlHashRequest {
  hash: string;
}

export interface ReadUrlHashResponse {
  url_hash: string;
  url: string;
  ttl: number;
}