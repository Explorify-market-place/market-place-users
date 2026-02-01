/**
 * API Types
 *
 * Common types for API responses and requests.
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

/**
 * Trip card display type (for homepage/listings)
 */
export interface TripCard {
  id: string;
  title: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
}
