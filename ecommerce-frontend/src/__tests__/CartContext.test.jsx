import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CartProvider, useCart } from '../context/CartContext';
import { getCartItems, addToCart, removeFromCart, updateCartQuantity } from '../services/cart';
import { isAuthenticated } from '../services/auth';

// Mocks
jest.mock('../services/cart', () => ({
  getCartItems: jest.fn(),
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateCartQuantity: jest.fn(),
  clearCart: jest.fn(),
}));

jest.mock('../services/auth', () => ({
  isAuthenticated: jest.fn(),
}));

const TestConsumer = () => {
  const {
    cartItems,
    cartCount,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
  } = useCart();

  return (
    <div>
      <span data-testid="cart-count">{cartCount}</span>
      <span data-testid="items-count">{cartItems.length}</span>
      <button onClick={() => addItemToCart({ id: 'p-1', productId: 'p-1', name: 'Product A', price: 500 }, 2)}>
        Add Product A
      </button>
      <button onClick={() => updateItemQuantity('p-1', 4)}>
        Update Product A Qty
      </button>
      <button onClick={() => removeItemFromCart('p-1')}>
        Remove Product A
      </button>
      <button onClick={clearCart}>
        Clear Cart
      </button>
    </div>
  );
};

describe('CartContext provider tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAuthenticated.mockReturnValue(true);
    getCartItems.mockResolvedValue([]);
  });

  const renderProvider = () => {
    return render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );
  };

  test('provides empty initial cart state', async () => {
    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    });
  });

  test('successfully resolves items list from API on mount', async () => {
    getCartItems.mockResolvedValue([
      { productId: 'p-1', quantity: 3, price: 100 }
    ]);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
      expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    });
  });

  test('performs addItemToCart operations and refreshes local state', async () => {
    addToCart.mockResolvedValue({ success: true });
    getCartItems.mockResolvedValueOnce([]) // initial fetch
      .mockResolvedValueOnce([
        { productId: 'p-1', quantity: 2, price: 500 }
      ]); // post-add refresh fetch

    renderProvider();

    const addBtn = screen.getByText('Add Product A');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'p-1', price: 500 }),
        2
      );
      expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
      expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    });
  });

  test('performs updateItemQuantity and updates quantities in store', async () => {
    updateCartQuantity.mockResolvedValue({ success: true });
    getCartItems.mockResolvedValueOnce([{ productId: 'p-1', quantity: 2, price: 500 }]) // initial fetch
      .mockResolvedValueOnce([{ productId: 'p-1', quantity: 4, price: 500 }]); // post-update refresh fetch

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    });

    const updateBtn = screen.getByText('Update Product A Qty');
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(updateCartQuantity).toHaveBeenCalledWith('p-1', 4);
      expect(screen.getByTestId('cart-count')).toHaveTextContent('4');
    });
  });

  test('performs removeItemFromCart and deletes item from store', async () => {
    removeFromCart.mockResolvedValue({ success: true });
    getCartItems.mockResolvedValueOnce([{ productId: 'p-1', quantity: 2, price: 500 }]) // initial fetch
      .mockResolvedValueOnce([]); // post-remove refresh fetch

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    });

    const removeBtn = screen.getByText('Remove Product A');
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(removeFromCart).toHaveBeenCalledWith('p-1');
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    });
  });

  test('performs clearCart operation and deletes all items from backend and local store', async () => {
    const { clearCart } = require('../services/cart');
    clearCart.mockResolvedValue({ success: true });
    getCartItems.mockResolvedValue([{ productId: 'p-1', quantity: 3, price: 100 }]);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
    });

    const clearBtn = screen.getByText('Clear Cart');
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(clearCart).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
      expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    });
  });
});
