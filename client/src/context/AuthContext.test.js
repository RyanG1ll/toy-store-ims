import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock API — define mock functions at module top level for jest.mock hoisting
const mockPost = jest.fn();
// We need a stable object for defaults.headers.common that the AuthContext can mutate
const mockApi = {
  post: (...args) => mockPost(...args),
  get: jest.fn(),
  defaults: { headers: { common: {} } },
  interceptors: { response: { use: jest.fn() } },
};
jest.mock('../services/api', () => ({
  __esModule: true,
  default: mockApi,
}));

// Import after mocks are defined
const { AuthProvider, useAuth } = require('./AuthContext');

// Test component that exposes AuthContext values
function TestConsumer() {
  const { user, loading, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <button onClick={() => login('testuser', 'password123')}>Login</button>
      <button onClick={() => register('newuser', 'new@test.com', 'Pass1!')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    // Reset the headers object
    Object.keys(mockApi.defaults.headers.common).forEach(key => {
      delete mockApi.defaults.headers.common[key];
    });
  });

  // ==================== INITIAL STATE ====================

  test('starts with null user and loading true, then loading becomes false', async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  test('restores user from sessionStorage on mount', async () => {
    const savedUser = { user_id: 1, username: 'saved', role: 'staff' };
    sessionStorage.setItem('token', 'saved-token');
    sessionStorage.setItem('user', JSON.stringify(savedUser));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(savedUser));
    expect(mockApi.defaults.headers.common['Authorization']).toBe('Bearer saved-token');
  });

  // ==================== LOGIN ====================

  test('login stores token and user in sessionStorage', async () => {
    const mockUser = { user_id: 1, username: 'testuser', role: 'staff' };
    mockPost.mockResolvedValue({
      data: { token: 'login-token', user: mockUser },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      identifier: 'testuser',
      password: 'password123',
    });
    expect(sessionStorage.getItem('token')).toBe('login-token');
    expect(JSON.parse(sessionStorage.getItem('user'))).toEqual(mockUser);
    expect(mockApi.defaults.headers.common['Authorization']).toBe('Bearer login-token');
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
  });

  // ==================== REGISTER ====================

  test('register stores token and user in sessionStorage', async () => {
    const mockUser = { user_id: 2, username: 'newuser', role: 'staff' };
    mockPost.mockResolvedValue({
      data: { token: 'register-token', user: mockUser },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Register'));
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/register', {
      username: 'newuser',
      email: 'new@test.com',
      password: 'Pass1!',
    });
    expect(sessionStorage.getItem('token')).toBe('register-token');
    expect(JSON.parse(sessionStorage.getItem('user'))).toEqual(mockUser);
  });

  // ==================== LOGOUT ====================

  test('logout clears sessionStorage and resets user', async () => {
    sessionStorage.setItem('token', 'existing-token');
    sessionStorage.setItem('user', JSON.stringify({ user_id: 1, username: 'test' }));
    mockApi.defaults.headers.common['Authorization'] = 'Bearer existing-token';

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user')).not.toHaveTextContent('null');
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Logout'));
    });

    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
    expect(mockApi.defaults.headers.common['Authorization']).toBeUndefined();
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  // ==================== SESSION PERSISTENCE ====================

  test('does not set auth header when no token in sessionStorage', async () => {
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(mockApi.defaults.headers.common['Authorization']).toBeUndefined();
  });
});
