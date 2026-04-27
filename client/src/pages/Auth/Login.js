import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Password requirement checks
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };
  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      setError(isRegister ? 'Email is required' : 'Email or username is required');
      return false;
    }
    // Only enforce email format on registration
    if (isRegister && !emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (isRegister) {
      if (!formData.username.trim()) {
        setError('Username is required');
        return false;
      }
      if (!allPasswordChecksPassed) {
        setError('Password does not meet all requirements');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    try {
      if (isRegister) {
        await register(formData.username, formData.email, formData.password);
      } else {
        await login(formData.email.trim(), formData.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{isRegister ? 'Create Account' : 'Sign In'}</h1>
        <p className="login-subtitle">Toy Store Inventory Management System</p>

        {error && <p className="error-message" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" type="text" value={formData.username}
                     onChange={handleChange} aria-required="true" />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{isRegister ? 'Email' : 'Email or Username'}</label>
            <input id="email" name="email" type={isRegister ? 'email' : 'text'} value={formData.email}
                   onChange={handleChange} aria-required="true"
                   placeholder="" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={formData.password}
                   onChange={handleChange} aria-required="true"
                   aria-describedby={isRegister ? 'password-requirements' : undefined} />
          </div>

          {isRegister && formData.password.length > 0 && (
            <ul className="password-requirements" id="password-requirements" aria-label="Password requirements">
              <li className={passwordChecks.length ? 'met' : 'unmet'}>At least 8 characters</li>
              <li className={passwordChecks.uppercase ? 'met' : 'unmet'}>One uppercase letter</li>
              <li className={passwordChecks.lowercase ? 'met' : 'unmet'}>One lowercase letter</li>
              <li className={passwordChecks.number ? 'met' : 'unmet'}>One number</li>
              <li className={passwordChecks.special ? 'met' : 'unmet'}>One special character (!@#$%^&* etc.)</li>
            </ul>
          )}

          <button type="submit" className="btn btn-primary btn-full">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="login-toggle">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => { setIsRegister(!isRegister); setError(''); setFormData({ username: '', email: '', password: '' }); }}
          >
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;