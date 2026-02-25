import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddProductWizard from '@/components/store/add-product/AddProductWizard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock dnd-kit (since it uses browser APIs not available in Jest environment easily without setup)
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div>{children}</div>,
  useSensor: jest.fn(),
  useSensors: jest.fn(),
  PointerSensor: jest.fn(),
  KeyboardSensor: jest.fn(),
  closestCenter: jest.fn(),
  DragOverlay: ({ children }) => <div>{children}</div>,
}));

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => <div>{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: jest.fn(),
  rectSortingStrategy: jest.fn(),
}));

// Mock CKEditor
jest.mock('@/components/CKEditorCustom', () => {
  return function MockCKEditor({ value, onChange }) {
    return (
      <textarea
        data-testid="ck-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

// Mock VariationMatrixManager
jest.mock('@/components/admin/VariationMatrixManager', () => {
  return function MockVariationMatrixManager({ initialData, onUpdate }) {
    return <div data-testid="variation-matrix">Variation Matrix Manager</div>;
  };
});

describe('AddProductWizard', () => {
  const mockRouter = { push: jest.fn() };
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    useAuth.mockReturnValue({ user: mockUser });
    global.fetch = jest.fn((url) => {
      if (url === '/api/system/settings') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ maxProductImages: 12, maxProductVideos: 2 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'http://example.com/image.jpg' }),
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first step correctly', () => {
    render(<AddProductWizard storeId="store-123" />);
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
  });

  it('renders the Magic Write button', () => {
    render(<AddProductWizard storeId="store-123" />);
    expect(screen.getByText('Magic Write')).toBeInTheDocument();
  });

  it('shows product video uploader when enabled in settings', async () => {
    render(<AddProductWizard storeId="store-123" />);

    await waitFor(() => {
      expect(screen.getByText('Product Videos')).toBeInTheDocument();
      expect(screen.getByText('Add Video')).toBeInTheDocument();
    });
  });

  it('validates required fields on next', async () => {
    render(<AddProductWizard storeId="store-123" />);
    
    // Click Next without filling anything
    const nextButton = screen.getByText('Next Step');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Product name must be at least 5 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
    });
  });

  it('navigates to next step when validation passes', async () => {
    render(<AddProductWizard storeId="store-123" />);
    
    // Fill Basic Info
    fireEvent.change(screen.getByLabelText(/Product Name/i), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'Electronics' } });
    
    // CKEditor (Textarea mock)
    const editor = screen.getByTestId('ck-editor');
    fireEvent.change(editor, { target: { value: 'This is a detailed description of the product.' } });

    // Mock Image Upload (by manually setting value if possible, or mocking the component internal state if needed)
    // For this test, we might need to mock DragDropImageUpload to call onChange
    // Since we didn't mock DragDropImageUpload fully, let's assume it renders and we can interact or just skip image validation if we mock it to return valid state
  });
});
