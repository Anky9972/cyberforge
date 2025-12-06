/**
 * PWA Registration Hook
 * Handles service worker registration and updates
 */

import { useEffect, useState } from 'react';

interface PWAState {
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  needsUpdate: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [pwaState, setPWAState] = useState<PWAState>({
    isInstalled: false,
    canInstall: false,
    isOnline: navigator.onLine,
    needsUpdate: false
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');
    
    setPWAState(prev => ({ ...prev, isInstalled: isStandalone }));

    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPWAState(prev => ({ ...prev, canInstall: true }));
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      setPWAState(prev => ({ ...prev, isInstalled: true, canInstall: false }));
      setDeferredPrompt(null);
    };

    // Listen for online/offline
    const handleOnline = () => {
      setPWAState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setPWAState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Register service worker
   */
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              setPWAState(prev => ({ ...prev, needsUpdate: true }));
              
              // Show update notification
              if (window.confirm('New version available! Reload to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });

      // Listen for controller change (new SW activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  /**
   * Prompt user to install PWA
   */
  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted install prompt');
    } else {
      console.log('User dismissed install prompt');
    }

    setDeferredPrompt(null);
    setPWAState(prev => ({ ...prev, canInstall: false }));
  };

  /**
   * Update service worker
   */
  const updateServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
      }
    }
  };

  /**
   * Unregister service worker
   */
  const unregisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        console.log('Service Worker unregistered');
      }
    }
  };

  return {
    ...pwaState,
    promptInstall,
    updateServiceWorker,
    unregisterServiceWorker
  };
};

export default usePWA;
