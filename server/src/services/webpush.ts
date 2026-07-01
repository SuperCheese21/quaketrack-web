import webpush from 'web-push';

let configured = false;

const ensureConfigured = (): boolean => {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@quaketrack.local';
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
};

export const getVapidPublicKey = (): string | null =>
  process.env.VAPID_PUBLIC_KEY ?? null;

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface QuakePushPayload {
  title: string;
  body: string;
  earthquakeId: string;
  mag: number;
  url?: string;
}

export interface SendResult {
  ok: boolean;
  /** true when the subscription is gone (404/410) and should be deleted */
  expired: boolean;
}

export const sendPush = async (
  sub: PushSubscriptionRecord,
  payload: QuakePushPayload,
): Promise<SendResult> => {
  if (!ensureConfigured()) {
    throw new Error(
      'VAPID keys are not configured. Run `npm run gen-vapid` and set them in server/.env',
    );
  }
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 3600, urgency: 'high' },
    );
    return { ok: true, expired: false };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, expired: true };
    }
    console.error('[webpush] send failed:', statusCode ?? err);
    return { ok: false, expired: false };
  }
};

export const isConfigured = (): boolean => ensureConfigured();
