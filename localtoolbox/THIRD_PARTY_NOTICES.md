# Third-party notices

LocalToolBox is open source under the MIT License (see `LICENSE`). It builds on the
shoulders of the following open-source projects. Each entry lists what we use it
for. License texts are available in the linked repositories/packages.

## Runtime libraries (bundled)

| Library | Use | License |
|---|---|---|
| [React](https://react.dev) / [ReactDOM](https://react.dev) | UI runtime | MIT |
| [wouter](https://github.com/molefrog/wouter) | Routing | MIT |
| [lucide-react](https://lucide.dev) | Icon set | ISC |
| [clsx](https://github.com/lukeed/clsx) | Class composition | MIT |
| [pdf-lib](https://github.com/Hopding/pdf-lib) | PDF write/modify | MIT |
| [pdfjs-dist](https://github.com/mozilla/pdf.js) | PDF read/render/extract (worker self-hosted) | Apache-2.0 |
| [fflate](https://github.com/101arrowz/fflate) | ZIP create/extract | MIT |
| [heic2any](https://github.com/alexmercerind/heic2any) | HEIC → JPG/PNG | MIT |
| [exifr](https://github.com/MikeKovarik/exifr) | EXIF metadata | MIT |
| [js-yaml](https://github.com/nodeca/js-yaml) | YAML parse/emit | MIT |
| [papaparse](https://github.com/mholt/Papaparse) | CSV parse/emit | MIT |
| [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) | SQL formatting | MIT |
| [marked](https://github.com/markedjs/marked) | Markdown → HTML | MIT |
| [DOMPurify](https://github.com/cure53/DOMPurify) | Sanitizing HTML previews | Apache-2.0 / MPL-2.0 |
| [SheetJS CE (xlsx)](https://docs.sheetjs.com) | Excel → JSON conversion (dynamically imported) | Apache-2.0 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Bcrypt hashing | BSD-3-Clause |
| [otpauth](https://github.com/hectorm/otpauth) | TOTP/HOTP generation | MIT |
| [culori](https://github.com/Evercoder/culori) | Color conversion, contrast, harmonies | MIT |
| [qrcode](https://github.com/soldair/node-qrcode) | QR generation | MIT |
| [JsBarcode](https://github.com/lindell/JsBarcode) | Barcode generation | MIT |
| [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm) + [@ffmpeg/util](https://github.com/ffmpegwasm/ffmpeg.wasm) | Video/audio processing core (single-thread core self-hosted under `public/vendor/ffmpeg/`) | MIT (wrapper); core LGPL-2.1 (ffmpeg build) |
| [@huggingface/transformers](https://github.com/huggingface/transformers.js) (Transformers.js) | On-device AI inference (WebGPU/WASM) | Apache-2.0 |

## Build tooling

| Tool | License |
|---|---|
| [Vite](https://vite.dev) + [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | MIT |
| [Tailwind CSS](https://tailwindcss.com) + [@tailwindcss/vite](https://tailwindcss.com) | MIT |
| [TypeScript](https://www.typescriptlang.org) | Apache-2.0 |

## AI model weights (downloaded on demand, cached in the browser)

| Model | Used by | Size (approx.) | License |
|---|---|---|---|
| [Whisper tiny](https://huggingface.co/onnx-community/whisper-tiny) (ONNX) | Transcribe, Subtitle generator | ~40–75 MB | MIT (OpenAI Whisper) |
| [MODNet](https://huggingface.co/Xenova/modnet) (ONNX, portrait matting) | Background remover | ~28 MB | Apache-2.0 (MODNet) |

Models are fetched from public Hugging Face hubs on first use only, then served
from the browser cache. No image or audio you process is uploaded anywhere.

## ffmpeg.wasm note

The FFmpeg core WebAssembly build shipped in `public/vendor/ffmpeg/` is produced
by the ffmpeg.wasm project (LGPL-2.1, built with `--enable-gpl` disabled). It is
redistributed unmodified from the `@ffmpeg/core` npm package.
