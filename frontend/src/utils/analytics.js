/**
 * SIRABA ORGANIC™ — Centralized Analytics & Attribution System
 *
 * Provides production-grade tracking for Google Tag Manager (GTM-NQLPMVL7):
 * - Safe dataLayer initialization & push
 * - First-touch & Last-touch UTM and referrer attribution persistence
 * - Client-side virtual page_view tracking (duplicate-protected)
 * - Centralized delegated tel: and mailto: click tracking (duplicate-protected)
 * - Confirmed form_submission and generate_lead conversion tracking
 * - Contextual location data (Browser Timezone & Language only — zero GPS/PII)
 * - Strict privacy compliance (NO user PII: names, emails, phones, messages sent to dataLayer)
 */

const STORAGE_KEYS = {
  FIRST_TOUCH: 'siraba_attr_first_touch',
  LAST_TOUCH: 'siraba_attr_last_touch',
  LANDING_PAGE: 'siraba_attr_landing_page',
};

// In-memory fallback if localStorage is disabled or restricted
const memoryStorage = {};

const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fall back to memory
    }
    return memoryStorage[key] || null;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fall back to memory
    }
    memoryStorage[key] = value;
  },
};

/**
 * Safely push an event to window.dataLayer
 */
export const pushDataLayer = (payload) => {
  try {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Analytics] dataLayer push failed:', error);
    }
  }
};

/**
 * Capture browser contextual metadata (locale & timezone).
 * NOTE: Non-PII and never requests GPS/geolocation permissions.
 */
export const getBrowserContext = () => {
  let timezone = 'Unknown';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  } catch {
    timezone = 'Unknown';
  }

  const language = typeof navigator !== 'undefined' ? (navigator.language || 'Unknown') : 'Unknown';

  return {
    browser_timezone: timezone,
    browser_language: language,
  };
};

/**
 * Parse UTM parameters from a URL search string or current window location
 */
export const parseUtmParams = (searchStr) => {
  const result = {};
  try {
    const query = searchStr || (typeof window !== 'undefined' ? window.location.search : '');
    if (!query) return result;

    const params = new URLSearchParams(query);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    utmKeys.forEach((key) => {
      const val = params.get(key);
      if (val) {
        result[key] = val.trim();
      }
    });
  } catch {
    // Malformed search string
  }
  return result;
};

/**
 * Initialize and update first-touch and last-touch attribution
 */
export const syncAttribution = () => {
  if (typeof window === 'undefined') return;

  try {
    const currentPath = window.location.pathname + window.location.search;
    const referrer = document.referrer || '';
    const utm = parseUtmParams();

    const hasUtm = Object.keys(utm).length > 0;
    const isExternalReferrer = referrer && !referrer.includes(window.location.hostname);

    const touchData = {
      utm_source: utm.utm_source || (isExternalReferrer ? new URL(referrer).hostname : 'direct'),
      utm_medium: utm.utm_medium || (isExternalReferrer ? 'referral' : '(none)'),
      utm_campaign: utm.utm_campaign || '(not set)',
      utm_term: utm.utm_term || '',
      utm_content: utm.utm_content || '',
      referrer: referrer || '',
      landing_page: currentPath,
      timestamp: new Date().toISOString(),
    };

    // First-touch attribution: Set ONCE, never overwrite after established
    const existingFirstTouch = safeStorage.getItem(STORAGE_KEYS.FIRST_TOUCH);
    if (!existingFirstTouch) {
      safeStorage.setItem(STORAGE_KEYS.FIRST_TOUCH, JSON.stringify(touchData));
      safeStorage.setItem(STORAGE_KEYS.LANDING_PAGE, currentPath);
    }

    // Last-touch attribution: Update if incoming session has UTMs or external referral
    const existingLastTouch = safeStorage.getItem(STORAGE_KEYS.LAST_TOUCH);
    if (!existingLastTouch || hasUtm || isExternalReferrer) {
      safeStorage.setItem(STORAGE_KEYS.LAST_TOUCH, JSON.stringify(touchData));
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Analytics] Attribution sync failed:', err);
    }
  }
};

