/**
 * ContextStore per SPEC-A
 *
 * Owns: tracking context expiry
 * - contextId -> expiresAt
 *
 * This is simple in-memory storage and does not make business decisions.
 */

// Data stored for each context
export interface ContextData {
  contextId: string;
  expiresAt: Date;
}

export interface ContextStore {
  /**
   * Store a context with its expiration time
   */
  setContext(contextId: string, expiresAt: Date): void;

  /**
   * Retrieve context data by ID
   * @returns ContextData or undefined if not found
   */
  getContext(contextId: string): ContextData | undefined;

  /**
   * Check if a context exists and has not expired
   * @returns true if context exists and is not expired
   */
  isContextValid(contextId: string): boolean;

  /**
   * Check if a context has expired (exists but past expiry time)
   * @returns true if context exists but is expired
   */
  isContextExpired(contextId: string): boolean;
}

/**
 * In-memory implementation of ContextStore
 */
export class InMemoryContextStore implements ContextStore {
  private contexts: Map<string, ContextData> = new Map();

  setContext(contextId: string, expiresAt: Date): void {
    this.contexts.set(contextId, { contextId, expiresAt });
  }

  getContext(contextId: string): ContextData | undefined {
    return this.contexts.get(contextId);
  }

  isContextValid(contextId: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) return false;
    return context.expiresAt > new Date();
  }

  isContextExpired(contextId: string): boolean {
    const context = this.contexts.get(contextId);
    if (!context) return false;
    return context.expiresAt <= new Date();
  }
}
