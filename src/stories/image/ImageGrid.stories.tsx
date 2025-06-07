import type { Meta, StoryObj } from '@storybook/nextjs'
import ImageGrid from '@/app/components/image_grid'

const meta = {
  title: 'Image/ImageGrid',
  component: ImageGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    image_base64: {
      description: 'Array of base64 image strings',
    },
    prompt_text: {
      control: 'text',
      description: 'The prompt used to generate images',
    },
    mana_points_used: {
      control: 'number',
      description: 'Mana points consumed',
    },
    plan: {
      control: 'text',
      description: 'User subscription plan',
    },
    model_id: {
      control: 'text',
      description: 'AI model used',
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
} satisfies Meta<typeof ImageGrid>

export default meta
type Story = StoryObj<typeof meta>

// Mock base64 images (you can replace with actual base64 strings)
const mockBase64Images = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
]

export const Default: Story = {
  args: {
    image_base64: mockBase64Images,
    prompt_text: 'A futuristic city with flying cars',
    mana_points_used: 50,
    plan: 'standard',
    model_id: 'fal-ai/flux-realism',
    onRedo: () => console.log('Redo clicked'),
    onReuse: () => console.log('Reuse clicked'),
    onEdit: (img: string) => console.log('Edit clicked:', img),
  },
}

export const WithAdvancedSettings: Story = {
  args: {
    image_base64: mockBase64Images,
    prompt_text: 'A fantasy landscape with dragons',
    mana_points_used: 75,
    plan: 'standard',
    model_id: 'fal-ai/sana',
    num_inference_steps: 28,
    guidance_scale: 5,
    style_name: 'Cinematic',
    onRedo: () => console.log('Redo clicked'),
    onReuse: () => console.log('Reuse clicked'),
    onEdit: (img: string) => console.log('Edit clicked:', img),
  },
}

export const FreePlan: Story = {
  args: {
    image_base64: mockBase64Images.slice(0, 2),
    prompt_text: 'Cat astronaut on Mars',
    mana_points_used: 25,
    plan: 'free',
    model_id: 'fal-ai/flux-realism',
    onRedo: () => console.log('Redo clicked'),
    onReuse: () => console.log('Reuse clicked'),
    onEdit: (img: string) => console.log('Edit clicked:', img),
  },
}

export const SingleImage: Story = {
  args: {
    image_base64: [mockBase64Images[0]],
    prompt_text: 'A single beautiful sunset',
    mana_points_used: 25,
    plan: 'standard',
    model_id: 'fal-ai/flux-pro',
    onRedo: () => console.log('Redo clicked'),
    onReuse: () => console.log('Reuse clicked'),
    onEdit: (img: string) => console.log('Edit clicked:', img),
  },
}

export const WithEnhancements: Story = {
  args: {
    image_base64: mockBase64Images,
    prompt_text: 'Enhanced prompt: A beautiful landscape',
    mana_points_used: 60,
    plan: 'standard',
    model_id: 'fal-ai/flux-realism',
    enhancement_count: 2,
    onRedo: () => console.log('Redo clicked'),
    onReuse: () => console.log('Reuse clicked'),
    onEdit: (img: string) => console.log('Edit clicked:', img),
  },
}

export const MobileView: Story = {
  args: {
    image_base64: mockBase64Images.slice(0, 2),
    prompt_text: 'Mobile view test',
    mana_points_used: 30,
    plan: 'standard',
    model_id: 'fal-ai/flux-realism',
    onRedo: () => console.log('Redo clicked'),
    onReuse: () => console.log('Reuse clicked'),
    onEdit: (img: string) => console.log('Edit clicked:', img),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}