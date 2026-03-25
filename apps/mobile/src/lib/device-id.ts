import { getItem, setItem } from './storage';

const DEVICE_ID_KEY = 'rs_mobile_device_id';

function createId() {
  const rand = Math.random().toString(36).slice(2);
  return `mobile-${Date.now().toString(36)}-${rand}`;
}

export async function getDeviceId(): Promise<string> {
  const existing = await getItem<string>(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = createId();
  await setItem(DEVICE_ID_KEY, next);
  return next;
}
