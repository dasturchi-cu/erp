const STORAGE_KEY = 'erp-device-uuid';

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function getDeviceInfo() {
  const platform =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
      ? 'macos'
      : typeof navigator !== 'undefined' && /Linux/.test(navigator.platform)
        ? 'linux'
        : 'windows';

  return {
    deviceId: getDeviceId(),
    name: 'Desktop ERP',
    platform,
    osVersion: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) : undefined,
  };
}
