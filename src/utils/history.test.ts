/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { HistoryManager } from './history';

test('HistoryManager correctly tracks undo and redo states', () => {
  const history = new HistoryManager<string>(5);

  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), false);

  history.push('state1');
  assert.equal(history.canUndo(), true);
  assert.equal(history.canRedo(), false);

  history.push('state2');

  // Currently at state3
  const undone = history.undo('state3');
  assert.equal(undone, 'state2');
  assert.equal(history.canRedo(), true);

  const redone = history.redo('state2');
  assert.equal(redone, 'state3');
  assert.equal(history.canRedo(), false);
});

test('HistoryManager respects maximum capacity', () => {
  const history = new HistoryManager<number>(3);
  history.push(1);
  history.push(2);
  history.push(3);
  history.push(4); // 1 should be evicted

  assert.equal(history.size().undo, 3);
  const u1 = history.undo(5);
  assert.equal(u1, 4);
  const u2 = history.undo(4);
  assert.equal(u2, 3);
  const u3 = history.undo(3);
  assert.equal(u3, 2);
  const u4 = history.undo(2);
  assert.equal(u4, null); // 1 was evicted!
});
