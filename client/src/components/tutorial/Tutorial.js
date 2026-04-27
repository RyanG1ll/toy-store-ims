import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import tutorialSteps from '../../data/tutorialSteps';
import './Tutorial.css';
import useFocusTrap from '../../hooks/useFocusTrap';
import { useAnnounce } from '../../components/LiveAnnouncer';

function Tutorial({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const announce = useAnnounce();
  const trapRef = useFocusTrap(() => {});

  const step = tutorialSteps[currentStep];
  const totalSteps = tutorialSteps.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  // Navigate to the route for the current step
  useEffect(() => {
    if (step.route) {
      navigate(step.route);
    }
  }, [currentStep, step.route, navigate]);

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
      announce(`Step ${currentStep + 2} of ${totalSteps}: ${tutorialSteps[currentStep + 1].title}`);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
      announce(`Step ${currentStep} of ${totalSteps}: ${tutorialSteps[currentStep - 1].title}`);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    const key = user ? `tutorialCompleted_${user.user_id}` : 'tutorialCompleted';
    localStorage.setItem(key, 'true');
    announce('Tutorial completed');
    navigate('/');
    onComplete();
  };

  return (
    <div className="tutorial-panel-wrapper">
      <div
        className="tutorial-panel"
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        tabIndex={-1}
      >
        {/* Progress bar */}
        <div className="tutorial-progress" aria-hidden="true">
          <div
            className="tutorial-progress-fill"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step counter */}
        <div className="tutorial-step-count" aria-live="polite">
          Step {currentStep + 1} of {totalSteps}
        </div>

        {/* Content */}
        <div className="tutorial-content">
          <div className="tutorial-icon" aria-hidden="true">{step.icon}</div>
          <h2 id="tutorial-title">{step.title}</h2>
          <p className="tutorial-description">{step.content}</p>

          {step.details && step.details.length > 0 && (
            <ul className="tutorial-details">
              {step.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="tutorial-actions">
          {!isFirst && (
            <button
              className="tutorial-btn tutorial-btn-back"
              onClick={handleBack}
              aria-label="Go to previous step"
            >
              ← Back
            </button>
          )}

          <button
            className="tutorial-btn tutorial-btn-skip"
            onClick={handleSkip}
            aria-label="Skip tutorial"
          >
            Skip Tutorial
          </button>

          <button
            className="tutorial-btn tutorial-btn-next"
            onClick={handleNext}
            aria-label={isLast ? 'Finish tutorial' : 'Go to next step'}
          >
            {isLast ? 'Get Started! →' : 'Next →'}
          </button>
        </div>

        {/* Step dots */}
        <div className="tutorial-dots" aria-hidden="true">
          {tutorialSteps.map((_, index) => (
            <span
              key={index}
              className={`tutorial-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Tutorial;
