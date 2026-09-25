'use client';

import { useEffect, useState } from 'react';

const KEY = 'jaryan-theme';

/** Light/dark toggle. Default follows the OS; explicit choice persists.
 *  The inline script in layout <head> applies it pre-paint (no flash).
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('theme-dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('theme-dark', next);
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light');
    } catch {
      /* private mode — ignore */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'روشنایی: حالت روشن' : 'روشنایی: حالت تیره'}
      title={dark ? 'حالت روشن' : 'حالت تیره'}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-lg transition hover:bg-white/20"
    >
      {dark ? '☀' : '🌙'}
    </button>
  );
}
