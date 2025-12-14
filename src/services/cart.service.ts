import { UpstreamCartClient } from '../clients/upstream-cart-client.interface';
import { ContextStore } from '../stores/context.store';
import { CreateContextInput, ContextResult, UpstreamCart } from '../types/cart.types';
import { CartError, ErrorCode } from '../types/error.types';

/**
 * CartService per SPEC-A
 *
 * Owns: Business logic and decision flow for cart operations
 * - createContext: create upstream context and track expiry locally
 * - getCart: enforce expiry and not-found rules before fetching
 *
 * Does NOT own: HTTP details, upstream implementation details
 *
 * All business rules for expiry and error handling live here.
 */
export class CartService {
  constructor(
    private upstreamClient: UpstreamCartClient,
    private contextStore: ContextStore
  ) {}

  /**
   * Creates a new cart context
   *
   * Business logic:
   * 1. Delegate context creation to upstream client
   * 2. Store the context and its expiry time locally for future validation
   * 3. Fetch the initial cart state (assumption: upstream returns empty cart on creation)
   * 4. Return both context info and cart data
   *
   * @param input - Market and channel for the cart context
   * @returns Context result with initial cart data
   * @throws CartError - Propagates upstream errors (VALIDATION_ERROR, UPSTREAM_UNAVAILABLE)
   */
  async createContext(
    input: CreateContextInput
  ): Promise<{ context: ContextResult; cart: UpstreamCart }> {
    // Step 1: Create context upstream
    // Assumption: upstream client validates input and throws CartError if invalid
    const contextResult = await this.upstreamClient.createContext(input);

    // Step 2: Store context locally to track expiry
    // This allows us to enforce expiry rules without hitting upstream every time
    this.contextStore.setContext(contextResult.contextId, contextResult.expiresAt);

    // Step 3: Fetch initial cart state
    // Assumption: newly created contexts always have an empty cart
    // We fetch it to return consistent data structure to the caller
    const cart = await this.upstreamClient.getCart(contextResult.contextId);

    return {
      context: contextResult,
      cart,
    };
  }

  /**
   * Retrieves cart data for a given context
   *
   * Business logic (per SPEC-A):
   * 1. Check if context exists locally
   *    - If not found: throw CONTEXT_NOT_FOUND (404)
   * 2. Check if context has expired
   *    - If expired: throw CONTEXT_EXPIRED (410)
   * 3. If valid, fetch cart from upstream
   *    - Upstream may still throw errors (e.g., UPSTREAM_UNAVAILABLE)
   *
   * Assumption: We trust our local expiry tracking over upstream.
   * If ContextStore says it's expired, we return 410 without calling upstream.
   * This prevents unnecessary upstream calls and ensures consistent error responses.
   *
   * @param contextId - The context identifier
   * @returns Cart data with items and totals
   * @throws CartError with CONTEXT_NOT_FOUND if context doesn't exist locally
   * @throws CartError with CONTEXT_EXPIRED if context exists but has expired
   * @throws CartError - Propagates upstream errors (UPSTREAM_UNAVAILABLE)
   */
  async getCart(contextId: string): Promise<UpstreamCart> {
    // Step 1: Check if context exists
    // Assumption: If we never stored this context locally, it was never created
    // through our API, so we treat it as not found
    const contextData = this.contextStore.getContext(contextId);
    if (!contextData) {
      throw new CartError(
        ErrorCode.CONTEXT_NOT_FOUND,
        'Cart context not found',
        { contextId }
      );
    }

    // Step 2: Check if context has expired
    // Assumption: We check expiry before calling upstream to fail fast
    // and provide a clear, consistent error response
    if (this.contextStore.isContextExpired(contextId)) {
      throw new CartError(
        ErrorCode.CONTEXT_EXPIRED,
        'Cart context has expired',
        { contextId, expiresAt: contextData.expiresAt.toISOString() }
      );
    }

    // Step 3: Context is valid, fetch cart from upstream
    // Upstream client may throw its own errors (e.g., UPSTREAM_UNAVAILABLE)
    // which we propagate as-is
    return await this.upstreamClient.getCart(contextId);
  }
}
