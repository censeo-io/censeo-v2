/**
 * Layout Component
 * Main layout wrapper with header, navigation, and content area
 */

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import { Menu as MenuIcon, AccountCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <Box
      data-testid="layout-container"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <AppBar position="static" data-testid="layout-header" component="header" role="banner">
        <Toolbar>
          <IconButton
            data-testid="menu-button"
            edge="start"
            color="inherit"
            aria-label="menu"
            tabIndex={0}
            onClick={handleHomeClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="h1"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={handleHomeClick}
          >
            Censeo
          </Typography>

          <Box data-testid="navigation-menu" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <Box data-testid="auth-controls" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Welcome, {user?.name}
                </Typography>
                <IconButton
                  color="inherit"
                  onClick={handleMenuOpen}
                  aria-label="account menu"
                  tabIndex={0}
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    <AccountCircle />
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box data-testid="auth-controls">
                <Button color="inherit" onClick={() => navigate('/')}>
                  Login
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        role="main"
        data-testid="layout-content"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;