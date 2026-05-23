import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Detects when a new service worker version is available
 * and provides a function to apply the update.
 */
export function useSWUpdate() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[SW] Registered:', r);
    },
    onRegisterError(error) {
      console.error('[SW] Registration error:', error);
    },
  });

  const applyUpdate = () => {
    updateServiceWorker(true);
  };

  const dismissUpdate = () => {
    setNeedRefresh(false);
  };

  return { needRefresh, applyUpdate, dismissUpdate };
}
