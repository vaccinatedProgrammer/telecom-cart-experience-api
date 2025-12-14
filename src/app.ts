import express from 'express';
import { createCartRoutes } from './routes/cart.routes';
import { CartService } from './services/cart.service';
import { SalesforceCartClientMock } from './clients/salesforce-cart-client.mock';
import { InMemoryContextStore } from './stores/context.store';

const app = express();

// JSON middleware
app.use(express.json());

// Initialize dependencies
const upstreamClient = new SalesforceCartClientMock();
const contextStore = new InMemoryContextStore();
const cartService = new CartService(upstreamClient, contextStore);

// Register routes
const cartRoutes = createCartRoutes(cartService);
app.use('/api/cart', cartRoutes);

export default app;
