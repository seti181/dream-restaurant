// Who's who in the sketchbook: how each kind of guest, each member of the team and each special
// guest looks (project.md section 9.5). Guests of a group share their telltale things (tourists'
// sun hats and cameras, students' backpacks, locals' embroidery, office shirts and ties, foodies'
// scarves); `variant` changes their hair and colours so no two look alike.

import type { GroupId } from '../../data/groups';
import type { RegularId } from '../../data/regulars';
import type { Look } from './people';

/** Everyone the restaurant view can show. */
export type SketchKind =
  | GroupId
  | 'critic'
  | 'regular'
  | RegularId
  | 'walesa'
  | 'guard'
  | 'footballer'
  | 'musician'
  | 'waiter'
  | 'tomek'
  | 'adrian'
  | 'chef';

type Hair = [colour: string, style: Look['hairStyle']];

const SKINS = ['skin', 'skin2', 'skin', '#d9a27f', 'skin', 'skin2'];

const GROUP_HAIR: Record<GroupId, Hair[]> = {
  tourists: [['#e3c07a', 'braid'], ['#8a5233', 'short'], ['#f1d9a0', 'long'], ['#b5452f', 'bob']],
  students: [['#2b2230', 'curly'], ['#b5452f', 'long'], ['#4a3426', 'spiky'], ['#2e2a33', 'bun']],
  locals: [['#8a5233', 'short'], ['#e2ddd6', 'bun'], ['#4a3426', 'bob'], ['#d9d6cf', 'bald']],
  office: [['#2e2a33', 'short'], ['#6b3d24', 'bob'], ['#c99a45', 'short'], ['#4a3426', 'long']],
  foodies: [['#b04a2f', 'bob'], ['#2e2a33', 'short'], ['#e8c06a', 'bun'], ['#4a3426', 'curly']],
};

const GROUP_TOPS: Record<GroupId, string[]> = {
  tourists: ['yellow', '#f08a6a', '#8ec5e0', '#fffaf0'],
  students: ['purple', 'green', '#3b4a7a', '#a5464e'],
  locals: ['green', 'blue', 'red', '#c9963a'],
  office: ['#eef2f7', '#cfe0f0', '#f4ece0', '#e3e8ee'],
  foodies: ['red', '#c9963a', '#3f8a7a', '#3a3236'],
};

const GROUP_LEGS: Record<GroupId, string[]> = {
  tourists: ['#d8c79a', 'blue', '#c9b48a', '#55678a'],
  students: ['#2f3a52', '#3b4252', 'blue', '#2f3a52'],
  locals: ['#55678a', 'purple', '#4a4a55', '#5e4632'],
  office: ['#3b4252', '#2e2a33', '#4a4a55', '#3b4252'],
  foodies: ['black', '#5e4632', 'black', '#3b4252'],
};

/** Each guest group's colour, for the bars in the day's numbers. */
export const GROUP_COLOURS: Record<GroupId, string> = {
  tourists: '#e9a23b',
  students: '#4f9a4a',
  locals: '#b5452f',
  office: '#7fb2d3',
  foodies: '#7b4f9d',
};

/** How many looks each group has: hair, tops, trousers and hats mixed differently. */
export const GROUP_LOOKS = 8;

function guest(group: GroupId, variant: number): Look {
  const v = variant % GROUP_LOOKS;
  const n = v % 4;
  const [hair, hairStyle] = GROUP_HAIR[group][n];
  const look: Look = {
    skin: SKINS[v % SKINS.length],
    hair,
    hairStyle,
    top: GROUP_TOPS[group][(v >> 1) % 4],
    legs: GROUP_LEGS[group][(v + 1) % 4],
  };
  switch (group) {
    case 'tourists': {
      // A sun hat, a cap or nothing at all; a camera always.
      const hat = v % 3 === 0 ? 'straw' : v % 3 === 1 ? 'cap' : undefined;
      return { ...look, hat, hatColour: hat === 'cap' ? ['blue', 'red', 'green'][v % 3] : undefined, extras: ['camera'], pattern: v === 0 || v === 5 ? 'flowers' : v === 3 ? 'stripes' : undefined };
    }
    case 'students':
      return { ...look, extras: ['backpack'], pattern: v % 3 === 1 ? 'stripes' : undefined, glasses: v === 6 };
    case 'locals':
      // Families from round the corner: Kashubian embroidery, and a headscarf or a cap for the older ones.
      return {
        ...look,
        pattern: 'flowers',
        hat: n === 1 ? 'scarf' : n === 0 ? 'cap' : undefined,
        glasses: n === 1 || n === 3,
        moustache: n === 0 || n === 3,
      };
    case 'office':
      return { ...look, extras: v % 3 === 2 ? ['lanyard'] : ['tie'], glasses: n !== 2, pattern: 'buttons' };
    case 'foodies':
      return { ...look, extras: v % 4 === 3 ? [] : ['scarf'], hat: v % 2 === 0 ? 'beret' : undefined, hatColour: v === 4 ? 'red' : undefined, pattern: v % 3 === 1 ? 'check' : undefined };
  }
}

