import { create } from '@storybook/theming/create'

export const darkTheme = create({
  base: 'dark',
  
  // Brand
  brandTitle: 'Studio Moikas Storybook',
  brandUrl: '/',
  brandImage: '/studio_moikas.PNG',
  brandTarget: '_self',

  // Colors - matching Tailwind zinc palette
  colorPrimary: '#3b82f6', // blue-500
  colorSecondary: '#8b5cf6', // violet-500

  // UI
  appBg: '#09090b', // zinc-950
  appContentBg: '#18181b', // zinc-900
  appBorderColor: '#27272a', // zinc-800
  appBorderRadius: 8,

  // Typography
  fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontCode: '"Fira Code", "Monaco", "Consolas", monospace',

  // Text colors
  textColor: '#fafafa', // zinc-50
  textInverseColor: '#09090b', // zinc-950
  textMutedColor: '#a1a1aa', // zinc-400

  // Toolbar default and active colors
  barTextColor: '#e4e4e7', // zinc-200
  barSelectedColor: '#3b82f6', // blue-500
  barBg: '#18181b', // zinc-900

  // Form colors
  inputBg: '#09090b', // zinc-950
  inputBorder: '#27272a', // zinc-800
  inputTextColor: '#fafafa', // zinc-50
  inputBorderRadius: 6,
})

export const lightTheme = create({
  base: 'light',
  
  // Brand
  brandTitle: 'Studio Moikas Storybook',
  brandUrl: '/',
  brandImage: '/studio_moikas.PNG',
  brandTarget: '_self',

  // Colors
  colorPrimary: '#3b82f6', // blue-500
  colorSecondary: '#8b5cf6', // violet-500

  // UI
  appBg: '#ffffff',
  appContentBg: '#fafafa', // zinc-50
  appBorderColor: '#e4e4e7', // zinc-200
  appBorderRadius: 8,

  // Typography
  fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontCode: '"Fira Code", "Monaco", "Consolas", monospace',

  // Text colors
  textColor: '#18181b', // zinc-900
  textInverseColor: '#fafafa', // zinc-50
  textMutedColor: '#71717a', // zinc-500

  // Toolbar default and active colors
  barTextColor: '#27272a', // zinc-800
  barSelectedColor: '#3b82f6', // blue-500
  barBg: '#fafafa', // zinc-50

  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#e4e4e7', // zinc-200
  inputTextColor: '#18181b', // zinc-900
  inputBorderRadius: 6,
})