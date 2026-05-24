import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Login.css';

// Forgot password page — allows users to request a password reset email.
// Uses generic messaging from the backend to prevent account enumeration.
function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/account/forgot-password', { email });
      setMessage(res.data.message);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {!submitted ? (
          <>
            <h1>Forgot Password</h1>
            <p className="login-subtitle">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && <div className="error-message" role="alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="login-toggle">
              <button className="link-button" onClick={() => navigate('/login')}>
                Back to Sign In
              </button>
            </div>
          </>
        ) : (
          <div className="verification-info">
            <div className="verification-icon" aria-hidden="true">&#9993;</div>
            <h1>Check Your Email</h1>
            <p>{message}</p>
            <p style={{ marginTop: '12px', fontSize: '0.88rem', color: 'var(--muted, #888)' }}>
              If you don't see the email, check your spam or junk folder.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
              style={{ marginTop: '20px' }}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
