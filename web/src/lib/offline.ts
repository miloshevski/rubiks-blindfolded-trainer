let registration: ServiceWorkerRegistration | null = null;
export async function registerOffline() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  try {
    registration = await navigator.serviceWorker.register('/sw.js');
    const announce = () => {
      if (navigator.serviceWorker.controller && registration?.waiting)
        window.dispatchEvent(new Event('bld-update'));
    };
    announce();
    registration.addEventListener('updatefound', () => {
      registration?.installing?.addEventListener('statechange', announce);
    });
  } catch {
    /* app remains usable without installation */
  }
}
export function applyUpdate() {
  if (document.documentElement.dataset.activeTask === 'true') return false;
  registration?.waiting?.postMessage('activate');
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {
    once: true,
  });
  return true;
}
