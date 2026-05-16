import type { MenuItem } from './types.js';

const foodImage = (title: string, accent: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff8e8" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="36" fill="url(#bg)" />
      <circle cx="520" cy="90" r="64" fill="#ffffff66" />
      <circle cx="110" cy="310" r="80" fill="#ffffff44" />
      <text x="48" y="132" font-size="34" font-family="Trebuchet MS, Verdana, sans-serif" font-weight="700" fill="#1f1b16">${title}</text>
      <text x="48" y="182" font-size="84">🍽️</text>
      <rect x="48" y="236" width="220" height="18" rx="9" fill="#1f1b1622" />
      <rect x="48" y="268" width="160" height="18" rx="9" fill="#1f1b1618" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const menuItems: MenuItem[] = [
  {
    id: 'pizza-margherita',
    name: 'Margherita Pizza',
    description: 'Stone-baked pizza with tomato, mozzarella, and basil.',
    price: 12.99,
    image: foodImage('Margherita Pizza', '#ffbf69'),
  },
  {
    id: 'smash-burger',
    name: 'Smash Burger',
    description: 'Double patty burger with cheddar, pickles, and house sauce.',
    price: 10.49,
    image: foodImage('Smash Burger', '#ff9f1c'),
  },
  {
    id: 'korean-bowl',
    name: 'Korean Rice Bowl',
    description: 'Sticky rice with crispy chicken, greens, and gochujang glaze.',
    price: 11.79,
    image: foodImage('Korean Rice Bowl', '#2ec4b6'),
  },
  {
    id: 'truffle-fries',
    name: 'Truffle Fries',
    description: 'Crispy fries tossed with parmesan, herbs, and truffle oil.',
    price: 6.5,
    image: foodImage('Truffle Fries', '#cbf3f0'),
  },
];
