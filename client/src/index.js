import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Once active, axe runs automatically every time your UI updates. 
// If it finds a problem — say a button with no label, or an image with no alt text — it prints a warning
// in your browser's developer console
// (Cmd + Option + I in Chrome) with a description of the issue and which WCAG rule it violates.
if (process.env.NODE_ENV === 'development') {
  const axe = require('@axe-core/react');
  axe(React, ReactDOM, 1000);  // Reports a11y issues to browser console
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
