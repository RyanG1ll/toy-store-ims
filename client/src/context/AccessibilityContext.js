import React, { createContext, useContext, useEffect, useState } from 'react';

const AccessibilityContext = createContext();

const DEFAULTS = {
  fontSize: 'medium',
  theme: 'light',
  pageZoom: '100',
  reducedMotion: false,
  underlineLinks: false
};

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem('a11y-fontSize') || DEFAULTS.fontSize
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem('a11y-theme') || DEFAULTS.theme
  );
  const [pageZoom, setPageZoom] = useState(
    () => localStorage.getItem('a11y-pageZoom') || DEFAULTS.pageZoom
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem('a11y-reducedMotion') === 'true'
  );
  const [underlineLinks, setUnderlineLinks] = useState(
    () => localStorage.getItem('a11y-underlineLinks') === 'true'
  );

  // Apply settings to <html> root and persist
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-font-size', fontSize);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-page-zoom', String(pageZoom));
    root.setAttribute('data-reduced-motion', reducedMotion);
    root.setAttribute('data-underline-links', underlineLinks);

    localStorage.setItem('a11y-fontSize', fontSize);
    localStorage.setItem('a11y-theme', theme);
    localStorage.setItem('a11y-pageZoom', String(pageZoom));
    localStorage.setItem('a11y-reducedMotion', reducedMotion);
    localStorage.setItem('a11y-underlineLinks', underlineLinks);
  }, [fontSize, theme, pageZoom, reducedMotion, underlineLinks]);

  const resetDefaults = () => {
    setFontSize(DEFAULTS.fontSize);
    setTheme(DEFAULTS.theme);
    setPageZoom(DEFAULTS.pageZoom);
    setReducedMotion(DEFAULTS.reducedMotion);
    setUnderlineLinks(DEFAULTS.underlineLinks);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize, setFontSize,
        theme, setTheme,
        pageZoom, setPageZoom,
        reducedMotion, setReducedMotion,
        underlineLinks, setUnderlineLinks,
        resetDefaults
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}