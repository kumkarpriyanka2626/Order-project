import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { fetchMenu, placeOrder, subscribeToOrderStatus } from './api';
import type { MenuItem, Order } from './types';

vi.mock('./api', () => ({
  fetchMenu: vi.fn(),
  placeOrder: vi.fn(),
  subscribeToOrderStatus: vi.fn(() => vi.fn()),
}));

const mockMenu: MenuItem[] = [
  {
    id: 'pizza-margherita',
    name: 'Margherita Pizza',
    description: 'Stone-baked pizza with tomato, mozzarella, and basil.',
    price: 12.99,
    image: 'pizza.png',
  },
];

const mockOrder: Order = {
  id: '42',
  items: [
    {
      menuItemId: 'pizza-margherita',
      name: 'Margherita Pizza',
      quantity: 1,
      unitPrice: 12.99,
      lineTotal: 12.99,
    },
  ],
  deliveryDetails: {
    name: 'Alex Chen',
    address: '100 Main Street',
    phoneNumber: '+1 555 123 4567',
  },
  status: 'Order Received',
  total: 12.99,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('App', () => {
  beforeEach(() => {
    vi.mocked(fetchMenu).mockResolvedValue(mockMenu);
    vi.mocked(placeOrder).mockResolvedValue(mockOrder);
    vi.mocked(subscribeToOrderStatus).mockReturnValue(vi.fn());
  });

  it('renders menu items and adds them to the cart', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Margherita Pizza');
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(screen.getByLabelText('Quantity for Margherita Pizza')).toHaveValue(1);
    expect(screen.getAllByText('$12.99').length).toBeGreaterThan(1);
  });

  it('shows validation when checkout details are missing', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Margherita Pizza');
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));
    await user.click(screen.getByRole('button', { name: 'Place order' }));

    expect(screen.getAllByText('Enter your delivery name, address, and phone number.')).toHaveLength(1);
  });

  it('submits an order and starts status tracking', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Margherita Pizza');
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));
    await user.type(screen.getByLabelText('Name'), 'Alex Chen');
    await user.type(screen.getByLabelText('Address'), '100 Main Street');
    await user.type(screen.getByLabelText('Phone number'), '+1 555 123 4567');
    await user.click(screen.getByRole('button', { name: 'Place order' }));

    await waitFor(() => {
      expect(placeOrder).toHaveBeenCalledWith({
        items: [{ menuItemId: 'pizza-margherita', quantity: 1 }],
        deliveryDetails: {
          name: 'Alex Chen',
          address: '100 Main Street',
          phoneNumber: '+1 555 123 4567',
        },
      });
    });

    expect(screen.getByText(/Order #42/)).toBeInTheDocument();
    expect(screen.getAllByText('Order Received')).toHaveLength(2);
    expect(subscribeToOrderStatus).toHaveBeenCalledWith('42', expect.any(Function));
  });
});
