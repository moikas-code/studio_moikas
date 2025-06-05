import type { Meta, StoryObj } from '@storybook/react'
import { WorkflowEditor } from '@/app/tools/memu/components/workflow_editor'

const meta = {
  title: 'MEMU/WorkflowEditor',
  component: WorkflowEditor,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    workflow: {
      description: 'Current workflow configuration',
    },
    onUpdate: {
      action: 'workflow updated',
      description: 'Called when workflow is updated',
    },
    onClose: {
      action: 'editor closed',
      description: 'Called when editor is closed',
    },
  },
} satisfies Meta<typeof WorkflowEditor>

export default meta
type Story = StoryObj<typeof meta>

const mockWorkflow = {
  id: 'workflow_1',
  name: 'Customer Support Bot',
  description: 'Automated customer support workflow',
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: 'user_123',
  config: {
    nodes: [
      {
        id: 'start',
        type: 'input',
        label: 'User Input',
        config: {},
      },
      {
        id: 'analyze',
        type: 'llm',
        label: 'Analyze Request',
        config: {
          model: 'gpt-4',
          prompt: 'Analyze the customer request and categorize it.',
        },
      },
      {
        id: 'respond',
        type: 'output',
        label: 'Send Response',
        config: {},
      },
    ],
    edges: [
      { source: 'start', target: 'analyze' },
      { source: 'analyze', target: 'respond' },
    ],
  },
}

export const Default: Story = {
  args: {
    workflow: mockWorkflow,
    onUpdate: (workflow) => console.log('Updated workflow:', workflow),
    onClose: () => console.log('Editor closed'),
  },
}

export const EmptyWorkflow: Story = {
  args: {
    workflow: {
      ...mockWorkflow,
      config: {
        nodes: [],
        edges: [],
      },
    },
    onUpdate: (workflow) => console.log('Updated workflow:', workflow),
    onClose: () => console.log('Editor closed'),
  },
}

export const ComplexWorkflow: Story = {
  args: {
    workflow: {
      ...mockWorkflow,
      name: 'Content Generation Pipeline',
      config: {
        nodes: [
          { id: 'input', type: 'input', label: 'Topic Input', config: {} },
          { id: 'research', type: 'llm', label: 'Research', config: { model: 'gpt-4' } },
          { id: 'outline', type: 'llm', label: 'Create Outline', config: { model: 'gpt-4' } },
          { id: 'write', type: 'llm', label: 'Write Content', config: { model: 'gpt-4' } },
          { id: 'image', type: 'tool', label: 'Generate Images', config: { tool: 'image_generation' } },
          { id: 'review', type: 'llm', label: 'Review & Edit', config: { model: 'gpt-4' } },
          { id: 'output', type: 'output', label: 'Final Content', config: {} },
        ],
        edges: [
          { source: 'input', target: 'research' },
          { source: 'research', target: 'outline' },
          { source: 'outline', target: 'write' },
          { source: 'write', target: 'image' },
          { source: 'write', target: 'review' },
          { source: 'image', target: 'review' },
          { source: 'review', target: 'output' },
        ],
      },
    },
    onUpdate: (workflow) => console.log('Updated workflow:', workflow),
    onClose: () => console.log('Editor closed'),
  },
}

export const MobileView: Story = {
  args: {
    workflow: mockWorkflow,
    onUpdate: (workflow) => console.log('Updated workflow:', workflow),
    onClose: () => console.log('Editor closed'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}