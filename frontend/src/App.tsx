/**
 * Main App Component
 * Root component that sets up routing, theme, and authentication context
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './components/auth/AuthContext';
import { createAppTheme } from './theme/theme';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/ErrorBoundary';

const theme = createAppTheme();

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Box
              data-testid="app-container"
              sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: theme.typography.fontFamily,
              }}
              component="main"
              role="main"
            >
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/create-session" element={<div>Create Session (Coming Soon)</div>} />
                  <Route path="/join-session" element={<div>Join Session (Coming Soon)</div>} />
                  <Route path="*" element={<div>Page Not Found</div>} />
                </Routes>
              </Layout>
            </Box>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;