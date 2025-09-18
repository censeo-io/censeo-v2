/**
 * Story Form Component
 * Form for creating and editing stories
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
} from "@mui/material";
import { Story, CreateStoryRequest, UpdateStoryRequest } from "../types/story";

interface StoryFormProps {
  open: boolean;
  story?: Story | null; // null for create, Story for edit
  onClose: () => void;
  onSubmit: (data: CreateStoryRequest | UpdateStoryRequest) => Promise<void>;
  loading?: boolean;
}

const StoryForm: React.FC<StoryFormProps> = ({
  open,
  story,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    story_order: 0,
    status: "pending" as Story["status"],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  const isEditing = Boolean(story);

  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title,
        description: story.description,
        story_order: story.story_order,
        status: story.status,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        story_order: 0,
        status: "pending",
      });
    }
    setErrors({});
    setSubmitError("");
  }, [story, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 500) {
      newErrors.title = "Title cannot exceed 500 characters";
    }

    if (formData.story_order < 0) {
      newErrors.story_order = "Story order must be non-negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitError("");
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        story_order: formData.story_order,
        status: formData.status,
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Error submitting story form:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving the story",
      );
    }
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any,
    ) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: field === "story_order" ? Number(value) : value,
      }));

      // Clear errors when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
      if (submitError) {
        setSubmitError("");
      }
    };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>{isEditing ? "Edit Story" : "Create New Story"}</DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Story Title *"
            value={formData.title}
            onChange={handleInputChange("title")}
            error={Boolean(errors.title)}
            helperText={errors.title || "Enter a clear, concise story title"}
            placeholder="As a user, I want to..."
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleInputChange("description")}
            multiline
            rows={3}
            placeholder="Add any additional details, acceptance criteria, or notes"
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Story Order"
            type="number"
            value={formData.story_order}
            onChange={handleInputChange("story_order")}
            error={Boolean(errors.story_order)}
            helperText={
              errors.story_order ||
              "Order in which this story should be discussed"
            }
            inputProps={{ min: 0 }}
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              value={formData.status}
              label="Status"
              onChange={handleInputChange("status")}
              disabled={loading}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="voting">Voting</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>

          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}

          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Please fix the errors above before submitting.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Update Story" : "Create Story"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoryForm;
