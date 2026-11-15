import { parseSiteMessage } from '@/lib/bridge';
import { isExternal, pathFromLink, SITE_URL, tabForPath } from '@/lib/links';

describe('bridge messages', () => {
  test('valid messages pass, as strings or objects', () => {
    expect(parseSiteMessage('{"type":"cart","count":3}')).toEqual({ type: 'cart', count: 3 });
    expect(parseSiteMessage({ type: 'route', path: '/product/monstera', title: 'Monstera', canGoBack: true })).toEqual({
      type: 'route',
      path: '/product/monstera',
      title: 'Monstera',
      canGoBack: true,
    });
    expect(parseSiteMessage({ type: 'notify', title: 'Shipped', body: 'On its way', delaySec: 12, path: '/account' })).toEqual({
      type: 'notify',
      title: 'Shipped',
      body: 'On its way',
      delaySec: 12,
      path: '/account',
    });
  });

  test('untrusted input is rejected or clamped', () => {
    expect(parseSiteMessage('not json')).toBeNull();
    expect(parseSiteMessage({ type: 'eval', code: 'x' })).toBeNull();
    expect(parseSiteMessage({ type: 'route', path: 'javascript:alert(1)', title: 'x' })).toBeNull();
    expect(parseSiteMessage({ type: 'share', title: 'x', url: 'http://insecure.example' })).toBeNull();
    expect(parseSiteMessage({ type: 'cart', count: -2 })).toBeNull();
    expect(parseSiteMessage({ type: 'cart', count: 500 })).toEqual({ type: 'cart', count: 99 });
    expect(parseSiteMessage({ type: 'notify', title: 'a', body: 'b', delaySec: 99999, path: 'https://evil' })).toEqual({
      type: 'notify',
      title: 'a',
      body: 'b',
      delaySec: 3600,
      path: undefined,
    });
  });
});

describe('links', () => {
  test('pages of the site stay in the app, everything else opens outside', () => {
    expect(isExternal(SITE_URL + '#/shop')).toBe(false);
    expect(isExternal('https://neomaverick1.github.io/wrapt/site/img/hero.jpg')).toBe(false);
    expect(isExternal('https://neomaverick1.github.io/other-project/')).toBe(true);
    expect(isExternal('https://en.wikipedia.org/wiki/Houseplant')).toBe(true);
    expect(isExternal('mailto:hello@example.com')).toBe(true);
    expect(isExternal('about:blank')).toBe(false);
  });

  test('deep links and shared links map to pages', () => {
    expect(pathFromLink('wrapt://product/monstera')).toBe('/product/monstera');
    expect(pathFromLink('wrapt:///cart')).toBe('/cart');
    expect(pathFromLink(SITE_URL + '#/product/zz-plant')).toBe('/product/zz-plant');
    expect(pathFromLink(SITE_URL)).toBe('/');
    expect(pathFromLink('https://example.com/#/cart')).toBeNull();
  });

  test('pages map to native tabs', () => {
    expect(tabForPath('/')).toBe('home');
    expect(tabForPath('/care')).toBe('home');
    expect(tabForPath('/product/monstera')).toBe('shop');
    expect(tabForPath('/shop/easy')).toBe('shop');
    expect(tabForPath('/order/JN-123')).toBe('cart');
    expect(tabForPath('/account')).toBe('account');
  });
});
