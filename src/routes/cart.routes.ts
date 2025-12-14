import { Router, Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import {
  CreateCartContextResponse,
  GetCartResponse,
} from '../types/cart.types';
import { CartError, ErrorCode, ErrorStatusMap } from '../types/error.types';

/**
 * Cart routes per SPEC-B
 *
 * Owns: request parsing + simple validation + turning errors into HTTP responses
 * Does NOT own: business rules, expiry decisions, upstream logic
 *
 * Routes call the service and return what it says, so business rule changes
 * don't leak into HTTP code.
 */

/**
 * Creates cart routes with the provided CartService
 *
 * @param cartService - The service instance to handle business logic
 * @returns Express router with cart endpoints
 */
export function createCartRoutes(cartService: CartService): Router {
  const router = Router();

  /**
   * POST /api/cart/cart-contexts
   *
   * Creates a new cart context per SPEC-B
   */
  router.post('/cart-contexts', async (req: Request, res: Response) => {
    try {
      const { market, channel } = req.body || {};

      // Simple validation: required fields must be present
      if (!market || !channel) {
        throw new CartError(
          ErrorCode.VALIDATION_ERROR,
          'Fields "market" and "channel" are required'
        );
      }

      // Call service to handle business logic
      const result = await cartService.createContext({ market, channel });

      // Map service response to API response (Date -> ISO string)
      const response: CreateCartContextResponse = {
        contextId: result.context.contextId,
        expiresAt: result.context.expiresAt.toISOString(),
        cart: {
          cartId: result.cart.cartId,
          expiresAt: result.cart.expiresAt.toISOString(),
          items: result.cart.items,
          totals: result.cart.totals,
        },
      };

      return res.status(201).json(response);
    } catch (error) {
      return handleError(error, res);
    }
  });

  /**
   * GET /api/cart/carts/:contextId
   *
   * Fetches cart by context ID per SPEC-B
   */
  router.get('/carts/:contextId', async (req: Request, res: Response) => {
    try {
      const { contextId } = req.params;

      // Simple validation: contextId must be present
      if (!contextId) {
        throw new CartError(
          ErrorCode.VALIDATION_ERROR,
          'Context ID is required'
        );
      }

      // Call service to handle business logic (includes expiry and not-found checks)
      const cart = await cartService.getCart(contextId);

      // Map service response to API response (Date -> ISO string)
      const response: GetCartResponse = {
        cartId: cart.cartId,
        expiresAt: cart.expiresAt.toISOString(),
        items: cart.items,
        totals: cart.totals,
      };

      return res.status(200).json(response);
    } catch (error) {
      return handleError(error, res);
    }
  });

  return router;
}

/**
 * Maps all errors to HTTP responses
 *
 * All errors flow through CartError for consistent error codes and structure.
 * ErrorStatusMap centrally defines HTTP status codes for each error code.
 *
 * @param error - The error to handle
 * @param res - Express response object
 */
function handleError(error: unknown, res: Response): Response {
  if (error instanceof CartError) {
    const statusCode = ErrorStatusMap[error.code];
    return res.status(statusCode).json(error.toResponse());
  }

  // Unexpected errors default to 500
  console.error('Unexpected error:', error);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: {},
    },
  });
}
