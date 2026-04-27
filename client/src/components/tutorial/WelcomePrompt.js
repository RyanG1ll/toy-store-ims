import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Tutorial.css';
import useFocusTrap from '../../hooks/useFocusTrap';

function WelcomePrompt({ onResponse }) {
  const { user } = useAuth();
  const trapRef = useFocusTrap(() => {});

  const handleYes = () => {
    // User has used the system before — skip tutorial
    const key = user ? `tutorialCompleted_${user.user_id}` : 'tutorialCompleted';
    localStorage.setItem(key, 'true');
    onResponse(false);
  };

  const handleNo = () => {
    // User is new — show tutorial
    onResponse(true);
  };

  return (
    <div className="tutorial-overlay">
      <div
        className="tutorial-modal welcome-prompt"
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        tabIndex={-1}
      >
        <div className="tutorial-content">
          <div className="tutorial-icon" aria-hidden="true">👋</div>
          <h2 id="welcome-title">Welcome to Toy Store IMS!</h2>
          <p className="tutorial-description">
            Have you used this system before?
          </p>
          <p className="welcome-subtext">
            If not, we'll give you a quick guided tour of all the features.
          </p>
        </div>

        <div className="welcome-actions">
          <button
            className="tutorial-btn tutorial-btn-back welcome-btn"
            onClick={handleYes}
          >
            Yes, I've used it before
          </button>
          <button
            className="tutorial-btn tutorial-btn-next welcome-btn"
            onClick={handleNo}
          >
            No, show me around!
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomePrompt;