import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * On route change, move focus to #main-content so screen readers
 * announce the new page and keyboard users start at the top.
 */
export function useFocusManagement() {
  const location = useLocation();

  useEffect(() => {
    const el = document.getElementById('main-content');
    if (el) {
      el.focus({ preventScroll: false });
    }
  }, [location.pathname]);
}
