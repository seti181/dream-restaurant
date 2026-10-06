// The game's JSX (set in vite.config.ts and tsconfig.json): React's own, except that any emoji in an
// element's text is shown as the game's drawn icon (see withIcons in ../Icon.tsx).

import { jsx as reactJsx, jsxs as reactJsxs } from 'react/jsx-runtime';
import { withIcons } from '../Icon';

export { Fragment } from 'react/jsx-runtime';
export type { JSX } from 'react/jsx-runtime';

export function jsx(type: Parameters<typeof reactJsx>[0], props: Parameters<typeof reactJsx>[1], key?: Parameters<typeof reactJsx>[2]) {
  return reactJsx(type, withIcons(type, props), key);
}

export function jsxs(type: Parameters<typeof reactJsxs>[0], props: Parameters<typeof reactJsxs>[1], key?: Parameters<typeof reactJsxs>[2]) {
  return reactJsxs(type, withIcons(type, props), key);
}
