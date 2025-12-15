import { CartService } from '../../src/services/cart.service';
import { SalesforceCartClientMock } from '../../src/clients/salesforce-cart-client.mock';
import { InMemoryContextStore } from '../../src/stores/context.store';
import { ErrorCode } from '../../src/types/error.types';

describe('CartService', () => {
  let service: CartService;
  let upstreamClient: SalesforceCartClientMock;
  let contextStore: InMemoryContextStore;

  beforeEach(() => {
    upstreamClient = new SalesforceCartClientMock();
    contextStore = new InMemoryContextStore();
    service = new CartService(upstreamClient, contextStore);
  });

  describe('createContext', () => {
    it('should create a context and return context + cart', async () => {
      const result = await service.createContext({ market: 'CA', channel: 'web' });

      expect(result.context.contextId).toBeDefined();
      expect(result.context.expiresAt).toBeInstanceOf(Date);
      expect(result.cart.cartId).toBeDefined();
      expect(result.cart.items).toBeInstanceOf(Array);
      expect(result.cart.totals).toBeDefined();
    });

    it('should store context in context store', async () => {
      const result = await service.createContext({ market: 'CA', channel: 'web' });

      const storedContext = contextStore.getContext(result.context.contextId);
      expect(storedContext).toBeDefined();
      expect(storedContext?.contextId).toBe(result.context.contextId);
      expect(storedContext?.expiresAt).toEqual(result.context.expiresAt);
    });
  });

  describe('getCart', () => {
    it('should return cart for valid context', async () => {
      const created = await service.createContext({ market: 'CA', channel: 'web' });
      const cart = await service.getCart(created.context.contextId);

      expect(cart.cartId).toBe(created.cart.cartId);
      expect(cart.items).toEqual(created.cart.items);
      expect(cart.totals).toEqual(created.cart.totals);
    });

    it('should throw CONTEXT_NOT_FOUND for unknown contextId', async () => {
      try {
        await service.getCart('unknown-ctx');
        fail('Should have thrown CONTEXT_NOT_FOUND error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.CONTEXT_NOT_FOUND);
        expect(error.message).toBe('Cart context not found');
        expect(error.details.contextId).toBe('unknown-ctx');
      }
    });

    it('should throw CONTEXT_EXPIRED for expired context', async () => {
      const created = await service.createContext({ market: 'CA', channel: 'web' });

      // Mock Date to simulate expiry
      const expiredTime = new Date(created.context.expiresAt.getTime() + 1000);
      jest.useFakeTimers();
      jest.setSystemTime(expiredTime);

      try {
        await service.getCart(created.context.contextId);
        fail('Should have thrown CONTEXT_EXPIRED error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.CONTEXT_EXPIRED);
        expect(error.message).toBe('Cart context has expired');
        expect(error.details.contextId).toBe(created.context.contextId);
      } finally {
        jest.useRealTimers();
      }
    });

    it('should check expiry in context store before calling upstream', async () => {
      const created = await service.createContext({ market: 'CA', channel: 'web' });

      // Spy on upstream client to ensure it's not called for expired context
      const getCartSpy = jest.spyOn(upstreamClient, 'getCart');

      // Mock Date to simulate expiry
      const expiredTime = new Date(created.context.expiresAt.getTime() + 1000);
      jest.useFakeTimers();
      jest.setSystemTime(expiredTime);

      try {
        await service.getCart(created.context.contextId);
        fail('Should have thrown CONTEXT_EXPIRED error');
      } catch (error: any) {
        // Error should be thrown by service, not upstream
        expect(error.code).toBe(ErrorCode.CONTEXT_EXPIRED);
      }

      // Upstream should not have been called
      expect(getCartSpy).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
