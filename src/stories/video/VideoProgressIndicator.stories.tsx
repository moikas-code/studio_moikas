import type { Meta, StoryObj } from '@storybook/nextjs'
import { VideoProgressIndicator } from '@/app/tools/video-effects/components/video_progress_indicator'

const meta = {
  title: 'Video/VideoProgressIndicator',
  component: VideoProgressIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    job_id: {
      control: 'text',
      description: 'Job ID for the video generation',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Progress percentage',
    },
  },
} satisfies Meta<typeof VideoProgressIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  args: {
    job_id: 'job_123',
    progress: 0,
  },
}

export const InProgress: Story = {
  args: {
    job_id: 'job_456',
    progress: 45,
  },
}

export const Processing: Story = {
  args: {
    job_id: 'job_789',
    progress: 75,
    // message: 'Applying effects...',
  },
}

export const Completed: Story = {
  args: {
    job_id: 'job_complete',
    progress: 100,
  },
}

export const PartialProgress: Story = {
  args: {
    job_id: 'job_partial',
    progress: 30,
  },
}

export const MidProgress: Story = {
  args: {
    job_id: 'job_mid',
    progress: 60,
  },
}

export const AlmostComplete: Story = {
  args: {
    job_id: 'job_almost',
    progress: 95,
  },
}