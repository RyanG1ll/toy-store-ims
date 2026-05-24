import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Login.css';

// Here we handle email verification after the user clicks the link in their email.
// The backend sends a verification email with a unique token link that directs
// to this component. We then call the backend API to confirm the token and
// show a success or error message based on the response.
// The email sending logic is handled in the backend (server/utils/email.js) where we use Nodemailer to send a nicely formatted HTML email with the verification link.
// A ref is used to prevent React StrictMode from double-firing the verification
// request in development, which would cause the second call to fail because the
// token is cleared from the database after the first successful verification.
function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    // Prevent double-firing in React StrictMode (development mode)
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided. Please check your email link.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.error ||
          'Verification failed. The link may have expired. Please request a new one.'
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="verification-page">
      <div className="verification-card">
        {status === 'loading' && (
          <>
            <p className="loading-spinner">Verifying your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon" aria-hidden="true">&#10003;</div>
            <h1>Email Verified</h1>
            <p>{message}</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
            >
              Go to Sign In
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon" aria-hidden="true">&#10007;</div>
            <h1>Verification Failed</h1>
            <p>{message}</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
            >
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default EmailVerification;
