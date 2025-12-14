import { CreateContextInput, ContextResult, UpstreamCart } from '../types/cart.types';

/**
 * UpstreamCartClient interface per SPEC-A
 *
 * This is the only contract CartService needs.
 * CartService doesn't know if this is Salesforce or something else.
 *
 * Implementations must:
 * - Throw CartError with appropriate codes on failures
 * - Handle context expiry by throwing CONTEXT_EXPIRED error
 */
export interface UpstreamCartClient {
  /**
   * Creates a new cart context upstream
   *
   * @param input - Market and channel information
   * @returns Context ID and expiration time
   * @throws CartError with UPSTREAM_UNAVAILABLE if upstream is down
   * @throws CartError with VALIDATION_ERROR if input is invalid
   */
  createContext(input: CreateContextInput): Promise<ContextResult>;

  /**
   * Fetches cart data for a given context
   *
   * @param contextId - The context identifier
   * @returns Full cart data with items and totals
   * @throws CartError with CONTEXT_NOT_FOUND if context doesn't exist
   * @throws CartError with CONTEXT_EXPIRED if context has expired
   * @throws CartError with UPSTREAM_UNAVAILABLE if upstream is down
   */
  getCart(contextId: string): Promise<UpstreamCart>;
}
