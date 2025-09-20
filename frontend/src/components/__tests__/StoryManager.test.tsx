/**
 * Tests for StoryManager Component
 * Comprehensive test suite to achieve high coverage
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import StoryManager from "../StoryManager";
import { storyApi } from "../../services/api";
import { createAppTheme } from "../../theme/theme";
import { Story } from "../../types/story";

// Mock the API
jest.mock("../../services/api", () => ({
  storyApi: {
    getStories: jest.fn(),
    createStory: jest.fn(),
    updateStory: jest.fn(),
    deleteStory: jest.fn(),
  },
}));

const mockStoryApi = storyApi as jest.Mocked<typeof storyApi>;

// Mock child components to focus on StoryManager logic
jest.mock("../StoryList", () => {
  return function MockStoryList({
    stories,
    loading,
    error,
    isFacilitator,
    onEditStory,
    onDeleteStory,
    onUpdateStoryStatus,
    onRefresh,
  }: any) {
    return (
      <div data-testid="story-list">
        <div data-testid="story-count">{stories.length}</div>
        <div data-testid="loading-state">{loading ? "loading" : "not-loading"}</div>
        {stories.map((story: Story) => (
          <div key={story.id} data-testid={`story-${story.id}`}>
            <span>{story.title}</span>
            {isFacilitator && (
              <>
                <button onClick={() => onEditStory(story)}>Edit</button>
                <button onClick={() => onDeleteStory(story.id)}>Delete</button>
              </>
            )}
            <button onClick={() => onUpdateStoryStatus(story.id, "completed")}>
              Mark Complete
            </button>
          </div>
        ))}
        <button onClick={onRefresh}>Mock Refresh</button>
      </div>
    );
  };
});

jest.mock("../StoryForm", () => {
  return function MockStoryForm({ open, story, onClose, onSubmit, loading }: any) {
    if (!open) return null;
    return (
      <div data-testid="story-form">
        <div data-testid="form-mode">{story ? "edit" : "create"}</div>
        <div data-testid="form-loading">{loading ? "submitting" : "not-submitting"}</div>
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={() =>
            onSubmit({
              title: "Test Story",
              description: "Test Description",
              story_order: 1,
              status: "pending",
            })
          }
        >
          Submit
        </button>
        <button
          onClick={() => onSubmit(Promise.reject(new Error("API Error")))}
          data-testid="submit-error"
        >
          Submit Error
        </button>
      </div>
    );
  };
});

const mockStories: Story[] = [
  {
    id: "1",
    session: "session-1",
    title: "Story 1",
    description: "First story",
    story_order: 1,
    status: "pending",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    session: "session-1",
    title: "Story 2",
    description: "Second story",
    story_order: 2,
    status: "voting",
    created_at: "2024-01-02T00:00:00Z",
  },
];

const renderStoryManager = async (props: { sessionId?: string; isFacilitator?: boolean } = {}) => {
  const defaultProps = {
    sessionId: "session-1",
    isFacilitator: false,
    ...props,
  };

  const theme = createAppTheme();

  const view = render(
    <ThemeProvider theme={theme}>
      <StoryManager {...defaultProps} />
    </ThemeProvider>,
  );

  // Wait for initial loading to complete - this allows async operations to finish
  await waitFor(() => {
    expect(screen.getByTestId("loading-state")).toHaveTextContent("not-loading");
  });

  return view;
};

describe("StoryManager Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoryApi.getStories.mockResolvedValue(mockStories);
  });

  describe("Component Rendering", () => {
    it("renders with correct title and story count", async () => {
      await renderStoryManager();

      await waitFor(() => {
        expect(screen.getByText(/Stories \(2\)/)).toBeInTheDocument();
      });
    });

    it("shows refresh button for all users", async () => {
      await renderStoryManager();

      expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    });

    it("shows Add Story button only for facilitators", async () => {
      await renderStoryManager({ isFacilitator: true });

      expect(screen.getByRole("button", { name: /add story/i })).toBeInTheDocument();
    });

    it("hides Add Story button for non-facilitators", async () => {
      await renderStoryManager({ isFacilitator: false });

      expect(screen.queryByRole("button", { name: /add story/i })).not.toBeInTheDocument();
    });

    it("shows floating action button for facilitators on mobile", async () => {
      await renderStoryManager({ isFacilitator: true });

      const fab = screen.getByLabelText("add story");
      expect(fab).toBeInTheDocument();
    });
  });

  describe("Data Loading", () => {
    it("loads stories on mount", async () => {
      await renderStoryManager({ sessionId: "test-session" });

      await waitFor(() => {
        expect(mockStoryApi.getStories).toHaveBeenCalledWith("test-session");
      });

      await waitFor(() => {
        expect(screen.getByTestId("story-count")).toHaveTextContent("2");
      });
    });

    it("handles loading state correctly", async () => {
      await renderStoryManager();

      expect(screen.getByTestId("loading-state")).toHaveTextContent("loading");
    });

    it("handles API errors during load", async () => {
      const errorMessage = "Failed to load stories";
      mockStoryApi.getStories.mockRejectedValue(new Error(errorMessage));

      await renderStoryManager();

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("handles non-Error exceptions during load", async () => {
      mockStoryApi.getStories.mockRejectedValue("String error");

      await renderStoryManager();

      await waitFor(() => {
        expect(screen.getByText("Failed to load stories")).toBeInTheDocument();
      });
    });
  });

  describe("Refresh Functionality", () => {
    it("refreshes stories when refresh button is clicked", async () => {
      await renderStoryManager();

      await waitFor(() => {
        expect(mockStoryApi.getStories).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

      await waitFor(() => {
        expect(mockStoryApi.getStories).toHaveBeenCalledTimes(2);
      });
    });

    it("refreshes through StoryList refresh callback", async () => {
      await renderStoryManager();

      await waitFor(() => {
        expect(mockStoryApi.getStories).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(screen.getByText("Refresh List"));

      await waitFor(() => {
        expect(mockStoryApi.getStories).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Story Creation", () => {
    it("opens create form when Add Story button is clicked", async () => {
      await renderStoryManager({ isFacilitator: true });

      fireEvent.click(screen.getByRole("button", { name: /add story/i }));

      expect(screen.getByTestId("story-form")).toBeInTheDocument();
      expect(screen.getByTestId("form-mode")).toHaveTextContent("create");
    });

    it("opens create form when FAB is clicked", async () => {
      await renderStoryManager({ isFacilitator: true });

      fireEvent.click(screen.getByLabelText("add story"));

      expect(screen.getByTestId("story-form")).toBeInTheDocument();
      expect(screen.getByTestId("form-mode")).toHaveTextContent("create");
    });

    it("creates story successfully", async () => {
      mockStoryApi.createStory.mockResolvedValue({
        id: "new-story",
        session: "session-1",
        title: "Test Story",
        description: "Test Description",
        story_order: 1,
        status: "pending",
        created_at: "2024-01-03T00:00:00Z",
      });

      await renderStoryManager({ isFacilitator: true });

      // Open form
      fireEvent.click(screen.getByRole("button", { name: /add story/i }));

      // Submit form
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(mockStoryApi.createStory).toHaveBeenCalledWith("session-1", {
          title: "Test Story",
          description: "Test Description",
          story_order: 1,
          status: "pending",
        });
      });

      // Form should close and stories should reload
      await waitFor(() => {
        expect(screen.queryByTestId("story-form")).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockStoryApi.getStories).toHaveBeenCalledTimes(2);
      });
    });

    it("handles create story API errors", async () => {
      mockStoryApi.createStory.mockRejectedValue(new Error("Creation failed"));

      await renderStoryManager({ isFacilitator: true });

      // Open form
      fireEvent.click(screen.getByRole("button", { name: /add story/i }));

      // Submit with error
      fireEvent.click(screen.getByTestId("submit-error"));

      // Form should remain open
      await waitFor(() => {
        expect(screen.getByTestId("story-form")).toBeInTheDocument();
      });
    });
  });

  describe("Story Editing", () => {
    it("opens edit form when edit button is clicked", async () => {
      await renderStoryManager({ isFacilitator: true });

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Edit"));

      expect(screen.getByTestId("story-form")).toBeInTheDocument();
      expect(screen.getByTestId("form-mode")).toHaveTextContent("edit");
    });

    it("updates story successfully", async () => {
      mockStoryApi.updateStory.mockResolvedValue({
        ...mockStories[0],
        title: "Updated Story",
      });

      await renderStoryManager({ isFacilitator: true });

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      // Open edit form
      fireEvent.click(screen.getByText("Edit"));

      // Submit form
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() => {
        expect(mockStoryApi.updateStory).toHaveBeenCalledWith("session-1", "1", {
          title: "Test Story",
          description: "Test Description",
          story_order: 1,
          status: "pending",
        });
      });

      // Form should close and stories should reload
      await waitFor(() => {
        expect(screen.queryByTestId("story-form")).not.toBeInTheDocument();
      });
    });

    it("handles update story API errors", async () => {
      mockStoryApi.updateStory.mockRejectedValue(new Error("Update failed"));

      await renderStoryManager({ isFacilitator: true });

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      // Open edit form
      fireEvent.click(screen.getByText("Edit"));

      // Submit with error
      fireEvent.click(screen.getByTestId("submit-error"));

      // Form should remain open
      await waitFor(() => {
        expect(screen.getByTestId("story-form")).toBeInTheDocument();
      });
    });
  });

  describe("Story Deletion", () => {
    it("opens delete confirmation dialog", async () => {
      await renderStoryManager({ isFacilitator: true });

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete"));

      expect(screen.getByText("Delete Story")).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });

    it("cancels delete operation", async () => {
      await renderStoryManager({ isFacilitator: true });

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete"));
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.queryByText("Delete Story")).not.toBeInTheDocument();
    });

    it("deletes story successfully", async () => {
      mockStoryApi.deleteStory.mockResolvedValue(undefined);

      await renderStoryManager({ isFacilitator: true });

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      // Open delete dialog
      fireEvent.click(screen.getByText("Delete"));

      // Confirm delete
      fireEvent.click(screen.getByRole("button", { name: /delete/i }));

      await waitFor(() => {
        expect(mockStoryApi.deleteStory).toHaveBeenCalledWith("session-1", "1");
      });

      // Dialog should close and stories should reload
      await waitFor(() => {
        expect(screen.queryByText("Delete Story")).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockStoryApi.getStories).toHaveBeenCalledTimes(2);
      });
    });

    it("handles delete story API errors", async () => {
      const errorMessage = "Failed to delete story";
      mockStoryApi.deleteStory.mockRejectedValue(new Error(errorMessage));

      await renderStoryManager({ isFacilitator: true });

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      // Open delete dialog
      fireEvent.click(screen.getByText("Delete"));

      // Confirm delete
      fireEvent.click(screen.getByRole("button", { name: /delete/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("handles non-Error exceptions during delete", async () => {
      mockStoryApi.deleteStory.mockRejectedValue("String error");

      await renderStoryManager({ isFacilitator: true });

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Delete"));
      fireEvent.click(screen.getByRole("button", { name: /delete/i }));

      await waitFor(() => {
        expect(screen.getByText("Failed to delete story")).toBeInTheDocument();
      });
    });
  });

  describe("Story Status Updates", () => {
    it("updates story status successfully", async () => {
      mockStoryApi.updateStory.mockResolvedValue({
        ...mockStories[0],
        status: "completed",
      });

      await renderStoryManager();

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Mark Complete"));

      await waitFor(() => {
        expect(mockStoryApi.updateStory).toHaveBeenCalledWith("session-1", "1", {
          status: "completed",
        });
      });

      await waitFor(() => {
        expect(mockStoryApi.getStories).toHaveBeenCalledTimes(2);
      });
    });

    it("handles status update API errors", async () => {
      const errorMessage = "Failed to update story status";
      mockStoryApi.updateStory.mockRejectedValue(new Error(errorMessage));

      await renderStoryManager();

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Mark Complete"));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("handles non-Error exceptions during status update", async () => {
      mockStoryApi.updateStory.mockRejectedValue("String error");

      await renderStoryManager();

      await waitFor(() => {
        expect(screen.getByTestId("story-1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Mark Complete"));

      await waitFor(() => {
        expect(screen.getByText("Failed to update story status")).toBeInTheDocument();
      });
    });
  });

  describe("Form Management", () => {
    it("closes form when cancel is clicked", async () => {
      await renderStoryManager({ isFacilitator: true });

      // Open form
      fireEvent.click(screen.getByRole("button", { name: /add story/i }));
      expect(screen.getByTestId("story-form")).toBeInTheDocument();

      // Close form
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      await waitFor(() => {
        expect(screen.queryByTestId("story-form")).not.toBeInTheDocument();
      });
    });

    it("shows submitting state during form submission", async () => {
      mockStoryApi.createStory.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      await renderStoryManager({ isFacilitator: true });

      // Open form
      fireEvent.click(screen.getByRole("button", { name: /add story/i }));

      // Submit form
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      expect(screen.getByTestId("form-loading")).toHaveTextContent("submitting");
    });
  });

  describe("Error Handling", () => {
    it("clears error when new operations succeed", async () => {
      // First call fails
      mockStoryApi.getStories.mockRejectedValueOnce(new Error("Load failed"));

      await renderStoryManager();

      await waitFor(() => {
        expect(screen.getByText("Load failed")).toBeInTheDocument();
      });

      // Second call succeeds
      mockStoryApi.getStories.mockResolvedValue(mockStories);

      fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

      await waitFor(() => {
        expect(screen.queryByText("Load failed")).not.toBeInTheDocument();
      });
    });
  });
});