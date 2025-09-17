/**
 * Create Session Page
 * Allows authenticated users to create new story pointing sessions
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

const CreateSessionPage: React.FC = () => {
  const [sessionName, setSessionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionName.trim()) {
      setError("Session name is required");
      return;
    }

    if (sessionName.trim().length > 200) {
      setError("Session name cannot exceed 200 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await sessionApi.createSession({
        name: sessionName.trim(),
      });

      // Navigate to the session page
      navigate(`/session/${session.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Alert severity="warning">Please log in to create a session.</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Session
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start a new story pointing session. You'll be the facilitator and
            can invite team members to join.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Session Name"
              variant="outlined"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Sprint Planning - February 2024"
              sx={{ mb: 3 }}
              inputProps={{ maxLength: 200 }}
              helperText={`${sessionName.length}/200 characters`}
              disabled={loading}
              required
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
                disabled={loading || !sessionName.trim()}
                sx={{ flex: 1 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Creating...
                  </>
                ) : (
                  "Create Session"
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
              As the facilitator, you will be able to:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>Add stories to estimate</li>
              <li>Control the voting rounds</li>
              <li>View all participant votes</li>
              <li>Manage session status</li>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateSessionPage;
