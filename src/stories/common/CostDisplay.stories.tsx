import type { Meta, StoryObj } from '@storybook/react'
import { CostDisplay } from '@/app/components/CostDisplay'

const meta = {
  title: 'Common/CostDisplay',
  component: CostDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    cost: {
      control: { type: 'number', min: 0, max: 1000 },
      description: 'Token cost to display',
    },
    variant: {
      control: 'select',
      options: ['default', 'large', 'small'],
      description: 'Display size variant',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show the MP icon',
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

export const Large: Story = {
  args: {
    cost: 100,
    variant: 'large',
  },
}

export const Small: Story = {
  args: {
    cost: 25,
    variant: 'small',
  },
}

export const WithoutIcon: Story = {
  args: {
    cost: 75,
    showIcon: false,
  },
}

export const ZeroCost: Story = {
  args: {
    cost: 0,
  },
}

export const HighCost: Story = {
  args: {
    cost: 999,
    variant: 'large',
  },
}

export const InButton: Story = {
  args: {
    cost: 50,
    variant: 'small',
  },
  decorators: [
    (Story) => (
      <button className="btn btn-primary">
        Generate Image <Story />
      </button>
    ),
  ],
}