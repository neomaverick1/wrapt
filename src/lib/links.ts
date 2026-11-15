/** The website this app wraps. Point it at any site that includes the bridge script. */
export const SITE_URL = 'https://neomaverick1.github.io/wrapt/site/';
export const APP_SCHEME = 'wrapt';

export type TabKey = 'home' | 'shop' | 'cart' | 'account';

export const TABS: { key: TabKey; label: string; path: string; icon: string; activeIcon: string }[] = [
  { key: 'home', label: 'Home', path: '/', icon: 'home-outline', activeIcon: 'home' },
  { key: 'shop', label: 'Shop', path: '/shop', icon: 'leaf-outline', activeIcon: 'leaf' },
  { key: 'cart', label: 'Cart', path: '/cart', icon: 'bag-handle-outline', activeIcon: 'bag-handle' },
  { key: 'account', label: 'Account', path: '/account', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

/** Which native tab a page of the website belongs to. */
export function tabForPath(path: string): TabKey {
  const first = path.split('/').filter(Boolean)[0] ?? '';
  if (first === 'shop' || first === 'product') return 'shop';
  if (first === 'cart' || first === 'checkout' || first === 'order') return 'cart';
  if (first === 'account') return 'account';
  return 'home';
}

/** Links that leave the website open in the phone's browser instead of inside the app. */
export function isExternal(url: string, siteUrl: string = SITE_URL): boolean {
  if (/^(about:|blob:|data:|javascript:)/i.test(url)) return false;
  if (/^(mailto:|tel:|sms:|maps:|geo:)/i.test(url)) return true;
  try {
    const target = new URL(url);
    const site = new URL(siteUrl);
    if (target.origin !== site.origin) return true;
    return !target.pathname.startsWith(site.pathname);
  } catch {
    return false;
  }
}

/**
 * Turns an incoming link into a page of the website:
 * wrapt://product/monstera, wrapt:///cart or a shared https link to the site.
 */
export function pathFromLink(url: string, siteUrl: string = SITE_URL): string | null {
  if (!url) return null;
  const scheme = `${APP_SCHEME}://`;
  if (url.startsWith(scheme)) {
    const rest = url.slice(scheme.length).replace(/^\/+/, '').split(/[?#]/)[0];
    return '/' + rest.replace(/\/+$/, '');
  }
  try {
    const u = new URL(url);
    const site = new URL(siteUrl);
    if (u.origin !== site.origin || !u.pathname.startsWith(site.pathname)) return null;
    const hash = u.hash.replace(/^#/, '');
    return hash.startsWith('/') ? hash : '/';
  } catch {
    return null;
  }
}
