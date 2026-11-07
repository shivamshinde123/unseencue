// Head follow: pause when you look away from the screen.
// MediaPipe Face Landmarker runs locally (model bundled in models/). We compare where the nose sits
// between the cheeks (left/right turn) and between forehead and chin (up/down tilt) against a
// baseline captured while you look at the screen (the countdown, or when head follow is switched on).
import { FaceLandmarker, FilesetResolver } from '../node_modules/@mediapipe/tasks-vision/vision_bundle.mjs';

const NOSE = 1, LEFT = 234, RIGHT = 454, TOP = 10, CHIN = 152;
let landmarker = null;

export async function loadLandmarker() {
  if (landmarker) return landmarker;
  const files = await FilesetResolver.forVisionTasks('app://bundle/node_modules/@mediapipe/tasks-vision/wasm');
  landmarker = await FaceLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: 'app://bundle/models/face_landmarker.task', delegate: 'CPU' },
    runningMode: 'VIDEO',
    numFaces: 1,
  });
  return landmarker;
}

export function headPose(lm) {
  const n = lm[NOSE], l = lm[LEFT], r = lm[RIGHT], t = lm[TOP], c = lm[CHIN];
  return { x: (n.x - l.x) / (r.x - l.x), y: (n.y - t.y) / (c.y - t.y) };
}

export class CameraBusyError extends Error {}

export async function startHead(video, opts, onLooking) {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined, width: 640, height: 480 },
    });
  } catch (e) {
    if (e.name === 'NotReadableError' || e.name === 'AbortError') throw new CameraBusyError('Camera is in use by another app');
    throw e;
  }
  video.srcObject = stream;
  await video.play();
  const fl = await loadLandmarker();

  let baseline = null;
  let samples = [];
  let calibrating = true;
  let looking = true;
  let pending = null; // debounce: state must hold 300 ms before we flip
  let pendingSince = 0;

  const timer = setInterval(() => {
    if (video.readyState < 2) return;
    const res = fl.detectForVideo(video, performance.now());
    const lm = res.faceLandmarks?.[0];
    const pose = lm ? headPose(lm) : null;

    if (calibrating) {
      if (pose) samples.push(pose);
      if (samples.length >= 8) {
        baseline = {
          x: samples.reduce((a, p) => a + p.x, 0) / samples.length,
          y: samples.reduce((a, p) => a + p.y, 0) / samples.length,
        };
        calibrating = false;
      }
      return;
    }

    const now = pose && baseline && Math.abs(pose.x - baseline.x) < opts.sensitivity && Math.abs(pose.y - baseline.y) < opts.sensitivity;
    if (now === looking) { pending = null; return; }
    if (pending !== now) { pending = now; pendingSince = performance.now(); return; }
    if (performance.now() - pendingSince > 300) onLooking((looking = now));
  }, 100);

  return {
    update(o) { opts = o; },
    // Call while the user is looking at the screen.
    calibrate() { samples = []; calibrating = true; },
    stop() {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}