/** Hair for the team, so no two people look alike: `variant` is their employee number. */
const STAFF_HAIR: Hair[] = [
  ['#4a2a18', 'short'],
  ['#c9c4bd', 'bun'],
  ['#e8c06a', 'bob'],
  ['#8a5233', 'short'],
  ['#2e2a33', 'long'],
  ['#b5452f', 'short'],
];

export function lookFor(kind: SketchKind, variant = 0): Look {
  switch (kind) {
    case 'waiter': {
      const [hair, hairStyle] = STAFF_HAIR[variant % STAFF_HAIR.length];
      return { skin: SKINS[(variant + 1) % SKINS.length], hair, hairStyle, top: 'black', legs: 'black', apron: 'white', moustache: variant % 3 === 0 && hairStyle === 'short' };
    }
    case 'tomek':
      // Bald, and always happy; a splash of kompot on his shirt.
      return { skin: 'skin', hair: '#c9a27f', hairStyle: 'bald', top: 'black', legs: 'black', apron: 'white', face: 'beaming', extras: ['stain'] };
    case 'adrian':
      return { skin: 'skin', hair: '#c99a45', hairStyle: 'spiky', top: 'black', legs: 'black', apron: 'white', face: 'adrian' };
    case 'chef': {
      const [hair, hairStyle] = STAFF_HAIR[variant % STAFF_HAIR.length];
      return { skin: SKINS[(variant + 2) % SKINS.length], hair, hairStyle: hairStyle === 'long' ? 'bun' : hairStyle, top: 'white', legs: 'black', hat: 'toque', apron: 'white', pattern: 'buttons' };
    }
    case 'critic':
      return { skin: 'skin', hair: '#c9c4bd', hairStyle: 'short', top: '#2e2a33', legs: '#2e2a33', hat: 'beret', glasses: true, extras: ['notebook', 'scarf'] };
    case 'regular':
      // The Friday regular who always asks for cytrynówka: a sunny yellow shirt and a flat cap.
      return { skin: 'skin2', hair: '#55545e', hairStyle: 'short', top: '#f4d03f', legs: '#a08a6a', hat: 'flatcap', moustache: true, pattern: 'buttons' };
    case 'filip':
      return { skin: 'skin', hair: '#3a2a20', hairStyle: 'short', top: '#6a7480', legs: '#3f5f8a', glasses: true, extras: ['lanyard'] };
    case 'fletcher':
      return { skin: '#f4b39a', hair: '#d9c08a', hairStyle: 'short', top: 'red', legs: '#c9b48a', hat: 'bucket', extras: ['camera'] };
    case 'henryk':
      return { skin: 'skin', hair: '#e6e2da', hairStyle: 'short', top: '#2f4a6b', legs: '#4a4a55', hat: 'flatcap', hatColour: '#2f4a6b', moustache: true };
    case 'weronika':
      return { skin: 'skin', hair: '#d0607a', hairStyle: 'long', top: '#e0b84a', legs: '#3f5f8a', extras: ['paint'] };
    case 'walesa':
      return { skin: 'skin', hair: '#d9d6cf', hairStyle: 'short', top: '#4a4a55', legs: '#4a4a55', moustache: true, extras: ['shirt', 'badge'] };
    case 'guard':
      return { skin: 'skin2', hair: '#7a5a3e', hairStyle: 'short', top: '#1f1c23', legs: '#1f1c23', glasses: 'dark', extras: ['shirt', 'earpiece'] };
    case 'musician':
      // The accordion player on live-music nights: a flat cap, a blue jumper and a grey moustache.
      return { skin: 'skin', hair: '#9a948c', hairStyle: 'short', top: '#2f5f86', legs: '#3b3a44', hat: 'flatcap', moustache: true, extras: ['scarf'] };
    case 'footballer':
      return { skin: '#d9a27f', hair: '#4a3426', hairStyle: 'short', top: '#1f7a3a', legs: '#ffffff', pattern: 'stripes' };
    default:
      return guest(kind, variant);
  }
}
