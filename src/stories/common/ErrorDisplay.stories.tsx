import type { Meta, StoryObj } from '@storybook/nextjs'
import ErrorDisplay from '@/app/components/error_display'

const meta = {
  title: 'Common/ErrorDisplay',
  component: ErrorDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    error_message: {
      control: 'text',
      description: 'Error message to display',
    },
  },
} satisfies Meta<typeof ErrorDisplay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    error_message: 'Something went wrong. Please try again.',
  },
}

export const NetworkError: Story = {
  args: {
    error_message: 'Network error: Unable to connect to the server. Please check your internet connection.',
  },
}

export const ValidationError: Story = {
  args: {
    error_message: 'Validation error: Please provide a valid email address.',
  },
}

export const AuthenticationError: Story = {
  args: {
    error_message: 'Authentication failed. Please sign in again.',
  },
}

export const TokenError: Story = {
  args: {
    error_message: 'Insufficient tokens. You need at least 50 MP to perform this action.',
  },
}

export const GenerationError: Story = {
  args: {
    error_message: 'Failed to generate image. Please try again with different settings.',
  },
}

export const LongError: Story = {
  args: {
    error_message: 'This is a very long error message that contains multiple sentences. It might happen when the server returns a detailed error response. The error display should handle this gracefully and show all the information in a readable way without breaking the layout.',
  },
}

export const APIError: Story = {
  args: {
    error_message: 'API Error 429: Too many requests. Please wait 60 seconds before trying again.',
  },
}