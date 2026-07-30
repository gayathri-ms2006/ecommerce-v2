// Mocks must be declared before imports to ensure ESM bindings are mocked correctly
jest.mock('../services/orders', () => ({
  createOrder: jest.fn(),
}));

jest.mock('../services/auth', () => ({
  isAuthenticated: jest.fn(),
  getName: jest.fn(),
  getEmail: jest.fn(),
}));

jest.mock('../context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../components/Navbar', () => () => <div data-testid="mock-navbar">Mock Navbar</div>);

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Checkout from '../pages/Checkout';
import { createOrder } from '../services/orders';
import { useCart } from '../context/CartContext';
import { isAuthenticated, getName, getEmail } from '../services/auth';
import { MemoryRouter } from 'react-router-dom';

const mockCartItems = [
  {
    productId: 'prod-301',
    productName: 'Gaming Mouse',
    name: 'Gaming Mouse',
    price: 4500,
    quantity: 1,
  }
];

describe('Checkout Page component tests', () => {
  let mockClearCart;
  let mockRefreshCart;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClearCart = jest.fn();
    mockRefreshCart = jest.fn();

    useCart.mockReturnValue({
      cartItems: mockCartItems,
      clearCart: mockClearCart,
      refreshCart: mockRefreshCart,
    });

    isAuthenticated.mockReturnValue(true);
    getName.mockReturnValue('Gayathri M');
    getEmail.mockReturnValue('gayathri@example.com');
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );
  };

  test('renders order summary and total amount correctly', () => {
    renderComponent();

    expect(screen.getByText('Gaming Mouse')).toBeInTheDocument();
    // Subtotal = 4500, Tax = 225, Total = 4725
    expect(screen.getByText(/4,725/)).toBeInTheDocument();
  });

  test('renders checkout form elements', () => {
    renderComponent();

    expect(screen.getByLabelText(/Select Payment Method/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Credit \/ Debit Card/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Net Banking/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Cash On Delivery/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Place Order/i })).toBeInTheDocument();
  });

  test('displays warning on empty cart checkout', () => {
    useCart.mockReturnValue({
      cartItems: [],
      clearCart: mockClearCart,
      refreshCart: mockRefreshCart,
    });

    renderComponent();

    expect(screen.getByText(/No items to checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/Your shopping cart is empty/i)).toBeInTheDocument();
  });

  test('successfully submits order when form is correct', async () => {
    createOrder.mockResolvedValue({
      success: true,
      orderId: 'ORD-TEST12345',
    });

    renderComponent();

    const selectEl = screen.getByLabelText(/Select Payment Method/i);
    fireEvent.change(selectEl, { target: { value: 'CASH_ON_DELIVERY' } });

    const placeBtn = screen.getByRole('button', { name: /Place Order/i });
    fireEvent.click(placeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Order Placed Successfully/i)).toBeInTheDocument();
      expect(screen.getByText('ORD-TEST12345')).toBeInTheDocument();
      expect(mockClearCart).toHaveBeenCalled();
    });
  });

  test('shows service failure errors on API errors', async () => {
    createOrder.mockRejectedValue(new Error('Internal server timeout'));

    renderComponent();

    const placeBtn = screen.getByRole('button', { name: /Place Order/i });
    fireEvent.click(placeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Internal server timeout/i)).toBeInTheDocument();
    });
  });
});
