
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AddressFormManager from '../components/address/AddressFormManager'

// Mock dynamic import
jest.mock('next/dynamic', () => () => {
  return function MockMapPicker() {
    return <div data-testid="map-picker">Map Picker</div>
  }
})

describe('AddressFormManager Password Field', () => {
  const defaultProps = {
    initialData: {},
    onSave: jest.fn(),
    onCancel: jest.fn(),
    mode: 'profile'
  }

  test('should render password field and eye toggle', () => {
    render(<AddressFormManager {...defaultProps} />)
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    expect(passwordInput).toBeInTheDocument()
    expect(passwordInput.type).toBe('password')
    
    const toggleButton = screen.getByRole('button', { name: /show password/i })
    expect(toggleButton).toBeInTheDocument()
  })

  test('should toggle password visibility when eye icon is clicked', () => {
    render(<AddressFormManager {...defaultProps} />)
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    const toggleButton = screen.getByRole('button', { name: /show password/i })
    
    // Initial state: password
    expect(passwordInput.type).toBe('password')
    
    // Click toggle
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
    
    // Click toggle again
    fireEvent.click(screen.getByRole('button', { name: /hide password/i }))
    expect(passwordInput.type).toBe('password')
  })

  test('should show hint when password is not set', () => {
    const props = {
        ...defaultProps,
        initialData: { hasPassword: false }
    }
    render(<AddressFormManager {...props} />)
    
    const hint = screen.getByText(/Setup password for email login/i)
    expect(hint).toBeInTheDocument()
  })

  test('should show validation error for short password', () => {
    render(<AddressFormManager {...defaultProps} />)
    
    const passwordInput = screen.getByLabelText(/^password$/i)
    
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    
    const error = screen.getByText(/Password must be at least 8 characters/i)
    expect(error).toBeInTheDocument()
  })
})
