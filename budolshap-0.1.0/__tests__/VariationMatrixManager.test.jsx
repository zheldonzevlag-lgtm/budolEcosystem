import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VariationMatrixManager from '../components/admin/VariationMatrixManager';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('react-hot-toast', () => ({
  toast: {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus">Plus</span>,
  Trash2: () => <span data-testid="icon-trash">Trash2</span>,
  Image: () => <span data-testid="icon-image">ImageIcon</span>,
  Check: () => <span data-testid="icon-check">Check</span>,
  X: () => <span data-testid="icon-x">X</span>,
  Eye: () => <span data-testid="icon-eye">EyeIcon</span>,
  Loader2: () => <span data-testid="icon-loader">Loader2</span>,
  Wand2: () => <span data-testid="icon-wand">Wand2</span>,
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

// Mock fetch
global.fetch = jest.fn();

describe('VariationMatrixManager', () => {
  const mockInitialData = {
    tier_variations: [
      { name: 'Color', options: ['Red', 'Blue'] },
    ],
    variation_matrix: [
      {
        sku: 'TEST-RED',
        tier_index: [0],
        price: 100,
        mrp: 120,
        stock: 10,
        image: new File(['(⌐□_□)'], 'test.png', { type: 'image/png' }),
      },
      {
        sku: 'TEST-BLUE',
        tier_index: [1],
        price: 100,
        mrp: 120,
        stock: 10,
        image: null,
      },
    ],
    parent_sku: 'TEST',
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial data', () => {
    render(<VariationMatrixManager initialData={mockInitialData} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('Variation Matrix')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TEST-RED')).toBeInTheDocument();
  });

  it('opens preview modal on eye icon click and removes background', async () => {
    render(<VariationMatrixManager initialData={mockInitialData} onUpdate={mockOnUpdate} />);
    
    // Find the eye icon
    const eyeIcons = screen.getAllByTestId('icon-eye');
    expect(eyeIcons.length).toBeGreaterThan(0);
    
    // Click the first eye icon (corresponding to TEST-RED which has an image)
    fireEvent.click(eyeIcons[0].parentElement);
    
    // Verify modal opens
    expect(screen.getByText('Variant Image Preview')).toBeInTheDocument();
    expect(screen.getByText('Remove Background')).toBeInTheDocument();
    
    // Mock fetch response for background removal
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://res.cloudinary.com/demo/image/upload/removed-bg.png' }),
    });

    // Click remove background button
    const removeBgBtn = screen.getByText('Remove Background').closest('button');
    fireEvent.click(removeBgBtn);
    
    // Verify loading state
    expect(screen.getByText('Removing Background...')).toBeInTheDocument();
    
    // Verify fetch call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"removeBackground":true'),
      }));
    });

    // Verify success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Background removed successfully!', expect.any(Object));
    });

    // Verify button state changes to "Background Removed" and is disabled
    expect(screen.getByText('Background Removed')).toBeInTheDocument();
    expect(removeBgBtn).toBeDisabled();

    // Verify modal image updated
    // The image src should now be the new URL
    const previewImage = screen.getByAltText('Preview');
    expect(previewImage).toHaveAttribute('src', 'https://res.cloudinary.com/demo/image/upload/removed-bg.png');
  });
});
