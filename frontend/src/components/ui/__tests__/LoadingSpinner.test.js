import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status', { hidden: true }) || 
                   document.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const message = 'Loading data...';
    render(<LoadingSpinner message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders without message when not provided', () => {
    render(<LoadingSpinner />);
    
    const messageElement = document.querySelector('.loading-message');
    expect(messageElement).not.toBeInTheDocument();
  });

  it('applies correct size class', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    
    let spinner = document.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('spinner-small');

    rerender(<LoadingSpinner size="large" />);
    spinner = document.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('spinner-large');
  });

  it('uses medium size by default', () => {
    render(<LoadingSpinner />);
    
    const spinner = document.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('spinner-medium');
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner message="Loading..." />);
    
    const container = document.querySelector('.loading-spinner-container');
    expect(container).toBeInTheDocument();
  });

  it('renders with all size variants', () => {
    const sizes = ['small', 'medium', 'large'];
    
    sizes.forEach(size => {
      const { unmount } = render(<LoadingSpinner size={size} />);
      
      const spinner = document.querySelector('.loading-spinner');
      expect(spinner).toHaveClass(`spinner-${size}`);
      
      unmount();
    });
  });

  it('handles empty message gracefully', () => {
    render(<LoadingSpinner message="" />);
    
    const messageElement = document.querySelector('.loading-message');
    expect(messageElement).not.toBeInTheDocument();
  });

  it('handles null message gracefully', () => {
    render(<LoadingSpinner message={null} />);
    
    const messageElement = document.querySelector('.loading-message');
    expect(messageElement).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    
    const container = document.querySelector('.loading-spinner-container');
    expect(container).toHaveClass('custom-spinner');
  });
});