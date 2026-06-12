import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useLevels } from './useLevels';

describe('useLevels Custom React Hook (.test.ts)', () => {
  let fetchSpy: any;
  const mockLevelsData = [
    { id: 'lvl-b', name: 'Sonic Wave', rank: 2, difficulty: 'Extreme Demon' },
    { id: 'lvl-a', name: 'Tidal Wave', rank: 1, difficulty: 'Extreme Demon' },
    { id: 'lvl-c', name: 'Bloodlust', rank: 3, difficulty: 'Extreme Demon' }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    
    // Polyfill global fetch if needed, and mock it
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLevelsData)
      } as Response)
    );
  });

  it('should initially start with loading = true and an empty list of levels (before cache is populated)', async () => {
    const { result } = renderHook(() => useLevels());

    expect(result.current.loading).toBe(true);
    expect(result.current.levels).toEqual([]);

    // Wait for async effect cleanup & updates to satisfy reacts hook lifecycle
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should fetch levels from the server API, and sort them strictly based on rank', async () => {
    const { result } = renderHook(() => useLevels());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/levels');
    
    // Check sorted rank order (1 -> 2 -> 3)
    expect(result.current.levels).toHaveLength(3);
    expect(result.current.levels[0].name).toBe('Tidal Wave'); // Rank 1
    expect(result.current.levels[1].name).toBe('Sonic Wave'); // Rank 2
    expect(result.current.levels[2].name).toBe('Bloodlust');  // Rank 3
  });
});
