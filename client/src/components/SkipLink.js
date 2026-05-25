import React from 'react';

// This component provides a skip link for accessibility, allowing users to quickly navigate to the main content of the page.
function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}

export default SkipLink;