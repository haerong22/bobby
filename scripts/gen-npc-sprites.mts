/**
 * 주민 스프라이트를 플레이어 시트에서 색만 바꿔 만든다. `npm run gen:npc`
 *
 * 다른 캐릭터 팩을 섞으면 화풍이 깨진다. 같은 시트의 머리색과 셔츠색만 바꾸면
 * 프레임 구조(16x24, 6 열 x 8 행)가 그대로라 코드도 손댈 게 없다.
 * 피부·외곽선·바지는 건드리지 않는다 — 전부 바꾸면 사람이 아니라 색덩어리가 된다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodePng, encodePng } from "./png.mts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "public/town/sprites/player.png");

/** 원본 색. 밝은 쪽부터 어두운 쪽 순서이고, 교체색도 같은 순서여야 한다. */
const HAIR = ["6b4630", "5e3a28", "533625", "4b2e20"];
const SHIRT = ["5a9e92", "467b71"];

const VARIANTS: Record<string, { hair: string[]; shirt: string[] }> = {
  "npc-a": {
    hair: ["3a3a42", "33333b", "2c2c33", "26262c"], // 검은 머리
    shirt: ["b05a4a", "8c4439"], // 벽돌색
  },
  "npc-b": {
    hair: ["c9a05a", "b18c4a", "a07b3e", "8a6833"], // 금발
    shirt: ["c9a13f", "a07e2e"], // 머스터드
  },
  "npc-c": {
    hair: ["9aa0a8", "888f97", "787f88", "666c74"], // 희끗한 머리
    shirt: ["8c5aa0", "6e447e"], // 자주
  },
  "npc-d": {
    hair: ["7b4a2e", "6a3f27", "5c3621", "4e2d1b"], // 적갈색
    shirt: ["4a7aa8", "355a80"], // 청색
  },
  "npc-e": {
    hair: ["3f2f44", "362839", "2e222f", "271c28"], // 짙은 보라
    shirt: ["6f8d6a", "52694e"], // 올리브
  },
  "npc-f": {
    hair: ["c4705c", "a85a4a", "8e4b3d", "753d31"], // 주황빛
    shirt: ["e4d9bf", "b7ad95"], // 아이보리
  },
};

const rgb = (hex: string) => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
];

const key = (r: number, g: number, b: number) => `${r},${g},${b}`;

const source = decodePng(readFileSync(SOURCE));

for (const [name, variant] of Object.entries(VARIANTS)) {
  if (variant.hair.length !== HAIR.length || variant.shirt.length !== SHIRT.length) {
    throw new Error(`${name}: 교체색 개수가 원본과 다르다`);
  }

  const map = new Map<string, number[]>();
  HAIR.forEach((from, i) => map.set(key(...(rgb(from) as [number, number, number])), rgb(variant.hair[i]!)));
  SHIRT.forEach((from, i) => map.set(key(...(rgb(from) as [number, number, number])), rgb(variant.shirt[i]!)));

  const pixels = new Uint8Array(source.pixels);
  let swapped = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue;
    const to = map.get(key(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!));
    if (!to) continue;
    pixels[i] = to[0]!;
    pixels[i + 1] = to[1]!;
    pixels[i + 2] = to[2]!;
    swapped += 1;
  }

  if (swapped === 0) {
    throw new Error(`${name}: 바뀐 픽셀이 없다. 원본 색이 달라졌는지 확인할 것`);
  }

  const out = resolve(ROOT, `public/town/sprites/${name}.png`);
  writeFileSync(out, encodePng({ ...source, pixels }));
  console.log(`wrote ${name}.png (${swapped} px 교체)`);
}
