import type { Meta, StoryObj } from '@storybook/react'
import { ErrorDisplay } from '@/app/components/error_display'

const meta = {
  title: 'Common/ErrorDisplay',
  component: ErrorDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    onRetry: {
      action: 'retry clicked',
      description: 'Callback when retry button is clicked',
    },
  },
} satisfies Meta<typeof ErrorDisplay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    error: 'Something went wrong. Please try again.',
  },
}

export const NetworkError: Story = {
  args: {
    error: 'Network error: Unable to connect to the server. Please check your internet connection.',
  },
}

export const ValidationError: Story = {
  args: {
    error: 'Validation error: Please provide a valid email address.',
  },
}

export const AuthenticationError: Story = {
  args: {
    error: 'Authentication failed. Please sign in again.',
  },
}

export const TokenError: Story = {
  args: {
    error: 'Insufficient tokens. You need at least 50 MP to perform this action.',
  },
}

export const WithRetry: Story = {
  args: {
    error: 'Failed to generate image. Click retry to try again.',
    onRetry: () => console.log('Retrying...'),
  },
}

export const LongError: Story = {
  args: {
    error: 'This is a very long error message that contains multiple sentences. It might happen when the server returns a detailed error response. The error display should handle this gracefully and show all the information in a readable way without breaking the layout.',
  },
}

export const APIError: Story = {
  args: {
    error: 'API Error 429: Too many requests. Please wait 60 seconds before trying again.',
  },
}