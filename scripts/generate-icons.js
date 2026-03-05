// Tạo PNG icons cho PWA bằng Node.js thuần (không cần package thêm)
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// CRC32 table
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1)
  crcTable[i] = c
}
function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}
function createChunk(type, data) {
  const typeB = Buffer.from(type)
  const dataB = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const len = Buffer.alloc(4); len.writeUInt32BE(dataB.length)
  const combined = Buffer.concat([typeB, dataB])
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc32(combined))
  return Buffer.concat([len, combined, crcB])
}

function generatePNG(size, bg, fgLetter) {
  // Vẽ nền màu + chữ "Q" đơn giản ở giữa
  const raw = Buffer.alloc((size * 3 + 1) * size)
  const [br, bg2, bb] = bg

  // Tọa độ vẽ chữ Q đơn giản (5x7 pixel bitmap, scale up)
  const letterQ = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,1,0,1],
    [1,0,0,1,1],
    [0,1,1,1,0],
    [0,0,0,0,1],
  ]
  const scale = Math.floor(size / 10)
  const lw = 5 * scale, lh = 7 * scale
  const ox = Math.floor((size - lw) / 2), oy = Math.floor((size - lh) / 2)

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1)
    raw[rowStart] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const offset = rowStart + 1 + x * 3
      // Check se pixel nằm trong chữ Q không
      const lx = x - ox, ly = y - oy
      const inLetter = lx >= 0 && ly >= 0 && lx < lw && ly < lh &&
        letterQ[Math.floor(ly / scale)]?.[Math.floor(lx / scale)] === 1
      if (inLetter) {
        raw[offset] = 255; raw[offset+1] = 255; raw[offset+2] = 255
      } else {
        raw[offset] = br; raw[offset+1] = bg2; raw[offset+2] = bb
      }
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })
  const sig = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0); ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8; ihdrData[9] = 2 // RGB
  return Buffer.concat([sig, createChunk('IHDR', ihdrData), createChunk('IDAT', compressed), createChunk('IEND', Buffer.alloc(0))])
}

const dir = path.join(__dirname, '../public/icons')
fs.mkdirSync(dir, { recursive: true })

// Indigo-600: #4f46e5 = rgb(79, 70, 229)
const color = [79, 70, 229]
for (const size of [72, 96, 128, 144, 152, 192, 384, 512]) {
  const png = generatePNG(size, color)
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), png)
  console.log(`✅ icon-${size}.png`)
}
console.log('Icons created in public/icons/')
