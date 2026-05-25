import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Login.css';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Password requirement checks for the live strength indicator
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };
  const passedCount = Object.values(passwordChecks).filter(Boolean).length;
  const allPasswordChecksPassed = passedCount === 5;

  // Calculate strength label and colour for the strength meter bar
  const getStrengthInfo = () => {
    if (formData.password.length === 0) return { label: '', colour: '', width: '0%' };
    if (passedCount <= 1) return { label: 'Very Weak', colour: '#d32f2f', width: '20%' };
    if (passedCount === 2) return { label: 'Weak', colour: '#f44336', width: '40%' };
    if (passedCount === 3) return { label: 'Fair', colour: '#ff9800', width: '60%' };
    if (passedCount === 4) return { label: 'Strong', colour: '#4caf50', width: '80%' };
    return { label: 'Very Strong', colour: '#2e7d32', width: '100%' };
  };
  const strengthInfo = getStrengthInfo();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  };

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isRegister) {
      // Validate real name fields
      if (!formData.firstName.trim()) {
        setError('First name is required');
        return false;
      }
      if (formData.firstName.trim().length < 2) {
        setError('First name must be at least 2 characters');
        return false;
      }
      if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName.trim())) {
        setError('First name can only contain letters, spaces, hyphens, and apostrophes');
        return false;
      }
      if (!formData.lastName.trim()) {
        setError('Last name is required');
        return false;
      }
      if (formData.lastName.trim().length < 2) {
        setError('Last name must be at least 2 characters');
        return false;
      }
      if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName.trim())) {
        setError('Last name can only contain letters, spaces, hyphens, and apostrophes');
        return false;
      }
      if (!formData.username.trim()) {
        setError('Username is required');
        return false;
      }
      if (formData.username.trim().length < 3) {
        setError('Username must be at least 3 characters');
        return false;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
        setError('Username can only contain letters, numbers, and underscores');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return false;
      }
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
      if (!allPasswordChecksPassed) {
        setError('Password does not meet all requirements');
        return false;
      }
    } else {
      // Login validation
      if (!formData.email.trim()) {
        setError('Email or username is required');
        return false;
      }
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setResendMessage('');
    if (!validate()) return;

    try {
      if (isRegister) {
        // Registration
        const response = await api.post('/auth/register', {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });

        if (response.data.requiresVerification) {
          // Show verification pending message instead of logging in
          setVerificationPending(true);
          setVerificationEmail(formData.email.trim());
          setSuccessMessage(response.data.message);
          setFormData({ firstName: '', lastName: '', username: '', email: '', password: '' });
        }
      } else {
        await login(formData.email.trim(), formData.password);
        navigate('/');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        // If email is not verified it will show verification prompt
        setVerificationPending(true);
        setVerificationEmail(err.response.data.email);
        setError('Please verify your email address before logging in.');
      } else {
        setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      }
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      const response = await api.post('/auth/resend-verification', {
        email: verificationEmail,
      });
      setResendMessage(response.data.message);
    } catch (err) {
      setResendMessage('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // If verification is pending, show the verification message screen
  if (verificationPending) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Check Your Email</h1>
          <p className="login-subtitle">Toy Store Inventory Management System</p>

          <div className="verification-info" role="status">
            <div className="verification-icon" aria-hidden="true">&#9993;</div>
            <p>
              {successMessage || 'A verification link has been sent to your email address. Please click the link to verify your account before logging in.'}
            </p>
            <p className="verification-email">{verificationEmail}</p>
          </div>

          {resendMessage && (
            <p className="info-message" role="status">{resendMessage}</p>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={handleResendVerification}
            disabled={resendLoading}
          >
            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <p className="login-toggle">
            Already verified?{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setVerificationPending(false);
                setIsRegister(false);
                setError('');
                setSuccessMessage('');
                setResendMessage('');
                setFormData({ firstName: '', lastName: '', username: '', email: '', password: '' });
              }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{isRegister ? 'Create Account' : 'Sign In'}</h1>
        <p className="login-subtitle">Toy Store Inventory Management System</p>

        {error && <p className="error-message" role="alert">{error}</p>}
        {successMessage && <p className="success-message" role="status">{successMessage}</p>}

        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    aria-required="true"
                    autoComplete="given-name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    aria-required="true"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  aria-required="true"
                  autoComplete="username"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">{isRegister ? 'Email' : 'Email or Username'}</label>
            <input
              id="email"
              name="email"
              type={isRegister ? 'email' : 'text'}
              value={formData.email}
              onChange={handleChange}
              aria-required="true"
              autoComplete={isRegister ? 'email' : 'username'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={isRegister ? 'password-requirements password-strength' : undefined}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {isRegister && formData.password.length > 0 && (
            <>
              <div className="password-strength-meter" id="password-strength">
                <div className="strength-bar-track">
                  <div
                    className="strength-bar-fill"
                    style={{ width: strengthInfo.width, backgroundColor: strengthInfo.colour }}
                    role="progressbar"
                    aria-valuenow={passedCount}
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-label={`Password strength: ${strengthInfo.label}`}
                  />
                </div>
                <span
                  className="strength-label"
                  style={{ color: strengthInfo.colour }}
                  aria-live="polite"
                >
                  {strengthInfo.label}
                </span>
              </div>

              <ul className="password-requirements" id="password-requirements" aria-label="Password requirements">
                <li className={passwordChecks.length ? 'met' : 'unmet'}>At least 8 characters</li>
                <li className={passwordChecks.uppercase ? 'met' : 'unmet'}>One uppercase letter</li>
                <li className={passwordChecks.lowercase ? 'met' : 'unmet'}>One lowercase letter</li>
                <li className={passwordChecks.number ? 'met' : 'unmet'}>One number</li>
                <li className={passwordChecks.special ? 'met' : 'unmet'}>One special character (!@#$%^&* etc.)</li>
              </ul>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-full">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>

          {!isRegister && (
            <div className="forgot-password-link">
              <button type="button" className="link-button" onClick={() => navigate('/forgot-password')}>
                Forgot your password?
              </button>
            </div>
          )}
        </form>

        <p className="login-toggle">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccessMessage('');
              setFormData({ firstName: '', lastName: '', username: '', email: '', password: '' });
            }}
          >
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
