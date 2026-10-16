import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('soundManager module exists and exports soundManager instance with required cinematic audio methods', () => {
  const soundManagerPath = path.join(ROOT, 'src/soundManager.ts');
  assert.ok(fs.existsSync(soundManagerPath), 'src/soundManager.ts must exist');

  const content = fs.readFileSync(soundManagerPath, 'utf-8');

  // Must include procedural synthesis methods matching cinematic tone
  const requiredMethods = [
    'playStoneSlide',
    'playStoneClick',
    'playStoneSelect',
    'playStoneStrike',
    'playStoneShatter',
    'playKingCrash',
    'toggleMute',
    'setMuted',
    'isMuted',
    'setMasterVolume',
    'getMasterVolume',
    'buildCathedralImpulseResponse'
  ];

  for (const m of requiredMethods) {
    assert.ok(content.includes(m), `soundManager must implement ${m}`);
  }

  // Must include piece mass acoustic variations
  for (const piece of ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn']) {
    assert.ok(content.includes(piece), `soundManager acoustics must account for piece type ${piece}`);
  }
});

test('wizardChessEngine imports and integrates soundManager for piece movement, settling, combat, and shortcuts', () => {
  const enginePath = path.join(ROOT, 'src/wizardChessEngine.js');
  const engineCode = fs.readFileSync(enginePath, 'utf-8');

  // Verify soundManager import
  assert.ok(
    engineCode.includes("import { soundManager } from './soundManager.ts';") ||
    engineCode.includes('import { soundManager } from "./soundManager.ts";'),
    'wizardChessEngine.js must import soundManager'
  );

  // Verify stone slide sound is triggered during move
  assert.ok(
    engineCode.includes('soundManager.playStoneSlide'),
    'wizardChessEngine.js must call soundManager.playStoneSlide'
  );

  // Verify stone click / settling sound is triggered on finish
  assert.ok(
    engineCode.includes('soundManager.playStoneClick'),
    'wizardChessEngine.js must call soundManager.playStoneClick'
  );

  // Verify combat strike and shatter sounds
  assert.ok(
    engineCode.includes('soundManager.playStoneStrike'),
    'wizardChessEngine.js must call soundManager.playStoneStrike during combat'
  );
  assert.ok(
    engineCode.includes('soundManager.playStoneShatter'),
    'wizardChessEngine.js must call soundManager.playStoneShatter during debris explosion'
  );

  // Verify King crash sound during checkmate
  assert.ok(
    engineCode.includes('soundManager.playKingCrash'),
    'wizardChessEngine.js must call soundManager.playKingCrash'
  );

  // Verify M keyboard shortcut and HUD toggle
  assert.ok(
    engineCode.includes("e.code === 'KeyM'"),
    'wizardChessEngine.js must bind KeyM to sound toggle'
  );
  assert.ok(
    engineCode.includes('btn-sound-toggle'),
    'wizardChessEngine.js must wire btn-sound-toggle element'
  );

  // Verify programmatic API exposure on window.wizardChess
  assert.ok(
    engineCode.includes('playStoneSlide:'),
    'window.wizardChess must expose playStoneSlide'
  );
  assert.ok(
    engineCode.includes('playStoneClick:'),
    'window.wizardChess must expose playStoneClick'
  );
});

test('App.tsx contains sound toggle button with valid accessible label and hint', () => {
  const appPath = path.join(ROOT, 'src/App.tsx');
  const appCode = fs.readFileSync(appPath, 'utf-8');

  assert.ok(appCode.includes('id="btn-sound-toggle"'), 'App.tsx must include #btn-sound-toggle button');
  assert.ok(appCode.includes('M: Sound'), 'controls-hint in App.tsx should mention M: Sound shortcut');
});
