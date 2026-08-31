/**
 * The world palette. Cool Gen 5 (Black/White) sensibility: plum-tinted
 * near-black outlines, cool shadows, balanced saturation.
 *
 * Every colour in the game world comes from here. No renderer may use a
 * colour literal — that invariant is what keeps the world looking like one
 * place instead of seven separately-drawn ones.
 */
export const PAL = Object.freeze({
  // Outline — tinted near-black, never pure #000
  out: "#2b1f2e",

  // Roof ramp
  roofL: "#e08a78",
  roof: "#c1554b",
  roofD: "#9c3f3e",
  roofX: "#6e2c33",

  // Wall / stucco ramp
  wallL: "#f7efd8",
  wall: "#e8d9b8",
  wallD: "#c9b392",
  wallX: "#a08a68",

  // Timber
  wood: "#6b4630",
  woodL: "#8a5f42",
  woodD: "#43291c",

  // Stone
  stoneL: "#b9b2a4",
  stone: "#948d80",
  stoneD: "#6d675c",

  // Glass
  glassL: "#d3eef7",
  glass: "#7fc4d9",
  glassD: "#4a8ba8",

  // Door
  door: "#8a5a3c",
  doorL: "#a97449",
  doorD: "#5e3a26",

  // Metal / brass
  gold: "#e8c15c",
  goldD: "#b08a33",

  // Foliage
  leaf: "#5f9e4a",
  leafD: "#3f7233",
  bloom: "#e56b6b",
  bloom2: "#f0a5c0",

  // Ground — softened from the old #bef264/#22541d range
  grassL: "#92c973",
  grass: "#7cb85f",
  grassD: "#6fae54",
  grassX: "#5d9647",
  grassS: "#4a7d37",

  // Tall grass reads darker than the lawn
  tallL: "#63a54e",
  tall: "#4c8a3c",
  tallD: "#3d7030",

  // Paths
  pathL: "#fbf7ea",
  path: "#ede3c2",
  pathD: "#c5b382",

  // Effects
  smoke: "#cdc7c0",
  arcane: "#8fd4f0",
  arcaneD: "#3f7fa8",
} as const);

export type PaletteColor = keyof typeof PAL;
