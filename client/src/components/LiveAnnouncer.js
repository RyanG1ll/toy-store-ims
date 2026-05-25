import React, { createContext, useContext, useState, useCallback } from 'react';

// Provides a way to announce messages to screen readers for accessibility.

const AnnounceContext = createContext(null);

export function LiveAnnouncerProvider({ children }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message, politeness = 'polite') => {
    if (politeness === 'assertive') {
      // Clear then set to force re-announcement of identical messages
      setAssertiveMessage('');
      setTimeout(() => setAssertiveMessage(message), 50);
    } else {
      setPoliteMessage('');
      setTimeout(() => setPoliteMessage(message), 50);
    }
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}

      {/* Polite live region — announced when screen reader is idle */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {politeMessage}
      </div>

      {/* Assertive live region — announced immediately for errors */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {assertiveMessage}
      </div>
    </AnnounceContext.Provider>
  );
}

export function useAnnounce() {
  const announce = useContext(AnnounceContext);
  if (!announce) {
    throw new Error('useAnnounce must be used within <LiveAnnouncerProvider>');
  }
  return announce;
}