import type { Meta, StoryObj } from '@storybook/react'
import { VideoSettingsPanel } from '@/app/tools/video-effects/components/video_settings_panel'
import { VideoSettings } from '@/app/tools/video-effects/types/video-effects'

const meta = {
  title: 'Video/VideoSettingsPanel',
  component: VideoSettingsPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    settings: {
      description: 'Current video settings',
    },
    onSettingsChange: {
      action: 'settings changed',
      description: 'Called when settings are changed',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the panel is disabled',
    },
  },
} satisfies Meta<typeof VideoSettingsPanel>

export default meta
type Story = StoryObj<typeof meta>

const defaultSettings: VideoSettings = {
  model: 'fal-ai/stable-video',
  duration: 4,
  aspectRatio: '16:9',
  motionIntensity: 5,
  seed: undefined,
}

export const Default: Story = {
  args: {
    settings: defaultSettings,
    onSettingsChange: (settings) => console.log('Settings changed:', settings),
    disabled: false,
  },
}

export const CustomSettings: Story = {
  args: {
    settings: {
      model: 'fal-ai/animatediff-v2v',
      duration: 6,
      aspectRatio: '1:1',
      motionIntensity: 8,
      seed: 12345,
    },
    onSettingsChange: (settings) => console.log('Settings changed:', settings),
    disabled: false,
  },
}

export const Disabled: Story = {
  args: {
    settings: defaultSettings,
    onSettingsChange: (settings) => console.log('Settings changed:', settings),
    disabled: true,
  },
}

export const MinimalSettings: Story = {
  args: {
    settings: {
      model: 'fal-ai/stable-video',
      duration: 2,
      aspectRatio: '9:16',
      motionIntensity: 1,
      seed: undefined,
    },
    onSettingsChange: (settings) => console.log('Settings changed:', settings),
    disabled: false,
  },
}

export const MaximalSettings: Story = {
  args: {
    settings: {
      model: 'fal-ai/animatediff-v2v',
      duration: 8,
      aspectRatio: '21:9',
      motionIntensity: 10,
      seed: 999999,
    },
    onSettingsChange: (settings) => console.log('Settings changed:', settings),
    disabled: false,
  },
}

export const MobileView: Story = {
  args: {
    settings: defaultSettings,
    onSettingsChange: (settings) => console.log('Settings changed:', settings),
    disabled: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}