import { useState, useEffect, useCallback } from 'react';

/**
 * Manages the PWA install prompt (beforeinstallprompt event).
 * Returns install state and a trigger function.
 */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstallable(false);
    }
    return outcome === 'accepted';
  }, [installPrompt]);

  const dismissInstall = useCallback(() => {
    setIsInstallable(false);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  }, []);

  // Don't show if dismissed recently
  const dismissed = localStorage.getItem('pwa_install_dismissed');
  const recentlyDismissed = dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000;

  return {
    isInstallable: isInstallable && !recentlyDismissed,
    isInstalled,
    triggerInstall,
    dismissInstall,
  };
}
