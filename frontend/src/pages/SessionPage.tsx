/**
 * Session Page
 * Displays session details, participants, and provides session management functionality
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Container,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from "@mui/material";
import {
  Person as PersonIcon,
  ContentCopy as CopyIcon,
  ExitToApp as LeaveIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "../components/auth/AuthContext";
import { sessionApi } from "../services/api";
import { Session } from "../types/session";

const SessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setError("Invalid session ID");
      setLoading(false);
      return;
    }

    try {
      const sessionData = await sessionApi.getSession(sessionId);
      setSession(sessionData);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("404") || err.message.includes("not found")) {
          setError("Session not found or you do not have access to it.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load session");
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSession();
    } else {
      setLoading(false);
    }
  }, [sessionId, isAuthenticated, loadSession]);

  const handleCopySessionId = async () => {
    if (sessionId) {
      try {
        await navigator.clipboard.writeText(sessionId);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy session ID:", err);
      }
    }
  };

  const handleLeaveSession = async () => {
    if (!sessionId || !session) return;

    // Don't allow facilitator to leave
    if (session.facilitator.id === user?.id) {
      setError("Facilitators cannot leave their own sessions.");
      return;
    }

    try {
      await sessionApi.leaveSession(sessionId);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave session");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "default";
      case "paused":
        return "warning";
      default:
        return "default";
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Alert severity="warning">Please log in to view this session.</Alert>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading session...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </Box>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Alert severity="info">Session not found.</Alert>
        </Box>
      </Container>
    );
  }

  const isSessionFacilitator = session.facilitator.id === user?.id;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        {/* Session Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {session.name}
              </Typography>
              <Chip
                label={session.status.toUpperCase()}
                color={getStatusColor(session.status) as any}
                size="small"
                sx={{ mb: 1 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Refresh session data">
                <IconButton onClick={loadSession}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              {!isSessionFacilitator && (
                <Tooltip title="Leave session">
                  <IconButton onClick={handleLeaveSession} color="error">
                    <LeaveIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Facilitator: {session.facilitator.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Created: {new Date(session.created_at).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Session ID: {sessionId}
            </Typography>
            <Tooltip title={copySuccess ? "Copied!" : "Copy session ID"}>
              <IconButton size="small" onClick={handleCopySessionId}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Participants Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Participants ({session.participant_count})
          </Typography>

          {session.participants.length === 0 ? (
            <Alert severity="info">
              No active participants in this session.
            </Alert>
          ) : (
            <List>
              {session.participants.map((participant, index) => (
                <React.Fragment key={participant.email}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {participant.name}
                          {participant.email === session.facilitator.email && (
                            <Chip
                              label="Facilitator"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                      secondary={`Joined: ${new Date(participant.joined_at).toLocaleString()}`}
                    />
                  </ListItem>
                  {index < session.participants.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* Session Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Session Actions
            </Typography>

            {session.status === "active" ? (
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button variant="contained" disabled>
                  Start Story Voting (Coming Soon)
                </Button>
                <Button variant="outlined" disabled>
                  Add Stories (Coming Soon)
                </Button>
                {isSessionFacilitator && (
                  <Button variant="outlined" disabled>
                    Manage Session (Coming Soon)
                  </Button>
                )}
              </Box>
            ) : (
              <Alert severity="info">
                This session is {session.status}. No actions are currently
                available.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SessionPage;
