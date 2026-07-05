/** Fisher-Yates shuffle. Returns a new array; does not mutate the input. */
export function shuffle<T>(items: readonly T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Non-null assertions are safe here: i and j are always valid in-bounds
    // indices by construction (0 <= j <= i < arr.length).
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

/** Splits an array into consecutive chunks of a fixed size. Drops any remainder. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i + size <= items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}
