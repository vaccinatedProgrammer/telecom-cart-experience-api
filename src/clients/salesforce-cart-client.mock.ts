import {
  CreateContextInput,
  ContextResult,
  UpstreamCart,
  CartItem,
  CartTotals
} from '../types/cart.types';
import { CartError, ErrorCode } from '../types/error.types';
import { UpstreamCartClient } from './upstream-cart-client.interface';

/**
 * In-memory mock implementation of UpstreamCartClient per SPEC-A
 *
 * Behavior:
 * - Creates contexts with TTL-based expiration
 * - Returns deterministic cart data based on contextId
 * - Checks expiry on each getCart call (no background jobs)
 * - Throws CartError for expired/unknown contexts
 */

interface StoredContext {
  expiresAt: Date;
}

export class SalesforceCartClientMock implements UpstreamCartClient {
  private contexts: Map<string, StoredContext> = new Map();
  private contextCounter = 0;
  private readonly CONTEXT_TTL_MS = 15 * 60 * 1000; // 15 minutes

  async createContext(input: CreateContextInput): Promise<ContextResult> {
    const contextId = `ctx-${++this.contextCounter}`;
    const expiresAt = new Date(Date.now() + this.CONTEXT_TTL_MS);

    this.contexts.set(contextId, { expiresAt });

    return {
      contextId,
      expiresAt,
    };
  }

  async getCart(contextId: string): Promise<UpstreamCart> {
    const context = this.contexts.get(contextId);

    if (!context) {
      throw new CartError(
        ErrorCode.CONTEXT_NOT_FOUND,
        `Context ${contextId} not found`,
        { contextId }
      );
    }

    if (Date.now() > context.expiresAt.getTime()) {
      throw new CartError(
        ErrorCode.CONTEXT_EXPIRED,
        `Context ${contextId} has expired`,
        { contextId, expiresAt: context.expiresAt.toISOString() }
      );
    }

    return this.generateDeterministicCart(contextId, context.expiresAt);
  }

  /**
   * Generates deterministic cart data based on contextId
   */
  private generateDeterministicCart(contextId: string, expiresAt: Date): UpstreamCart {
    const hash = this.simpleHash(contextId);

    const items: CartItem[] = [];
    const itemCount = (hash % 3) + 1; // 1-3 items

    const plans = ['basic-plan', 'premium-plan', 'enterprise-plan'];
    for (let i = 0; i < itemCount; i++) {
      items.push({
        plan: plans[(hash + i) % plans.length],
        qty: ((hash + i) % 3) + 1, // 1-3 quantity
      });
    }

    const subtotal = items.reduce((sum, item) => {
      const price = item.plan === 'basic-plan' ? 29.99 :
                   item.plan === 'premium-plan' ? 49.99 : 99.99;
      return sum + (price * item.qty);
    }, 0);

    const tax = subtotal * 0.13; // 13% tax
    const total = subtotal + tax;

    const totals: CartTotals = {
      currency: 'CAD',
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };

    return {
      cartId: `cart-${contextId}`,
      expiresAt,
      items,
      totals,
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
