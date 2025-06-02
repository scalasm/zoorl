import axios, { AxiosInstance } from 'axios';

/**
 * API client for interacting with the URL shortener API
 */
export class ApiClient {
  private readonly apiUrl: string;
  private readonly axiosInstance: AxiosInstance;
  
  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.axiosInstance = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  /**
   * Sets the authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  /**
   * Creates a short URL
   */
  async createShortUrl(url: string, ttl?: number): Promise<any> {
    const response = await this.axiosInstance.post('/u', {
      url,
      ttl,
    });
    return response.data;
  }
  
  /**
   * Gets a short URL by its hash
   */
  async getShortUrl(urlHash: string): Promise<any> {
    const response = await this.axiosInstance.get(`/u/${urlHash}`);
    return response.data;
  }
}