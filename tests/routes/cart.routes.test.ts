import request from 'supertest';
import express, { Application } from 'express';
import { createCartRoutes } from '../../src/routes/cart.routes';
import { CartService } from '../../src/services/cart.service';
import { SalesforceCartClientMock } from '../../src/clients/salesforce-cart-client.mock';
import { InMemoryContextStore } from '../../src/stores/context.store';

describe('Cart Routes', () => {
  let app: Application;
  let cartService: CartService;

  beforeEach(() => {
    const upstreamClient = new SalesforceCartClientMock();
    const contextStore = new InMemoryContextStore();
    cartService = new CartService(upstreamClient, contextStore);

    app = express();
    app.use(express.json());
    app.use('/api/cart', createCartRoutes(cartService));
  });

  describe('POST /api/cart/cart-contexts', () => {
    it('should create a cart context and return 201', async () => {
      const response = await request(app)
        .post('/api/cart/cart-contexts')
        .send({ market: 'CA', channel: 'web' })
        .expect(201);

      expect(response.body.contextId).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();
      expect(response.body.cart).toBeDefined();
      expect(response.body.cart.cartId).toBeDefined();
      expect(response.body.cart.items).toBeInstanceOf(Array);
      expect(response.body.cart.totals).toBeDefined();
      expect(response.body.cart.totals.currency).toBe('CAD');
    });

    it('should return 400 when market is missing', async () => {
      const response = await request(app)
        .post('/api/cart/cart-contexts')
        .send({ channel: 'web' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('market');
    });

    it('should return 400 when channel is missing', async () => {
      const response = await request(app)
        .post('/api/cart/cart-contexts')
        .send({ market: 'CA' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toContain('channel');
    });

    it('should return 400 when body is empty', async () => {
      const response = await request(app)
        .post('/api/cart/cart-contexts')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/cart/carts/:contextId', () => {
    it('should return cart for valid contextId', async () => {
      // First create a context
      const createResponse = await request(app)
        .post('/api/cart/cart-contexts')
        .send({ market: 'CA', channel: 'web' });

      const contextId = createResponse.body.contextId;

      // Then fetch the cart
      const response = await request(app)
        .get(`/api/cart/carts/${contextId}`)
        .expect(200);

      expect(response.body.cartId).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();
      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.totals).toBeDefined();
    });

    it('should return 404 for unknown contextId', async () => {
      const response = await request(app)
        .get('/api/cart/carts/unknown-ctx')
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('CONTEXT_NOT_FOUND');
      expect(response.body.error.details.contextId).toBe('unknown-ctx');
    });

    it('should return 410 for expired contextId', async () => {
      // Create a context
      const createResponse = await request(app)
        .post('/api/cart/cart-contexts')
        .send({ market: 'CA', channel: 'web' });

      const contextId = createResponse.body.contextId;
      const expiresAt = new Date(createResponse.body.expiresAt);

      // Mock time to be after expiry
      const expiredTime = new Date(expiresAt.getTime() + 1000);
      jest.useFakeTimers();
      jest.setSystemTime(expiredTime);

      const response = await request(app)
        .get(`/api/cart/carts/${contextId}`)
        .expect(410);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('CONTEXT_EXPIRED');
      expect(response.body.error.details.contextId).toBe(contextId);

      jest.useRealTimers();
    });

    it('should return same cart on multiple fetches', async () => {
      // Create a context
      const createResponse = await request(app)
        .post('/api/cart/cart-contexts')
        .send({ market: 'CA', channel: 'web' });

      const contextId = createResponse.body.contextId;

      // Fetch cart twice
      const response1 = await request(app).get(`/api/cart/carts/${contextId}`);
      const response2 = await request(app).get(`/api/cart/carts/${contextId}`);

      expect(response1.body).toEqual(response2.body);
    });
  });
});
