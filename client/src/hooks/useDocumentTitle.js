import { useEffect } from 'react';

// Centralized hook to manage document titles across the app
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