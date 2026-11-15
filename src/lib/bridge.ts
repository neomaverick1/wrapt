/**
 * Messages the website sends to the app through the JavaScript bridge.
 * Everything coming from web content is untrusted, so each message is validated before it is used.
 */
export type SiteMessage =
  | { type: 'route'; path: string; title: string; canGoBack: boolean }
  | { type: 'cart'; count: number }
  | { type: 'share'; title: string; text?: string; url: string }
  | { type: 'notify'; title: string; body: string; delaySec: number; path?: string }
  | { type: 'haptic'; kind: 'light' | 'success' };

const str = (v: unknown, max = 200): string | null => (typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null);
const isPath = (v: unknown): v is string => typeof v === 'string' && /^\/[\w\-/.]*$/.test(v) && v.length < 200;

export function parseSiteMessage(raw: unknown): SiteMessage | null {
  let m: Record<string, unknown>;
  try {
    m = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (!m || typeof m !== 'object') return null;
  switch (m.type) {
    case 'route': {
      if (!isPath(m.path)) return null;
      return { type: 'route', path: m.path, title: str(m.title, 80) ?? '', canGoBack: m.canGoBack === true };
    }
    case 'cart': {
      const n = Number(m.count);
      return Number.isFinite(n) && n >= 0 ? { type: 'cart', count: Math.min(99, Math.floor(n)) } : null;
    }
    case 'share': {
      const url = str(m.url, 500);
      const title = str(m.title, 120);
      if (!url || !title || !/^https:\/\//.test(url)) return null;
      return { type: 'share', title, url, text: str(m.text, 300) ?? undefined };
    }
    case 'notify': {
      const title = str(m.title, 80);
      const body = str(m.body, 200);
      const delay = Number(m.delaySec);
      if (!title || !body || !Number.isFinite(delay)) return null;
      return { type: 'notify', title, body, delaySec: Math.min(3600, Math.max(1, delay)), path: isPath(m.path) ? m.path : undefined };
    }
    case 'haptic':
      return { type: 'haptic', kind: m.kind === 'success' ? 'success' : 'light' };
    default:
      return null;
  }
}
