import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextFloor, FLOOR_MIN_DB } from '../renderer/voice.js';

test('digital silence from noise suppression does not drag the floor below the minimum', () => {
  let floor = -50;
  for (let i = 0; i < 100; i++) floor = nextFloor(floor, -100);
  assert.equal(floor, FLOOR_MIN_DB);
  // so a -52 dB click stays under the trigger (floor + 12 dB; the app default is 16)
  assert.ok(-52 < floor + 12);
});

// Simulate 50 ms ticks: noisy room at -38 dB, then 3 s of speech at -18 dB, then silence again.
function run(levels) {
  let floor = null;
  return levels.map((db) => (floor = floor == null ? db : nextFloor(floor, db)));
}

test('noise floor settles on the room level and barely moves while talking', () => {
  const room = Array(40).fill(-38);
  const speech = Array(60).fill(-18); // 3 s
  const floors = run([...room, ...speech, ...room]);
  const beforeSpeech = floors[39];
  const endOfSpeech = floors[99];
  assert.ok(Math.abs(beforeSpeech - -38) < 0.5);
  assert.ok(endOfSpeech - beforeSpeech < 4, 'floor rose too fast during speech');
  // With a 12 dB margin, speech is detected and silence is not.
  assert.ok(-18 > endOfSpeech + 12);
  assert.ok(-38 < floors.at(-1) + 12);
});
