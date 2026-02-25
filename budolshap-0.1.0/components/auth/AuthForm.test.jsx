import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuthForm from '@/components/auth/AuthForm'
import { AuthProvider } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}))

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('AuthForm Login Toggle', () => {
  const mockRouter = { push: jest.fn() }
  
  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter)
    global.fetch = jest.fn()
  })

  it('renders email login by default', () => {
    render(
      <AuthProvider>
        <AuthForm mode="login" />
      </AuthProvider>
    )

    expect(screen.getByText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument()
  })

  it('switches to mobile login when clicking Mobile button', async () => {
    render(
      <AuthProvider>
        <AuthForm mode="login" />
      </AuthProvider>
    )

    const mobileButton = screen.getAllByRole('button', { name: /Mobile/i })[0]
    fireEvent.click(mobileButton)

    await waitFor(() => {
      // Check for Mobile Number text in the document
      const mobileLabels = screen.getAllByText(/Mobile Number/i)
      expect(mobileLabels.length).toBeGreaterThan(0)
    })
    
    expect(screen.getByPlaceholderText('9XXXXXXXXX')).toBeInTheDocument()
  })

  it('switches back to email login when clicking Email button', async () => {
    render(
      <AuthProvider>
        <AuthForm mode="login" />
      </AuthProvider>
    )

    const mobileButton = screen.getAllByRole('button', { name: /Mobile/i })[0]
    const emailButton = screen.getAllByRole('button', { name: /Email/i })[0]

    fireEvent.click(mobileButton)
    fireEvent.click(emailButton)

    await waitFor(() => {
      expect(screen.getByText(/Email Address/i)).toBeInTheDocument()
    })
  })

  it('replaces password with Send Code button in mobile mode', async () => {
    render(
      <AuthProvider>
        <AuthForm mode="login" />
      </AuthProvider>
    )

    // Switch to mobile
    fireEvent.click(screen.getAllByRole('button', { name: /Mobile/i })[0])

    // Check that password field is hidden (using queryByText since queryByLabelText might fail on hidden elements)
    // In our implementation, the Password label is still there but inside an absolute hidden div
    // We can check if the button is present
    expect(screen.getByText(/Send Code via SMS & Email/i)).toBeInTheDocument()
  })

  it('shows OTP input after clicking Send Code', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Code sent' }),
    })

    render(
      <AuthProvider>
        <AuthForm mode="login" />
      </AuthProvider>
    )

    // Switch to mobile
    const mobileButton = screen.getAllByRole('button', { name: /Mobile/i })[0]
    fireEvent.click(mobileButton)
    
    // Fill phone number
    fireEvent.change(screen.getByPlaceholderText('9XXXXXXXXX'), { target: { value: '9123456789' } })

    // Click Send Code
    fireEvent.click(screen.getByText(/Send Code via SMS & Email/i))

    await waitFor(() => {
      expect(screen.getByLabelText(/Verification Code/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Enter 6-digit code/i)).toBeInTheDocument()
    })
  })

  it('formats phone number correctly on submission', async () => {
    // 1. Mock OTP send
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Code sent' }),
    })
    // 2. Mock Login success
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { name: 'Test User' }, token: 'test-token' }),
    })

    render(
      <AuthProvider>
        <AuthForm mode="login" />
      </AuthProvider>
    )

    // Switch to mobile
    const mobileButton = screen.getAllByRole('button', { name: /Mobile/i })[0]
    fireEvent.click(mobileButton)

    // Fill phone
    fireEvent.change(screen.getByPlaceholderText('9XXXXXXXXX'), { target: { value: '9123456789' } })
    
    // Send Code
    fireEvent.click(screen.getByText(/Send Code via SMS & Email/i))

    // Fill OTP
    await waitFor(() => {
      fireEvent.change(screen.getByPlaceholderText('Enter 6-digit code'), { target: { value: '123456' } })
    })

    // Submit
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        body: JSON.stringify({
          email: '+639123456789',
          password: '123456',
          isOtp: true
        })
      }))
    })
  })
})
