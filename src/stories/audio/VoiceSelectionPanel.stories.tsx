import type { Meta, StoryObj } from '@storybook/nextjs'
import { VoiceSelectionPanel } from '@/app/tools/audio/components/voice_selection_panel'

const meta = {
  title: 'Audio/VoiceSelectionPanel',
  component: VoiceSelectionPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    selected_voice: {
      control: 'text',
      description: 'Currently selected voice',
    },
    on_voice_change: {
      action: 'voice changed',
      description: 'Called when voice selection changes',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the panel is disabled',
    },
  },
} satisfies Meta<typeof VoiceSelectionPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    selected_voice: 'Richard',
    on_voice_change: (voice: string) => console.log('Selected voice:', voice),
  },
}

export const WithSelectedVoice: Story = {
  args: {
    selected_voice: 'Richard',
    on_voice_change: (voice: string) => console.log('Selected voice:', voice),
  },
}

export const MobileView: Story = {
  args: {
    selected_voice: 'Richard',
    on_voice_change: (voice: string) => console.log('Selected voice:', voice),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const InSettings: Story = {
  args: {
    selected_voice: 'Richard',
    on_voice_change: (voice: string) => console.log('Selected voice:', voice),
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

export const Disabled: Story = {
  args: {
    selected_voice: 'Richard',
    on_voice_change: (voice: string) => console.log('Selected voice:', voice),
    disabled: true,
  },
}