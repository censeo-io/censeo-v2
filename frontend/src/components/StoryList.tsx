/**
 * Story List Component
 * Displays list of stories with actions for facilitators
 */

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Button,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartVotingIcon,
  CheckCircle as CompleteIcon,
} from "@mui/icons-material";
import { Story } from "../types/story";

interface StoryListProps {
  stories: Story[];
  loading: boolean;
  error: string | null;
  isFacilitator: boolean;
  onEditStory: (story: Story) => void;
  onDeleteStory: (storyId: string) => void;
  onUpdateStoryStatus: (storyId: string, status: Story["status"]) => void;
  onRefresh: () => void;
}

const StoryList: React.FC<StoryListProps> = ({
  stories,
  loading,
  error,
  isFacilitator,
  onEditStory,
  onDeleteStory,
  onUpdateStoryStatus,
  onRefresh,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    story: Story,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedStory(story);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStory(null);
  };

  const handleEdit = () => {
    if (selectedStory) {
      onEditStory(selectedStory);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedStory) {
      onDeleteStory(selectedStory.id);
    }
    handleMenuClose();
  };

  const handleStartVoting = () => {
    if (selectedStory) {
      onUpdateStoryStatus(selectedStory.id, "voting");
    }
    handleMenuClose();
  };

  const handleComplete = () => {
    if (selectedStory) {
      onUpdateStoryStatus(selectedStory.id, "completed");
    }
    handleMenuClose();
  };

  const getStatusColor = (status: Story["status"]) => {
    switch (status) {
      case "pending":
        return "default";
      case "voting":
        return "primary";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: Story["status"]) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "voting":
        return "Voting";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  if (loading) {
    return <Alert severity="info">Loading stories...</Alert>;
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" onClick={onRefresh}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (stories.length === 0) {
    return (
      <Alert severity="info">
        No stories have been added to this session yet.
        {isFacilitator && " Add your first story to get started!"}
      </Alert>
    );
  }

  return (
    <Box>
      {stories.map((story, index) => (
        <Card key={story.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Typography variant="h6" component="h3">
                    {story.title}
                  </Typography>
                  <Chip
                    label={getStatusLabel(story.status)}
                    color={getStatusColor(story.status) as any}
                    size="small"
                  />
                </Box>
                {story.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {story.description}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Order: #{story.story_order} • Created:{" "}
                  {new Date(story.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              {isFacilitator && (
                <IconButton
                  onClick={(e) => handleMenuOpen(e, story)}
                  size="small"
                >
                  <MoreVertIcon />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Story Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Story</ListItemText>
        </MenuItem>

        {selectedStory?.status === "pending" && (
          <MenuItem onClick={handleStartVoting}>
            <ListItemIcon>
              <StartVotingIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Start Voting</ListItemText>
          </MenuItem>
        )}

        {selectedStory?.status === "voting" && (
          <MenuItem onClick={handleComplete}>
            <ListItemIcon>
              <CompleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark Complete</ListItemText>
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Story</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default StoryList;
