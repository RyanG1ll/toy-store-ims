import React from 'react';

/**
 * SkipLink — WCAG 2.2 SC 2.4.1 (Bypass Blocks)
 *
 * Provides a hidden link that becomes visible on focus, letting keyboard users
 * jump straight past the navigation to the main content area.
 *
 * Usage: Place <SkipLink /> as the very first child inside your App or Layout component.
 *        Make sure the main content area has id="main-content".
 *
 * Styling is in theme.css under .skip-link
 */
function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}

export default SkipLink;