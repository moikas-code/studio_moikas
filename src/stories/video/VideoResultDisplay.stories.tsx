import type { Meta, StoryObj } from '@storybook/react'
import { VideoResultDisplay } from '@/app/tools/video-effects/components/video_result_display'

const meta = {
  title: 'Video/VideoResultDisplay',
  component: VideoResultDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    videoUrl: {
      control: 'text',
      description: 'URL of the processed video',
    },
    originalPrompt: {
      control: 'text',
      description: 'Original prompt used for generation',
    },
    cost: {
      control: { type: 'number', min: 0, max: 500 },
      description: 'Token cost',
    },
    onDownload: {
      action: 'download clicked',
      description: 'Called when download button is clicked',
    },
    onNewVideo: {
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
    videoUrl: mockVideoUrl,
    originalPrompt: 'A futuristic city with flying cars',
    cost: 150,
    onDownload: () => console.log('Downloading video...'),
    onNewVideo: () => console.log('Creating new video...'),
  },
}

export const LongPrompt: Story = {
  args: {
    videoUrl: mockVideoUrl,
    originalPrompt: 'A serene landscape with mountains in the background, a crystal clear lake reflecting the sky, birds flying overhead, and a small wooden cabin nestled among pine trees',
    cost: 200,
    onDownload: () => console.log('Downloading video...'),
    onNewVideo: () => console.log('Creating new video...'),
  },
}

export const LowCost: Story = {
  args: {
    videoUrl: mockVideoUrl,
    originalPrompt: 'Simple animation test',
    cost: 50,
    onDownload: () => console.log('Downloading video...'),
    onNewVideo: () => console.log('Creating new video...'),
  },
}

export const NoVideo: Story = {
  args: {
    videoUrl: '',
    originalPrompt: 'Failed generation',
    cost: 0,
    onDownload: () => console.log('Downloading video...'),
    onNewVideo: () => console.log('Creating new video...'),
  },
}

export const MobileView: Story = {
  args: {
    videoUrl: mockVideoUrl,
    originalPrompt: 'Mobile video test',
    cost: 100,
    onDownload: () => console.log('Downloading video...'),
    onNewVideo: () => console.log('Creating new video...'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}