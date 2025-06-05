import type { Preview } from '@storybook/nextjs'
import React from 'react'
import '../src/app/globals.css'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import { ClerkProvider } from '@clerk/nextjs'
import { MpProvider } from '../src/app/context/mp_context'

// Mock Clerk for Storybook
const mockClerk = {
  user: {
    id: 'user_storybook',
    firstName: 'Storybook',
    lastName: 'User',
    email: 'storybook@example.com',
  },
  session: {
    id: 'session_storybook',
  },
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#09090b', // zinc-950
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'dark',
      attributeName: 'data-theme',
    }),
    (Story) => (
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_storybook'}
      >
        <MpProvider initialBalance={1000}>
          <div className="min-h-screen bg-base-100">
            <Story />
          </div>
        </MpProvider>
      </ClerkProvider>
    ),
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark'],
        showName: true,
      },
    },
  },
}

export default preview