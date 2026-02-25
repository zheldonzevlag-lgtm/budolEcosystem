
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import AddressModal from '../components/AddressModal'
import { getUser } from '@/lib/auth-client'

// Mock dependencies
jest.mock('@/lib/auth-client')
jest.mock('react-hot-toast')
jest.mock('../components/address/AddressFormManager', () => {
  return function MockForm() { return <div data-testid="form-manager">Form</div> }
})

// Mock fetch
global.fetch = jest.fn()

describe('AddressModal KYC Banner', () => {
  const defaultProps = {
    setShowAddressModal: jest.fn(),
    onAddressesAdded: jest.fn(),
    mode: 'profile'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    getUser.mockReturnValue({ id: 'user-123', name: 'Test User' })
  })

  test('should show verification banner when KYC status is UNVERIFIED', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ kycStatus: 'UNVERIFIED' })
    })

    render(<AddressModal {...defaultProps} />)

    // Wait for loading to finish
    const banner = await screen.findByText(/Verification Required/i)
    expect(banner).toBeInTheDocument()
    expect(screen.getByText(/Complete your identity verification/i)).toBeInTheDocument()
  })

  test('should hide verification banner when KYC status is VERIFIED', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ kycStatus: 'VERIFIED' })
    })

    render(<AddressModal {...defaultProps} />)

    // Wait for loading to finish and check banner
    await waitFor(() => {
      expect(screen.getByTestId('form-manager')).toBeInTheDocument()
    })
    
    const banner = screen.queryByText(/Verification Required/i)
    expect(banner).not.toBeInTheDocument()
  })

  test('should hide verification banner when KYC status is PENDING', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ kycStatus: 'PENDING' })
    })

    render(<AddressModal {...defaultProps} />)

    // Wait for loading to finish and check banner
    await waitFor(() => {
      expect(screen.getByTestId('form-manager')).toBeInTheDocument()
    })
    
    const banner = screen.queryByText(/Verification Required/i)
    expect(banner).not.toBeInTheDocument()
  })
})
