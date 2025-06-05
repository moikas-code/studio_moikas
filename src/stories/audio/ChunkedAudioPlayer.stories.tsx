import type { Meta, StoryObj } from '@storybook/react'
import { ChunkedAudioPlayer } from '@/app/tools/audio/components/chunked_audio_player'

const meta = {
  title: 'Audio/ChunkedAudioPlayer',
  component: ChunkedAudioPlayer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    chunks: {
      description: 'Array of audio chunks with status and URLs',
    },
    totalChunks: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Total number of chunks',
    },
    jobId: {
      control: 'text',
      description: 'Job ID for tracking',
    },
    documentTitle: {
      control: 'text',
      description: 'Title of the document',
    },
  },
} satisfies Meta<typeof ChunkedAudioPlayer>

export default meta
type Story = StoryObj<typeof meta>

const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

const mockChunks = [
  {
    chunk_index: 0,
    status: 'completed' as const,
    audio_url: mockAudioUrl,
    progress: 100,
  },
  {
    chunk_index: 1,
    status: 'completed' as const,
    audio_url: mockAudioUrl,
    progress: 100,
  },
  {
    chunk_index: 2,
    status: 'completed' as const,
    audio_url: mockAudioUrl,
    progress: 100,
  },
]

export const Default: Story = {
  args: {
    chunks: mockChunks,
    totalChunks: 3,
    jobId: 'job_123',
    documentTitle: 'Sample Document',
  },
}

export const Processing: Story = {
  args: {
    chunks: [
      mockChunks[0],
      {
        chunk_index: 1,
        status: 'processing' as const,
        progress: 50,
      },
      {
        chunk_index: 2,
        status: 'pending' as const,
        progress: 0,
      },
    ],
    totalChunks: 3,
    jobId: 'job_456',
    documentTitle: 'Document Being Processed',
  },
}

export const WithFailedChunk: Story = {
  args: {
    chunks: [
      mockChunks[0],
      {
        chunk_index: 1,
        status: 'failed' as const,
        progress: 0,
      },
      mockChunks[2],
    ],
    totalChunks: 3,
    jobId: 'job_789',
    documentTitle: 'Document with Failed Chunk',
  },
}

export const LargeDocument: Story = {
  args: {
    chunks: Array.from({ length: 10 }, (_, i) => ({
      chunk_index: i,
      status: 'completed' as const,
      audio_url: mockAudioUrl,
      progress: 100,
    })),
    totalChunks: 10,
    jobId: 'job_large',
    documentTitle: 'Large Document with Many Chunks',
  },
}

export const Empty: Story = {
  args: {
    chunks: [],
    totalChunks: 5,
    jobId: 'job_empty',
    documentTitle: 'Waiting for Processing',
  },
}

export const MobileView: Story = {
  args: {
    chunks: mockChunks,
    totalChunks: 3,
    jobId: 'job_mobile',
    documentTitle: 'Mobile Document Player',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}