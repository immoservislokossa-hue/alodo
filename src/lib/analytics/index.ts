export function trackEvent(name: string, payload?: Record<string, unknown>) {
  return { name, payload };
}
