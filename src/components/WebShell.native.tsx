import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

import { isExternal, SITE_URL } from '@/lib/links';
import { colors } from '@/theme';

import type { WebShellHandle, WebShellProps } from './WebShell';

/** The website inside a native WebView, with the bridge wired both ways. */
export const WebShell = forwardRef<WebShellHandle, WebShellProps>(function WebShell({ onMessage, onProgress, onError, onLoaded }, ref) {
  // WebView's type parameter defaults to `undefined`, which collapses its props to `never`; `object` keeps them.
  const view = useRef<WebView<object>>(null);
  const send = (msg: object) =>
    view.current?.injectJavaScript(`window.WraptBridge && window.WraptBridge.receive(${JSON.stringify(msg)});true;`);

  useImperativeHandle(ref, () => ({
    navigate: (path: string) => send({ type: 'navigate', path }),
    goBack: () => view.current?.goBack(),
    reload: () => view.current?.reload(),
  }));

  return (
    <WebView<object>
      ref={view}
      source={{ uri: SITE_URL }}
      style={{ flex: 1, backgroundColor: colors.cream }}
      originWhitelist={['https://*', 'about:*', 'blob:*', 'data:*']}
      injectedJavaScriptBeforeContentLoaded="window.__WRAPT__=true;true;"
      onMessage={(e) => onMessage(e.nativeEvent.data)}
      onLoadProgress={(e) => onProgress(e.nativeEvent.progress)}
      onLoadEnd={() => {
        send({ type: 'hello', platform: Platform.OS });
        onLoaded();
      }}
      onError={() => onError()}
      onHttpError={(e) => {
        if (e.nativeEvent.statusCode >= 500) onError();
      }}
      onShouldStartLoadWithRequest={(req) => {
        if (isExternal(req.url)) {
          Linking.openURL(req.url).catch(() => undefined);
          return false;
        }
        return true;
      }}
      pullToRefreshEnabled
      allowsBackForwardNavigationGestures
      allowFileAccess
      allowsInlineMediaPlayback
      setSupportMultipleWindows={false}
      decelerationRate="normal"
      sharedCookiesEnabled
      domStorageEnabled
      javaScriptEnabled
      cacheEnabled
      cacheMode="LOAD_DEFAULT"
    />
  );
});
