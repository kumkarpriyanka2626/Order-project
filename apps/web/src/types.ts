export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface CartItem {
  menuItemId: string;
  quantity: number;
}

export interface DeliveryDetails {
  name: string;
  address: string;
  phoneNumber: string;
}

export type OrderStatus = 'Order Received' | 'Preparing' | 'Out for Delivery' | 'Delivered';

export interface Order {
  id: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  deliveryDetails: DeliveryDetails;
  status: OrderStatus;
  total: number;
  createdAt: string;
}
