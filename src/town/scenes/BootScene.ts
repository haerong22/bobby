import Phaser from "phaser";

import { MapScene } from "./MapScene";

/**
 * Phase 1 에는 로드할 에셋이 없어 바로 넘긴다. 타일셋과 스프라이트가 들어오면
 * 여기서 preload 하고 로딩바를 그린다 — 맵 씬이 에셋 없이 시작하지 않게.
 */
export class BootScene extends Phaser.Scene {
  static readonly KEY = "BootScene";

  constructor() {
    super(BootScene.KEY);
  }

  create() {
    this.scene.start(MapScene.KEY);
  }
}
