import { menuItems } from './data.js';
import type { CreateOrderInput, MenuItem, Order, OrderStatus } from './types.js';

const orders = new Map<string, Order>();
let nextOrderId = 1;

export const getMenu = (): MenuItem[] => menuItems;

export const listOrders = (): Order[] => Array.from(orders.values());

export const getOrder = (orderId: string): Order | undefined => orders.get(orderId);

export const createOrder = (input: CreateOrderInput): Order => {
  const items = input.items.map((item) => {
    const menuItem = menuItems.find((entry) => entry.id === item.menuItemId);

    if (!menuItem) {
      throw new Error(`Unknown menu item: ${item.menuItemId}`);
    }

    return {
      menuItemId: item.menuItemId,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      lineTotal: Number((menuItem.price * item.quantity).toFixed(2)),
    };
  });

  const total = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const order: Order = {
    id: String(nextOrderId++),
    items,
    deliveryDetails: input.deliveryDetails,
    status: 'Order Received',
    total,
    createdAt: new Date().toISOString(),
  };

  orders.set(order.id, order);
  return order;
};

export const updateOrderStatus = (orderId: string, status: OrderStatus): Order | undefined => {
  const currentOrder = orders.get(orderId);

  if (!currentOrder) {
    return undefined;
  }

  const updatedOrder: Order = {
    ...currentOrder,
    status,
  };

  orders.set(orderId, updatedOrder);
  return updatedOrder;
};

export const deleteOrder = (orderId: string): boolean => orders.delete(orderId);

export const resetStore = (): void => {
  orders.clear();
  nextOrderId = 1;
};
