import type { Meta, StoryObj } from '@storybook/nextjs'
import WorkflowEditor from '@/app/tools/memu/components/workflow_editor'

const meta = {
  title: 'MEMU/WorkflowEditor',
  component: WorkflowEditor,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    initial_nodes: {
      description: 'Initial nodes configuration',
    },
    on_save: {
      action: 'saved',
      description: 'Called when workflow is saved',
    },
    on_run: {
      action: 'run',
      description: 'Called when workflow is run',
    },
    workflow_id: {
      control: 'text',
      description: 'Workflow ID',
    },
  },
} satisfies Meta<typeof WorkflowEditor>

export default meta
type Story = StoryObj<typeof meta>

const mockNodes = [
  {
    id: 'start',
    type: 'input',
    position: { x: 100, y: 100 },
    data: {
      label: 'User Input',
    },
  },
  {
    id: 'analyze',
    type: 'llm',
    position: { x: 300, y: 100 },
    data: {
      label: 'Analyze Request',
      model: 'gpt-4',
      prompt: 'Analyze the customer request and categorize it.',
    },
  },
  {
    id: 'respond',
    type: 'output',
    position: { x: 500, y: 100 },
    data: {
      label: 'Send Response',
    },
  },
]

export const Default: Story = {
  args: {
    initial_nodes: mockNodes,
    on_save: (nodes: any, connections: any) => console.log('Saved nodes:', nodes, 'connections:', connections),
    on_run: () => console.log('Run workflow'),
    workflow_id: 'workflow_1',
  },
}

export const EmptyWorkflow: Story = {
  args: {
    initial_nodes: [],
    on_save: (nodes: any, connections: any) => console.log('Saved nodes:', nodes, 'connections:', connections),
    on_run: () => console.log('Run workflow'),
    workflow_id: 'workflow_empty',
  },
}

export const ComplexWorkflow: Story = {
  args: {
    initial_nodes: [
      { id: 'input', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Topic Input' } },
      { id: 'research', type: 'llm', position: { x: 300, y: 50 }, data: { label: 'Research', model: 'gpt-4' } },
      { id: 'outline', type: 'llm', position: { x: 500, y: 50 }, data: { label: 'Create Outline', model: 'gpt-4' } },
      { id: 'write', type: 'llm', position: { x: 700, y: 100 }, data: { label: 'Write Content', model: 'gpt-4' } },
      { id: 'image', type: 'tool', position: { x: 700, y: 200 }, data: { label: 'Generate Images', tool: 'image_generation' } },
      { id: 'review', type: 'llm', position: { x: 900, y: 150 }, data: { label: 'Review & Edit', model: 'gpt-4' } },
      { id: 'output', type: 'output', position: { x: 1100, y: 150 }, data: { label: 'Final Content' } },
    ],
    on_save: (nodes: any, connections: any) => console.log('Saved nodes:', nodes, 'connections:', connections),
    on_run: () => console.log('Run workflow'),
    workflow_id: 'workflow_complex',
  },
}

export const DataProcessing: Story = {
  args: {
    initial_nodes: [
      { id: 'data-input', type: 'input', position: { x: 100, y: 150 }, data: { label: 'Data Source' } },
      { id: 'clean', type: 'llm', position: { x: 300, y: 100 }, data: { label: 'Clean Data', model: 'gpt-3.5-turbo' } },
      { id: 'analyze', type: 'llm', position: { x: 300, y: 200 }, data: { label: 'Analyze Data', model: 'gpt-4' } },
      { id: 'visualize', type: 'tool', position: { x: 500, y: 150 }, data: { label: 'Create Charts', tool: 'chart_generator' } },
      { id: 'report', type: 'output', position: { x: 700, y: 150 }, data: { label: 'Generate Report' } },
    ],
    on_save: (nodes: any, connections: any) => console.log('Saved nodes:', nodes, 'connections:', connections),
    on_run: () => console.log('Run workflow'),
    workflow_id: 'workflow_data',
  },
}

export const MobileView: Story = {
  args: {
    initial_nodes: mockNodes,
    on_save: (nodes: any, connections: any) => console.log('Saved nodes:', nodes, 'connections:', connections),
    on_run: () => console.log('Run workflow'),
    workflow_id: 'workflow_mobile',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}