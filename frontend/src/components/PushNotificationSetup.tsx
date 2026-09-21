'use client';

import { useEffect } from 'react';
import { apiFetch } from '@/lib/apiClient';

// Convierte base64url a Uint8Array (requerido por la Push API del navegador)
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

export default function PushNotificationSetup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[Push] Navegador no soporta notificaciones push.');
      return;
    }

    async function setupPush() {
      try {
        // 1. Registrar el service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[Push] Service Worker registrado.');

        // 2. Pedir permiso de notificaciones
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[Push] Permiso denegado.');
          return;
        }

        // 3. Obtener la VAPID public key del backend
        const keyRes = await apiFetch('/push/vapid-public-key');
        const { publicKey } = await keyRes.json();

        // 4. Suscribirse al push server del navegador
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // 5. Enviar la suscripción al backend
        const subJson = subscription.toJSON();
        await apiFetch('/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          }),
        });

        console.log('[Push] Suscripción registrada en el servidor.');
      } catch (err) {
        console.error('[Push] Error al configurar notificaciones:', err);
      }
    }

    setupPush();
  }, []);

  // Componente invisible — solo lógica
  return null;
}
