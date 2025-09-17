/**
 * Join Session Page
 * Allows authenticated users to join existing story pointing sessions
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Container,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../components/auth/AuthContext";
import { sessionApi } from "../services/api";

const JoinSessionPage: React.FC = () => {
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId.trim()) {
      setError("Session ID is required");
      return;
    }

    // Basic UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId.trim())) {
      setError("Please enter a valid session ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await sessionApi.joinSession(sessionId.trim());

      // Navigate to the session page
      navigate(`/session/${response.session.session_id}`);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("404") || err.message.includes("not found")) {
          setError("Session not found. Please check the session ID.");
        } else if (err.message.includes("completed")) {
          setError("This session has been completed and cannot be joined.");
        } else if (err.message.includes("already joined")) {
          // Still navigate to the session if already joined
          navigate(`/session/${sessionId.trim()}`);
          return;
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to join session");
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Alert severity="warning">Please log in to join a session.</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Join Session
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter the session ID provided by your facilitator to join the story
            pointing session.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Session ID"
              variant="outlined"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
              sx={{ mb: 3 }}
              disabled={loading}
              required
              helperText="Session ID is a unique identifier shared by the session facilitator"
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !sessionId.trim()}
                sx={{ flex: 1 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Joining...
                  </>
                ) : (
                  "Join Session"
                )}
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              As a participant, you will be able to:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>View stories to estimate</li>
              <li>Cast your votes using story points</li>
              <li>See voting results when revealed</li>
              <li>Participate in team discussions</li>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default JoinSessionPage;
