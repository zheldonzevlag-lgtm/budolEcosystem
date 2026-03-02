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

// Mock next/dynamic to return a simple textarea for CKEditorCustom
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: jest.fn(() => {
    const MockedComponent = ({ value, onChange, placeholder }) => (
      <textarea
        data-testid="ck-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    );
    MockedComponent.displayName = 'CKEditorCustom';
    return MockedComponent;
  }),
}));


// Mock VariationMatrixManager
jest.mock('@/components/admin/VariationMatrixManager', () => {
  return function MockVariationMatrixManager({ initialData, onUpdate }) {
    return <div data-testid="variation-matrix">Variation Matrix Manager</div>;
  };
});

// Mock CategorySelector
jest.mock('@/components/store/add-product/CategorySelector', () => {
  return function MockCategorySelector({ value, onChange, error }) {
    return (
      <div>
        <button onClick={() => onChange('mock-category-id')}>Select Category</button>
        {error && <p data-testid="category-error">{error}</p>}
      </div>
    );
  };
});



describe('AddProductWizard', () => {
  const mockRouter = { push: jest.fn() };
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    useAuth.mockReturnValue({ user: mockUser });
    global.fetch = jest.fn((url) => {
      if (url.startsWith('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'cat1', name: 'Electronics', slug: 'electronics', level: 1 },
            { id: 'cat2', name: 'Phones', slug: 'phones', level: 2, parentId: 'cat1' },
            { id: 'cat3', name: 'Laptops', slug: 'laptops', level: 2, parentId: 'cat1' },
          ]),
        });
      }
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

  it('renders the first step correctly', async () => {
    render(<AddProductWizard storeId="store-123" />);
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Select Category/i })).toBeInTheDocument();
  });

  it('renders the Magic Write button', async () => {
    render(<AddProductWizard storeId="store-123" />);
    const descriptionToggleButton = await screen.findByRole('button', { name: /Description/i });
    fireEvent.click(descriptionToggleButton);
    expect(screen.getByText('Magic Write')).toBeInTheDocument();
  });

  it('shows product video uploader when enabled in settings', async () => {
    render(<AddProductWizard storeId="store-123" />);
    const videoToggleButton = await screen.findByRole('button', { name: /Product Videos/i });
    fireEvent.click(videoToggleButton);
    await waitFor(() => {
      expect(screen.getByText('Add Video')).toBeInTheDocument();
    });
  });

  it('validates required fields on next', async () => {
    render(<AddProductWizard storeId="store-123" />);
    
    // Click Next without filling anything
    const nextButton = screen.getByText('Next Step');
    fireEvent.click(nextButton);

    await waitFor(async () => {
      expect(await screen.findByText(/Product name must be at least 5 characters/i)).toBeInTheDocument();
      expect(await screen.findByTestId('category-error')).toHaveTextContent(/Invalid input: expected string, received null/i);
    });
  });

  it('should find the CKEditor mock', async () => {
    render(<AddProductWizard storeId="store-123" />);
    const descriptionToggleButton = await screen.findByRole('button', { name: /Description/i });
    fireEvent.click(descriptionToggleButton);
    const editor = await screen.findByTestId('ck-editor');
    expect(editor).toBeInTheDocument();
  });
});