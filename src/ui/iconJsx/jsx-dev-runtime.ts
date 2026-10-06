// The game's JSX while developing: React's own, with emojis shown as drawn icons (see jsx-runtime.ts).

import { jsxDEV as reactJsxDEV } from 'react/jsx-dev-runtime';
import { withIcons } from '../Icon';

export { Fragment } from 'react/jsx-dev-runtime';
export type { JSX } from 'react/jsx-dev-runtime';

type Args = Parameters<typeof reactJsxDEV>;

export function jsxDEV(type: Args[0], props: Args[1], key: Args[2], isStatic: Args[3], source?: Args[4], self?: Args[5]) {
  return reactJsxDEV(type, withIcons(type, props), key, isStatic, source, self);
}
