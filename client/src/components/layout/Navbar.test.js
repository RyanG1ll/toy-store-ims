import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock react-router-dom before importing Navbar
const mockLocation = { pathname: '/' };
jest.mock('react-router-dom', () => ({
  NavLink: ({ children, to, end, className, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => mockLocation,
}));

// Mock AuthContext
const mockLogout = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser', user_id: 1, role: 'staff' },
    logout: mockLogout,
  }),
}));

// Mock API for notification count
const mockApiGet = jest.fn().mockResolvedValue({ data: { count: 3 } });
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockApiGet(...args),
    defaults: { headers: { common: {} } },
    interceptors: { response: { use: jest.fn() } },
  },
}));

// Import after mocks
const Navbar = require('./Navbar').default;

function renderNavbar() {
  return render(<Navbar />);
}

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-set API mock after clearAllMocks
    mockApiGet.mockResolvedValue({ data: { count: 3 } });
    // Reset window.confirm mock
    window.confirm = jest.fn();
  });

  // ==================== RENDERING ====================

  test('renders navigation bar with correct role and label', () => {
    renderNavbar();
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  test('renders brand link to home page', () => {
    renderNavbar();
    const brandLink = screen.getByText(/toy store ims/i);
    expect(brandLink).toBeInTheDocument();
    expect(brandLink.closest('a')).toHaveAttribute('href', '/');
  });

  test('renders all navigation links', () => {
    renderNavbar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Suppliers')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Forecasting')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('renders username', () => {
    renderNavbar();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('renders sign out button', () => {
    renderNavbar();
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  // ==================== NAVIGATION LINKS ====================

  test('navigation links have correct href attributes', () => {
    renderNavbar();
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Products').closest('a')).toHaveAttribute('href', '/products');
    expect(screen.getByText('Suppliers').closest('a')).toHaveAttribute('href', '/suppliers');
    expect(screen.getByText('Orders').closest('a')).toHaveAttribute('href', '/orders');
    expect(screen.getByText('Forecasting').closest('a')).toHaveAttribute('href', '/forecasting');
    expect(screen.getByText('Settings').closest('a')).toHaveAttribute('href', '/settings');
  });

  // ==================== NOTIFICATION BADGE ====================

  test('displays notification badge with unread count', async () => {
    renderNavbar();
    // Wait for the API call to resolve
    const badge = await screen.findByText('3');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('notification-badge');
  });

  test('Messages link has aria-label with unread count', async () => {
    renderNavbar();
    const messagesLink = await screen.findByLabelText(/messages, 3 unread/i);
    expect(messagesLink).toBeInTheDocument();
  });

  // ==================== LOGOUT ====================

  test('shows confirmation dialog before logging out', () => {
    window.confirm.mockReturnValue(false);
    renderNavbar();

    fireEvent.click(screen.getByText(/sign out/i));
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to sign out?');
    expect(mockLogout).not.toHaveBeenCalled();
  });

  test('logs out when user confirms', () => {
    window.confirm.mockReturnValue(true);
    renderNavbar();

    fireEvent.click(screen.getByText(/sign out/i));
    expect(window.confirm).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
  });

  test('does not log out when user cancels confirmation', () => {
    window.confirm.mockReturnValue(false);
    renderNavbar();

    fireEvent.click(screen.getByText(/sign out/i));
    expect(mockLogout).not.toHaveBeenCalled();
  });

  // ==================== HAMBURGER MENU ====================

  test('renders hamburger button with correct aria attributes', () => {
    renderNavbar();
    const hamburger = screen.getByLabelText(/open navigation menu/i);
    expect(hamburger).toBeInTheDocument();
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    expect(hamburger).toHaveAttribute('aria-controls', 'nav-menu');
  });

  test('toggles menu open state when hamburger is clicked', () => {
    renderNavbar();
    const hamburger = screen.getByLabelText(/open navigation menu/i);

    fireEvent.click(hamburger);
    // After click, label should change to "Close"
    expect(screen.getByLabelText(/close navigation menu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/close navigation menu/i)).toHaveAttribute('aria-expanded', 'true');

    // The nav-menu should have the open class
    const navMenu = document.getElementById('nav-menu');
    expect(navMenu).toHaveClass('nav-menu--open');
  });

  test('closes menu when Escape key is pressed', () => {
    renderNavbar();
    const hamburger = screen.getByLabelText(/open navigation menu/i);

    // Open the menu
    fireEvent.click(hamburger);
    expect(document.getElementById('nav-menu')).toHaveClass('nav-menu--open');

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.getElementById('nav-menu')).not.toHaveClass('nav-menu--open');
  });

  // ==================== ACCESSIBILITY ====================

  test('nav links are inside a list for assistive tech', () => {
    renderNavbar();
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(7); // Dashboard, Products, Suppliers, Orders, Forecasting, Messages, Settings
  });
});
