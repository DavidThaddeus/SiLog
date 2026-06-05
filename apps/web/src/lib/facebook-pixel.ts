const PIXEL_ID = "1540629934350526";

declare global {
  interface Window {
    fbq: (
      type: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq: unknown;
  }
}

export function fbq(
  type: string,
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(type, eventName, params);
  }
}

export function trackPageView() {
  fbq("track", "PageView");
}

export function trackLead() {
  fbq("track", "Lead");
}

export function trackCompleteRegistration() {
  fbq("track", "CompleteRegistration");
}

export function trackPurchase(value: number, currency = "NGN") {
  fbq("track", "Purchase", { value, currency });
}

export const PIXEL_SCRIPT = `
  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init','${PIXEL_ID}');
  fbq('track','PageView');
`.trim();
