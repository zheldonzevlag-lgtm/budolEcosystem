import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import LatestProducts from '../components/LatestProducts';
import '@testing-library/jest-dom';

// Mock react-redux useSelector
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('LatestProducts Component - Production Fix Verification', () => {
  it('should show "Loading products..." when isLoading is true', () => {
    // Simulated fixed state (isLoading: true)
    useSelector.mockReturnValue({
      isLoading: true,
      list: [],
    });

    render(<LatestProducts />);
    expect(screen.getByText(/Loading products.../i)).toBeInTheDocument();
  });

  it('should show "No products found" when isLoading is false and list is empty', () => {
    // Simulated fixed state (isLoading: false, list: empty)
    useSelector.mockReturnValue({
      isLoading: false,
      list: [],
    });

    render(<LatestProducts />);
    expect(screen.getByText(/No products found/i)).toBeInTheDocument();
  });

  it('should display products when list is not empty', () => {
    const mockProducts = [
      { id: '1', name: 'Test Product 1', price: 100, images: [] },
    ];
    useSelector.mockReturnValue({
      isLoading: false,
      list: mockProducts,
    });

    render(<LatestProducts />);
    expect(screen.getByText(/Test Product 1/i)).toBeInTheDocument();
  });
});
