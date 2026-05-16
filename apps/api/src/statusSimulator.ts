import type { Order } from './types.js';
import { getOrder, updateOrderStatus } from './store.js';

const progression = [
  { status: 'Preparing', delayMs: 4000 },
  { status: 'Out for Delivery', delayMs: 8000 },
  { status: 'Delivered', delayMs: 12000 },
] as const;

const listeners = new Map<string, Set<(order: Order) => void>>();
const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

const notify = (order: Order) => {
  listeners.get(order.id)?.forEach((listener) => listener(order));
};

export const publishOrder = (order: Order): void => {
  notify(order);
};

export const subscribeToOrder = (
  orderId: string,
  listener: (order: Order) => void,
): (() => void) => {
  const listenerSet = listeners.get(orderId) ?? new Set<(order: Order) => void>();
  listenerSet.add(listener);
  listeners.set(orderId, listenerSet);

  return () => {
    const activeListeners = listeners.get(orderId);
    if (!activeListeners) {
      return;
    }

    activeListeners.delete(listener);

    if (activeListeners.size === 0) {
      listeners.delete(orderId);
    }
  };
};

export const clearOrderProgression = (orderId: string): void => {
  const timers = scheduledTimers.get(orderId);
  if (!timers) {
    return;
  }

  timers.forEach((timer) => clearTimeout(timer));
  scheduledTimers.delete(orderId);
};

export const scheduleOrderProgression = (orderId: string): void => {
  clearOrderProgression(orderId);

  const timers = progression.map(({ status, delayMs }) =>
    setTimeout(() => {
      const updatedOrder = updateOrderStatus(orderId, status);
      if (updatedOrder) {
        notify(updatedOrder);
      }
    }, delayMs),
  );

  scheduledTimers.set(orderId, timers);
};

export const getOrderProgressionSnapshot = (orderId: string): Order | undefined => getOrder(orderId);

export const resetStatusSimulation = (): void => {
  scheduledTimers.forEach((timers) => timers.forEach((timer) => clearTimeout(timer)));
  scheduledTimers.clear();
  listeners.clear();
};
