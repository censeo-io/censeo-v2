/**
 * Story Manager Component
 * Main component for managing stories in a session
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Fab,
} from "@mui/material";
import { Add as AddIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { Story, CreateStoryRequest, UpdateStoryRequest } from "../types/story";
import { storyApi } from "../services/api";
import StoryList from "./StoryList";
import StoryForm from "./StoryForm";

interface StoryManagerProps {
  sessionId: string;
  isFacilitator: boolean;
}

const StoryManager: React.FC<StoryManagerProps> = ({
  sessionId,
  isFacilitator,
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadStories = useCallback(async () => {
    try {
      setLoading(true);
      const storiesData = await storyApi.getStories(sessionId);
      setStories(storiesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stories");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleCreateStory = () => {
    setEditingStory(null);
    setFormOpen(true);
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    data: CreateStoryRequest | UpdateStoryRequest,
  ) => {
    try {
      setSubmitting(true);

      if (editingStory) {
        // Update existing story
        await storyApi.updateStory(sessionId, editingStory.id, data);
      } else {
        // Create new story
        await storyApi.createStory(sessionId, data as CreateStoryRequest);
      }

      await loadStories(); // Refresh the list
      setFormOpen(false);
      setEditingStory(null);
    } catch (err) {
      throw err; // Let the form handle the error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStory = (storyId: string) => {
    setStoryToDelete(storyId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteStory = async () => {
    if (!storyToDelete) return;

    try {
      await storyApi.deleteStory(sessionId, storyToDelete);
      await loadStories(); // Refresh the list
      setDeleteDialogOpen(false);
      setStoryToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete story");
    }
  };

  const handleUpdateStoryStatus = async (
    storyId: string,
    status: Story["status"],
  ) => {
    try {
      await storyApi.updateStory(sessionId, storyId, { status });
      await loadStories(); // Refresh the list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update story status",
      );
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingStory(null);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" component="h2">
          Stories ({stories.length})
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadStories}
            disabled={loading}
          >
            Refresh
          </Button>
          {isFacilitator && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateStory}
            >
              Add Story
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <StoryList
        stories={stories}
        loading={loading}
        error={null} // Errors are handled above
        isFacilitator={isFacilitator}
        onEditStory={handleEditStory}
        onDeleteStory={handleDeleteStory}
        onUpdateStoryStatus={handleUpdateStoryStatus}
        onRefresh={loadStories}
      />

      {/* Story Form Dialog */}
      <StoryForm
        open={formOpen}
        story={editingStory}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        loading={submitting}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Story</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this story? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteStory}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
      {isFacilitator && (
        <Fab
          color="primary"
          aria-label="add story"
          onClick={handleCreateStory}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            display: { xs: "flex", sm: "none" }, // Only show on mobile
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Paper>
  );
};

export default StoryManager;
