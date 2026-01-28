/**
 * Example component tests.
 *
 * Demonstrates testing patterns for React components.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TestWrapper } from '../setup'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>, { wrapper: TestWrapper })
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>, { wrapper: TestWrapper })
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass('bg-destructive')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>, { wrapper: TestWrapper })
    expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled()
  })
})
