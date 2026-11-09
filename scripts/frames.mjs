// Genera los 179 cuadros WebP, el póster y el .webm a partir de espejo-app.mp4.
// Uso: npm run frames            (lee public/media/espejo-app.mp4)
//      npm run frames -- ruta/al/video.mp4
// Requiere ffmpeg en el PATH.
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const src = process.argv[2] || 'public/media/espejo-app.mp4';
const out = 'public/media/hero';
if (!existsSync(src)) {
  console.error(`No encuentro ${src}`);
  process.exit(1);
}
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (f.endsWith('.webp')) rmSync(join(out, f));

const run = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

// 179 cuadros 560×1218 a 5 fps, numerados 000–178
run(['-i', src, '-vf', 'fps=5,scale=560:1218:flags=lanczos', '-frames:v', '179', '-c:v', 'libwebp', '-quality', '72', '-start_number', '0', `${out}/%03d.webp`]);
// Póster del primer cuadro
run(['-i', src, '-frames:v', '1', '-q:v', '3', 'public/media/espejo-app.jpg']);
// Versión .webm sin audio
run(['-i', src, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', 'public/media/espejo-app.webm']);

const n = readdirSync(out).filter((f) => f.endsWith('.webp')).length;
console.log(`Listo: ${n} cuadros en ${out}`);
