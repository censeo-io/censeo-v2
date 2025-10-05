/**
 * Tests for VotingPanel Component
 * Comprehensive test suite for voting functionality
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import VotingPanel from "../VotingPanel";
import { createAppTheme } from "../../theme/theme";
import { voteApi } from "../../services/api";
import { VotingStatusResponse } from "../../types/vote";

// Mock the vote API
jest.mock("../../services/api", () => ({
  voteApi: {
    getVotingStatus: jest.fn(),
    submitVote: jest.fn(),
  },
}));

const mockVoteApi = voteApi as jest.Mocked<typeof voteApi>;

const theme = createAppTheme();

const defaultProps = {
  storyId: "story-123",
  storyStatus: "voting" as const,
  onVoteSubmitted: jest.fn(),
};

const renderVotingPanel = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return render(
    <ThemeProvider theme={theme}>
      <VotingPanel {...mergedProps} />
    </ThemeProvider>
  );
};

const mockVotingStatus: VotingStatusResponse = {
  votes_count: 2,
  total_participants: 5,
  revealed: false,
  votes: [],
};

const mockVotingStatusWithVotes: VotingStatusResponse = {
  votes_count: 3,
  total_participants: 5,
  revealed: true,
  votes: [
    {
      vote_id: "vote-1",
      user: { id: "user-1", name: "Alice", email: "alice@test.com" } as any,
      points: "5",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      vote_id: "vote-2",
      user: { id: "user-2", name: "Bob", email: "bob@test.com" } as any,
      points: "8",
      created_at: "2024-01-01T00:01:00Z",
    },
    {
      vote_id: "vote-3",
      user: { id: "user-3", name: "", email: "charlie@test.com" } as any,
      points: "3",
      created_at: "2024-01-01T00:02:00Z",
    },
  ] as any,
};

describe("VotingPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering based on story status", () => {
    it("should not render for pending stories", () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);

      renderVotingPanel({ storyStatus: "pending" });

      // Voting panel should not be rendered for pending stories
      expect(screen.queryByText("Select your estimate:")).not.toBeInTheDocument();
      expect(mockVoteApi.getVotingStatus).not.toHaveBeenCalled();
    });

    it("should fetch voting status for voting stories", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);

      renderVotingPanel({ storyStatus: "voting" });

      await waitFor(() => {
        expect(mockVoteApi.getVotingStatus).toHaveBeenCalledWith("story-123");
      });
    });

    it("should fetch voting status for completed stories", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);

      renderVotingPanel({ storyStatus: "completed" });

      await waitFor(() => {
        expect(mockVoteApi.getVotingStatus).toHaveBeenCalledWith("story-123");
      });
    });
  });

  describe("Loading and error states", () => {
    it("should show loading indicator initially", () => {
      mockVoteApi.getVotingStatus.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderVotingPanel();

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("should show error message when fetching status fails", async () => {
      mockVoteApi.getVotingStatus.mockRejectedValue(
        new Error("Network error")
      );

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("Voting status display", () => {
    it("should display vote count and total participants", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByText("2 of 5 voted")).toBeInTheDocument();
      });
    });

    it("should display progress bar with correct value", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);

      renderVotingPanel();

      await waitFor(() => {
        const progressBar = screen.getByRole("progressbar");
        expect(progressBar).toHaveAttribute("aria-valuenow", "40"); // 2/5 = 40%
      });
    });

    it("should handle zero participants gracefully", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue({
        ...mockVotingStatus,
        votes_count: 0,
        total_participants: 0,
      });

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByText("0 of 0 voted")).toBeInTheDocument();
      });
    });
  });

  describe("Voting interface for voting status", () => {
    it("should show voting buttons for voting status", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);

      renderVotingPanel({ storyStatus: "voting" });

      await waitFor(() => {
        expect(screen.getByText("Select your estimate:")).toBeInTheDocument();
      });

      // Check all Fibonacci point buttons are present
      const expectedPoints = ["1", "2", "3", "5", "8", "13", "21", "?"];
      expectedPoints.forEach((point) => {
        expect(screen.getByTestId(`vote-button-${point}`)).toBeInTheDocument();
      });
    });

    it("should not show voting buttons for completed status", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);

      renderVotingPanel({ storyStatus: "completed" });

      await waitFor(() => {
        expect(screen.getByText("2 of 5 voted")).toBeInTheDocument();
      });

      expect(
        screen.queryByText("Select your estimate:")
      ).not.toBeInTheDocument();
    });
  });

  describe("Vote submission", () => {
    it("should submit vote when button clicked", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);
      mockVoteApi.submitVote.mockResolvedValue({
        vote_id: "new-vote",
        user: { id: "user-1", name: "Test User", email: "test@test.com" } as any,
        points: "5",
        created_at: "2024-01-01T00:00:00Z",
      } as any);

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByTestId("vote-button-5")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("vote-button-5"));

      await waitFor(() => {
        expect(mockVoteApi.submitVote).toHaveBeenCalledWith("story-123", {
          points: "5",
        });
      });
    });

    it("should show success message after vote submission", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);
      mockVoteApi.submitVote.mockResolvedValue({
        vote_id: "new-vote",
        user: { id: "user-1", name: "Test User", email: "test@test.com" } as any,
        points: "8",
        created_at: "2024-01-01T00:00:00Z",
      } as any);

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByTestId("vote-button-8")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("vote-button-8"));

      await waitFor(() => {
        expect(screen.getByText(/You voted: 8 points/i)).toBeInTheDocument();
      });
    });

    it("should show error message when vote submission fails", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);
      mockVoteApi.submitVote.mockRejectedValue(new Error("Vote failed"));

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByTestId("vote-button-3")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("vote-button-3"));

      await waitFor(() => {
        expect(screen.getByText("Vote failed")).toBeInTheDocument();
      });
    });

    it("should call onVoteSubmitted callback after successful vote", async () => {
      const onVoteSubmitted = jest.fn();
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);
      mockVoteApi.submitVote.mockResolvedValue({
        vote_id: "new-vote",
        user: { id: "user-1", name: "Test User", email: "test@test.com" } as any,
        points: "13",
        created_at: "2024-01-01T00:00:00Z",
      } as any);

      renderVotingPanel({ onVoteSubmitted });

      await waitFor(() => {
        expect(screen.getByTestId("vote-button-13")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("vote-button-13"));

      await waitFor(() => {
        expect(onVoteSubmitted).toHaveBeenCalled();
      });
    });

    it("should update voting status after vote submission", async () => {
      mockVoteApi.getVotingStatus
        .mockResolvedValueOnce(mockVotingStatus)
        .mockResolvedValueOnce({
          ...mockVotingStatus,
          votes_count: 3,
        });
      mockVoteApi.submitVote.mockResolvedValue({
        vote_id: "new-vote",
        user: { id: "user-1", name: "Test User", email: "test@test.com" } as any,
        points: "5",
        created_at: "2024-01-01T00:00:00Z",
      } as any);

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByText("2 of 5 voted")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("vote-button-5"));

      await waitFor(() => {
        expect(screen.getByText("3 of 5 voted")).toBeInTheDocument();
      });
    });

    it("should highlight selected vote button", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);
      mockVoteApi.submitVote.mockResolvedValue({
        vote_id: "new-vote",
        user: { id: "user-1", name: "Test User", email: "test@test.com" } as any,
        points: "5",
        created_at: "2024-01-01T00:00:00Z",
      } as any);

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByTestId("vote-button-5")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("vote-button-5"));

      await waitFor(() => {
        const voteButton = screen.getByTestId("vote-button-5");
        // MUI uses "contained" variant for selected button
        expect(voteButton.className).toContain("MuiButton-contained");
      });
    });
  });

  describe("Vote results display", () => {
    it("should not show vote results when not revealed", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByText("2 of 5 voted")).toBeInTheDocument();
      });

      expect(screen.queryByText("Vote Results:")).not.toBeInTheDocument();
    });

    it("should show vote results when revealed", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatusWithVotes);

      renderVotingPanel({ storyStatus: "completed" });

      await waitFor(() => {
        expect(screen.getByText("Vote Results:")).toBeInTheDocument();
      });
    });

    it("should display all votes with user names and points", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatusWithVotes);

      renderVotingPanel({ storyStatus: "completed" });

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      expect(screen.getByText("Bob")).toBeInTheDocument();

      // Check vote points are displayed
      const chips = screen.getAllByText(/^[0-9?]+$/);
      expect(chips.length).toBeGreaterThan(0);
    });

    it("should display email when user name is empty", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatusWithVotes);

      renderVotingPanel({ storyStatus: "completed" });

      await waitFor(() => {
        expect(screen.getByText("charlie@test.com")).toBeInTheDocument();
      });
    });

    it("should not show vote results when revealed but no votes", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue({
        votes_count: 0,
        total_participants: 5,
        revealed: true,
        votes: [],
      });

      renderVotingPanel({ storyStatus: "completed" });

      await waitFor(() => {
        expect(screen.getByText("0 of 5 voted")).toBeInTheDocument();
      });

      expect(screen.queryByText("Vote Results:")).not.toBeInTheDocument();
    });
  });

  describe("Vote update message", () => {
    it("should show update message for voting status", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);
      mockVoteApi.submitVote.mockResolvedValue({
        vote_id: "new-vote",
        user: { id: "user-1", name: "Test User", email: "test@test.com" } as any,
        points: "5",
        created_at: "2024-01-01T00:00:00Z",
      } as any);

      renderVotingPanel({ storyStatus: "voting" });

      await waitFor(() => {
        expect(screen.getByTestId("vote-button-5")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("vote-button-5"));

      await waitFor(() => {
        expect(
          screen.getByText(/You can change your vote before it's revealed/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-labels on vote buttons", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);

      renderVotingPanel();

      await waitFor(() => {
        const button = screen.getByTestId("vote-button-5");
        expect(button).toHaveAttribute("aria-label", "Vote 5 points");
      });
    });

    it("should disable vote buttons while submitting", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);
      mockVoteApi.submitVote.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByTestId("vote-button-5")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("vote-button-5"));

      await waitFor(() => {
        expect(screen.getByTestId("vote-button-5")).toBeDisabled();
      });

      // Check all vote buttons are disabled
      const allButtons = screen.getAllByRole("button");
      const voteButtons = allButtons.filter((button) =>
        button.getAttribute("data-testid")?.startsWith("vote-button-")
      );
      voteButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Error handling with non-Error objects", () => {
    it("should handle string errors when fetching status", async () => {
      mockVoteApi.getVotingStatus.mockRejectedValue("String error");

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch voting status/i)).toBeInTheDocument();
      });
    });

    it("should handle string errors when submitting vote", async () => {
      mockVoteApi.getVotingStatus.mockResolvedValue(mockVotingStatus);
      mockVoteApi.submitVote.mockRejectedValue("Submit failed");

      renderVotingPanel();

      await waitFor(() => {
        expect(screen.getByTestId("vote-button-5")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("vote-button-5"));

      await waitFor(() => {
        expect(screen.getByText(/Failed to submit vote/i)).toBeInTheDocument();
      });
    });
  });
});
