// localStorage can be missing or throw (private windows, blocked storage): settings then
// simply fall back to their defaults.

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // not persisted; the in-memory value still applies
  }
}
