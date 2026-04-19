import React, { useRef } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import './Settings.css';
import useDocumentTitle from '../../hooks/useDocumentTitle';

function Settings() {
  useDocumentTitle('Settings');
  const {
    fontSize, setFontSize,
    theme, setTheme,
    pageZoom, setPageZoom,
    reducedMotion, setReducedMotion,
    underlineLinks, setUnderlineLinks,
    resetDefaults
  } = useAccessibility();

  // When Enter is pressed on a label, click the input inside it
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget.querySelector('input');
      if (input) {
        input.click();
      }
    }
  };

  return (
    <div className="settings-page">
      <h1>Accessibility Settings</h1>
      <p className="settings-subtitle">
        Customise the app to match your needs. Changes save automatically.
      </p>

      <section className="settings-section">
        <h2>Font Size</h2>
        <p className="settings-help">Adjust the text size across the entire application.</p>
        <div className="settings-options" role="group" aria-label="Font size">
          {[
            { value: 'small', label: 'Small (14px)' },
            { value: 'medium', label: 'Medium (16px)' },
            { value: 'large', label: 'Large (18px)' },
            { value: 'xlarge', label: 'Extra Large (20px)' }
          ].map((option) => (
            <label
              key={option.value}
              className="settings-option"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              role="radio"
              aria-checked={fontSize === option.value}
            >
              <input
                type="radio"
                name="fontSize"
                value={option.value}
                checked={fontSize === option.value}
                onChange={(e) => setFontSize(e.target.value)}
                tabIndex={-1}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>Page Zoom</h2>
        <p className="settings-help">
          Shrink or enlarge the whole page. Useful for seeing more of a page at once
          without scrolling, or for enlarging content on large displays.
        </p>
        <div className="settings-options" role="group" aria-label="Page zoom">
          {[
            { value: '75',  label: '75% — Fit more on screen' },
            { value: '85',  label: '85% — Compact' },
            { value: '100', label: '100% — Default' },
            { value: '115', label: '115% — Enlarged' }
          ].map((option) => (
            <label
              key={option.value}
              className="settings-option"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              role="radio"
              aria-checked={String(pageZoom) === option.value}
            >
              <input
                type="radio"
                name="pageZoom"
                value={option.value}
                checked={String(pageZoom) === option.value}
                onChange={(e) => setPageZoom(e.target.value)}
                tabIndex={-1}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>Colour Theme</h2>
        <p className="settings-help">Choose a theme that's comfortable for your eyes.</p>
        <div className="settings-options" role="group" aria-label="Colour theme">
          {[
            { value: 'light', label: 'Light (default)', description: 'Standard light background with dark text' },
            { value: 'dark', label: 'Dark', description: 'Reduced eye strain in low light' },
            { value: 'high-contrast', label: 'High Contrast', description: 'Maximum contrast for low vision (WCAG AAA)' }
          ].map((option) => (
            <label
              key={option.value}
              className="settings-option settings-option-card"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              role="radio"
              aria-checked={theme === option.value}
            >
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={theme === option.value}
                onChange={(e) => setTheme(e.target.value)}
                tabIndex={-1}
              />
              <div>
                <div className="option-label">{option.label}</div>
                <div className="option-description">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>Motion & Display</h2>
        <p className="settings-help">Reduce visual motion or enhance link visibility.</p>
        <div className="settings-options">
          <label
            className="settings-option settings-option-toggle"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="checkbox"
            aria-checked={reducedMotion}
          >
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              tabIndex={-1}
            />
            <div>
              <div className="option-label">Reduce Motion</div>
              <div className="option-description">Disable animations and transitions</div>
            </div>
          </label>
          <label
            className="settings-option settings-option-toggle"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            role="checkbox"
            aria-checked={underlineLinks}
          >
            <input
              type="checkbox"
              checked={underlineLinks}
              onChange={(e) => setUnderlineLinks(e.target.checked)}
              tabIndex={-1}
            />
            <div>
              <div className="option-label">Always Underline Links</div>
              <div className="option-description">Make all links visually distinct with underlines</div>
            </div>
          </label>
        </div>
      </section>

      <section className="settings-section">
        <button
          className="reset-button"
          onClick={resetDefaults}
          aria-label="Reset all accessibility settings to defaults"
        >
          Reset to Defaults
        </button>
      </section>
    </div>
  );
}

export default Settings;