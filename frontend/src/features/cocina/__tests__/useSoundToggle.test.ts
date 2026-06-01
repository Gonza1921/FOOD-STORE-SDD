/**
 * Tests: useSoundToggle (CH-030 — KDS Enhancements)
 *
 * Tests localStorage persistence for KDS sound toggle:
 *   - Default: sound enabled (isMuted = false)
 *   - toggleMute() inverts the state
 *   - Persists to localStorage with key 'kds-sound-enabled'
 *   - Re-hydrates from localStorage on mount
 *   - Cross-tab sync via storage event
 *
 * Uses vi.spyOn for localStorage methods (Storage.prototype).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSoundToggle } from '../hooks/useSoundToggle';

const STORAGE_KEY = 'kds-sound-enabled';

// ===========================================================================
// Setup / Teardown
// ===========================================================================

beforeEach(() => {
  localStorage.clear();
});

// ===========================================================================
// Tests
// ===========================================================================

describe('useSoundToggle', () => {
  // -----------------------------------------------------------------------
  // Default state
  // -----------------------------------------------------------------------

  describe('default state', () => {
    it('defaults to not muted (sound enabled) when localStorage is empty', () => {
      const { result } = renderHook(() => useSoundToggle());

      // Default: sound enabled → isMuted = false
      expect(result.current.isMuted).toBe(false);
    });

    it('reads existing localStorage value: sound enabled', () => {
      localStorage.setItem(STORAGE_KEY, 'true');

      const { result } = renderHook(() => useSoundToggle());

      // 'true' → enabled → isMuted = false
      expect(result.current.isMuted).toBe(false);
    });

    it('reads existing localStorage value: sound disabled', () => {
      localStorage.setItem(STORAGE_KEY, 'false');

      const { result } = renderHook(() => useSoundToggle());

      // 'false' → not enabled → isMuted = true
      expect(result.current.isMuted).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // toggleMute
  // -----------------------------------------------------------------------

  describe('toggleMute()', () => {
    it('toggles isMuted from false to true', () => {
      const { result } = renderHook(() => useSoundToggle());

      expect(result.current.isMuted).toBe(false);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);
    });

    it('toggles isMuted from true to false', () => {
      localStorage.setItem(STORAGE_KEY, 'false'); // start muted
      const { result } = renderHook(() => useSoundToggle());

      expect(result.current.isMuted).toBe(true);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // localStorage persistence
  // -----------------------------------------------------------------------

  describe('localStorage persistence', () => {
    it('persists muted state to localStorage after toggle', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const { result } = renderHook(() => useSoundToggle());

      act(() => {
        result.current.toggleMute(); // isMuted → true
      });

      expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, 'false');

      setItemSpy.mockRestore();
    });

    it('persists unmuted state to localStorage after double toggle', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const { result } = renderHook(() => useSoundToggle());

      act(() => {
        result.current.toggleMute(); // isMuted → true, stored 'false'
      });

      act(() => {
        result.current.toggleMute(); // isMuted → false, stored 'true'
      });

      // Last call should store 'true' (sound enabled)
      const calls = setItemSpy.mock.calls.filter(
        (call) => call[0] === STORAGE_KEY,
      );
      expect(calls[calls.length - 1]).toEqual([STORAGE_KEY, 'true']);

      setItemSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // Re-hydration from localStorage
  // -----------------------------------------------------------------------

  describe('re-hydration from localStorage', () => {
    it('rehydrates muted state from localStorage on mount', () => {
      localStorage.setItem(STORAGE_KEY, 'false'); // sound disabled
      const { result } = renderHook(() => useSoundToggle());

      expect(result.current.isMuted).toBe(true);
    });

    it('rehydrates unmuted state from localStorage on mount', () => {
      localStorage.setItem(STORAGE_KEY, 'true'); // sound enabled
      const { result } = renderHook(() => useSoundToggle());

      expect(result.current.isMuted).toBe(false);
    });

    it('uses default (enabled) when localStorage has invalid value', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid');
      const { result } = renderHook(() => useSoundToggle());

      // 'invalid' !== 'true' → enabled = false → isMuted = true
      expect(result.current.isMuted).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Cross-tab sync (storage event)
  // -----------------------------------------------------------------------

  describe('cross-tab sync', () => {
    it('updates isMuted when another tab changes localStorage', () => {
      const { result } = renderHook(() => useSoundToggle());

      // Simulate another tab changing the value to 'false' (sound disabled)
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: 'false',
          }),
        );
      });

      expect(result.current.isMuted).toBe(true);
    });

    it('updates isMuted when another tab enables sound', () => {
      localStorage.setItem(STORAGE_KEY, 'false'); // start muted
      const { result } = renderHook(() => useSoundToggle());

      expect(result.current.isMuted).toBe(true);

      // Simulate another tab enabling sound
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: 'true',
          }),
        );
      });

      expect(result.current.isMuted).toBe(false);
    });

    it('defaults to enabled when storage event newValue is null', () => {
      const { result } = renderHook(() => useSoundToggle());

      // Simulate another tab clearing the value
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: null,
          }),
        );
      });

      // null → default (true) → enabled → isMuted = false
      expect(result.current.isMuted).toBe(false);
    });

    it('ignores storage events for other keys', () => {
      const { result } = renderHook(() => useSoundToggle());

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'some-other-key',
            newValue: 'false',
          }),
        );
      });

      // Should remain unchanged (default: enabled)
      expect(result.current.isMuted).toBe(false);
    });
  });
});
