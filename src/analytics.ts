import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = 'G-EKLE5ZL133';
// Everything but GA is optional: leave the env var unset and that tag never loads.
const META_PIXEL_ID = process.env.REACT_APP_META_PIXEL_ID;
const X_PIXEL_ID = process.env.REACT_APP_X_PIXEL_ID;
const CLARITY_PROJECT_ID = process.env.REACT_APP_CLARITY_PROJECT_ID;

export type AnalyticsEvent = 'sign_up' | 'login' | 'generate_image' | 'begin_checkout' | 'purchase';

// Names are GA4's recommended events. Meta has standard equivalents for the ones its
// ads optimise on; anything else goes to Meta as a custom event.
const META_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  sign_up: 'CompleteRegistration',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
};

// X has no standard event names: each conversion is created in X Ads Manager's
// Events Manager, which hands back an id like `tw-abc12-def34`.
const X_EVENTS: Partial<Record<AnalyticsEvent, string | undefined>> = {
  sign_up: process.env.REACT_APP_X_SIGNUP_EVENT_ID,
  purchase: process.env.REACT_APP_X_PURCHASE_EVENT_ID,
};

const loadScript = (src: string): void => {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

/**
 * The vendors' loader snippets, unminified. Each installs a stub that queues calls
 * until the real script arrives and replays them.
 *
 * GA page views are NOT sent from here or from the router: GA4's enhanced measurement
 * already records SPA navigations from history changes, and sending our own as well
 * counted every page twice.
 */
export const initAnalytics = (): void => {
  ReactGA.initialize(GA_MEASUREMENT_ID);
  const w = window as any;

  if (META_PIXEL_ID && !w.fbq) {
    const fbq: any = (...args: unknown[]) =>
      fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args);
    Object.assign(fbq, { push: fbq, loaded: true, version: '2.0', queue: [] });
    w.fbq = w._fbq = fbq;
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    // The pixel records later SPA navigations itself from history changes.
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  if (X_PIXEL_ID && !w.twq) {
    const twq: any = (...args: unknown[]) =>
      twq.exe ? twq.exe.apply(twq, args) : twq.queue.push(args);
    Object.assign(twq, { version: '1.1', queue: [] });
    w.twq = twq;
    loadScript('https://static.ads-twitter.com/uwt.js');
    twq('config', X_PIXEL_ID);
  }

  if (CLARITY_PROJECT_ID && !w.clarity) {
    w.clarity = (...args: unknown[]) => (w.clarity.q = w.clarity.q || []).push(args);
    loadScript(`https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`);
  }
};

/** One call reports a conversion to every tag that's loaded. */
export const track = (name: AnalyticsEvent, params: Record<string, string | number> = {}): void => {
  ReactGA.event(name, params);
  const w = window as any;

  const metaEvent = META_EVENTS[name];
  if (w.fbq) w.fbq(metaEvent ? 'track' : 'trackCustom', metaEvent ?? name, params);

  const xEvent = X_EVENTS[name];
  if (w.twq && xEvent) w.twq('event', xEvent, params);
};
