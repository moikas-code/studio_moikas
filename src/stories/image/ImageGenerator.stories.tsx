import type { Meta, StoryObj } from "@storybook/nextjs";
import { ImageGenerator } from "@/components/image_generator";

const meta = {
  title: "Image/ImageGenerator",
  component: ImageGenerator,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ImageGenerator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    available_mp: 1000,
    user_plan: "standard",
    use_job_system: true,
  },
};

export const WithInitialPrompt: Story = {
  args: {
    available_mp: 1000,
    user_plan: "standard",
    use_job_system: true,
  },
  play: async ({ canvasElement }) => {
    // Simulate entering a prompt
    const promptInput = canvasElement.querySelector("textarea");
    if (promptInput) {
      promptInput.value = "A futuristic cityscape at sunset with flying cars";
    }
  },
};

export const MobileView: Story = {
  args: {
    available_mp: 1000,
    user_plan: "standard",
    use_job_system: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

export const TabletView: Story = {
  args: {
    available_mp: 1000,
    user_plan: "standard",
    use_job_system: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

export const DarkTheme: Story = {
  args: {
    available_mp: 1000,
    user_plan: "standard",
    use_job_system: true,
  },
  parameters: {
    backgrounds: { default: "dark" },
    theme: "dark",
  },
};

export const LightTheme: Story = {
  args: {
    available_mp: 1000,
    user_plan: "standard",
    use_job_system: true,
  },
  parameters: {
    backgrounds: { default: "light" },
    theme: "light",
  },
};
