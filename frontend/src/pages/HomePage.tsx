/**
 * HomePage Component
 * Landing page with authentication and session creation/joining options
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [loginForm, setLoginForm] = useState({ name: '', email: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [validationErrors, setValidationErrors] = useState({ name: '', email: '' });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const errors = { name: '', email: '' };
    let isValid = true;

    if (!loginForm.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!loginForm.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(loginForm.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleInputChange = (field: 'name' | 'email') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLoginForm(prev => ({ ...prev, [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear login error
    if (loginError) {
      setLoginError('');
    }
  };

  const handleEmailBlur = () => {
    if (loginForm.email && !validateEmail(loginForm.email)) {
      setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      await login(loginForm.name, loginForm.email);
      setLoginForm({ name: '', email: '' });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const isFormValid = loginForm.name.trim() && loginForm.email.trim() && validateEmail(loginForm.email);

  if (isLoading) {
    return (
      <Box
        data-testid="homepage-container"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      data-testid="homepage-container"
      sx={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        gap: 4,
      }}
    >
      <Box
        data-testid="homepage-hero"
        sx={{
          textAlign: 'center',
          maxWidth: 800,
          mb: 4,
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          Censeo Story Pointing
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
          Collaborative story estimation for agile development teams
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create sessions, estimate stories with your team, and reveal votes when everyone is ready.
          Simple, fast, and effective story pointing.
        </Typography>
      </Box>

      <Box data-testid="homepage-actions" sx={{ width: '100%', maxWidth: 600 }}>
        {isAuthenticated ? (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => navigate('/create-session')}
                sx={{ py: 2 }}
              >
                Create Session
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigate('/join-session')}
                sx={{ py: 2 }}
              >
                Join Session
              </Button>
            </Grid>
          </Grid>
        ) : (
          <Box data-testid="auth-section">
            <Card sx={{ maxWidth: 400, mx: 'auto' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom align="center">
                  Login to Get Started
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  Enter your name and email to join or create sessions
                </Typography>

                {loginError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {loginError}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleLogin} data-testid="login-form">
                  <TextField
                    fullWidth
                    label="Name"
                    value={loginForm.name}
                    onChange={handleInputChange('name')}
                    error={!!validationErrors.name}
                    helperText={validationErrors.name}
                    required
                    sx={{ mb: 2 }}
                    inputProps={{
                      'aria-label': 'Name',
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={loginForm.email}
                    onChange={handleInputChange('email')}
                    onBlur={handleEmailBlur}
                    error={!!validationErrors.email}
                    helperText={validationErrors.email}
                    required
                    sx={{ mb: 3 }}
                    inputProps={{
                      'aria-label': 'Email',
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={!isFormValid || loginLoading}
                    sx={{ py: 1.5 }}
                  >
                    {loginLoading ? <CircularProgress size={24} /> : 'Login'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;