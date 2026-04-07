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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(formData.username, formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
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

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" type="text" value={formData.username}
                     onChange={handleChange} aria-required="true" />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={formData.email}
                   onChange={handleChange} aria-required="true" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={formData.password}
                   onChange={handleChange} aria-required="true" />
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="login-toggle">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
          >
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;