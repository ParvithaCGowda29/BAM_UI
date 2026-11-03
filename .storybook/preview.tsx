import type { Preview } from '@storybook/react-vite'
// The same global stylesheets the app entry (src/main.tsx) imports: tokens, fonts, light/dark styling.
import '../src/styles.css'
import '../src/v3.css'
import '../src/ingestion.css'
import '../src/declutter.css'
import '../src/rag-seamless.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  // Theme switch in the toolbar: the app's tokens follow <html data-theme> (dark is the :root default).
  globalTypes: {
    theme: {
      description: 'App theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, { globals }) => {
      document.documentElement.setAttribute('data-theme', globals.theme === 'dark' ? 'dark' : 'light')
      return <Story />
    },
  ],
};

export default preview;
