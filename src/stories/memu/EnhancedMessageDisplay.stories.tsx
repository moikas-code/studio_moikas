import type { Meta, StoryObj } from '@storybook/nextjs'
import { EnhancedMessageDisplay } from '@/app/tools/memu/components/enhanced_message_display'

const meta = {
  title: 'MEMU/EnhancedMessageDisplay',
  component: EnhancedMessageDisplay,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      description: 'Message object to display',
    },
    show_debug_info: {
      control: 'boolean',
      description: 'Whether to show debug information',
    },
  },
} satisfies Meta<typeof EnhancedMessageDisplay>

export default meta
type Story = StoryObj<typeof meta>

const baseMessage = {
  id: '1',
  created_at: new Date().toISOString(),
}

export const UserMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      role: 'user',
      content: 'Can you help me create a logo for my startup?',
    },
  },
}

export const AssistantMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      role: 'assistant',
      content: 'I\'d be happy to help you create a logo! Let me ask a few questions first:\n\n1. What\'s the name of your startup?\n2. What industry are you in?\n3. Do you have any color preferences?\n4. What style are you looking for (modern, classic, playful, professional)?',
    },
  },
}

export const SystemMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      role: 'system',
      content: 'Workflow initialized. Ready to assist with logo creation.',
    },
  },
}

export const WithCodeBlock: Story = {
  args: {
    message: {
      ...baseMessage,
      role: 'assistant',
      content: 'Here\'s a simple SVG logo example:\n\n```svg\n<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="50" cy="50" r="40" fill="#3B82F6" />\n  <text x="50" y="55" text-anchor="middle" fill="white" font-size="24" font-weight="bold">AI</text>\n</svg>\n```\n\nThis creates a simple circular logo with your initials.',
    },
  },
}

export const WithMarkdown: Story = {
  args: {
    message: {
      ...baseMessage,
      role: 'assistant',
      content: '# Logo Design Process\n\n## Step 1: Research\n- Analyze competitors\n- Identify target audience\n- Define brand values\n\n## Step 2: Conceptualization\n- **Brainstorm** ideas\n- Create *mood boards*\n- Sketch initial concepts\n\n## Step 3: Design\n1. Create digital drafts\n2. Experiment with colors\n3. Test different variations\n\n> "A logo is the door to your brand" - Design Expert',
    },
  },
}

export const WithImage: Story = {
  args: {
    message: {
      ...baseMessage,
      role: 'assistant',
      content: 'Here\'s a logo concept I generated for you:',
      structured_response: {
        response: 'Here\'s a logo concept I generated for you:',
        metadata: {
          response_type: 'task',
        },
      },
    },
  },
}

export const LongMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      role: 'assistant',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    },
  },
}

export const ErrorMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      role: 'system',
      content: 'Error: Failed to process request. Please try again.',
      structured_response: {
        response: 'Error: Failed to process request. Please try again.',
        metadata: {
          response_type: 'error',
        },
      },
    },
  },
}