/**
 * Get current first-touch and last-touch attribution snapshot
 */
export const getAttributionSnapshot = () => {
  let firstTouch = null;
  let lastTouch = null;
  let landingPage = '/';

  try {
    const rawFirst = safeStorage.getItem(STORAGE_KEYS.FIRST_TOUCH);
    if (rawFirst) firstTouch = JSON.parse(rawFirst);

    const rawLast = safeStorage.getItem(STORAGE_KEYS.LAST_TOUCH);
    if (rawLast) lastTouch = JSON.parse(rawLast);

    landingPage = safeStorage.getItem(STORAGE_KEYS.LANDING_PAGE) || (typeof window !== 'undefined' ? window.location.pathname : '/');
  } catch {
    // Malformed JSON fallback
  }

  firstTouch = firstTouch || {
    utm_source: 'direct',
    utm_medium: '(none)',
    utm_campaign: '(not set)',
    utm_term: '',
    utm_content: '',
    referrer: '',
  };

  lastTouch = lastTouch || {
    utm_source: 'direct',
    utm_medium: '(none)',
    utm_campaign: '(not set)',
    utm_term: '',
    utm_content: '',
    referrer: '',
  };

  return {
    first_touch_source: firstTouch.utm_source,
    first_touch_medium: firstTouch.utm_medium,
    first_touch_campaign: firstTouch.utm_campaign,
    first_touch_term: firstTouch.utm_term || '',
    first_touch_content: firstTouch.utm_content || '',
    last_touch_source: lastTouch.utm_source,
    last_touch_medium: lastTouch.utm_medium,
    last_touch_campaign: lastTouch.utm_campaign,
    last_touch_term: lastTouch.utm_term || '',
    last_touch_content: lastTouch.utm_content || '',
    landing_page: landingPage,
  };
};

// Duplicate prevention state
let lastTrackedPage = null;
let lastPhoneClickTime = 0;
let lastPhoneClickHref = '';
let lastEmailClickTime = 0;
let lastEmailClickHref = '';
let isGlobalListenerAttached = false;

/**
 * Track client-side virtual page views (React Router)
 * Guarantees exactly ONE page_view event per route transition.
 */
export const trackPageView = (location) => {
  if (typeof window === 'undefined') return;

  try {
    const currentPath = (typeof location === 'object' && location?.pathname)
      ? (location.pathname + (location.search || ''))
      : (window.location.pathname + window.location.search);

    // Prevent duplicate page_view on re-renders for identical path
    if (lastTrackedPage === currentPath) {
      return;
    }
    lastTrackedPage = currentPath;

    // Refresh attribution on route change
    syncAttribution();

    const attribution = getAttributionSnapshot();
    const context = getBrowserContext();

    pushDataLayer({
      event: 'page_view',
      page_path: currentPath,
      page_title: document.title || 'Siraba Organic',
      page_location: window.location.href,
      referrer: document.referrer || '',
      ...attribution,
      ...context,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Analytics] trackPageView failed:', err);
    }
  }
};

/**
 * Track phone number click
 * Emits exactly one `phone_click` event without exposing user personal data.
 */
export const trackPhoneClick = ({ linkUrl, linkText, placement = 'body' }) => {
  try {
    const now = Date.now();
    const cleanHref = (linkUrl || '').trim();

    // Prevent duplicate click events within 500ms
    if (cleanHref === lastPhoneClickHref && now - lastPhoneClickTime < 500) {
      return;
    }
    lastPhoneClickTime = now;
    lastPhoneClickHref = cleanHref;

    const attribution = getAttributionSnapshot();
    const context = getBrowserContext();
    const cleanNumber = cleanHref.replace(/^tel:\s*/i, '').trim();

    pushDataLayer({
      event: 'phone_click',
      phone_number: cleanNumber,
      link_url: cleanHref,
      link_text: (linkText || cleanNumber).slice(0, 50),
      placement: placement || 'body',
      page_path: typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
      ...attribution,
      ...context,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Analytics] trackPhoneClick failed:', err);
    }
  }
};

