import { InMemoryContextStore } from '../../src/stores/context.store';

describe('InMemoryContextStore', () => {
  let store: InMemoryContextStore;

  beforeEach(() => {
    store = new InMemoryContextStore();
  });

  describe('setContext and getContext', () => {
    it('should store and retrieve a context', () => {
      const contextId = 'ctx-1';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      store.setContext(contextId, expiresAt);
      const result = store.getContext(contextId);

      expect(result).toBeDefined();
      expect(result?.contextId).toBe(contextId);
      expect(result?.expiresAt).toEqual(expiresAt);
    });

    it('should return undefined for non-existent context', () => {
      const result = store.getContext('non-existent');

      expect(result).toBeUndefined();
    });

    it('should overwrite existing context with same contextId', () => {
      const contextId = 'ctx-1';
      const expiresAt1 = new Date(Date.now() + 15 * 60 * 1000);
      const expiresAt2 = new Date(Date.now() + 30 * 60 * 1000);

      store.setContext(contextId, expiresAt1);
      store.setContext(contextId, expiresAt2);

      const result = store.getContext(contextId);
      expect(result?.expiresAt).toEqual(expiresAt2);
    });

    it('should store multiple contexts independently', () => {
      const ctx1 = 'ctx-1';
      const ctx2 = 'ctx-2';
      const expires1 = new Date(Date.now() + 15 * 60 * 1000);
      const expires2 = new Date(Date.now() + 30 * 60 * 1000);

      store.setContext(ctx1, expires1);
      store.setContext(ctx2, expires2);

      const result1 = store.getContext(ctx1);
      const result2 = store.getContext(ctx2);

      expect(result1?.contextId).toBe(ctx1);
      expect(result1?.expiresAt).toEqual(expires1);
      expect(result2?.contextId).toBe(ctx2);
      expect(result2?.expiresAt).toEqual(expires2);
    });
  });

  describe('isContextValid', () => {
    it('should return true for valid non-expired context', () => {
      const contextId = 'ctx-1';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      store.setContext(contextId, expiresAt);

      expect(store.isContextValid(contextId)).toBe(true);
    });

    it('should return false for non-existent context', () => {
      expect(store.isContextValid('non-existent')).toBe(false);
    });

    it('should return false for expired context', () => {
      const contextId = 'ctx-1';
      const expiresAt = new Date(Date.now() + 1000);

      store.setContext(contextId, expiresAt);

      // Mock time to be after expiry
      jest.useFakeTimers();
      jest.setSystemTime(new Date(expiresAt.getTime() + 1000));

      expect(store.isContextValid(contextId)).toBe(false);

      jest.useRealTimers();
    });

    it('should return false for context expiring exactly now', () => {
      const contextId = 'ctx-1';
      const expiresAt = new Date(Date.now() + 1000);

      store.setContext(contextId, expiresAt);

      // Mock time to be exactly at expiry
      jest.useFakeTimers();
      jest.setSystemTime(expiresAt);

      // At exact expiry time, context should be invalid (expiresAt > new Date() is false)
      expect(store.isContextValid(contextId)).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('isContextExpired', () => {
    it('should return false for non-existent context', () => {
      expect(store.isContextExpired('non-existent')).toBe(false);
    });

    it('should return false for valid non-expired context', () => {
      const contextId = 'ctx-1';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      store.setContext(contextId, expiresAt);

      expect(store.isContextExpired(contextId)).toBe(false);
    });

    it('should return true for expired context', () => {
      const contextId = 'ctx-1';
      const expiresAt = new Date(Date.now() + 1000);

      store.setContext(contextId, expiresAt);

      // Mock time to be after expiry
      jest.useFakeTimers();
      jest.setSystemTime(new Date(expiresAt.getTime() + 1000));

      expect(store.isContextExpired(contextId)).toBe(true);

      jest.useRealTimers();
    });

    it('should return true for context expiring exactly now', () => {
      const contextId = 'ctx-1';
      const expiresAt = new Date(Date.now() + 1000);

      store.setContext(contextId, expiresAt);

      // Mock time to be exactly at expiry
      jest.useFakeTimers();
      jest.setSystemTime(expiresAt);

      // At exact expiry time, context should be expired (expiresAt <= new Date() is true)
      expect(store.isContextExpired(contextId)).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('boundary between valid and expired', () => {
    it('should correctly handle the boundary at expiry time', () => {
      const contextId = 'ctx-1';
      const expiresAt = new Date(Date.now() + 1000);

      store.setContext(contextId, expiresAt);

      jest.useFakeTimers();

      // 1ms before expiry - should be valid
      jest.setSystemTime(new Date(expiresAt.getTime() - 1));
      expect(store.isContextValid(contextId)).toBe(true);
      expect(store.isContextExpired(contextId)).toBe(false);

      // Exactly at expiry - should be expired
      jest.setSystemTime(expiresAt);
      expect(store.isContextValid(contextId)).toBe(false);
      expect(store.isContextExpired(contextId)).toBe(true);

      // 1ms after expiry - should be expired
      jest.setSystemTime(new Date(expiresAt.getTime() + 1));
      expect(store.isContextValid(contextId)).toBe(false);
      expect(store.isContextExpired(contextId)).toBe(true);

      jest.useRealTimers();
    });
  });
});
