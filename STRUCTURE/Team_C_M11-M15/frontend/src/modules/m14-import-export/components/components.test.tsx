// M14 Frontend — Component Tests
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../src/components/Common/StatusBadge';
import { ProgressBar } from '../src/components/Common/ProgressBar';

describe('Common Components', () => {
  it('StatusBadge renders status text', () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText('COMPLETED')).toBeDefined();
  });

  it('ProgressBar calculates percentage', () => {
    render(<ProgressBar current={50} total={100} label="Test" />);
    expect(screen.getByText('50 / 100 (50%)')).toBeDefined();
  });
});
