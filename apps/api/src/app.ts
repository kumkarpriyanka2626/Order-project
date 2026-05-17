import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import {
  clearOrderProgression,
  publishOrder,
  scheduleOrderProgression,
  subscribeToOrder,
} from './statusSimulator.js';
import { createOrder, deleteOrder, getMenu, getOrder, listOrders, updateOrderStatus } from './store.js';
import { createOrderSchema, updateStatusSchema } from './validation.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_request, response) => {
  response.json({
    name: 'Food Delivery Order API',
    status: 'ok',
    endpoints: {
      health: '/api/health',
      menu: '/api/menu',
      orders: '/api/orders',
    },
  });
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.get('/api/menu', (_request, response) => {
  response.json(getMenu());
});

app.get('/api/orders', (_request, response) => {
  response.json(listOrders());
});

app.get('/api/orders/:orderId', (request, response) => {
  const order = getOrder(request.params.orderId);

  if (!order) {
    response.status(404).json({ message: 'Order not found.' });
    return;
  }

  response.json(order);
});

app.post('/api/orders', (request, response) => {
  try {
    const payload = createOrderSchema.parse(request.body);
    const order = createOrder(payload);

    publishOrder(order);
    scheduleOrderProgression(order.id);

    response.status(201).json(order);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: 'Invalid order payload.',
        issues: error.issues,
      });
      return;
    }

    response.status(400).json({
      message: error instanceof Error ? error.message : 'Unable to create order.',
    });
  }
});

app.patch('/api/orders/:orderId/status', (request, response) => {
  try {
    const { status } = updateStatusSchema.parse(request.body);
    clearOrderProgression(request.params.orderId);

    const updatedOrder = updateOrderStatus(request.params.orderId, status);

    if (!updatedOrder) {
      response.status(404).json({ message: 'Order not found.' });
      return;
    }

    publishOrder(updatedOrder);
    response.json(updatedOrder);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: 'Invalid status payload.',
        issues: error.issues,
      });
      return;
    }

    response.status(500).json({
      message: error instanceof Error ? error.message : 'Unable to update order.',
    });
  }
});

app.delete('/api/orders/:orderId', (request, response) => {
  clearOrderProgression(request.params.orderId);
  const deleted = deleteOrder(request.params.orderId);

  if (!deleted) {
    response.status(404).json({ message: 'Order not found.' });
    return;
  }

  response.status(204).send();
});

app.get('/api/orders/:orderId/stream', (request, response) => {
  const order = getOrder(request.params.orderId);

  if (!order) {
    response.status(404).json({ message: 'Order not found.' });
    return;
  }

  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');
  response.flushHeaders();

  const sendOrder = (nextOrder = getOrder(request.params.orderId)) => {
    if (!nextOrder) {
      return;
    }

    response.write(`data: ${JSON.stringify(nextOrder)}\n\n`);
  };

  sendOrder(order);
  const unsubscribe = subscribeToOrder(request.params.orderId, sendOrder);

  request.on('close', () => {
    unsubscribe();
    response.end();
  });
});
