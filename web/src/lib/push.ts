// Web Push client helpers — the browser side of the notification pipeline.

export const isPushSupported = (): boolean =>
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const urlBase64ToUint8Array = (base64String: string): BufferSource => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
};

export const registerServiceWorker =
  async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;
    try {
      return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    } catch (err) {
      console.error('Service worker registration failed:', err);
      return null;
    }
  };

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const getExistingSubscription =
  async (): Promise<PushSubscription | null> => {
    if (!isPushSupported()) return null;
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  };

export const subscribeToPush = async (
  vapidPublicKey: string,
): Promise<PushSubscription> => {
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
};

export interface SerializedSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const toSubscriptionJSON = (
  sub: PushSubscription,
): SerializedSubscription => {
  const json = sub.toJSON();
  return {
    endpoint: json.endpoint as string,
    keys: {
      p256dh: json.keys?.p256dh as string,
      auth: json.keys?.auth as string,
    },
  };
};
