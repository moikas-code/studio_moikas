import type { Meta, StoryObj } from '@storybook/react'
import { ImageGenerationReceipt } from '@/app/components/ImageGenerationReceipt'

const meta = {
  title: 'Common/ImageGenerationReceipt',
  component: ImageGenerationReceipt,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    cost: {
      control: { type: 'number', min: 0, max: 500 },
      description: 'Token cost of the generation',
    },
    model: {
      control: 'text',
      description: 'Model used for generation',
    },
    aspectRatio: {
      control: 'text',
      description: 'Aspect ratio of the generated image',
    },
    timestamp: {
      control: 'date',
      description: 'When the image was generated',
    },
  },
} satisfies Meta<typeof ImageGenerationReceipt>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    cost: 50,
    model: 'fal-ai/flux-realism',
    aspectRatio: '1:1',
    timestamp: new Date().toISOString(),
  },
}

export const SANAModel: Story = {
  args: {
    cost: 25,
    model: 'fal-ai/sana',
    aspectRatio: '16:9',
    timestamp: new Date().toISOString(),
  },
}

export const FluxPro: Story = {
  args: {
    cost: 100,
    model: 'fal-ai/flux-pro',
    aspectRatio: '3:2',
    timestamp: new Date().toISOString(),
  },
}

export const Portrait: Story = {
  args: {
    cost: 75,
    model: 'fal-ai/flux-realism',
    aspectRatio: '2:3',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
}

export const Yesterday: Story = {
  args: {
    cost: 50,
    model: 'fal-ai/sana',
    aspectRatio: '1:1',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
}

export const CustomAspectRatio: Story = {
  args: {
    cost: 60,
    model: 'fal-ai/flux-realism',
    aspectRatio: '21:9',
    timestamp: new Date().toISOString(),
  },
}