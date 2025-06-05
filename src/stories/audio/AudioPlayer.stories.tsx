import type { Meta, StoryObj } from '@storybook/react'
import { AudioPlayer } from '@/app/tools/audio/components/audio_player'

const meta = {
  title: 'Audio/AudioPlayer',
  component: AudioPlayer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    url: {
      control: 'text',
      description: 'Audio file URL',
    },
    title: {
      control: 'text',
      description: 'Title of the audio',
    },
    onDownload: {
      action: 'download clicked',
      description: 'Called when download button is clicked',
    },
  },
} satisfies Meta<typeof AudioPlayer>

export default meta
type Story = StoryObj<typeof meta>

// Mock audio URL (you can replace with actual audio files)
const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

export const Default: Story = {
  args: {
    url: mockAudioUrl,
    title: 'Sample Audio',
  },
}

export const WithLongTitle: Story = {
  args: {
    url: mockAudioUrl,
    title: 'This is a very long audio title that might wrap to multiple lines in the player interface',
  },
}

export const WithDownload: Story = {
  args: {
    url: mockAudioUrl,
    title: 'Downloadable Audio',
    onDownload: () => console.log('Downloading audio...'),
  },
}

export const NoTitle: Story = {
  args: {
    url: mockAudioUrl,
  },
}

export const ErrorState: Story = {
  args: {
    url: 'https://invalid-url.com/audio.mp3',
    title: 'Broken Audio',
  },
}

export const MobileView: Story = {
  args: {
    url: mockAudioUrl,
    title: 'Mobile Audio Player',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}