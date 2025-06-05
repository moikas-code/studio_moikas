import type { Meta, StoryObj } from '@storybook/react'
import { VoiceSelectionPanel } from '@/app/tools/audio/components/voice_selection_panel'

const meta = {
  title: 'Audio/VoiceSelectionPanel',
  component: VoiceSelectionPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    selectedVoice: {
      control: 'text',
      description: 'Currently selected voice',
    },
    onVoiceChange: {
      action: 'voice changed',
      description: 'Called when voice selection changes',
    },
  },
} satisfies Meta<typeof VoiceSelectionPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onVoiceChange: (voice) => console.log('Selected voice:', voice),
  },
}

export const WithSelectedVoice: Story = {
  args: {
    selectedVoice: 'alloy',
    onVoiceChange: (voice) => console.log('Selected voice:', voice),
  },
}

export const MobileView: Story = {
  args: {
    selectedVoice: 'echo',
    onVoiceChange: (voice) => console.log('Selected voice:', voice),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const InSettings: Story = {
  args: {
    selectedVoice: 'nova',
    onVoiceChange: (voice) => console.log('Selected voice:', voice),
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
        <h2 className="text-2xl font-bold">Audio Settings</h2>
        <div className="divider"></div>
        <Story />
        <div className="divider"></div>
        <div className="flex justify-end">
          <button className="btn btn-primary">Generate Audio</button>
        </div>
      </div>
    ),
  ],
}