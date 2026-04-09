import React, { useState } from 'react';
import './ToolTip.css';

function Tooltip({ content }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="tooltip-wrapper">
      <button
        className="tooltip-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Learn about ${content.term}`}
        type="button"
      >
        ?
      </button>
      {isOpen && (
        <>
          <div className="tooltip-backdrop" onClick={() => setIsOpen(false)} />
          <div className="tooltip-panel" role="dialog" aria-label={content.term}>
            <div className="tooltip-header">
              <h4>{content.term}</h4>
              <button
                className="tooltip-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close tooltip"
              >
                ×
              </button>
            </div>
            <p className="tooltip-short">{content.short}</p>
            <details className="tooltip-details">
              <summary>How does it work?</summary>
              <p>{content.detailed}</p>
            </details>
            {content.example && (
              <details className="tooltip-details">
                <summary>Example</summary>
                <p>{content.example}</p>
              </details>
            )}
            {content.realWorld && (
              <details className="tooltip-details">
                <summary>Real-world usage</summary>
                <p>{content.realWorld}</p>
              </details>
            )}
          </div>
        </>
      )}
    </span>
  );
}

export default Tooltip;