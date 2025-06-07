import type { Meta, StoryObj } from '@storybook/nextjs'
import { VoiceRecorder } from '@/app/tools/audio/components/voice_recorder'

const meta = {
  title: 'Audio/VoiceRecorder',
  component: VoiceRecorder,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    on_recording_complete: {
      action: 'recording complete',
      description: 'Called when recording is finished with base64 URL',
    },
    max_duration: {
      control: { type: 'number', min: 5, max: 300 },
      description: 'Maximum recording duration in seconds',
    },
  },
} satisfies Meta<typeof VoiceRecorder>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    on_recording_complete: (base64_url: string) => console.log('Recording complete:', base64_url),
  },
}

export const WithShortMaxDuration: Story = {
  args: {
    on_recording_complete: (base64_url: string) => console.log('Recording complete:', base64_url),
    max_duration: 10,
  },
}

export const WithLongMaxDuration: Story = {
  args: {
    on_recording_complete: (base64_url: string) => console.log('Recording complete:', base64_url),
    max_duration: 180,
  },
}

export const MobileView: Story = {
  args: {
    on_recording_complete: (base64_url: string) => console.log('Recording complete:', base64_url),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const InForm: Story = {
  args: {
    on_recording_complete: (base64_url: string) => console.log('Recording complete:', base64_url),
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