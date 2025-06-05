import type { Meta, StoryObj } from '@storybook/react'
import { VoiceRecorder } from '@/app/tools/audio/components/voice_recorder'

const meta = {
  title: 'Audio/VoiceRecorder',
  component: VoiceRecorder,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onRecordingComplete: {
      action: 'recording complete',
      description: 'Called when recording is finished with audio blob',
    },
    onClear: {
      action: 'cleared',
      description: 'Called when recording is cleared',
    },
    maxDuration: {
      control: { type: 'number', min: 5, max: 300 },
      description: 'Maximum recording duration in seconds',
    },
  },
} satisfies Meta<typeof VoiceRecorder>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onRecordingComplete: (blob) => console.log('Recording complete:', blob),
    onClear: () => console.log('Recording cleared'),
  },
}

export const WithShortMaxDuration: Story = {
  args: {
    onRecordingComplete: (blob) => console.log('Recording complete:', blob),
    onClear: () => console.log('Recording cleared'),
    maxDuration: 10,
  },
}

export const WithLongMaxDuration: Story = {
  args: {
    onRecordingComplete: (blob) => console.log('Recording complete:', blob),
    onClear: () => console.log('Recording cleared'),
    maxDuration: 180,
  },
}

export const MobileView: Story = {
  args: {
    onRecordingComplete: (blob) => console.log('Recording complete:', blob),
    onClear: () => console.log('Recording cleared'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const InForm: Story = {
  args: {
    onRecordingComplete: (blob) => console.log('Recording complete:', blob),
    onClear: () => console.log('Recording cleared'),
  },
  decorators: [
    (Story) => (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Voice Clone Settings</h2>
          <p>Record your voice for cloning:</p>
          <Story />
          <div className="card-actions justify-end">
            <button className="btn btn-primary">Save Voice</button>
          </div>
        </div>
      </div>
    ),
  ],
}