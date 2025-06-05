import type { Meta, StoryObj } from '@storybook/react'
import ImageGrid from '@/app/components/image_grid'

const meta = {
  title: 'Image/ImageGrid',
  component: ImageGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    images: {
      description: 'Array of image data to display',
    },
    onImageClick: {
      action: 'image clicked',
      description: 'Called when an image is clicked',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
  },
} satisfies Meta<typeof ImageGrid>

export default meta
type Story = StoryObj<typeof meta>

const mockImages = [
  {
    url: '/placeholder-jffrl.png',
    prompt: 'A cat astronaut on Mars',
    model: 'fal-ai/flux-realism',
    aspectRatio: '1:1',
    cost: 50,
    timestamp: new Date().toISOString(),
  },
  {
    url: '/ai-game-dev.png',
    prompt: 'AI game development team',
    model: 'fal-ai/sana',
    aspectRatio: '16:9',
    cost: 25,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    url: '/digital-artist-ai.png',
    prompt: 'Digital artist using AI tools',
    model: 'fal-ai/flux-pro',
    aspectRatio: '3:2',
    cost: 100,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    url: '/marketing-team-ai.png',
    prompt: 'Marketing team brainstorming with AI',
    model: 'fal-ai/flux-realism',
    aspectRatio: '1:1',
    cost: 50,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
]

export const Default: Story = {
  args: {
    images: mockImages,
    onImageClick: (image) => console.log('Clicked image:', image),
  },
}

export const Loading: Story = {
  args: {
    images: [],
    isLoading: true,
  },
}

export const Empty: Story = {
  args: {
    images: [],
    isLoading: false,
  },
}

export const SingleImage: Story = {
  args: {
    images: [mockImages[0]],
    onImageClick: (image) => console.log('Clicked image:', image),
  },
}

export const ManyImages: Story = {
  args: {
    images: [...mockImages, ...mockImages, ...mockImages],
    onImageClick: (image) => console.log('Clicked image:', image),
  },
}

export const MobileView: Story = {
  args: {
    images: mockImages,
    onImageClick: (image) => console.log('Clicked image:', image),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}