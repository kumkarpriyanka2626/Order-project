import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from './app.js';
import { resetStatusSimulation } from './statusSimulator.js';
import { resetStore } from './store.js';

describe('order API', () => {
  beforeEach(() => {
    resetStore();
    resetStatusSimulation();
    vi.useRealTimers();
  });

  it('returns a root service summary', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'Food Delivery Order API',
      status: 'ok',
      endpoints: {
        health: '/api/health',
        menu: '/api/menu',
        orders: '/api/orders',
      },
    });
  });

  it('returns the menu', async () => {
    const response = await request(app).get('/api/menu');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(4);
    expect(response.body[0]).toMatchObject({
      id: 'pizza-margherita',
      name: 'Margherita Pizza',
    });
  });

  it('rejects an invalid order payload', async () => {
    const response = await request(app).post('/api/orders').send({
      items: [],
      deliveryDetails: {
        name: 'A',
        address: '12',
        phoneNumber: 'abc',
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid order payload.');
  });

  it('creates and retrieves an order', async () => {
    const createResponse = await request(app).post('/api/orders').send({
      items: [{ menuItemId: 'pizza-margherita', quantity: 2 }],
      deliveryDetails: {
        name: 'Alex Chen',
        address: '100 Main Street',
        phoneNumber: '+1 555 123 4567',
      },
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.total).toBe(25.98);

    const orderId = createResponse.body.id as string;
    const getResponse = await request(app).get(`/api/orders/${orderId}`);
    const listResponse = await request(app).get('/api/orders');

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(orderId);
    expect(listResponse.body).toHaveLength(1);
  });

  it('updates order status manually', async () => {
    const createResponse = await request(app).post('/api/orders').send({
      items: [{ menuItemId: 'smash-burger', quantity: 1 }],
      deliveryDetails: {
        name: 'Sam Rivera',
        address: '55 Broad Avenue',
        phoneNumber: '+1 555 000 1111',
      },
    });

    const orderId = createResponse.body.id as string;
    const patchResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .send({ status: 'Out for Delivery' });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.status).toBe('Out for Delivery');
  });

  it('deletes an order', async () => {
    const createResponse = await request(app).post('/api/orders').send({
      items: [{ menuItemId: 'truffle-fries', quantity: 3 }],
      deliveryDetails: {
        name: 'Jamie Hart',
        address: '88 King Road',
        phoneNumber: '+1 555 222 3333',
      },
    });

    const orderId = createResponse.body.id as string;
    const deleteResponse = await request(app).delete(`/api/orders/${orderId}`);
    const getResponse = await request(app).get(`/api/orders/${orderId}`);

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.status).toBe(404);
  });

  it('progresses order status over time', async () => {
    vi.useFakeTimers();

    const createResponse = await request(app).post('/api/orders').send({
      items: [{ menuItemId: 'korean-bowl', quantity: 1 }],
      deliveryDetails: {
        name: 'Taylor Brooks',
        address: '14 Sunset Boulevard',
        phoneNumber: '+1 555 444 7777',
      },
    });

    const orderId = createResponse.body.id as string;

    await vi.advanceTimersByTimeAsync(4000);
    const preparingResponse = await request(app).get(`/api/orders/${orderId}`);
    expect(preparingResponse.body.status).toBe('Preparing');

    await vi.advanceTimersByTimeAsync(4000);
    const deliveryResponse = await request(app).get(`/api/orders/${orderId}`);
    expect(deliveryResponse.body.status).toBe('Out for Delivery');

    await vi.advanceTimersByTimeAsync(4000);
    const completeResponse = await request(app).get(`/api/orders/${orderId}`);
    expect(completeResponse.body.status).toBe('Delivered');
  });
});
