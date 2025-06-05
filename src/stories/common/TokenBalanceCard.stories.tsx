import type { Meta, StoryObj } from '@storybook/react'
import { TokenBalanceCard } from '@/app/components/TokenBalanceCard'

const meta = {
  title: 'Common/TokenBalanceCard',
  component: TokenBalanceCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TokenBalanceCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    renewableBalance: 125,
    permanentBalance: 0,
    planType: 'free',
  },
}

export const StandardUser: Story = {
  args: {
    renewableBalance: 15360,
    permanentBalance: 5000,
    planType: 'standard',
  },
}

export const LowBalance: Story = {
  args: {
    renewableBalance: 10,
    permanentBalance: 0,
    planType: 'free',
  },
}

export const Loading: Story = {
  args: {
    renewableBalance: 0,
    permanentBalance: 0,
    planType: 'free',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading state while fetching balance',
      },
    },
  },
}

export const WithPermanentTokens: Story = {
  args: {
    renewableBalance: 125,
    permanentBalance: 1000,
    planType: 'free',
  },
}

export const MaxedOut: Story = {
  args: {
    renewableBalance: 20480,
    permanentBalance: 50000,
    planType: 'standard',
  },
}