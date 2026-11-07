/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class HistoryManager<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private maxCapacity: number;

  constructor(maxCapacity = 20) {
    this.maxCapacity = maxCapacity;
  }

  /**
   * Pushes a new state onto the undo stack.
   * Clears the redo stack.
   */
  push(state: T): void {
    this.undoStack.push(state);
    if (this.undoStack.length > this.maxCapacity) {
      this.undoStack.shift(); // Evict oldest
    }
    this.redoStack = [];
  }

  /**
   * Undoes the last action, moving current state to redo stack and returning the previous state.
   */
  undo(currentState: T): T | null {
    if (this.undoStack.length === 0) return null;
    const previous = this.undoStack.pop()!;
    this.redoStack.push(currentState);
    return previous;
  }

  /**
   * Redoes the last undone action, moving current state to undo stack and returning the next state.
   */
  redo(currentState: T): T | null {
    if (this.redoStack.length === 0) return null;
    const next = this.redoStack.pop()!;
    this.undoStack.push(currentState);
    return next;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  size(): { undo: number; redo: number } {
    return { undo: this.undoStack.length, redo: this.redoStack.length };
  }
}
