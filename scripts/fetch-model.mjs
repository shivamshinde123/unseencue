// Downloads the MediaPipe face landmarker model used by head follow (bundled with the app, runs offline).
import { writeFile, mkdir } from 'node:fs/promises';
const url = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const res = await fetch(url);
if (!res.ok) throw new Error(`Model download failed: ${res.status}`);
await mkdir('models', { recursive: true });
await writeFile('models/face_landmarker.task', Buffer.from(await res.arrayBuffer()));
console.log('Saved models/face_landmarker.task');
