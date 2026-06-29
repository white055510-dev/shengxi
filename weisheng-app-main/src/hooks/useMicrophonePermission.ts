import { useState, useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export function useMicrophonePermission() {
  const [status, setStatus] = useState<PermissionStatus>('prompt');

  const checkPermission = useCallback(async () => {
    try {
      // 1. Try modern Permissions API
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as any });
        setStatus(result.state as PermissionStatus);
        
        result.onchange = () => {
          setStatus(result.state as PermissionStatus);
        };
        return;
      }

      // 2. Fallback to getUserMedia check
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setStatus('granted');
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setStatus('denied');
        } else {
          setStatus('prompt');
        }
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      setStatus('prompt');
    }
  }, []);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setStatus('granted');
      return true;
    } catch (err) {
      setStatus('denied');
      return false;
    }
  };

  const openSettings = async () => {
    // In Capacitor environment, open app settings
    // This is often handled by native plugins, but simple URL can work for some
    // Actually, usually we'd use a specific plugin like Capacitor Native Settings
    // But as requested, we try to open a URL or just alert
    try {
       // @ts-ignore
       if (window.Capacitor) {
         // Some platforms support app-settings:
         // window.location.href = 'app-settings:';
         alert('请前往手机系统设置以开启麦克风权限');
       } else {
         alert('请在浏览器设置中开启麦克风权限');
       }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkPermission();

    // Listen for app coming back from background
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        checkPermission();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [checkPermission]);

  return { status, checkPermission, requestPermission, openSettings };
}
