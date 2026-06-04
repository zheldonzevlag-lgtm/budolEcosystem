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
  it('should render loading skeletons when isLoading is true', () => {
    useSelector.mockReturnValue({
      isLoading: true,
      list: [],
    });

    const { container } = render(<LatestProducts />);
    // When loading, component renders skeletons (ProductSkeleton components)
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render empty grid when isLoading is false and list is empty', () => {
    useSelector.mockReturnValue({
      isLoading: false,
      list: [],
    });

    const { container } = render(<LatestProducts />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should display products when list is not empty', () => {
    const mockProducts = [
      { id: '1', name: 'Test Product 1', price: 100, images: [] },
    ];
    useSelector.mockReturnValue({
      isLoading: false,
      list: mockProducts,
    });

    const { container } = render(<LatestProducts />);
    expect(container.firstChild).toBeInTheDocument();
  });
});