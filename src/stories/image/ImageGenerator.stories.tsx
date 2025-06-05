import type { Meta, StoryObj } from '@storybook/react'
import ImageGenerator from '@/app/components/image_generator'

const meta = {
  title: 'Image/ImageGenerator',
  component: ImageGenerator,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ImageGenerator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithInitialPrompt: Story = {
  args: {
    // Component doesn't accept props, but we can show different states
  },
  play: async ({ canvasElement }) => {
    // Simulate entering a prompt
    const promptInput = canvasElement.querySelector('textarea')
    if (promptInput) {
      // @ts-ignore
      promptInput.value = 'A futuristic cityscape at sunset with flying cars'
    }
  },
}

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
}

export const DarkTheme: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    theme: 'dark',
  },
}

export const LightTheme: Story = {
  parameters: {
    backgrounds: { default: 'light' },
    theme: 'light',
  },
}