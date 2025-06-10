import type { Meta, StoryObj } from '@storybook/nextjs'
import CompactTokenDisplay from '@/components/CompactTokenDisplay'

const meta = {
  title: 'Common/CompactTokenDisplay',
  component: CompactTokenDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof CompactTokenDisplay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const CustomClassName: Story = {
  args: {
    className: 'bg-primary text-primary-content p-4 rounded-lg',
  },
}

export const InNavbar: Story = {
  decorators: [
    (Story: React.ComponentType) => (
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Studio Moikas</a>
        </div>
        <div className="flex-none">
          <Story />
        </div>
      </div>
    ),
  ],
}

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}