// What the About overlay needs to know about the visit, kept per session (tab) in sessionStorage.
// Storage can be blocked (private modes…): then nothing opens by itself and no hint shows,
// rather than failing.

const SEEN_KEY = "aboutSeen"; // the About overlay has been shown in this session
const ENTERED_KEY = "siteEntered"; // the session's first page load has happened

export function hasSeenAbout(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return true;
  }
}

export function markAboutSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // nothing to do
  }
}

// Whether the site was entered at its root and asked for nothing in particular: the session's
// first page load, at "/", with no artist (or About) in the address. Only such an entry gets
// About opened by itself: it is a welcome, so it comes when someone arrives, not when they
// move around inside the app, and never over a page they came for (a link to an artist). Call
// it once, when the app starts.
export function enteredSiteAtRoot(): boolean {
  try {
    if (sessionStorage.getItem(ENTERED_KEY) !== null) return false;
    sessionStorage.setItem(ENTERED_KEY, "1");
  } catch {
    return false;
  }
  const url = new URL(window.location.href);
  return (
    url.pathname === "/" &&
    !url.searchParams.has("artist") &&
    !url.searchParams.has("about")
  );
}
