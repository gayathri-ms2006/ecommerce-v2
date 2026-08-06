// Mocks must be declared before imports to ensure ESM bindings are mocked correctly
jest.mock('../services/products', () => ({
  fetchProductsList: jest.fn(),
}));

jest.mock('../services/inventory', () => ({
  fetchProductInventory: jest.fn(),
}));

jest.mock('../services/auth', () => ({
  isAuthenticated: jest.fn(),
}));

jest.mock('../context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../context/WishlistContext', () => ({
  useWishlist: jest.fn(),
}));

jest.mock('../components/Navbar', () => () => <div data-testid="mock-navbar">Mock Navbar</div>);

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Products from '../pages/Products';
import { fetchProductsList } from '../services/products';
import { fetchProductInventory } from '../services/inventory';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { isAuthenticated } from '../services/auth';
import { MemoryRouter } from 'react-router-dom';

const mockProducts = [
  {
    productId: 'prod-101',
    id: 'prod-101',
    productName: 'iPhone 15 Pro',
    name: 'iPhone 15 Pro',
    description: 'Latest Apple iPhone',
    category: 'Mobiles',
    price: 120000,
    imageUrl: 'https://example.com/iphone.jpg',
    stockQuantity: 15,
  },
  {
    productId: 'prod-102',
    id: 'prod-102',
    productName: 'MacBook Air M2',
    name: 'MacBook Air M2',
    description: 'Lightweight Apple Laptop',
    category: 'Computers',
    price: 99000,
    imageUrl: 'https://example.com/macbook.jpg',
    stockQuantity: 0, // Out of stock
  }
];

describe('Products Page component tests', () => {
  let mockAddItemToCart;
  let mockAddWishlist;
  let mockRemoveWishlist;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAddItemToCart = jest.fn().mockResolvedValue({ success: true });
    mockAddWishlist = jest.fn().mockResolvedValue(true);
    mockRemoveWishlist = jest.fn().mockResolvedValue(true);

    useCart.mockReturnValue({
      addItemToCart: mockAddItemToCart,
      cartItems: [],
    });

    useWishlist.mockReturnValue({
      wishlistItems: [],
      addWishlist: mockAddWishlist,
      removeWishlist: mockRemoveWishlist,
    });

    isAuthenticated.mockReturnValue(true);
    fetchProductInventory.mockResolvedValue({ success: true, data: { availableStock: 25 } });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );
  };

  test('renders loading state initially', async () => {
    fetchProductsList.mockImplementation(() => new Promise(() => {})); // pending promise
    renderComponent();
    expect(document.querySelector('.skeleton-product-card')).toBeInTheDocument();
  });

  test('renders error state on API failure', async () => {
    fetchProductsList.mockRejectedValue(new Error('Network failure'));
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load products/i)).toBeInTheDocument();
      expect(screen.getByText(/Network failure/i)).toBeInTheDocument();
    });
  });

  test('handles empty product list from API', async () => {
    fetchProductsList.mockResolvedValue({ success: true, data: [] });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No products found/i)).toBeInTheDocument();
    });
  });

  test('renders products correctly with all attributes when API succeeds', async () => {
    fetchProductsList.mockResolvedValue({ success: true, data: mockProducts });
    fetchProductInventory.mockImplementation((prodId) => {
      if (prodId === 'prod-102') {
        return Promise.resolve({ success: true, data: { availableStock: 0 } });
      }
      return Promise.resolve({ success: true, data: { availableStock: 25 } });
    });
    renderComponent();

    await waitFor(() => {
      // Check product names
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('MacBook Air M2')).toBeInTheDocument();
      
      // Check product prices
      expect(screen.getByText(/1,20,000/)).toBeInTheDocument();
      expect(screen.getByText(/99,000/)).toBeInTheDocument();

      // Check product images
      expect(screen.getByAltText('iPhone 15 Pro')).toHaveAttribute('src', 'https://example.com/iphone.jpg');

      // Check Add To Cart button
      expect(screen.getAllByRole('button', { name: /Add To Cart/i })).toHaveLength(1); // Only for in-stock
      expect(screen.getByRole('button', { name: /Out of Stock/i })).toBeInTheDocument(); // For out of stock item
    });
  });

  test('triggers addToCart context dispatcher on add button click', async () => {
    fetchProductsList.mockResolvedValue({ success: true, data: [mockProducts[0]] });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Add To Cart/i });
    fireEvent.click(addBtn);

    expect(mockAddItemToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-101',
        price: 120000,
      }),
      1
    );
  });

  test('handles out of stock rendering and disables Add to Cart', async () => {
    fetchProductsList.mockResolvedValue({ success: true, data: [mockProducts[1]] });
    fetchProductInventory.mockResolvedValue({ success: true, data: { availableStock: 0 } });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('MacBook Air M2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Out of Stock/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Add To Cart/i })).not.toBeInTheDocument();
    });
  });

  test('allows toggling wishlist state', async () => {
    fetchProductsList.mockResolvedValue({ success: true, data: [mockProducts[0]] });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    const wishlistBtn = screen.getByTitle('Add to Wishlist');
    expect(wishlistBtn).toHaveTextContent('🤍');
    
    fireEvent.click(wishlistBtn);
    expect(mockAddWishlist).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'prod-101'
    }));
  });

  test('filters products by category URL parameter', async () => {
    fetchProductsList.mockResolvedValue({ success: true, data: mockProducts });
    fetchProductInventory.mockResolvedValue({ success: true, data: { availableStock: 25 } });

    render(
      <MemoryRouter initialEntries={['/products?category=Computers']}>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('MacBook Air M2')).toBeInTheDocument();
      expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 products')).toBeInTheDocument();
    });
  });
});

