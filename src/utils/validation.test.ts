import { describe, expect, it } from 'vitest';
import { canFormFixedTeams, canStartGame, validatePlayerName, validateScore } from './validation';
import { makePlayer } from '../test/factories';

describe('validateScore', () => {
  it('rejects a draw', () => {
    expect(validateScore(5, 5)).not.toBeNull();
  });

  it('rejects negative scores', () => {
    expect(validateScore(-1, 3)).not.toBeNull();
  });

  it('rejects missing scores', () => {
    expect(validateScore(null, 3)).not.toBeNull();
  });

  it('accepts a valid, distinct score', () => {
    expect(validateScore(6, 3)).toBeNull();
  });
});

describe('validatePlayerName', () => {
  it('rejects an empty name', () => {
    expect(validatePlayerName('   ', [])).not.toBeNull();
  });

  it('rejects a case-insensitive duplicate', () => {
    const existing = [makePlayer({ name: 'Олена' })];
    expect(validatePlayerName('олена', existing)).not.toBeNull();
  });

  it('allows a player to keep their own name while editing (excludeId)', () => {
    const existing = makePlayer({ id: 'x', name: 'Іван' });
    expect(validatePlayerName('Іван', [existing], 'x')).toBeNull();
  });

  it('accepts a fresh, valid name', () => {
    expect(validatePlayerName('Марія', [])).toBeNull();
  });
});

describe('canStartGame', () => {
  it('requires at least 4 players', () => {
    expect(canStartGame(3, 1)).not.toBeNull();
    expect(canStartGame(4, 1)).toBeNull();
  });

  it('requires at least 1 court', () => {
    expect(canStartGame(8, 0)).not.toBeNull();
  });
});

describe('canFormFixedTeams', () => {
  it('requires an even player count', () => {
    expect(canFormFixedTeams(5)).not.toBeNull();
    expect(canFormFixedTeams(6)).toBeNull();
  });
});
