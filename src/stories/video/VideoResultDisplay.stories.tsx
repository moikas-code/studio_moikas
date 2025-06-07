import type { Meta, StoryObj } from '@storybook/nextjs'
import { VideoResultDisplay } from '@/app/tools/video-effects/components/video_result_display'

const meta = {
  title: 'Video/VideoResultDisplay',
  component: VideoResultDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    video_url: {
      control: 'text',
      description: 'URL of the processed video',
    },
    on_new_video: {
      action: 'new video clicked',
      description: 'Called when new video button is clicked',
    },
  },
} satisfies Meta<typeof VideoResultDisplay>

export default meta
type Story = StoryObj<typeof meta>

// Mock video URL (you can replace with actual video)
const mockVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

export const Default: Story = {
  args: {
    video_url: mockVideoUrl,
    on_new_video: () => console.log('Creating new video...'),
  },
}

export const NoVideo: Story = {
  args: {
    video_url: '',
    on_new_video: () => console.log('Creating new video...'),
  },
}

export const MobileView: Story = {
  args: {
    video_url: mockVideoUrl,
    on_new_video: () => console.log('Creating new video...'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const TabletView: Story = {
  args: {
    video_url: mockVideoUrl,
    on_new_video: () => console.log('Creating new video...'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
}