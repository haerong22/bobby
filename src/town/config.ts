import Phaser from "phaser";

import { GAME_SIZE } from "./constants";
import { BootScene } from "./scenes/BootScene";
import { MapScene } from "./scenes/MapScene";

export function createGameConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_SIZE.w,
    height: GAME_SIZE.h,
    backgroundColor: "#0f1117",
    // 셋 다 필요하다. 하나라도 빠지면 픽셀이 뭉개진다
    // (CSS 쪽 image-rendering: pixelated 는 globals.css 에 있다).
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scene: [BootScene, MapScene],
  };
}
