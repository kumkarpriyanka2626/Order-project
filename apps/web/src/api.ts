import type { CartItem, DeliveryDetails, MenuItem, Order } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Request failed.');
  }

  return (await response.json()) as T;
};

export const fetchMenu = async (): Promise<MenuItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/menu`);
  return parseResponse<MenuItem[]>(response);
};

export const placeOrder = async (payload: {
  items: CartItem[];
  deliveryDetails: DeliveryDetails;
}): Promise<Order> => {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<Order>(response);
};

export const subscribeToOrderStatus = (
  orderId: string,
  onUpdate: (order: Order) => void,
): (() => void) => {
  const source = new EventSource(`${API_BASE_URL}/api/orders/${orderId}/stream`);

  source.onmessage = (event) => {
    onUpdate(JSON.parse(event.data) as Order);
  };

  source.onerror = () => {
    source.close();
  };

  return () => {
    source.close();
  };
};
