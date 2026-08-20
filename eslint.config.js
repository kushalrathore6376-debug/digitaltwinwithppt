import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // The scene layer drives three.js directly: it mutates the renderer,
    // the orbit controls and material properties from inside useFrame and
    // useEffect. `react-hooks/immutability` is written for values React
    // owns and can re-render from, and these are not those. A three.js
    // scene graph lives outside React's model, and mutating it every frame
    // is the entire point of the render loop — replacing objects to
    // "update" them would allocate sixty times a second and change nothing
    // on screen.
    //
    // Scoped to exactly the files that talk to three.js, so the rule keeps
    // protecting the rest of the app: the store, the UI and the tour logic.
    files: [
      'src/scene/**/*.{js,jsx}',
      'src/tour/Section.jsx',
      'src/components/**/*.{js,jsx}',
    ],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
])
