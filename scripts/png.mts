import { deflateSync, inflateSync } from "node:zlib";

/**
 * 의존성 없는 최소 RGBA PNG 코덱 (8비트, 비인터레이스 전용).
 *
 * 스프라이트 색만 바꾸려고 sharp/canvas 를 깔기는 과하다. PNG 는 시그니처 +
 * 청크 몇 개뿐이고 압축은 node:zlib 이 해 준다.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

export interface Bitmap {
  width: number;
  height: number;
  /** RGBA, 픽셀당 4바이트 */
  pixels: Uint8Array;
}

export function decodePng(file: Buffer): Bitmap {
  const width = file.readUInt32BE(16);
  const height = file.readUInt32BE(20);
  const bitDepth = file[24];
  const colorType = file[25];
  const interlace = file[28];
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(
      `8비트 RGBA 비인터레이스 PNG 만 읽는다 (bitDepth=${bitDepth}, colorType=${colorType}, interlace=${interlace})`,
    );
  }

  const parts: Buffer[] = [];
  let offset = 8;
  while (offset < file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") {
      parts.push(file.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * 4;
  const pixels = new Uint8Array(width * height * 4);
  let previous = new Uint8Array(stride);
  let pos = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos];
    pos += 1;
    const line = new Uint8Array(raw.subarray(pos, pos + stride));
    pos += stride;

    for (let x = 0; x < stride; x += 1) {
      const a = x >= 4 ? line[x - 4]! : 0;
      const b = previous[x]!;
      const c = x >= 4 ? previous[x - 4]! : 0;
      switch (filter) {
        case 1:
          line[x] = (line[x]! + a) & 0xff;
          break;
        case 2:
          line[x] = (line[x]! + b) & 0xff;
          break;
        case 3:
          line[x] = (line[x]! + ((a + b) >> 1)) & 0xff;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          line[x] = (line[x]! + pr) & 0xff;
          break;
        }
        default:
          break;
      }
    }

    pixels.set(line, y * stride);
    previous = line;
  }

  return { width, height, pixels };
}

export function encodePng({ width, height, pixels }: Bitmap): Buffer {
  const stride = width * 4;
  // 스캔라인마다 필터 바이트(0 = None)가 앞에 붙는다.
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(pixels.subarray(y * stride, (y + 1) * stride)).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
