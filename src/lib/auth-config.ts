/** Auth tunables. Sessions are long-lived AND sliding: 90 days of inactivity
 *  is a logout; any write (invoice/profile save) refreshes the window.
 */
export const COOKIE_NAME = 'jaryan_session';
export const SESSION_DAYS = 90;
/** Refresh the window when less than this many days remain. */
export const REFRESH_THRESHOLD_DAYS = 45;
export const LOGIN_MAX_ATTEMPTS = 10;
export const LOGIN_WINDOW_MS = 10 * 60 * 1000;
