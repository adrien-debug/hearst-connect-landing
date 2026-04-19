'use client';

import { useEffect, useRef } from 'react';

function buildCursorSvg(hex: string, size: number, dot: number, ring: number): string {
  const c = size / 2;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<circle cx='${c}' cy='${c}' r='${dot}' fill='${hex}'/>` +
    `<circle cx='${c}' cy='${c}' r='${ring}' fill='none' stroke='${hex}' stroke-opacity='0.3' stroke-width='1'/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${c} ${c}, auto`;
}

function getAccentHex(): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue('--dashboard-accent').trim() ||
    'var(--dashboard-accent)'
  );
}

const STYLE_ATTR = 'data-hearst-cursor';

function hasCursorStyleElement(): boolean {
  return Boolean(document.querySelector<HTMLStyleElement>(`style[${STYLE_ATTR}]`));
}

function injectCursorStyle(hex: string) {
  const normal = buildCursorSvg(hex, 20, 4, 6);
  const pointer = buildCursorSvg(hex, 24, 5, 8).replace(', auto', ', pointer');

  const css = `
*, *::before, *::after { cursor: ${normal}; }
a, button, [role="button"], input[type="submit"], select, label[for],
.cursor-pointer, [onclick] { cursor: ${pointer} !important; }
`;

  let el = document.querySelector<HTMLStyleElement>(`style[${STYLE_ATTR}]`);
  if (!el) {
    el = document.createElement('style');
    el.setAttribute(STYLE_ATTR, '');
    document.head.appendChild(el);
  }
  el.textContent = css;
}

export function ClickRipple() {
  const lastHex = useRef('');

  useEffect(() => {
    function syncCursor() {
      const hex = getAccentHex();
      if (hex !== lastHex.current || !hasCursorStyleElement()) {
        lastHex.current = hex;
        injectCursorStyle(hex);
      }
    }

    syncCursor();

    const observer = new MutationObserver(syncCursor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
    observer.observe(document.head, {
      childList: true,
    });

    function handleClick(e: MouseEvent) {
      const el = document.createElement('div');
      el.className = 'click-ripple';
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }

    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      observer.disconnect();
    };
  }, []);

  return null;
}
