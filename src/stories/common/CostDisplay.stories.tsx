import type { Meta, StoryObj } from '@storybook/nextjs'
import CostDisplay from '@/app/components/CostDisplay'
import { get_legacy_model_options } from '@/lib/generate_helpers'

const meta = {
  title: 'Common/CostDisplay',
  component: CostDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    model: {
      control: 'select',
      options: ['fal-ai/flux-realism', 'fal-ai/flux-pro', 'fal-ai/sana', 'fal-ai/fast-turbo-diffusion'],
      description: 'AI model to calculate cost for',
    },
    cost: {
      control: { type: 'number', min: 0, max: 1000 },
      description: 'Direct cost to display (overrides model calculation)',
    },
    planType: {
      control: 'select',
      options: ['free', 'standard', 'premium', null],
      description: 'User plan type',
    },
  },
} satisfies Meta<typeof CostDisplay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    cost: 50,
  },
}

export const WithModel: Story = {
  args: {
    model: get_legacy_model_options().find(m => m.value === 'fal-ai/flux-realism'),
    planType: 'standard',
  },
}

export const FreePlan: Story = {
  args: {
    model: get_legacy_model_options().find(m => m.value === 'fal-ai/sana'),
    planType: 'free',
  },
}

export const LargeCost: Story = {
  args: {
    cost: 750,
  },
}

export const ZeroCost: Story = {
  args: {
    cost: 0,
  },
}

export const PremiumModel: Story = {
  args: {
    model: get_legacy_model_options().find(m => m.value === 'fal-ai/flux-pro'),
    planType: 'premium',
  },
}

export const InButton: Story = {
  args: {
    cost: 50,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <button className="btn btn-primary">
        Generate Image <Story />
      </button>
    ),
  ],
}