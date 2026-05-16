import { FormEvent, startTransition, useEffect, useMemo, useState } from 'react';
import './App.css';
import { fetchMenu, placeOrder, subscribeToOrderStatus } from './api';
import type { DeliveryDetails, MenuItem, Order, OrderStatus } from './types';

const orderTimeline: OrderStatus[] = [
  'Order Received',
  'Preparing',
  'Out for Delivery',
  'Delivered',
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const initialDetails: DeliveryDetails = {
  name: '',
  address: '',
  phoneNumber: '',
};

const App = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>(initialDetails);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadMenu = async () => {
      try {
        const nextMenu = await fetchMenu();
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setMenu(nextMenu);
          setLoading(false);
        });
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setLoadError(nextError instanceof Error ? nextError.message : 'Unable to load menu.');
        setLoading(false);
      }
    };

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeOrder) {
      return;
    }

    return subscribeToOrderStatus(activeOrder.id, (nextOrder) => {
      startTransition(() => {
        setActiveOrder(nextOrder);
      });
    });
  }, [activeOrder?.id]);

  const cartItems = useMemo(
    () =>
      menu
        .filter((item) => cart[item.id] > 0)
        .map((item) => ({
          ...item,
          quantity: cart[item.id],
          lineTotal: Number((item.price * cart[item.id]).toFixed(2)),
        })),
    [cart, menu],
  );

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = Number(cartItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));

  const setQuantity = (menuItemId: string, quantity: number) => {
    setCart((currentCart) => {
      if (quantity <= 0) {
        const { [menuItemId]: _removed, ...rest } = currentCart;
        return rest;
      }

      return {
        ...currentCart,
        [menuItemId]: quantity,
      };
    });
  };

  const handleAddToCart = (menuItemId: string) => {
    setQuantity(menuItemId, (cart[menuItemId] ?? 0) + 1);
  };

  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCheckoutError(null);

    if (cartItems.length === 0) {
      setCheckoutError('Add at least one item before checkout.');
      return;
    }

    if (!deliveryDetails.name || !deliveryDetails.address || !deliveryDetails.phoneNumber) {
      setCheckoutError('Enter your delivery name, address, and phone number.');
      return;
    }

    setSubmitting(true);

    try {
      const order = await placeOrder({
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        deliveryDetails,
      });

      startTransition(() => {
        setActiveOrder(order);
        setCart({});
        setCheckoutError(null);
      });
    } catch (nextError) {
      setCheckoutError(nextError instanceof Error ? nextError.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shell">
      <div className="layout">
        <section className="hero">
          <article className="hero-card">
            <span className="eyebrow">Live order desk</span>
            <h1>Track every bite from cart to doorstep.</h1>
            <p>
              Browse the menu, build an order, and watch its status move in real time.
              The flow is intentionally lean but production-shaped.
            </p>
          </article>
          <aside className="hero-panel">
            <span className="eyebrow">What this demo covers</span>
            <div className="metric-list">
              <div className="metric">
                <span>Menu items</span>
                <strong>{loading ? '...' : menu.length}</strong>
              </div>
              <div className="metric">
                <span>Items in cart</span>
                <strong>{itemCount}</strong>
              </div>
              <div className="metric">
                <span>Current subtotal</span>
                <strong>{currency.format(subtotal)}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section className="content">
          <div className="section-card">
            <div className="section-heading">
              <h2>Menu</h2>
              <span>{loading ? 'Loading...' : `${menu.length} items ready`}</span>
            </div>

            {loadError ? <p className="error-text">{loadError}</p> : null}

            <div className="menu-grid">
              {menu.map((item) => (
                <article className="menu-card" key={item.id}>
                  <img className="menu-image" src={item.image} alt={item.name} />
                  <div className="menu-body">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="price-row">
                      <span className="price">{currency.format(item.price)}</span>
                      <button className="primary-button" onClick={() => handleAddToCart(item.id)} type="button">
                        Add to cart
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="checkout-grid">
            <section className="summary-card">
              <h2>Cart & checkout</h2>
              <p className="status-note">Adjust quantities, add delivery details, and submit the order.</p>

              {cartItems.length === 0 ? <p className="empty-state">Your cart is empty.</p> : null}

              <div className="cart-list">
                {cartItems.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-row">
                      <div>
                        <strong>{item.name}</strong>
                        <span>{currency.format(item.price)} each</span>
                      </div>
                      <strong>{currency.format(item.lineTotal)}</strong>
                    </div>
                    <label>
                      Quantity
                      <input
                        aria-label={`Quantity for ${item.name}`}
                        className="quantity-input"
                        min={0}
                        type="number"
                        value={item.quantity}
                        onChange={(event) => setQuantity(item.id, Number(event.target.value))}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <form className="form-grid" onSubmit={handleCheckout}>
                <label>
                  Name
                  <input
                    className="text-input"
                    name="name"
                    value={deliveryDetails.name}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Address
                  <textarea
                    className="text-area"
                    name="address"
                    rows={3}
                    value={deliveryDetails.address}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({ ...current, address: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Phone number
                  <input
                    className="text-input"
                    name="phoneNumber"
                    value={deliveryDetails.phoneNumber}
                    onChange={(event) =>
                      setDeliveryDetails((current) => ({ ...current, phoneNumber: event.target.value }))
                    }
                  />
                </label>

                {checkoutError ? <p className="error-text">{checkoutError}</p> : null}

                <div className="summary-values">
                  <div>
                    <span>Items</span>
                    <span>{itemCount}</span>
                  </div>
                  <div>
                    <span>Subtotal</span>
                    <strong>{currency.format(subtotal)}</strong>
                  </div>
                </div>

                <div className="footer-actions">
                  <button className="primary-button" disabled={submitting} type="submit">
                    {submitting ? 'Placing order...' : 'Place order'}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setCart({});
                      setCheckoutError(null);
                    }}
                  >
                    Clear cart
                  </button>
                </div>
              </form>
            </section>

            <section className="status-card">
              <h2>Order status</h2>
              {activeOrder ? (
                <>
                  <p className="status-note">
                    Order #{activeOrder.id} for {activeOrder.deliveryDetails.name}. Current status:{' '}
                    <strong>{activeOrder.status}</strong>
                  </p>
                  <div className="status-list">
                    {orderTimeline.map((status, index) => {
                      const currentIndex = orderTimeline.indexOf(activeOrder.status);
                      return (
                        <div
                          className="status-item"
                          data-active={status === activeOrder.status}
                          data-complete={index <= currentIndex}
                          key={status}
                        >
                          <div className="timeline-row">
                            <strong>{status}</strong>
                            <span>{index <= currentIndex ? 'Reached' : 'Pending'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="empty-state">Place an order to start live tracking.</p>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
