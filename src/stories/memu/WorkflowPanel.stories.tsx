import type { Meta, StoryObj } from '@storybook/react'
import { WorkflowPanel } from '@/app/tools/memu/components/workflow_panel'

const meta = {
  title: 'MEMU/WorkflowPanel',
  component: WorkflowPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    selectedWorkflowId: {
      control: 'text',
      description: 'ID of the currently selected workflow',
    },
    onWorkflowSelect: {
      action: 'workflow selected',
      description: 'Called when a workflow is selected',
    },
    onNewWorkflow: {
      action: 'new workflow',
      description: 'Called when new workflow button is clicked',
    },
    workflows: {
      description: 'List of available workflows',
    },
  },
} satisfies Meta<typeof WorkflowPanel>

export default meta
type Story = StoryObj<typeof meta>

const mockWorkflows = [
  {
    id: 'wf_1',
    name: 'Customer Support',
    description: 'Handle customer inquiries',
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'user_123',
    config: { nodes: [], edges: [] },
  },
  {
    id: 'wf_2',
    name: 'Content Generator',
    description: 'Create blog posts and articles',
    status: 'active' as const,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    user_id: 'user_123',
    config: { nodes: [], edges: [] },
  },
  {
    id: 'wf_3',
    name: 'Data Analysis',
    description: 'Analyze and visualize data',
    status: 'inactive' as const,
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    user_id: 'user_123',
    config: { nodes: [], edges: [] },
  },
]

export const Default: Story = {
  args: {
    workflows: mockWorkflows,
    onWorkflowSelect: (id) => console.log('Selected workflow:', id),
    onNewWorkflow: () => console.log('Create new workflow'),
  },
}

export const WithSelection: Story = {
  args: {
    workflows: mockWorkflows,
    selectedWorkflowId: 'wf_2',
    onWorkflowSelect: (id) => console.log('Selected workflow:', id),
    onNewWorkflow: () => console.log('Create new workflow'),
  },
}

export const Empty: Story = {
  args: {
    workflows: [],
    onWorkflowSelect: (id) => console.log('Selected workflow:', id),
    onNewWorkflow: () => console.log('Create new workflow'),
  },
}

export const SingleWorkflow: Story = {
  args: {
    workflows: [mockWorkflows[0]],
    selectedWorkflowId: 'wf_1',
    onWorkflowSelect: (id) => console.log('Selected workflow:', id),
    onNewWorkflow: () => console.log('Create new workflow'),
  },
}

export const ManyWorkflows: Story = {
  args: {
    workflows: [
      ...mockWorkflows,
      ...mockWorkflows.map((wf, i) => ({
        ...wf,
        id: `wf_${i + 4}`,
        name: `${wf.name} ${i + 2}`,
      })),
    ],
    onWorkflowSelect: (id) => console.log('Selected workflow:', id),
    onNewWorkflow: () => console.log('Create new workflow'),
  },
}

export const Loading: Story = {
  args: {
    workflows: [],
    onWorkflowSelect: (id) => console.log('Selected workflow:', id),
    onNewWorkflow: () => console.log('Create new workflow'),
  },
  decorators: [
    (Story) => (
      <div className="animate-pulse">
        <Story />
      </div>
    ),
  ],
}