/**
 * Track email link click
 * Emits exactly one `email_click` event without exposing user personal data.
 */
export const trackEmailClick = ({ linkUrl, linkText, placement = 'body' }) => {
  try {
    const now = Date.now();
    const cleanHref = (linkUrl || '').trim();

    // Prevent duplicate click events within 500ms
    if (cleanHref === lastEmailClickHref && now - lastEmailClickTime < 500) {
      return;
    }
    lastEmailClickTime = now;
    lastEmailClickHref = cleanHref;

    const attribution = getAttributionSnapshot();
    const context = getBrowserContext();
    const cleanEmail = cleanHref.replace(/^mailto:\s*/i, '').split('?')[0].trim();

    pushDataLayer({
      event: 'email_click',
      email_address: cleanEmail,
      link_url: cleanHref,
      link_text: (linkText || cleanEmail).slice(0, 50),
      placement: placement || 'body',
      page_path: typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
      ...attribution,
      ...context,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Analytics] trackEmailClick failed:', err);
    }
  }
};

/**
 * Track confirmed form submission
 * Fires ONLY upon successful backend processing response.
 * Strictly avoids PII (no name, email, phone, personal answers or messages).
 */
export const trackFormSubmission = ({
  formId,
  formName,
  formType = 'general',
  formSubject = '',
  additionalMetadata = {},
}) => {
  try {
    const attribution = getAttributionSnapshot();
    const context = getBrowserContext();

    pushDataLayer({
      event: 'form_submission',
      form_id: formId,
      form_name: formName,
      form_type: formType,
      form_subject: formSubject || undefined,
      page_path: typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
      ...attribution,
      ...context,
      ...additionalMetadata,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Analytics] trackFormSubmission failed:', err);
    }
  }
};

/**
 * Track confirmed business lead generation
 * For qualified lead-generating business inquiries (Contact inquiries, B2B inquiries, Sample requests).
 * Fires alongside form_submission only on confirmed backend success.
 */
export const trackLead = ({
  leadType,
  formId,
  formName,
  additionalMetadata = {},
}) => {
  try {
    const attribution = getAttributionSnapshot();
    const context = getBrowserContext();

    pushDataLayer({
      event: 'generate_lead',
      lead_type: leadType,
      form_id: formId,
      form_name: formName,
      page_path: typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
      ...attribution,
      ...context,
      ...additionalMetadata,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Analytics] trackLead failed:', err);
    }
  }
};

/**
 * Initialize centralized delegated click listener for tel: and mailto: links.
 * Catches all legitimate Siraba phone and email links across current and future components.
 */
export const initGlobalAnalyticsListeners = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (isGlobalListenerAttached) return;

  isGlobalListenerAttached = true;
  syncAttribution();

  document.addEventListener(
    'click',
    (event) => {
      try {
        const target = event.target;
        if (!target) return;

        const anchor = target.closest ? target.closest('a') : null;
        if (!anchor) return;

        const rawHref = anchor.getAttribute('href') || '';
        const href = rawHref.trim();

        if (href.startsWith('tel:')) {
          const placement =
            anchor.getAttribute('data-placement') ||
            (anchor.closest('footer') ? 'footer' : anchor.closest('header, nav') ? 'header' : 'content');

          trackPhoneClick({
            linkUrl: href,
            linkText: anchor.innerText?.trim() || '',
            placement,
          });
        } else if (href.startsWith('mailto:')) {
          const placement =
            anchor.getAttribute('data-placement') ||
            (anchor.closest('footer') ? 'footer' : anchor.closest('header, nav') ? 'header' : 'content');

          trackEmailClick({
            linkUrl: href,
            linkText: anchor.innerText?.trim() || '',
            placement,
          });
        }
      } catch {
        // Silently ignore listener errors
      }
    },
    { capture: true, passive: true }
  );
};
