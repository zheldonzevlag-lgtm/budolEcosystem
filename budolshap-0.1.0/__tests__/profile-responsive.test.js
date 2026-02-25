
import React from 'react'
import { render, screen } from '@testing-library/react'
import ProfilePage from '../app/(public)/profile/page.jsx'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

// Mock the hooks
jest.mock('@/context/AuthContext')
jest.mock('next/navigation')

describe('ProfilePage Responsive Logout Button', () => {
  const mockUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    phoneNumber: '+639123456789',
    kycStatus: 'VERIFIED'
  }

  beforeEach(() => {
    useAuth.mockReturnValue({
      user: mockUser,
      handleLogout: jest.fn()
    })
    useRouter.mockReturnValue({
      push: jest.fn()
    })
  })

  test('Logout button container should have md:hidden class', () => {
    render(<ProfilePage />)
    
    // Find the logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    const container = logoutButton.closest('div')
    
    expect(container.className).toContain('md:hidden')
  })
})
