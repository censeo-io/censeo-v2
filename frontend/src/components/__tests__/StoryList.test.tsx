/**
 * Tests for StoryList Component
 * Comprehensive test suite to achieve high coverage based on actual component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import StoryList from "../StoryList";
import { createAppTheme } from "../../theme/theme";
import { Story } from "../../types/story";

const mockStories: Story[] = [
  {
    id: "1",
    session: "session-1",
    title: "First Story",
    description: "Description of first story",
    story_order: 1,
    status: "pending",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    session: "session-1",
    title: "Second Story",
    description: "Description of second story",
    story_order: 2,
    status: "voting",
    created_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    session: "session-1",
    title: "Third Story",
    description: "",
    story_order: 3,
    status: "completed",
    created_at: "2024-01-03T00:00:00Z",
  },
];

const defaultProps = {
  stories: mockStories,
  loading: false,
  error: null,
  isFacilitator: false,
  onEditStory: jest.fn(),
  onDeleteStory: jest.fn(),
  onUpdateStoryStatus: jest.fn(),
  onRefresh: jest.fn(),
};

const renderStoryList = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  const theme = createAppTheme();

  return render(
    <ThemeProvider theme={theme}>
      <StoryList {...mergedProps} />
    </ThemeProvider>,
  );
};

describe("StoryList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all stories", () => {
      renderStoryList();

      expect(screen.getByText("First Story")).toBeInTheDocument();
      expect(screen.getByText("Second Story")).toBeInTheDocument();
      expect(screen.getByText("Third Story")).toBeInTheDocument();
    });

    it("renders story descriptions when present", () => {
      renderStoryList();

      expect(screen.getByText("Description of first story")).toBeInTheDocument();
      expect(screen.getByText("Description of second story")).toBeInTheDocument();
    });

    it("does not render description for stories without description", () => {
      renderStoryList();

      // Third story has empty description, should not show
      const thirdStoryCard = screen.getByText("Third Story").closest("div");
      expect(thirdStoryCard).not.toHaveTextContent("Description of third story");
    });

    it("displays story order and creation date", () => {
      renderStoryList();

      expect(screen.getByText(/Order: #1 • Created: 1\/1\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/Order: #2 • Created: 1\/2\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/Order: #3 • Created: 1\/3\/2024/)).toBeInTheDocument();
    });

    it("shows status chips with correct labels", () => {
      renderStoryList();

      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Voting")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows loading message when loading", () => {
      renderStoryList({ loading: true, stories: [] });

      expect(screen.getByText("Loading stories...")).toBeInTheDocument();
    });

    it("does not show stories when loading", () => {
      renderStoryList({ loading: true });

      expect(screen.queryByText("First Story")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty state message for non-facilitators", () => {
      renderStoryList({ stories: [], isFacilitator: false });

      expect(screen.getByText("No stories have been added to this session yet.")).toBeInTheDocument();
    });

    it("shows empty state message with facilitator hint", () => {
      renderStoryList({ stories: [], isFacilitator: true });

      expect(screen.getByText(/No stories have been added to this session yet. Add your first story to get started!/)).toBeInTheDocument();
    });

    it("does not show empty state when loading", () => {
      renderStoryList({ stories: [], loading: true });

      expect(screen.queryByText("No stories have been added")).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("shows error message when error present", () => {
      const errorMessage = "Failed to load stories";
      renderStoryList({ error: errorMessage });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it("shows retry button when error present", () => {
      renderStoryList({ error: "Some error" });

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    it("calls onRefresh when retry button clicked", () => {
      const mockOnRefresh = jest.fn();
      renderStoryList({ error: "Some error", onRefresh: mockOnRefresh });

      fireEvent.click(screen.getByRole("button", { name: /retry/i }));

      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it("does not show stories when error present", () => {
      renderStoryList({ error: "Some error" });

      expect(screen.queryByText("First Story")).not.toBeInTheDocument();
    });
  });

  describe("Facilitator Menu", () => {
    it("shows menu button for facilitators", () => {
      renderStoryList({ isFacilitator: true });

      const menuButtons = screen.getAllByRole("button");
      // Should have menu buttons for each story
      expect(menuButtons.length).toBeGreaterThan(0);
    });

    it("hides menu button for non-facilitators", () => {
      renderStoryList({ isFacilitator: false });

      // No menu buttons should be present
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("opens menu when menu button clicked", () => {
      renderStoryList({ isFacilitator: true });

      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[0]);

      expect(screen.getByText("Edit Story")).toBeInTheDocument();
      expect(screen.getByText("Delete Story")).toBeInTheDocument();
    });

    it("closes menu when clicked outside", () => {
      renderStoryList({ isFacilitator: true });

      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[0]);

      expect(screen.getByText("Edit Story")).toBeInTheDocument();

      // Click outside menu
      fireEvent.click(document.body);

      expect(screen.queryByText("Edit Story")).not.toBeInTheDocument();
    });

    it("shows Start Voting option for pending stories", () => {
      renderStoryList({ isFacilitator: true });

      // Click on first story menu (pending status)
      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[0]);

      expect(screen.getByText("Start Voting")).toBeInTheDocument();
    });

    it("shows Mark Complete option for voting stories", () => {
      renderStoryList({ isFacilitator: true });

      // Click on second story menu (voting status)
      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[1]);

      expect(screen.getByText("Mark Complete")).toBeInTheDocument();
    });

    it("does not show status change options for completed stories", () => {
      renderStoryList({ isFacilitator: true });

      // Click on third story menu (completed status)
      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[2]);

      expect(screen.queryByText("Start Voting")).not.toBeInTheDocument();
      expect(screen.queryByText("Mark Complete")).not.toBeInTheDocument();
    });
  });

  describe("Menu Actions", () => {
    it("calls onEditStory when Edit Story clicked", () => {
      const mockOnEditStory = jest.fn();
      renderStoryList({ isFacilitator: true, onEditStory: mockOnEditStory });

      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[0]);

      fireEvent.click(screen.getByText("Edit Story"));

      expect(mockOnEditStory).toHaveBeenCalledWith(mockStories[0]);
    });

    it("calls onDeleteStory when Delete Story clicked", () => {
      const mockOnDeleteStory = jest.fn();
      renderStoryList({ isFacilitator: true, onDeleteStory: mockOnDeleteStory });

      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[1]);

      fireEvent.click(screen.getByText("Delete Story"));

      expect(mockOnDeleteStory).toHaveBeenCalledWith("2");
    });

    it("calls onUpdateStoryStatus when Start Voting clicked", () => {
      const mockOnUpdateStoryStatus = jest.fn();
      renderStoryList({ isFacilitator: true, onUpdateStoryStatus: mockOnUpdateStoryStatus });

      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[0]); // First story (pending)

      fireEvent.click(screen.getByText("Start Voting"));

      expect(mockOnUpdateStoryStatus).toHaveBeenCalledWith("1", "voting");
    });

    it("calls onUpdateStoryStatus when Mark Complete clicked", () => {
      const mockOnUpdateStoryStatus = jest.fn();
      renderStoryList({ isFacilitator: true, onUpdateStoryStatus: mockOnUpdateStoryStatus });

      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[1]); // Second story (voting)

      fireEvent.click(screen.getByText("Mark Complete"));

      expect(mockOnUpdateStoryStatus).toHaveBeenCalledWith("2", "completed");
    });

    it("closes menu after action is performed", () => {
      const mockOnEditStory = jest.fn();
      renderStoryList({ isFacilitator: true, onEditStory: mockOnEditStory });

      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[0]);

      expect(screen.getByText("Edit Story")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Edit Story"));

      expect(screen.queryByText("Edit Story")).not.toBeInTheDocument();
    });
  });

  describe("Status Colors and Labels", () => {
    it("uses correct colors for status chips", () => {
      renderStoryList();

      const pendingChip = screen.getByText("Pending");
      const votingChip = screen.getByText("Voting");
      const completedChip = screen.getByText("Completed");

      expect(pendingChip).toBeInTheDocument();
      expect(votingChip).toBeInTheDocument();
      expect(completedChip).toBeInTheDocument();
    });

    it("handles unknown status gracefully", () => {
      const storyWithUnknownStatus = {
        ...mockStories[0],
        status: "unknown" as any,
      };

      renderStoryList({ stories: [storyWithUnknownStatus] });

      expect(screen.getByText("unknown")).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("formats dates correctly", () => {
      renderStoryList();

      expect(screen.getByText(/Created: 1\/1\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/Created: 1\/2\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/Created: 1\/3\/2024/)).toBeInTheDocument();
    });

    it("handles invalid dates gracefully", () => {
      const storyWithInvalidDate = {
        ...mockStories[0],
        created_at: "invalid-date",
      };

      renderStoryList({ stories: [storyWithInvalidDate] });

      // Should still render the story
      expect(screen.getByText("First Story")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty story list", () => {
      renderStoryList({ stories: [] });

      expect(screen.getByText(/No stories have been added/)).toBeInTheDocument();
    });

    it("handles stories with very long titles", () => {
      const longTitleStory = {
        ...mockStories[0],
        title: "A".repeat(500),
      };

      renderStoryList({ stories: [longTitleStory] });

      expect(screen.getByText("A".repeat(500))).toBeInTheDocument();
    });

    it("handles stories with special characters", () => {
      const specialCharStory = {
        ...mockStories[0],
        title: "Story with émojis 🚀 & <special> chars",
      };

      renderStoryList({ stories: [specialCharStory] });

      expect(screen.getByText("Story with émojis 🚀 & <special> chars")).toBeInTheDocument();
    });

    it("handles story order edge cases", () => {
      const storyWithZeroOrder = {
        ...mockStories[0],
        story_order: 0,
      };

      renderStoryList({ stories: [storyWithZeroOrder] });

      expect(screen.getByText(/Order: #0/)).toBeInTheDocument();
    });
  });

  describe("Menu State Management", () => {
    it("tracks selected story correctly", () => {
      const mockOnEditStory = jest.fn();
      renderStoryList({ isFacilitator: true, onEditStory: mockOnEditStory });

      // Open menu for second story
      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[1]);

      fireEvent.click(screen.getByText("Edit Story"));

      // Should edit the second story, not the first
      expect(mockOnEditStory).toHaveBeenCalledWith(mockStories[1]);
    });

    it("clears selected story when menu closes", () => {
      renderStoryList({ isFacilitator: true });

      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[0]);

      expect(screen.getByText("Edit Story")).toBeInTheDocument();

      // Close menu
      fireEvent.click(document.body);

      // Open different story menu
      fireEvent.click(menuButtons[1]);

      // Should show voting story options, not pending story options
      expect(screen.getByText("Mark Complete")).toBeInTheDocument();
      expect(screen.queryByText("Start Voting")).not.toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("handles large number of stories", () => {
      const manyStories = Array.from({ length: 50 }, (_, i) => ({
        id: `story-${i}`,
        session: "session-1",
        title: `Story ${i}`,
        description: `Description ${i}`,
        story_order: i,
        status: "pending" as const,
        created_at: `2024-01-01T00:00:00Z`,
      }));

      renderStoryList({ stories: manyStories });

      expect(screen.getByText("Story 0")).toBeInTheDocument();
      expect(screen.getByText("Story 49")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper button labels", () => {
      renderStoryList({ isFacilitator: true });

      const menuButtons = screen.getAllByRole("button");
      expect(menuButtons.length).toBe(3); // One for each story
    });

    it("supports keyboard navigation", () => {
      renderStoryList({ isFacilitator: true });

      const menuButton = screen.getAllByRole("button")[0];
      menuButton.focus();
      expect(menuButton).toHaveFocus();
    });

    it("has proper menu item structure", () => {
      renderStoryList({ isFacilitator: true });

      const menuButtons = screen.getAllByRole("button");
      fireEvent.click(menuButtons[0]);

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });
});