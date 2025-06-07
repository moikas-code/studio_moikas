import type { Meta, StoryObj } from '@storybook/nextjs'
import { ChunkedAudioPlayer } from '@/app/tools/audio/components/chunked_audio_player'
import { ChunkedTTSResult } from '@/app/tools/audio/hooks/use_webhook_chunked_tts'

const meta = {
  title: 'Audio/ChunkedAudioPlayer',
  component: ChunkedAudioPlayer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    chunked_result: {
      description: 'Chunked TTS result object with chunks array',
    },
    text_preview: {
      control: 'text',
      description: 'Preview text for the audio',
    },
    on_regenerate_chunk: {
      action: 'regenerate chunk',
      description: 'Called when regenerating a chunk',
    },
    is_regenerating_chunk: {
      control: 'number',
      description: 'Index of chunk currently being regenerated',
    },
  },
} satisfies Meta<typeof ChunkedAudioPlayer>

export default meta
type Story = StoryObj<typeof meta>

const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

const mockChunks = [
  {
    index: 0,
    text: 'This is the first chunk of text that has been converted to audio.',
    status: 'completed' as const,
    audio_url: mockAudioUrl,
    mana_points_used: 10,
  },
  {
    index: 1,
    text: 'This is the second chunk of text, continuing the document.',
    status: 'completed' as const,
    audio_url: mockAudioUrl,
    mana_points_used: 8,
  },
  {
    index: 2,
    text: 'And this is the final chunk of the document.',
    status: 'completed' as const,
    audio_url: mockAudioUrl,
    mana_points_used: 7,
  },
]

export const Default: Story = {
  args: {
    chunked_result: {
      job_id: 'job_123',
      chunks: mockChunks,
      total_characters: 150,
      total_mana_points: 25,
      overall_status: 'completed',
      overall_progress: 100,
    } as ChunkedTTSResult,
    text_preview: 'This is a sample document that has been converted to audio.',
  },
}

export const Processing: Story = {
  args: {
    chunked_result: {
      job_id: 'job_456',
      chunks: [
        mockChunks[0],
        {
          index: 1,
          text: 'This chunk is currently being processed.',
          status: 'processing' as const,
        },
        {
          index: 2,
          text: 'This chunk is waiting to be processed.',
          status: 'pending' as const,
        },
      ],
      total_characters: 150,
      total_mana_points: 25,
      overall_status: 'processing',
      overall_progress: 33,
    } as ChunkedTTSResult,
    text_preview: 'Document is being processed, please wait...',
  },
}

export const WithFailedChunk: Story = {
  args: {
    chunked_result: {
      job_id: 'job_789',
      chunks: [
        mockChunks[0],
        {
          index: 1,
          text: 'This chunk failed to generate audio.',
          status: 'failed' as const,
        },
        mockChunks[2],
      ],
      total_characters: 150,
      total_mana_points: 25,
      overall_status: 'failed',
      overall_progress: 66,
    } as ChunkedTTSResult,
    text_preview: 'Some chunks failed to process. You can regenerate them.',
    on_regenerate_chunk: async (chunk_index: number) => console.log('Regenerating chunk:', chunk_index),
  },
}

export const LargeDocument: Story = {
  args: {
    chunked_result: {
      job_id: 'job_large',
      chunks: Array.from({ length: 10 }, (_, i) => ({
        index: i,
        text: `This is chunk number ${i + 1} of a large document.`,
        status: 'completed' as const,
        audio_url: mockAudioUrl,
        mana_points_used: 5,
      })),
      total_characters: 500,
      total_mana_points: 50,
      overall_status: 'completed',
      overall_progress: 100,
    } as ChunkedTTSResult,
    text_preview: 'This is a large document that has been split into multiple audio chunks for better processing.',
  },
}

export const Empty: Story = {
  args: {
    chunked_result: {
      job_id: 'job_empty',
      chunks: [],
      total_characters: 0,
      total_mana_points: 0,
      overall_status: 'pending',
      overall_progress: 0,
    } as ChunkedTTSResult,
    text_preview: 'Waiting for processing to begin...',
  },
}

export const MobileView: Story = {
  args: {
    chunked_result: {
      job_id: 'job_mobile',
      chunks: mockChunks,
      total_characters: 150,
      total_mana_points: 25,
      overall_status: 'completed',
      overall_progress: 100,
    } as ChunkedTTSResult,
    text_preview: 'Mobile view of the chunked audio player.',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const RegeneratingChunk: Story = {
  args: {
    chunked_result: {
      job_id: 'job_regen',
      chunks: [
        mockChunks[0],
        {
          index: 1,
          text: 'This chunk is being regenerated.',
          status: 'processing' as const,
        },
        mockChunks[2],
      ],
      total_characters: 150,
      total_mana_points: 25,
      overall_status: 'processing',
      overall_progress: 66,
    } as ChunkedTTSResult,
    text_preview: 'Regenerating a failed chunk.',
    on_regenerate_chunk: async (chunk_index: number) => console.log('Regenerating chunk:', chunk_index),
    is_regenerating_chunk: 1,
  },
}