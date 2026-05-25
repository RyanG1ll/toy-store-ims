import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
  NavLink: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ pathname: '/login' }),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

// Mock all page components
jest.mock('./pages/Auth/Login', () => () => <div data-testid="login-page">Login</div>);
jest.mock('./pages/Auth/EmailVerification', () => () => <div data-testid="email-verification-page">EmailVerification</div>);
jest.mock('./pages/Auth/ForgotPassword', () => () => <div data-testid="forgot-password-page">ForgotPassword</div>);
jest.mock('./pages/Auth/ResetPassword', () => () => <div data-testid="reset-password-page">ResetPassword</div>);
jest.mock('./pages/Account/AccountDetails', () => () => <div data-testid="account-details-page">AccountDetails</div>);
jest.mock('./pages/Dashboard/Dashboard', () => () => <div data-testid="dashboard-page">Dashboard</div>);
jest.mock('./pages/Products/Products', () => () => <div data-testid="products-page">Products</div>);
jest.mock('./pages/Suppliers/Suppliers', () => () => <div data-testid="suppliers-page">Suppliers</div>);
jest.mock('./pages/Orders/Orders', () => () => <div data-testid="orders-page">Orders</div>);
jest.mock('./pages/Notifications/Notifications', () => () => <div data-testid="notifications-page">Notifications</div>);
jest.mock('./pages/Forecasting/Forecasting', () => () => <div data-testid="forecasting-page">Forecasting</div>);
jest.mock('./pages/Settings/Settings', () => () => <div data-testid="settings-page">Settings</div>);
jest.mock('./components/layout/Navbar', () => () => <nav data-testid="navbar">Navbar</nav>);
jest.mock('./components/notificationpopup/NotificationPopup', () => () => null);
jest.mock('./components/tutorial/Tutorial', () => () => null);
jest.mock('./components/tutorial/WelcomePrompt', () => () => null);

// Mock API
jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: { count: 0 } }),
    post: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { response: { use: jest.fn() } },
  },
}));

const App = require('./App').default;

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  test('renders without crashing', () => {
    render(<App />);
    // App should render the main content area
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
  });

  test('renders main content area with correct ARIA role', () => {
    render(<App />);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('role', 'main');
  });

  test('does not show navbar when user is not logged in', () => {
    sessionStorage.removeItem('token');
    render(<App />);
    // Navbar should not render because user is null
    expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
  });

  test('shows navbar when user is logged in', () => {
    sessionStorage.setItem('token', 'test-token');
    sessionStorage.setItem('user', JSON.stringify({ user_id: 1, username: 'admin', role: 'admin' }));
    render(<App />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });
});
