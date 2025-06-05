import { addons } from '@storybook/manager-api'
import { darkTheme } from './themes'

addons.setConfig({
  theme: darkTheme,
  sidebar: {
    showRoots: true,
    collapsedRoots: [],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
})