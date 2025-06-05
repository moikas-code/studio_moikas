import type { Meta, StoryObj } from '@storybook/react'
import ImageEditor from '@/app/components/image_editor'

const meta = {
  title: 'Image/ImageEditor',
  component: ImageEditor,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onClose: {
      action: 'closed',
      description: 'Called when the editor is closed',
    },
  },
} satisfies Meta<typeof ImageEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onClose: () => console.log('Editor closed'),
  },
}

export const WithMockImage: Story = {
  args: {
    onClose: () => console.log('Editor closed'),
  },
  play: async ({ canvasElement }) => {
    // Simulate loading an image
    console.log('ImageEditor story loaded')
  },
}

export const MobileView: Story = {
  args: {
    onClose: () => console.log('Editor closed'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const TabletView: Story = {
  args: {
    onClose: () => console.log('Editor closed'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
}