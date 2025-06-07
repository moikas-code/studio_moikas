import type { Meta, StoryObj } from '@storybook/nextjs'
import { AudioPlayer } from '@/app/tools/audio/components/audio_player'

const meta = {
  title: 'Audio/AudioPlayer',
  component: AudioPlayer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    audio_url: {
      control: 'text',
      description: 'Audio file URL',
    },
    text_preview: {
      control: 'text',
      description: 'Preview text for the audio',
    },
    mana_points_used: {
      control: 'number',
      description: 'Mana points used for generation',
    },
    on_download: {
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
    audio_url: mockAudioUrl,
    text_preview: 'This is a sample audio file for testing the audio player component.',
    mana_points_used: 50,
  },
}

export const WithLongText: Story = {
  args: {
    audio_url: mockAudioUrl,
    text_preview: 'This is a very long text preview that might wrap to multiple lines in the player interface. It contains detailed information about the audio content and might be useful for providing context to the user about what they are listening to.',
    mana_points_used: 75,
  },
}

export const WithDownload: Story = {
  args: {
    audio_url: mockAudioUrl,
    text_preview: 'Downloadable Audio',
    mana_points_used: 100,
    on_download: (format: string) => console.log('Downloading audio in format:', format),
  },
}

export const MinimalInfo: Story = {
  args: {
    audio_url: mockAudioUrl,
  },
}

export const ErrorState: Story = {
  args: {
    audio_url: 'https://invalid-url.com/audio.mp3',
    text_preview: 'This audio file cannot be loaded',
  },
}

export const MobileView: Story = {
  args: {
    audio_url: mockAudioUrl,
    text_preview: 'Mobile Audio Player',
    mana_points_used: 25,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}