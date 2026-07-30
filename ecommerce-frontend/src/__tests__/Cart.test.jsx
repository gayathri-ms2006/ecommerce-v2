// Mocks must be declared before imports to ensure ESM bindings are mocked correctly
jest.mock('../context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../components/Navbar', () => () => <div data-testid="mock-navbar">Mock Navbar</div>);

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Cart from '../pages/Cart';
import { useCart } from '../context/CartContext';
import { MemoryRouter } from 'react-router-dom';

const mockCartItems = [
  {
    productId: 'prod-201',
    productName: 'Sony Headphones',
    name: 'Sony Headphones',
    price: 15000,
    quantity: 2,
    imageUrl: 'https://example.com/sony.jpg',
  },
  {
    productId: 'prod-202',
    productName: 'Leather Wallet',
    name: 'Leather Wallet',
    price: 2500,
    quantity: 1,
    imageUrl: 'https://example.com/wallet.jpg',
  }
];

describe('Cart Page component tests', () => {
  let mockRemoveItem;
  let mockUpdateQty;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRemoveItem = jest.fn().mockResolvedValue(true);
    mockUpdateQty = jest.fn().mockResolvedValue(true);

    useCart.mockReturnValue({
      cartItems: mockCartItems,
      removeItemFromCart: mockRemoveItem,
      updateItemQuantity: mockUpdateQty,
      loading: false,
      error: null,
      cartSubtotal: 32500,
      taxAmount: 1625,
      cartTotal: 34125,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    );
  };

  test('renders cart items list correctly', () => {
    renderComponent();

    expect(screen.getByText('Sony Headphones')).toBeInTheDocument();
    expect(screen.getByText('Leather Wallet')).toBeInTheDocument();
    
    // Displays correct quantities
    const badgeValues = document.querySelectorAll('.quantity-badge-value');
    expect(badgeValues).toHaveLength(2);
    expect(badgeValues[0]).toHaveTextContent('2');
    expect(badgeValues[1]).toHaveTextContent('1');

    // Displays totals
    expect(screen.getByText(/32,500/)).toBeInTheDocument(); // subtotal
    expect(screen.getByText(/34,125/)).toBeInTheDocument(); // total
  });

  test('handles empty cart view', () => {
    useCart.mockReturnValue({
      cartItems: [],
      removeItemFromCart: mockRemoveItem,
      updateItemQuantity: mockUpdateQty,
      loading: false,
      error: null,
      cartSubtotal: 0,
      taxAmount: 0,
      cartTotal: 0,
    });

    renderComponent();

    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue Shopping/i })).toBeInTheDocument();
  });

  test('handles loading state', () => {
    useCart.mockReturnValue({
      cartItems: [],
      removeItemFromCart: mockRemoveItem,
      updateItemQuantity: mockUpdateQty,
      loading: true,
      error: null,
      cartSubtotal: 0,
      taxAmount: 0,
      cartTotal: 0,
    });

    renderComponent();
    expect(document.querySelector('.skeleton-cart-card')).toBeInTheDocument();
  });

  test('handles error state', () => {
    useCart.mockReturnValue({
      cartItems: [],
      removeItemFromCart: mockRemoveItem,
      updateItemQuantity: mockUpdateQty,
      loading: false,
      error: 'Failed to fetch cart',
      cartSubtotal: 0,
      taxAmount: 0,
      cartTotal: 0,
    });

    renderComponent();
    expect(screen.getByText(/Failed to fetch cart/i)).toBeInTheDocument();
  });

  test('triggers update quantity when increase button is clicked', () => {
    renderComponent();

    const increaseBtns = screen.getAllByRole('button', { name: /Increase quantity/i });
    fireEvent.click(increaseBtns[0]); // increase quantity of Sony Headphones

    expect(mockUpdateQty).toHaveBeenCalledWith('prod-201', 3);
  });

  test('triggers update quantity when decrease button is clicked', () => {
    renderComponent();

    const decreaseBtns = screen.getAllByRole('button', { name: /Decrease quantity/i });
    fireEvent.click(decreaseBtns[0]); // decrease quantity of Sony Headphones

    expect(mockUpdateQty).toHaveBeenCalledWith('prod-201', 1);
  });

  test('triggers remove function when remove button is clicked', () => {
    renderComponent();

    const removeBtns = screen.getAllByRole('button', { name: /Remove .* from cart/i });
    fireEvent.click(removeBtns[0]); // remove Sony Headphones

    expect(mockRemoveItem).toHaveBeenCalledWith('prod-201');
  });
});
