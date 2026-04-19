import { useEffect } from 'react';

/**
 * useDocumentTitle — WCAG 2.2 SC 2.4.2 (Page Titled)
 *
 * Updates the browser tab title when a page mounts. Screen readers announce
 * the new title on route changes, which is essential for SPA navigation.
 *
 * Usage:
 *   useDocumentTitle('Dashboard — Toy Store IMS');
 *
 * The suffix " — Toy Store IMS" is appended automatically if not present,
 * so you can also just call:
 *   useDocumentTitle('Dashboard');
 */
const APP_NAME = 'Toy Store IMS';

export default function useDocumentTitle(title) {
  useEffect(() => {
    const fullTitle = title.includes(APP_NAME)
      ? title
      : `${title} — ${APP_NAME}`;
    document.title = fullTitle;

    // Reset on unmount so there's no stale title during transitions
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}