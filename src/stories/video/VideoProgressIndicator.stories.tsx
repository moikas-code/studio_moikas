import type { Meta, StoryObj } from '@storybook/react'
import { VideoProgressIndicator } from '@/app/tools/video-effects/components/video_progress_indicator'

const meta = {
  title: 'Video/VideoProgressIndicator',
  component: VideoProgressIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Progress percentage',
    },
    status: {
      control: 'select',
      options: ['idle', 'uploading', 'processing', 'completed', 'error'],
      description: 'Current status',
    },
    message: {
      control: 'text',
      description: 'Status message to display',
    },
  },
} satisfies Meta<typeof VideoProgressIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  args: {
    progress: 0,
    status: 'idle',
    message: 'Ready to start',
  },
}

export const Uploading: Story = {
  args: {
    progress: 45,
    status: 'uploading',
    message: 'Uploading video...',
  },
}

export const Processing: Story = {
  args: {
    progress: 75,
    status: 'processing',
    message: 'Applying effects...',
  },
}

export const Completed: Story = {
  args: {
    progress: 100,
    status: 'completed',
    message: 'Video ready!',
  },
}

export const Error: Story = {
  args: {
    progress: 30,
    status: 'error',
    message: 'Failed to process video',
  },
}

export const LongMessage: Story = {
  args: {
    progress: 60,
    status: 'processing',
    message: 'Analyzing video frames and applying AI-powered enhancement effects. This may take a few minutes...',
  },
}

export const AlmostComplete: Story = {
  args: {
    progress: 95,
    status: 'processing',
    message: 'Finalizing video...',
  },
}