import type { Meta, StoryObj } from '@storybook/nextjs'
import WorkflowPanel from '@/app/tools/memu/components/workflow_panel'

const meta = {
  title: 'MEMU/WorkflowPanel',
  component: WorkflowPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    show_workflow_panel: {
      control: 'boolean',
      description: 'Whether the workflow panel is shown',
    },
    workflows: {
      description: 'List of available workflows',
    },
    selected_workflow: {
      control: 'text',
      description: 'ID of the currently selected workflow',
    },
    set_selected_workflow: {
      action: 'workflow selected',
      description: 'Called when a workflow is selected',
    },
    set_show_templates: {
      action: 'show templates',
      description: 'Called when templates button is clicked',
    },
    set_show_new_workflow_modal: {
      action: 'show new workflow modal',
      description: 'Called when new workflow button is clicked',
    },
    workflow_limits: {
      description: 'Workflow creation limits',
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
    updated_at: new Date().toISOString(),
    status: 'stable' as const,
  },
  {
    id: 'wf_2',
    name: 'Content Generator',
    description: 'Create blog posts and articles',
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    status: 'early_access' as const,
  },
  {
    id: 'wf_3',
    name: 'Data Analysis',
    description: 'Analyze and visualize data',
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    status: 'experimental' as const,
  },
]

export const Default: Story = {
  args: {
    show_workflow_panel: true,
    workflows: mockWorkflows,
    selected_workflow: null,
    set_selected_workflow: (id: string | null) => console.log('Selected workflow:', id),
    set_show_templates: (show: boolean) => console.log('Show templates:', show),
    set_show_new_workflow_modal: (show: boolean) => console.log('Show new workflow modal:', show),
    workflow_limits: { can_create: true, max_allowed: 5, current_count: 3, plan: 'standard', is_unlimited: false },
  },
}

export const WithSelection: Story = {
  args: {
    show_workflow_panel: true,
    workflows: mockWorkflows,
    selected_workflow: 'wf_2',
    set_selected_workflow: (id: string | null) => console.log('Selected workflow:', id),
    set_show_templates: (show: boolean) => console.log('Show templates:', show),
    set_show_new_workflow_modal: (show: boolean) => console.log('Show new workflow modal:', show),
    workflow_limits: { can_create: true, max_allowed: 5, current_count: 3, plan: 'standard', is_unlimited: false },
  },
}

export const Empty: Story = {
  args: {
    show_workflow_panel: true,
    workflows: [],
    selected_workflow: null,
    set_selected_workflow: (id: string | null) => console.log('Selected workflow:', id),
    set_show_templates: (show: boolean) => console.log('Show templates:', show),
    set_show_new_workflow_modal: (show: boolean) => console.log('Show new workflow modal:', show),
    workflow_limits: { can_create: true, max_allowed: 5, current_count: 0, plan: 'standard', is_unlimited: false },
  },
}

export const SingleWorkflow: Story = {
  args: {
    show_workflow_panel: true,
    workflows: [mockWorkflows[0]],
    selected_workflow: 'wf_1',
    set_selected_workflow: (id: string | null) => console.log('Selected workflow:', id),
    set_show_templates: (show: boolean) => console.log('Show templates:', show),
    set_show_new_workflow_modal: (show: boolean) => console.log('Show new workflow modal:', show),
    workflow_limits: { can_create: true, max_allowed: 5, current_count: 1, plan: 'standard', is_unlimited: false },
  },
}

export const ManyWorkflows: Story = {
  args: {
    show_workflow_panel: true,
    workflows: [
      ...mockWorkflows,
      ...mockWorkflows.map((wf, i) => ({
        ...wf,
        id: `wf_${i + 4}`,
        name: `${wf.name} ${i + 2}`,
      })),
    ],
    selected_workflow: null,
    set_selected_workflow: (id: string | null) => console.log('Selected workflow:', id),
    set_show_templates: (show: boolean) => console.log('Show templates:', show),
    set_show_new_workflow_modal: (show: boolean) => console.log('Show new workflow modal:', show),
    workflow_limits: { can_create: false, max_allowed: 5, current_count: 6, plan: 'standard', is_unlimited: false },
  },
}

export const AtLimit: Story = {
  args: {
    show_workflow_panel: true,
    workflows: mockWorkflows,
    selected_workflow: null,
    set_selected_workflow: (id: string | null) => console.log('Selected workflow:', id),
    set_show_templates: (show: boolean) => console.log('Show templates:', show),
    set_show_new_workflow_modal: (show: boolean) => console.log('Show new workflow modal:', show),
    workflow_limits: { can_create: false, max_allowed: 3, current_count: 3, plan: 'free', is_unlimited: false },
  },
}

export const Collapsed: Story = {
  args: {
    show_workflow_panel: false,
    workflows: mockWorkflows,
    selected_workflow: null,
    set_selected_workflow: (id: string | null) => console.log('Selected workflow:', id),
    set_show_templates: (show: boolean) => console.log('Show templates:', show),
    set_show_new_workflow_modal: (show: boolean) => console.log('Show new workflow modal:', show),
    workflow_limits: { can_create: true, max_allowed: 5, current_count: 3, plan: 'standard', is_unlimited: false },
  },
}