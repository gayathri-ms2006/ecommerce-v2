// Mocks must be declared before imports to ensure ESM bindings are mocked correctly
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../context/WishlistContext', () => ({
  useWishlist: jest.fn(),
}));

jest.mock('../services/auth', () => ({
  isAuthenticated: jest.fn(),
  getName: jest.fn(),
  logoutUser: jest.fn(),
  getUsername: jest.fn(),
  getEmail: jest.fn(),
}));

jest.mock('../services/products', () => ({
  fetchProductsList: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { isAuthenticated, getName, logoutUser, getUsername, getEmail } from '../services/auth';
import { fetchProductsList } from '../services/products';
import { MemoryRouter } from 'react-router-dom';

describe('Navbar Component tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    useCart.mockReturnValue({
      cartCount: 3,
      refreshCart: jest.fn(),
    });

    useWishlist.mockReturnValue({
      wishlistCount: 2,
      refreshWishlist: jest.fn(),
    });

    isAuthenticated.mockReturnValue(true);
    getName.mockReturnValue('Gayathri M');
    getUsername.mockReturnValue('gayathri_m');
    getEmail.mockReturnValue('gayathri@example.com');
    fetchProductsList.mockResolvedValue({
      success: true,
      data: [
        { id: '1', category: 'Electronics' },
        { id: '2', category: 'Clothing' },
      ],
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
  };

  test('renders logo and brand identity', () => {
    renderComponent();
    expect(screen.getByText('E-Shop')).toBeInTheDocument();
  });

  test('displays correct cart and wishlist counts in navigation links', () => {
    renderComponent();
    
    expect(screen.getByText('❤️ Wishlist (2)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cart/i })).toHaveTextContent('3');
  });

  test('renders user actions menu when logged in', () => {
    renderComponent();

    expect(screen.getByText(/Gayathri M/i)).toBeInTheDocument();
    
    // Open profile menu
    fireEvent.click(screen.getByRole('button', { name: /Open profile menu/i }));
    
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Sign In/i })).not.toBeInTheDocument();
  });

  test('renders login link instead of user actions menu when unauthenticated', () => {
    isAuthenticated.mockReturnValue(false);
    renderComponent();

    expect(screen.getByRole('link', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByText(/Gayathri M/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Logout/i })).not.toBeInTheDocument();
  });

  test('triggers logout process when button is clicked', async () => {
    renderComponent();

    // Open profile menu
    fireEvent.click(screen.getByRole('button', { name: /Open profile menu/i }));

    const logoutBtn = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutBtn);

    expect(logoutUser).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('renders Categories dropdown and lists unique categories', async () => {
    renderComponent();
    
    const catBtn = screen.getByRole('button', { name: /Open categories menu/i });
    expect(catBtn).toBeInTheDocument();
    
    fireEvent.click(catBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All Categories' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Electronics' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clothing' })).toBeInTheDocument();
    });
  });

  test('calls onCategoryChange when a category is clicked', async () => {
    const onCategoryChangeMock = jest.fn();
    render(
      <MemoryRouter>
        <Navbar onCategoryChange={onCategoryChangeMock} />
      </MemoryRouter>
    );

    const catBtn = screen.getByRole('button', { name: /Open categories menu/i });
    fireEvent.click(catBtn);

    const elecBtn = await screen.findByRole('button', { name: 'Electronics' });
    fireEvent.click(elecBtn);
    expect(onCategoryChangeMock).toHaveBeenCalledWith('Electronics');
  });
});

