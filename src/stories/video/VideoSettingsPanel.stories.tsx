import type { Meta, StoryObj } from '@storybook/nextjs'
import { VideoSettingsPanel } from '@/app/tools/video-effects/components/video_settings_panel'

const meta = {
  title: 'Video/VideoSettingsPanel',
  component: VideoSettingsPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    is_open: {
      control: 'boolean',
      description: 'Whether the panel is open',
    },
    aspect_slider: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Aspect ratio slider value',
    },
    duration: {
      control: { type: 'range', min: 1, max: 10 },
      description: 'Video duration in seconds',
    },
    on_aspect_change: {
      action: 'aspect changed',
      description: 'Called when aspect ratio is changed',
    },
    on_duration_change: {
      action: 'duration changed',
      description: 'Called when duration is changed',
    },
    model_cost: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Cost per second of video',
    },
  },
} satisfies Meta<typeof VideoSettingsPanel>

export default meta
type Story = StoryObj<typeof meta>


export const Default: Story = {
  args: {
    is_open: true,
    aspect_slider: 0.5,
    duration: 4,
    on_aspect_change: (value) => console.log('Aspect changed:', value),
    on_duration_change: (value) => console.log('Duration changed:', value),
    model_cost: 15,
  },
}

export const SquareAspect: Story = {
  args: {
    is_open: true,
    aspect_slider: 0.25, // 1:1 aspect ratio
    duration: 6,
    on_aspect_change: (value) => console.log('Aspect changed:', value),
    on_duration_change: (value) => console.log('Duration changed:', value),
    model_cost: 20,
  },
}

export const Closed: Story = {
  args: {
    is_open: false,
    aspect_slider: 0.5,
    duration: 4,
    on_aspect_change: (value) => console.log('Aspect changed:', value),
    on_duration_change: (value) => console.log('Duration changed:', value),
    model_cost: 15,
  },
}

export const MinimalSettings: Story = {
  args: {
    is_open: true,
    aspect_slider: 0, // 9:16 vertical
    duration: 1,
    on_aspect_change: (value) => console.log('Aspect changed:', value),
    on_duration_change: (value) => console.log('Duration changed:', value),
    model_cost: 10,
  },
}

export const MaximalSettings: Story = {
  args: {
    is_open: true,
    aspect_slider: 1, // 21:9 ultrawide
    duration: 10,
    on_aspect_change: (value) => console.log('Aspect changed:', value),
    on_duration_change: (value) => console.log('Duration changed:', value),
    model_cost: 25,
  },
}

export const MobileView: Story = {
  args: {
    is_open: true,
    aspect_slider: 0.5,
    duration: 4,
    on_aspect_change: (value) => console.log('Aspect changed:', value),
    on_duration_change: (value) => console.log('Duration changed:', value),
    model_cost: 15,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}