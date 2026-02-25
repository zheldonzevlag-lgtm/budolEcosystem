import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import GoogleMapView from '../GoogleMapView';

// Mock Google Maps API
const mockMapInstance = {
    setZoom: jest.fn(),
    getZoom: jest.fn(() => 15),
    panTo: jest.fn(),
    getCenter: jest.fn(() => ({ lat: () => 14.5995, lng: () => 120.9842 })),
    addListener: jest.fn(),
};

const mockGoogleMaps = {
    Map: jest.fn(() => mockMapInstance),
    event: {
        addListener: jest.fn(),
        trigger: jest.fn(),
    },
};

describe('GoogleMapView', () => {
    const defaultProps = {
        center: [14.5995, 120.9842],
        onCenterChange: jest.fn(),
        apiKey: 'test-api-key',
    };

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup window.google
        global.window.google = {
            maps: mockGoogleMaps,
        };
        
        // Mock document.createElement for script loading
        // We want to simulate that the script loads immediately for testing logic
        // or we can rely on the component checking window.google
    });

    afterEach(() => {
        delete global.window.google;
    });

    it('renders loading state initially if google is not defined', () => {
        delete global.window.google; // Simulate script not loaded
        render(<GoogleMapView {...defaultProps} />);
        expect(screen.getByText('Loading Google Maps...')).toBeInTheDocument();
    });

    it('renders map container when script is loaded', async () => {
        render(<GoogleMapView {...defaultProps} />);
        // Since window.google is defined in beforeEach, it should set scriptLoaded to true
        // We might need to wait for the useEffect
        
        // The component has a check: if (window.google && window.google.maps) setScriptLoaded(true)
        // Wait for the map to be initialized
    await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalled();
    });

    // Check if the container is present
    const mapContainer = screen.getByTestId('google-map-container');
    expect(mapContainer).toBeInTheDocument();
    });

    it('initializes map with correct center and options', () => {
        render(<GoogleMapView {...defaultProps} />);
        
        expect(mockGoogleMaps.Map).toHaveBeenCalledWith(
            expect.any(HTMLElement),
            expect.objectContaining({
                center: { lat: defaultProps.center[0], lng: defaultProps.center[1] },
                zoom: 15,
                disableDefaultUI: true,
            })
        );
    });

    it('updates map center when center prop changes', () => {
        const { rerender } = render(<GoogleMapView {...defaultProps} />);
        
        // Change center
        const newCenter = [14.6000, 121.0000];
        rerender(<GoogleMapView {...defaultProps} center={newCenter} />);
        
        expect(mockMapInstance.panTo).toHaveBeenCalledWith({
            lat: newCenter[0],
            lng: newCenter[1],
        });
    });

    it('exposes zoomIn method via ref', () => {
        const ref = React.createRef();
        render(<GoogleMapView {...defaultProps} ref={ref} />);
        
        act(() => {
            ref.current.zoomIn();
        });
        
        expect(mockMapInstance.setZoom).toHaveBeenCalledWith(16); // 15 + 1
    });

    it('exposes zoomOut method via ref', () => {
        const ref = React.createRef();
        render(<GoogleMapView {...defaultProps} ref={ref} />);
        
        act(() => {
            ref.current.zoomOut();
        });
        
        expect(mockMapInstance.setZoom).toHaveBeenCalledWith(14); // 15 - 1
    });
});
