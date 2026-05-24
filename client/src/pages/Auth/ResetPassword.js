import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Login.css';

// Reset password page — the user arrives here after clicking the link in the
// password reset email. It validates the token and lets them set a new password
// with real-time strength feedback.
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password strength
  const [strength, setStrength] = useState({ strength: 0, label: '', checks: {} });

  const handlePasswordChange = async (value) => {
    setPassword(value);
    if (!value) {
      setStrength({ strength: 0, label: '', checks: {} });
      return;
    }
    try {
      const res = await api.post('/auth/check-password-strength', { password: value });
      setStrength(res.data);
    } catch {
      // Fail silently
    }
  };

  const getStrengthColour = (level) => {
    const colours = { 1: '#d32f2f', 2: '#f57c00', 3: '#fbc02d', 4: '#388e3c', 5: '#1b5e20' };
    return colours[level] || '#e0e0e0';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/account/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to reset password. The link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="verification-info">
            <div className="error-icon" aria-hidden="true" style={{ fontSize: '3rem', color: '#d32f2f', marginBottom: '12px' }}>&#10007;</div>
            <h1>Invalid Link</h1>
            <p>No reset token was provided. Please request a new password reset link.</p>
            <button className="btn-primary" onClick={() => navigate('/forgot-password')} style={{ marginTop: '16px' }}>
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="verification-info">
            <div className="success-icon" aria-hidden="true" style={{ fontSize: '3rem', color: '#2e7d32', marginBottom: '12px' }}>&#10003;</div>
            <h1>Password Reset</h1>
            <p>Your password has been reset successfully. You can now sign in with your new password.</p>
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ marginTop: '16px' }}>
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Reset Password</h1>
        <p className="login-subtitle">Enter your new password below.</p>

        {error && <div className="error-message" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Enter new password"
              autoFocus
            />
            {password && (
              <div className="password-strength-meter" aria-live="polite">
                <div className="strength-bar-track">
                  <div
                    className="strength-bar-fill"
                    style={{
                      width: `${(strength.strength / 5) * 100}%`,
                      backgroundColor: getStrengthColour(strength.strength),
                    }}
                  />
                </div>
                <span className="strength-label" style={{ color: getStrengthColour(strength.strength) }}>
                  {strength.label}
                </span>
              </div>
            )}
            {password && strength.checks && (
              <ul className="password-requirements" aria-label="Password requirements">
                <li className={strength.checks.length ? 'met' : 'unmet'}>At least 8 characters</li>
                <li className={strength.checks.uppercase ? 'met' : 'unmet'}>One uppercase letter</li>
                <li className={strength.checks.lowercase ? 'met' : 'unmet'}>One lowercase letter</li>
                <li className={strength.checks.number ? 'met' : 'unmet'}>One number</li>
                <li className={strength.checks.special ? 'met' : 'unmet'}>One special character</li>
              </ul>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="login-toggle">
          <button className="link-button" onClick={() => navigate('/login')}>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
