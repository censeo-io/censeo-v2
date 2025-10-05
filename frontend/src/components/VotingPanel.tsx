/**
 * Voting Panel Component
 * Displays voting interface for story point estimation
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  Chip,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  HowToVote as VoteIcon,
} from "@mui/icons-material";
import { FibonacciPoints, VotingStatusResponse } from "../types/vote";
import { voteApi } from "../services/api";

const FIBONACCI_POINTS: FibonacciPoints[] = [
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "21",
  "?",
];

interface VotingPanelProps {
  storyId: string;
  storyStatus: "pending" | "voting" | "completed";
  onVoteSubmitted?: () => void;
}

const VotingPanel: React.FC<VotingPanelProps> = ({
  storyId,
  storyStatus,
  onVoteSubmitted,
}) => {
  const [selectedPoints, setSelectedPoints] = useState<FibonacciPoints | null>(
    null,
  );
  const [votingStatus, setVotingStatus] = useState<VotingStatusResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchVotingStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await voteApi.getVotingStatus(storyId);
      setVotingStatus(status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch voting status",
      );
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  // Fetch voting status when component mounts or story status changes
  useEffect(() => {
    if (storyStatus !== "pending") {
      fetchVotingStatus();
    }
  }, [storyId, storyStatus, fetchVotingStatus]);

  const handleVoteSubmit = async (points: FibonacciPoints) => {
    setSubmitting(true);
    setError(null);
    try {
      await voteApi.submitVote(storyId, { points });
      setSelectedPoints(points);
      await fetchVotingStatus();
      onVoteSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  // Don't show voting panel for pending stories
  if (storyStatus === "pending") {
    return null;
  }

  if (loading && !votingStatus) {
    return <LinearProgress />;
  }

  if (error && !votingStatus) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const votingProgress = votingStatus
    ? (votingStatus.votes_count / votingStatus.total_participants) * 100
    : 0;

  return (
    <Box sx={{ mt: 2 }}>
      {/* Voting Status */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <VoteIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {votingStatus?.votes_count || 0} of{" "}
            {votingStatus?.total_participants || 0} voted
          </Typography>
          <LinearProgress
            variant="determinate"
            value={votingProgress}
            sx={{ mt: 0.5 }}
          />
        </Box>
      </Box>

      {/* Voting Interface - Only show if story is in voting status */}
      {storyStatus === "voting" && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select your estimate:
          </Typography>
          <Grid container spacing={1}>
            {FIBONACCI_POINTS.map((points) => (
              <Grid item key={points}>
                <Button
                  variant={selectedPoints === points ? "contained" : "outlined"}
                  onClick={() => handleVoteSubmit(points)}
                  disabled={submitting}
                  size="large"
                  data-testid={`vote-button-${points}`}
                  aria-label={`Vote ${points} points`}
                  sx={{
                    minWidth: 60,
                    fontWeight: "bold",
                  }}
                  startIcon={
                    selectedPoints === points ? <CheckIcon /> : undefined
                  }
                >
                  {points}
                </Button>
              </Grid>
            ))}
          </Grid>
          {selectedPoints && (
            <Alert severity="success" sx={{ mt: 2 }}>
              You voted: {selectedPoints} points
              {storyStatus === "voting" &&
                " (You can change your vote before it's revealed)"}
            </Alert>
          )}
        </Box>
      )}

      {/* Vote Results - Only show if votes are revealed */}
      {votingStatus?.revealed && votingStatus.votes.length > 0 && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Vote Results:
            </Typography>
            <Grid container spacing={1}>
              {votingStatus.votes.map((vote) => (
                <Grid item xs={12} sm={6} key={vote.vote_id}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {vote.user.name || vote.user.email}
                    </Typography>
                    <Chip label={vote.points} color="primary" size="small" />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default VotingPanel;
