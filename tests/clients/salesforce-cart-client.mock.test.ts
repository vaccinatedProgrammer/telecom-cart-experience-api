import { SalesforceCartClientMock } from '../../src/clients/salesforce-cart-client.mock';
import { ErrorCode } from '../../src/types/error.types';

describe('SalesforceCartClientMock', () => {
  let client: SalesforceCartClientMock;

  beforeEach(() => {
    client = new SalesforceCartClientMock();
  });

  describe('createContext', () => {
    it('should create a context with contextId and expiresAt', async () => {
      const result = await client.createContext({ market: 'CA', channel: 'web' });

      expect(result.contextId).toBeDefined();
      expect(result.contextId).toMatch(/^ctx-\d+$/);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should create unique contextIds for multiple calls', async () => {
      const result1 = await client.createContext({ market: 'CA', channel: 'web' });
      const result2 = await client.createContext({ market: 'US', channel: 'mobile' });

      expect(result1.contextId).not.toBe(result2.contextId);
    });
  });

  describe('getCart', () => {
    it('should return cart for valid contextId', async () => {
      const context = await client.createContext({ market: 'CA', channel: 'web' });
      const cart = await client.getCart(context.contextId);

      expect(cart.cartId).toBe(`cart-${context.contextId}`);
      expect(cart.expiresAt).toEqual(context.expiresAt);
      expect(cart.items).toBeInstanceOf(Array);
      expect(cart.items.length).toBeGreaterThan(0);
      expect(cart.totals).toBeDefined();
      expect(cart.totals.currency).toBe('CAD');
    });

    it('should return deterministic cart for same contextId', async () => {
      const context = await client.createContext({ market: 'CA', channel: 'web' });
      const cart1 = await client.getCart(context.contextId);
      const cart2 = await client.getCart(context.contextId);

      expect(cart1).toEqual(cart2);
    });

    it('should throw CONTEXT_NOT_FOUND for unknown contextId', async () => {
      await expect(client.getCart('unknown-ctx')).rejects.toThrow();

      try {
        await client.getCart('unknown-ctx');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.CONTEXT_NOT_FOUND);
        expect(error.details.contextId).toBe('unknown-ctx');
      }
    });

    it('should throw CONTEXT_EXPIRED for expired context', async () => {
      const context = await client.createContext({ market: 'CA', channel: 'web' });

      // Mock Date.now() to simulate time passing
      const expiredTime = context.expiresAt.getTime() + 1000;
      jest.spyOn(Date, 'now').mockReturnValue(expiredTime);

      try {
        await client.getCart(context.contextId);
        fail('Should have thrown CONTEXT_EXPIRED error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.CONTEXT_EXPIRED);
        expect(error.details.contextId).toBe(context.contextId);
      } finally {
        jest.restoreAllMocks();
      }
    });
  });
});
