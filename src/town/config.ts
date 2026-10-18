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
      // FIT 은 캔버스를 통째로 늘려서, 모니터가 클수록 확대돼 보이고
      // 보이는 마을 범위는 그대로였다. RESIZE 는 캔버스를 창과 1:1 로 두므로
      // 화면이 넓어지면 마을이 더 많이 보인다. 확대 정도는 카메라 zoom 이 정한다.
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scene: [BootScene, MapScene],
  };
}
