import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock useNavigate before importing the component
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext
const mockLogin = jest.fn();
const mockRegister = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

// Import after mocks
const Login = require('./Login').default;

function renderLogin() {
  return render(<Login />);
}

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== RENDERING ====================

  test('renders sign in form by default', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders subtitle text', () => {
    renderLogin();
    expect(screen.getByText(/toy store inventory management system/i)).toBeInTheDocument();
  });

  test('shows "Create one" toggle link', () => {
    renderLogin();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create one/i })).toBeInTheDocument();
  });

  // ==================== FORM SWITCHING ====================

  test('switches to registration form when "Create one" is clicked', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    // Email label changes from "Email or Username" to just "Email"
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('switches back to sign in from registration', async () => {
    renderLogin();
    // Go to register
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();

    // Go back to sign in
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  test('clears form data when switching between modes', async () => {
    renderLogin();

    // Type in login form
    await userEvent.type(screen.getByLabelText(/email or username/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'mypassword');

    // Switch to register
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));

    // Fields should be cleared
    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText(/password/i)).toHaveValue('');
  });

  // ==================== LOGIN VALIDATION ====================

  test('shows error when email/username is empty on login', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/email or username is required/i);
  });

  test('shows error when password is empty on login', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email or username/i), 'admin');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/password is required/i);
  });

  test('accepts username (non-email) for login', async () => {
    mockLogin.mockResolvedValue();
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email or username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'Password1!');
    });
  });

  test('accepts email for login', async () => {
    mockLogin.mockResolvedValue();
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email or username/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password1!');
    });
  });

  test('navigates to dashboard after successful login', async () => {
    mockLogin.mockResolvedValue();
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email or username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('shows API error message on login failure', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { error: 'Invalid email/username or password' } },
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email or username/i), 'wrong');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid email\/username or password/i);
    });
  });

  // ==================== REGISTRATION VALIDATION ====================

  test('shows error when email format is invalid on registration', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));

    await userEvent.type(screen.getByLabelText('Email'), 'notanemail');
    await userEvent.type(screen.getByLabelText(/password/i), 'Test1234!');
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/please enter a valid email address/i);
  });

  test('shows error when username is empty on registration', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Test1234!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/username is required/i);
  });

  test('shows error when password does not meet requirements on registration', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));

    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/password does not meet all requirements/i);
  });

  // ==================== PASSWORD REQUIREMENTS CHECKLIST ====================

  test('shows password requirements checklist during registration', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));

    // Requirements should not show until user starts typing
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();

    // Start typing a password
    await userEvent.type(screen.getByLabelText(/password/i), 'a');

    // Now requirements should be visible
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/one number/i)).toBeInTheDocument();
    expect(screen.getByText(/one special character/i)).toBeInTheDocument();
  });

  test('marks requirements as met when password satisfies them', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));

    // Type a strong password
    await userEvent.type(screen.getByLabelText(/password/i), 'Test1234!');

    // All requirements should be marked as met
    const requirements = screen.getAllByRole('listitem');
    requirements.forEach((req) => {
      expect(req).toHaveClass('met');
    });
  });

  test('marks requirements as unmet for weak password', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));

    // Type a weak password (no uppercase, no number, no special char, too short)
    await userEvent.type(screen.getByLabelText(/password/i), 'abc');

    const unmetItems = screen.getAllByRole('listitem').filter((li) => li.classList.contains('unmet'));
    // Should have unmet items: length, uppercase, number, special
    expect(unmetItems.length).toBeGreaterThanOrEqual(3);
  });

  test('does not show password requirements on login mode', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/password/i), 'somepassword');
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
  });

  // ==================== ACCESSIBILITY ====================

  test('email/username input has correct type for login vs registration', async () => {
    renderLogin();
    // Login mode: input type should be "text" (accepts username or email)
    const loginInput = screen.getByLabelText(/email or username/i);
    expect(loginInput).toHaveAttribute('type', 'text');

    // Switch to register
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));
    const registerInput = screen.getByLabelText('Email');
    expect(registerInput).toHaveAttribute('type', 'email');
  });

  test('all form inputs have aria-required attributes', () => {
    renderLogin();
    expect(screen.getByLabelText(/email or username/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-required', 'true');
  });

  test('error messages use role="alert" for screen readers', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  test('password field is linked to requirements via aria-describedby in register mode', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create one/i }));

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('aria-describedby', 'password-requirements');
  });

  test('password field has no aria-describedby in login mode', () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).not.toHaveAttribute('aria-describedby');
  });

  // ==================== SUCCESSFUL REGISTRATION ====================

  test('calls register with correct args and navigates on success', async () => {
    mockRegister.mockResolvedValue();
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: /create one/i }));
    await userEvent.type(screen.getByLabelText(/username/i), 'newuser');
    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'StrongPass1!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('newuser', 'new@example.com', 'StrongPass1!');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
