/**
 * Tests: useAudioAlert (CH-030 — KDS Enhancements)
 *
 * Tests the Web Audio API beep:
 *   - Creates OscillatorNode (800Hz) + GainNode (0.3) with duration 200ms
 *   - No-op when isMuted === true
 *   - Lazy AudioContext creation on first play()
 *   - AudioContext.resume() when suspended (autoplay policy)
 *   - toggleMute inverts mute state
 *
 * Uses vi.stubGlobal to mock AudioContext, OscillatorNode, and GainNode.
 * Uses vi.mock to control useSoundToggle return values.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioAlert } from '../hooks/useAudioAlert';

// ===========================================================================
// Mocks
// ===========================================================================

const { mockUseSoundToggle } = vi.hoisted(() => ({
  mockUseSoundToggle: vi.fn(),
}));

vi.mock('../hooks/useSoundToggle', () => ({
  useSoundToggle: mockUseSoundToggle,
}));

// ===========================================================================
// Fixtures
// ===========================================================================

let mockOscillatorNode: ReturnType<typeof createMockOscillator>;
let mockGainNode: ReturnType<typeof createMockGain>;
let mockAudioContext: ReturnType<typeof createMockAudioContext>;

function createMockOscillator() {
  return {
    type: '',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createMockGain() {
  return {
    gain: { setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
  };
}

function createMockAudioContext() {
  return {
    createOscillator: vi.fn(() => mockOscillatorNode),
    createGain: vi.fn(() => mockGainNode),
    destination: 'mock-destination',
    state: 'running',
    currentTime: 100,
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

// ===========================================================================
// Setup / Teardown
// ===========================================================================

beforeEach(() => {
  mockOscillatorNode = createMockOscillator();
  mockGainNode = createMockGain();
  mockAudioContext = createMockAudioContext();

  vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));

  // Default: sound is enabled (not muted)
  mockUseSoundToggle.mockReturnValue({ isMuted: false, toggleMute: vi.fn() });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ===========================================================================
// Tests
// ===========================================================================

describe('useAudioAlert', () => {
  // -----------------------------------------------------------------------
  // play() — beep generation
  // -----------------------------------------------------------------------

  describe('play()', () => {
    it('creates OscillatorNode at 800Hz', () => {
      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.play();
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(
        800,
        mockAudioContext.currentTime,
      );
    });

    it('creates GainNode with gain 0.3', () => {
      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.play();
      });

      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(
        0.3,
        mockAudioContext.currentTime,
      );
    });

    it('connects oscillator → gain → destination', () => {
      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.play();
      });

      expect(mockOscillatorNode.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(
        mockAudioContext.destination,
      );
    });

    it('calls start() and stop() with 200ms duration', () => {
      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.play();
      });

      expect(mockOscillatorNode.start).toHaveBeenCalledWith(
        mockAudioContext.currentTime,
      );
      expect(mockOscillatorNode.stop).toHaveBeenCalledWith(
        mockAudioContext.currentTime + 0.2,
      );
    });

    it('sets oscillator type to square', () => {
      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.play();
      });

      expect(mockOscillatorNode.type).toBe('square');
    });

    it('creates AudioContext lazily on first play()', () => {
      // AudioContext should NOT be created until play() is called
      const { result } = renderHook(() => useAudioAlert());

      // Before play: AudioContext not created
      expect(vi.mocked(globalThis.AudioContext)).not.toHaveBeenCalled();

      act(() => {
        result.current.play();
      });

      // After play: AudioContext created
      expect(vi.mocked(globalThis.AudioContext)).toHaveBeenCalledTimes(1);
    });

    it('resumes AudioContext when state is suspended', () => {
      mockAudioContext.state = 'suspended';
      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.play();
      });

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('does NOT resume when state is already running', () => {
      mockAudioContext.state = 'running';
      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.play();
      });

      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Mute behavior
  // -----------------------------------------------------------------------

  describe('mute behavior', () => {
    it('is a no-op when isMuted is true', () => {
      mockUseSoundToggle.mockReturnValue({
        isMuted: true,
        toggleMute: vi.fn(),
      });

      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.play();
      });

      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
      expect(mockAudioContext.createGain).not.toHaveBeenCalled();
    });

    it('works when isMuted is false', () => {
      mockUseSoundToggle.mockReturnValue({
        isMuted: false,
        toggleMute: vi.fn(),
      });

      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.play();
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // toggleMute
  // -----------------------------------------------------------------------

  describe('toggleMute', () => {
    it('delegates to useSoundToggle toggleMute', () => {
      const toggleMuteMock = vi.fn();
      mockUseSoundToggle.mockReturnValue({
        isMuted: false,
        toggleMute: toggleMuteMock,
      });

      const { result } = renderHook(() => useAudioAlert());

      act(() => {
        result.current.toggleMute();
      });

      expect(toggleMuteMock).toHaveBeenCalledTimes(1);
    });

    it('reflects the isMuted state from useSoundToggle', () => {
      mockUseSoundToggle.mockReturnValue({
        isMuted: true,
        toggleMute: vi.fn(),
      });

      const { result } = renderHook(() => useAudioAlert());

      expect(result.current.isMuted).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  describe('cleanup', () => {
    it('closes AudioContext on unmount', () => {
      const { unmount } = renderHook(() => useAudioAlert());

      // First play creates AudioContext
      // (we need to call the hook's play to trigger AudioContext creation)
      // Actually, AudioContext is created lazily on play() — we don't need
      // to test AudioContext cleanup from play, just the unmount cleanup.

      unmount();

      // Since AudioContext was never created (no play() call),
      // close should NOT have been called
      // (the cleanup effect checks audioContextRef.current)
      expect(mockAudioContext.close).not.toHaveBeenCalled();
    });

    it('closes AudioContext on unmount after play()', () => {
      const { result, unmount } = renderHook(() => useAudioAlert());

      // Trigger lazy AudioContext creation
      act(() => {
        result.current.play();
      });

      unmount();

      expect(mockAudioContext.close).toHaveBeenCalledTimes(1);
    });
  });
});
