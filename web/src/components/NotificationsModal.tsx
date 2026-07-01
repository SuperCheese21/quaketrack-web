import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormToggleSwitch, Modal } from 'stratosphere-ui';

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_MAG_STEP,
  NOTIFICATION_MAX_MAG,
  NOTIFICATION_MIN_MAG,
  type NotificationSettings,
} from '../lib/constants';
import {
  getExistingSubscription,
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  toSubscriptionJSON,
} from '../lib/push';
import { trpc } from '../trpc';

interface NotificationsModalProps {
  open: boolean;
  onClose: () => void;
}

// Web port of src/screens/Notifications.js — settings drive the server-side
// Web Push poller. Enabling triggers a browser push subscription.
const NotificationsModal = ({ open, onClose }: NotificationsModalProps) => {
  const methods = useForm<NotificationSettings>({
    defaultValues: DEFAULT_NOTIFICATION_SETTINGS,
  });
  const { register, watch, reset, handleSubmit } = methods;

  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [supported] = useState(() => isPushSupported());

  const utils = trpc.useUtils();
  const vapidQuery = trpc.config.vapidPublicKey.useQuery(undefined, {
    enabled: open,
  });
  const subscribeMutation = trpc.notifications.subscribe.useMutation();
  const saveSettingsMutation = trpc.notifications.saveSettings.useMutation();

  const enabled = watch('enabled');
  const minMagnitude = watch('minMagnitude');

  useEffect(() => {
    if (!open || !supported) return;
    setError(null);
    void (async () => {
      const sub = await getExistingSubscription();
      if (sub) {
        setEndpoint(sub.endpoint);
        const settings = await utils.notifications.get.fetch({
          endpoint: sub.endpoint,
        });
        reset({
          enabled: settings.enabled,
          minMagnitude: settings.minMagnitude,
          updates: settings.updates,
        });
      } else {
        setEndpoint(null);
        reset(DEFAULT_NOTIFICATION_SETTINGS);
      }
    })();
  }, [open, supported, reset, utils]);

  const onSubmit = async (values: NotificationSettings) => {
    setError(null);
    setSaving(true);
    try {
      if (values.enabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          setError('Notification permission was denied by the browser.');
          return;
        }
        const publicKey = vapidQuery.data?.publicKey;
        if (!publicKey) {
          setError(
            'Server has no VAPID keys configured. Run `npm run gen-vapid` and set them in server/.env.',
          );
          return;
        }
        const sub = await subscribeToPush(publicKey);
        const json = toSubscriptionJSON(sub);
        await subscribeMutation.mutateAsync({
          subscription: json,
          settings: {
            enabled: values.enabled,
            minMagnitude: Number(values.minMagnitude),
            updates: values.updates,
          },
        });
        setEndpoint(json.endpoint);
      } else if (endpoint) {
        // Keep the subscription row but mark it disabled (mirrors mobile).
        await saveSettingsMutation.mutateAsync({
          endpoint,
          enabled: false,
          minMagnitude: Number(values.minMagnitude),
          updates: values.updates,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save notification settings.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notifications"
      className="w-full max-w-lg"
      actionButtons={[
        { color: 'ghost', onClick: onClose, children: 'Cancel' },
        {
          color: 'primary',
          loading: saving,
          disabled: !supported,
          onClick: handleSubmit(onSubmit),
          children: 'Save & Close',
        },
      ]}
    >
      {!supported ? (
        <p className="py-4 text-warning">
          Push notifications aren&apos;t supported in this browser.
        </p>
      ) : (
        <Form methods={methods} className="flex flex-col gap-4 py-2">
          <FormToggleSwitch
            name="enabled"
            labelText="Enable Notifications"
            color="primary"
          />

          <div className={enabled ? '' : 'pointer-events-none opacity-50'}>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold">Minimum Magnitude</span>
              <span className="badge badge-primary badge-lg">
                {Number(minMagnitude).toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={NOTIFICATION_MIN_MAG}
              max={NOTIFICATION_MAX_MAG}
              step={NOTIFICATION_MAG_STEP}
              disabled={!enabled}
              className="range range-primary w-full"
              {...register('minMagnitude', { valueAsNumber: true })}
            />
          </div>

          <div className={enabled ? '' : 'pointer-events-none opacity-50'}>
            <FormToggleSwitch
              name="updates"
              labelText="Receive Update Notifications"
              color="primary"
              disabled={!enabled}
            />
          </div>

          {error ? (
            <div className="alert alert-error py-2 text-sm">{error}</div>
          ) : null}
        </Form>
      )}
    </Modal>
  );
};

export default NotificationsModal;
