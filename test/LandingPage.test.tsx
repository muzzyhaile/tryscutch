import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingPage } from '../components/LandingPage';

describe('LandingPage', () => {
  it('renders the main heading', () => {
    const mockOnStart = () => {};
    render(<LandingPage onStart={mockOnStart} />);
    
    expect(screen.getByText(/AI feedback analysis/i)).toBeInTheDocument();
  });

  it('renders the start button', () => {
    const mockOnStart = () => {};
    render(<LandingPage onStart={mockOnStart} />);
    
    const buttons = screen.getAllByText(/Try it free/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('displays feature cards', () => {
    const mockOnStart = () => {};
    render(<LandingPage onStart={mockOnStart} />);
    
    expect(screen.getByText(/Understand Sentiment/i)).toBeInTheDocument();
    expect(screen.getByText(/Automatic Clustering/i)).toBeInTheDocument();
  });
});
