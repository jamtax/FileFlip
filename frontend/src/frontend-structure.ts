// File: frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Content } from '@carbon/react';
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <Content>
        <App />
      </Content>
    </ThemeProvider>
  </React.StrictMode>
);

// File: frontend/src/App.tsx
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Header, HeaderName } from '@carbon/react';
import HomePage from './pages/HomePage';
import ConversionPage from './pages/ConversionPage';
import AboutPage from './pages/AboutPage';
import { ThemeSwitch } from './components/ThemeSwitch';

function App() {
  return (
    <Router>
      <Header aria-label="FileFlip">
        <HeaderName href="/" prefix="JamTax">
          FileFlip
        </HeaderName>
        <div className="ml-auto mr-4">
          <ThemeSwitch />
        </div>
      </Header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/convert" element={<ConversionPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Router>
  );
}

export default App;

// File: frontend/src/index.css
@import '@carbon/styles/css/styles.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --cds-interactive-01: #0f62fe;
  --cds-interactive-02: #393939;
  --cds-interactive-03: #0f62fe;
  --cds-interactive-04: #0f62fe;
}

body {
  margin: 0;
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
    'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Additional Tailwind customizations can be added here */

// File: frontend/src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('fileflip-theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('fileflip-theme', theme);
    document.documentElement.setAttribute('data-carbon-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// File: frontend/src/components/ThemeSwitch.tsx
import React from 'react';
import { Toggle } from '@carbon/react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from '@carbon/icons-react';

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex items-center">
      <Sun className="h-5 w-5 mr-2" />
      <Toggle
        aria-label="Toggle theme"
        id="theme-toggle"
        size="sm"
        toggled={theme === 'dark'}
        onToggle={() => {
          setTheme(theme === 'light' ? 'dark' : 'light');
        }}
      />
      <Moon className="h-5 w-5 ml-2" />
    </div>
  );
}

// File: frontend/src/types/index.ts
export interface TablePreview {
  table_id: string;
  page: number;
  rows: number;
  columns: number;
  preview_data: Record<string, any>[];
  has_multi_header: boolean;
  column_names: string[];
}

export interface ConversionOptions {
  format: 'csv' | 'xlsx' | 'sage';
  delimiter?: string;
  sheet_name?: string;
  include_headers?: boolean;
  skip_rows?: number;
  output_filename?: string;
}

// File: frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // IBM Carbon palette
        'carbon-blue': {
          10: '#edf5ff',
          20: '#d0e2ff',
          30: '#a6c8ff',
          40: '#78a9ff',
          50: '#4589ff',
          60: '#0f62fe',
          70: '#0043ce',
          80: '#002d9c',
          90: '#001d6c',
          100: '#001141',
        },
        'carbon-gray': {
          10: '#f4f4f4',
          20: '#e0e0e0',
          30: '#c6c6c6',
          40: '#a8a8a8',
          50: '#8d8d8d',
          60: '#6f6f6f',
          70: '#525252',
          80: '#393939',
          90: '#262626',
          100: '#161616',
        },
      },
    },
  },
  plugins: [],
};

// File: frontend/package.json
{
  "name": "fileflip-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "@carbon/icons-react": "^11.26.0",
    "@carbon/react": "^1.31.0",
    "@carbon/styles": "^1.31.0",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.13.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.12",
    "@types/react-dom": "^18.2.5",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.38.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.3.4",
    "postcss": "^8.4.24",
    "sass": "^1.63.4",
    "tailwindcss": "^3.3.2",
    "typescript": "^5.0.2",
    "vite": "^4.3.9"
  }
}

// File: frontend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}

// File: frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});
export interface TablePreview {
  table_id: string | undefined;
  page?: number; // Added page property to resolve the error
  fixed?: boolean;
}
