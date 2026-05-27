/**
 * Tests: UrgenciaBadge (CH-024 — KDS Cocina)
 *
 * Tests the UrgenciaBadge component rendering for each urgency level:
 *   - normal: plain minutes display
 *   - warning: warning indicator with border styling
 *   - urgent: urgent indicator with pulse animation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UrgenciaBadge } from '../components/UrgenciaBadge';

describe('UrgenciaBadge', () => {
  // -----------------------------------------------------------------------
  // Normal urgency
  // -----------------------------------------------------------------------

  describe('normal urgency', () => {
    it('renders minutes text without extra styling', () => {
      render(<UrgenciaBadge seconds={300} urgencyLevel="normal" />);

      const badge = screen.getByText('5 min');
      expect(badge).toBeInTheDocument();
      // Normal badge is a plain <span> — no warning/error classes
      expect(badge.className).not.toContain('warning');
      expect(badge.className).not.toContain('error');
    });

    it('renders 0 min for 0 seconds', () => {
      render(<UrgenciaBadge seconds={0} urgencyLevel="normal" />);

      expect(screen.getByText('0 min')).toBeInTheDocument();
    });

    it('renders correct minutes for non-rounded values (floor)', () => {
      render(<UrgenciaBadge seconds={119} urgencyLevel="normal" />);

      // Math.floor(119 / 60) = 1
      expect(screen.getByText('1 min')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Warning urgency
  // -----------------------------------------------------------------------

  describe('warning urgency', () => {
    it('renders warning indicator with minutes', () => {
      render(<UrgenciaBadge seconds={900} urgencyLevel="warning" />);

      // Minutes text
      expect(screen.getByText('15 min')).toBeInTheDocument();
      // Warning emoji
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('applies warning border and text styling on the container', () => {
      const { container } = render(<UrgenciaBadge seconds={600} urgencyLevel="warning" />);

      // The outer container has the warning classes — query by class prefix
      const outerSpan = container.querySelector('[class*="border-warning"]');
      expect(outerSpan).toBeInTheDocument();
      expect(outerSpan!.className).toContain('text-warning');
    });

    it('renders correct minutes for boundary values', () => {
      render(<UrgenciaBadge seconds={1199} urgencyLevel="warning" />);

      // Math.floor(1199 / 60) = 19
      expect(screen.getByText('19 min')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Urgent urgency
  // -----------------------------------------------------------------------

  describe('urgent urgency', () => {
    it('renders urgent indicator with "min+" format', () => {
      render(<UrgenciaBadge seconds={1500} urgencyLevel="urgent" />);

      // Shows "25+ min" with plus sign
      expect(screen.getByText('25+ min')).toBeInTheDocument();
      // Urgent emoji
      expect(screen.getByText('🚨')).toBeInTheDocument();
    });

    it('applies pulse animation class on the container', () => {
      const { container } = render(<UrgenciaBadge seconds={1200} urgencyLevel="urgent" />);

      const outerSpan = container.querySelector('[class*="animate-pulse-soft"]');
      expect(outerSpan).toBeInTheDocument();
    });

    it('applies error background styling on the container', () => {
      const { container } = render(<UrgenciaBadge seconds={1800} urgencyLevel="urgent" />);

      const outerSpan = container.querySelector('[class*="bg-error"]');
      expect(outerSpan).toBeInTheDocument();
      expect(outerSpan!.className).toContain('text-white');
      expect(outerSpan!.className).toContain('font-bold');
    });

    it('renders correct minutes for high values', () => {
      render(<UrgenciaBadge seconds={3600} urgencyLevel="urgent" />);

      // Math.floor(3600 / 60) = 60
      expect(screen.getByText('60+ min')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  it('renders 10 min for exactly 600 seconds (warning boundary)', () => {
    render(<UrgenciaBadge seconds={600} urgencyLevel="warning" />);

    expect(screen.getByText('10 min')).toBeInTheDocument();
  });

  it('renders 10+ min for exactly 600 seconds (urgent boundary if level is urgent)', () => {
    render(<UrgenciaBadge seconds={600} urgencyLevel="urgent" />);

    // Urgent always shows "min+", even if the minutes count is the same
    expect(screen.getByText('10+ min')).toBeInTheDocument();
  });

  it('renders correctly with large values', () => {
    render(<UrgenciaBadge seconds={9999} urgencyLevel="urgent" />);

    // Math.floor(9999 / 60) = 166
    expect(screen.getByText('166+ min')).toBeInTheDocument();
  });
});
