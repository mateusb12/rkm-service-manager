import { useSyncExternalStore } from 'react';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isLocalhost(hostname = window.location.hostname): boolean {
  return LOCAL_HOSTNAMES.has(hostname);
}

export const LOCAL_DEVELOPMENT_AVAILABLE =
  import.meta.env.DEV && typeof window !== 'undefined' && isLocalhost();

let localDevelopmentEnabled = LOCAL_DEVELOPMENT_AVAILABLE;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isLocalDevelopmentEnabled() {
  return LOCAL_DEVELOPMENT_AVAILABLE && localDevelopmentEnabled;
}

export function toggleLocalDevelopment() {
  if (!LOCAL_DEVELOPMENT_AVAILABLE) return;

  localDevelopmentEnabled = !localDevelopmentEnabled;
  listeners.forEach((listener) => listener());
}

export function useLocalDevelopment() {
  return useSyncExternalStore(subscribe, isLocalDevelopmentEnabled, () => false);
}
