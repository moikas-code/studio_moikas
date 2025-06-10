import type { Meta, StoryObj } from '@storybook/nextjs'
import TokenBalanceCard from '@/components/TokenBalanceCard'

const meta = {
  title: 'Common/TokenBalanceCard',
  component: TokenBalanceCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    show_buy_button: {
      control: 'boolean',
      description: 'Whether to show the buy tokens button',
    },
    compact: {
      control: 'boolean',
      description: 'Use compact layout',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof TokenBalanceCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    show_buy_button: true,
    compact: false,
  },
}

export const Compact: Story = {
  args: {
    show_buy_button: true,
    compact: true,
  },
}

export const NoBuyButton: Story = {
  args: {
    show_buy_button: false,
    compact: false,
  },
}

export const CompactNoBuyButton: Story = {
  args: {
    show_buy_button: false,
    compact: true,
  },
}

export const WithCustomClass: Story = {
  args: {
    show_buy_button: true,
    compact: false,
    className: 'shadow-xl border-2 border-primary',
  },
}

export const MobileView: Story = {
  args: {
    show_buy_button: true,
    compact: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}