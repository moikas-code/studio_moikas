import type { Meta, StoryObj } from '@storybook/nextjs'
import ImageGenerationReceipt from '@/app/components/ImageGenerationReceipt'

const meta = {
  title: 'Common/ImageGenerationReceipt',
  component: ImageGenerationReceipt,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    prompt_text: {
      control: 'text',
      description: 'The prompt used for generation',
    },
    images: {
      description: 'Array of base64 image strings',
    },
    costs: {
      description: 'Cost breakdown object',
    },
    plan: {
      control: 'select',
      options: ['free', 'standard', 'premium'],
      description: 'User subscription plan',
    },
    timestamp: {
      control: 'text',
      description: 'When the image was generated',
    },
    error_message: {
      control: 'text',
      description: 'Error message if generation failed',
    },
    onDownload: {
      action: 'download clicked',
      description: 'Called when download is clicked',
    },
    onRedo: {
      action: 'redo clicked',
      description: 'Called when redo is clicked',
    },
    onReuse: {
      action: 'reuse clicked',
      description: 'Called when reuse is clicked',
    },
    onEdit: {
      action: 'edit clicked',
      description: 'Called when edit is clicked',
    },
  },
} satisfies Meta<typeof ImageGenerationReceipt>

export default meta
type Story = StoryObj<typeof meta>

// Mock base64 image
const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

export const Default: Story = {
  args: {
    prompt_text: 'A beautiful sunset over the ocean',
    images: [mockBase64],
    costs: {
      enhancement_mp: 0,
      images: [{
        model: 'fal-ai/flux-realism',
        width: 1024,
        height: 1024,
        mp: 50,
      }],
      total_mp: 50,
    },
    plan: 'standard',
    timestamp: new Date().toISOString(),
  },
}

export const WithEnhancement: Story = {
  args: {
    prompt_text: 'Enhanced: A stunning cyberpunk cityscape with neon lights',
    images: [mockBase64, mockBase64],
    costs: {
      enhancement_mp: 10,
      images: [
        {
          model: 'fal-ai/flux-pro',
          width: 1920,
          height: 1080,
          mp: 45,
        },
        {
          model: 'fal-ai/flux-pro',
          width: 1920,
          height: 1080,
          mp: 45,
        },
      ],
      total_mp: 100,
    },
    plan: 'standard',
    timestamp: new Date().toISOString(),
    onDownload: (img: string, idx: number) => console.log('Download image', idx),
    onRedo: () => console.log('Redo generation'),
    onReuse: () => console.log('Reuse prompt'),
    onEdit: (img: string, idx: number) => console.log('Edit image', idx),
  },
}

export const FreePlan: Story = {
  args: {
    prompt_text: 'A cute cat playing with yarn',
    images: [mockBase64],
    costs: {
      enhancement_mp: 0,
      images: [{
        model: 'fal-ai/sana',
        width: 512,
        height: 512,
        mp: 25,
      }],
      total_mp: 25,
    },
    plan: 'free',
    timestamp: new Date().toISOString(),
  },
}

export const MultipleImages: Story = {
  args: {
    prompt_text: 'Four seasons landscape',
    images: [mockBase64, mockBase64, mockBase64, mockBase64],
    costs: {
      enhancement_mp: 0,
      images: [
        { model: 'fal-ai/flux-realism', width: 768, height: 768, mp: 30 },
        { model: 'fal-ai/flux-realism', width: 768, height: 768, mp: 30 },
        { model: 'fal-ai/flux-realism', width: 768, height: 768, mp: 30 },
        { model: 'fal-ai/flux-realism', width: 768, height: 768, mp: 30 },
      ],
      total_mp: 120,
    },
    plan: 'standard',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
}

export const WithError: Story = {
  args: {
    prompt_text: 'Failed generation attempt',
    images: [],
    costs: {
      enhancement_mp: 0,
      images: [],
      total_mp: 0,
    },
    plan: 'standard',
    timestamp: new Date().toISOString(),
    error_message: 'Generation failed: Content policy violation detected',
  },
}

export const LongPrompt: Story = {
  args: {
    prompt_text: 'A highly detailed fantasy landscape with a majestic castle perched on a cliff overlooking a vast ocean, dragons flying in the cloudy sky, magical forests in the foreground with glowing mushrooms and ancient trees, all bathed in the golden light of a setting sun with purple and orange hues painting the sky',
    images: [mockBase64],
    costs: {
      enhancement_mp: 5,
      images: [{
        model: 'fal-ai/flux-pro',
        width: 1280,
        height: 720,
        mp: 75,
      }],
      total_mp: 80,
    },
    plan: 'premium',
    timestamp: new Date().toISOString(),
  },
}

export const MobileView: Story = {
  args: {
    prompt_text: 'Mobile responsive receipt view',
    images: [mockBase64],
    costs: {
      enhancement_mp: 0,
      images: [{
        model: 'fal-ai/sana',
        width: 512,
        height: 512,
        mp: 25,
      }],
      total_mp: 25,
    },
    plan: 'standard',
    timestamp: new Date().toISOString(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}