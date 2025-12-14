// API DTOs per SPEC-B

// Request DTO for POST /api/cart/cart-contexts
export interface CreateCartContextRequest {
  market: string;
  channel: string;
}

// Cart item structure
export interface CartItem {
  plan: string;
  qty: number;
}

// Cart totals structure
export interface CartTotals {
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
}

// Cart structure - returned in GET /api/cart/carts/:contextId
export interface Cart {
  cartId: string;
  expiresAt: string; // ISO 8601 date string
  items: CartItem[];
  totals: CartTotals;
}

// Response DTO for POST /api/cart/cart-contexts
export interface CreateCartContextResponse {
  contextId: string;
  expiresAt: string; // ISO 8601 date string
  cart: Cart;
}

// Response DTO for GET /api/cart/carts/:contextId
export type GetCartResponse = Cart;

// Internal types for upstream client

// Input for creating a context (upstream)
export interface CreateContextInput {
  market: string;
  channel: string;
}

// Result from upstream createContext
export interface ContextResult {
  contextId: string;
  expiresAt: Date; // Using Date object internally for easier manipulation
}

// Full cart data from upstream
export interface UpstreamCart {
  cartId: string;
  expiresAt: Date; // Using Date object internally
  items: CartItem[];
  totals: CartTotals;
}
