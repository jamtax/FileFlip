import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Content, Theme } from '@carbon/react';
import { QueryClient, QueryClientProvider } from 'react-query';

// Import components
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ConversionPage from './pages/ConversionPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

// Import global styles
import './styles/globals.scss';

// Create a react-query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Theme theme="g100">
        <Router>
          <Header />
          <Content className="min-h-screen bg-carbon-gray-10">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/convert" element={<ConversionPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Content>
        </Router>
      </Theme>
    </QueryClientProvider>
  );
};

export default App;
