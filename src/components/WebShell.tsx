import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface WebShellHandle {
  navigate: (path: string) => void;
  goBack: () => void;
  reload: () => void;
}

export interface WebShellProps {
  onMessage: (raw: unknown) => void;
  onProgress: (p: number) => void;
  onError: () => void;
  onLoaded: () => void;
}

/** Where the site lives next to this web preview: the app is served at <base>, the site at <base>site/. */
export function previewSiteUrl(): string {
  const entry = document.querySelector<HTMLScriptElement>('script[src*="/_expo/static/js/web/"]');
  const base = entry ? entry.src.split('/_expo/')[0] + '/' : `${location.origin}/`;
  return `${base}site/?app=web`;
}

/**
 * Web preview of the app: the same website in an iframe and the same bridge over postMessage,
 * so the native shell can be tried in a browser.
 */
export const WebShell = forwardRef<WebShellHandle, WebShellProps>(function WebShell({ onMessage, onProgress, onLoaded }, ref) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const send = (msg: object) => frame.current?.contentWindow?.postMessage({ wraptCmd: msg }, window.location.origin);

  useImperativeHandle(ref, () => ({
    navigate: (path: string) => send({ type: 'navigate', path }),
    goBack: () => frame.current?.contentWindow?.history.back(),
    reload: () => frame.current?.contentWindow?.location.reload(),
  }));

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (
        e.source === frame.current?.contentWindow &&
        e.origin === window.location.origin &&
        e.data &&
        typeof e.data === 'object' &&
        'wrapt' in e.data
      )
        onMessage(e.data.wrapt);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onMessage]);

  return createElement('iframe', {
    ref: frame,
    src: previewSiteUrl(),
    title: 'Juniper & Co.',
    style: { border: 0, width: '100%', height: '100%', display: 'block', background: '#F7F3EC' },
    onLoad: () => {
      onProgress(1);
      send({ type: 'hello', platform: 'web' });
      onLoaded();
    },
  });
});
