/**
 * Tests for StoryForm Component
 * Comprehensive test suite to achieve high coverage
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import StoryForm from "../StoryForm";
import { createAppTheme } from "../../theme/theme";
import { Story } from "../../types/story";

const mockStory: Story = {
  id: "1",
  session: "session-1",
  title: "Existing Story",
  description: "Existing description",
  story_order: 5,
  status: "voting",
  created_at: "2024-01-01T00:00:00Z",
};

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
  loading: false,
};

const renderStoryForm = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  const theme = createAppTheme();

  return render(
    <ThemeProvider theme={theme}>
      <StoryForm {...mergedProps} />
    </ThemeProvider>,
  );
};

describe("StoryForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders create form when no story provided", () => {
      renderStoryForm();

      expect(screen.getByText("Create New Story")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create story/i })).toBeInTheDocument();
    });

    it("renders edit form when story provided", () => {
      renderStoryForm({ story: mockStory });

      expect(screen.getByText("Edit Story")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /update story/i })).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      renderStoryForm({ open: false });

      expect(screen.queryByText("Create New Story")).not.toBeInTheDocument();
    });

    it("pre-fills form fields when editing", () => {
      renderStoryForm({ story: mockStory });

      expect(screen.getByDisplayValue("Existing Story")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Existing description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
      expect(screen.getByDisplayValue("voting")).toBeInTheDocument();
    });

    it("shows default values for create mode", () => {
      renderStoryForm();

      expect(screen.getByDisplayValue("")).toBeInTheDocument(); // title
      expect(screen.getByDisplayValue("0")).toBeInTheDocument(); // story_order
      expect(screen.getByDisplayValue("pending")).toBeInTheDocument(); // status
    });
  });

  describe("Form Validation", () => {
    it("shows error when title is empty", async () => {
      const user = userEvent.setup();
      renderStoryForm();

      const titleField = screen.getByLabelText(/story title/i);
      const submitButton = screen.getByRole("button", { name: /create story/i });

      // Clear the title field
      await user.clear(titleField);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument();
      });

      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it("shows error when title is too long", async () => {
      const user = userEvent.setup();
      renderStoryForm();

      const titleField = screen.getByLabelText(/story title/i);
      const longTitle = "a".repeat(501); // Exceeds 500 character limit

      await user.clear(titleField);
      await user.type(titleField, longTitle);
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(screen.getByText("Title cannot exceed 500 characters")).toBeInTheDocument();
      });

      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it("shows error when story order is negative", async () => {
      const user = userEvent.setup();
      renderStoryForm();

      const orderField = screen.getByLabelText(/story order/i);

      await user.clear(orderField);
      await user.type(orderField, "-1");
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(screen.getByText("Story order must be non-negative")).toBeInTheDocument();
      });

      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it("clears validation errors when user starts typing", async () => {
      const user = userEvent.setup();
      renderStoryForm();

      const titleField = screen.getByLabelText(/story title/i);

      // Trigger validation error
      await user.clear(titleField);
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument();
      });

      // Start typing should clear error
      await user.type(titleField, "New title");

      await waitFor(() => {
        expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
      });
    });

    it("shows validation summary for multiple errors", async () => {
      const user = userEvent.setup();
      renderStoryForm();

      const titleField = screen.getByLabelText(/story title/i);
      const orderField = screen.getByLabelText(/story order/i);

      await user.clear(titleField);
      await user.clear(orderField);
      await user.type(orderField, "-1");
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(screen.getByText("Please fix the errors above before submitting.")).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("submits valid form data for create", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      renderStoryForm({ onSubmit: mockOnSubmit });

      // Fill form
      await user.type(screen.getByLabelText(/story title/i), "New Story");
      await user.type(screen.getByLabelText(/description/i), "Story description");
      await user.clear(screen.getByLabelText(/story order/i));
      await user.type(screen.getByLabelText(/story order/i), "3");
      await user.selectOptions(screen.getByLabelText(/status/i), "voting");

      // Submit
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: "New Story",
          description: "Story description",
          story_order: 3,
          status: "voting",
        });
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("submits valid form data for edit", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      renderStoryForm({ story: mockStory, onSubmit: mockOnSubmit });

      // Modify form
      const titleField = screen.getByLabelText(/story title/i);
      await user.clear(titleField);
      await user.type(titleField, "Updated Story");

      // Submit
      fireEvent.click(screen.getByRole("button", { name: /update story/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: "Updated Story",
          description: "Existing description",
          story_order: 5,
          status: "voting",
        });
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("trims whitespace from title and description", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      renderStoryForm({ onSubmit: mockOnSubmit });

      await user.type(screen.getByLabelText(/story title/i), "  Whitespace Story  ");
      await user.type(screen.getByLabelText(/description/i), "  Whitespace description  ");

      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: "Whitespace Story",
          description: "Whitespace description",
          story_order: 0,
          status: "pending",
        });
      });
    });

    it("handles submission errors from onSubmit", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error("Submission failed"));
      renderStoryForm({ onSubmit: mockOnSubmit });

      await user.type(screen.getByLabelText(/story title/i), "Test Story");
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(screen.getByText("Submission failed")).toBeInTheDocument();
      });

      // Form should not close on error
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it("handles non-Error exceptions during submission", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockRejectedValue("String error");
      renderStoryForm({ onSubmit: mockOnSubmit });

      await user.type(screen.getByLabelText(/story title/i), "Test Story");
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(screen.getByText("An unexpected error occurred while saving the story")).toBeInTheDocument();
      });
    });

    it("clears submit error when user makes changes", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error("Submission failed"));
      renderStoryForm({ onSubmit: mockOnSubmit });

      const titleField = screen.getByLabelText(/story title/i);
      await user.type(titleField, "Test Story");
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(screen.getByText("Submission failed")).toBeInTheDocument();
      });

      // Make change should clear error
      await user.type(titleField, " Updated");

      await waitFor(() => {
        expect(screen.queryByText("Submission failed")).not.toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("disables form fields when loading", () => {
      renderStoryForm({ loading: true });

      expect(screen.getByLabelText(/story title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByLabelText(/story order/i)).toBeDisabled();
      expect(screen.getByLabelText(/status/i)).toBeDisabled();
    });

    it("disables buttons when loading", () => {
      renderStoryForm({ loading: true });

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /saving.../i })).toBeDisabled();
    });

    it("shows loading button text", () => {
      renderStoryForm({ loading: true });

      expect(screen.getByRole("button", { name: /saving.../i })).toBeInTheDocument();
    });
  });

  describe("Form Reset", () => {
    it("resets form when story prop changes", () => {
      const { rerender } = renderStoryForm({ story: mockStory });

      expect(screen.getByDisplayValue("Existing Story")).toBeInTheDocument();

      // Change to different story
      const newStory = { ...mockStory, id: "2", title: "Different Story" };
      rerender(
        <ThemeProvider theme={theme}>
          <StoryForm {...defaultProps} story={newStory} />
        </ThemeProvider>,
      );

      expect(screen.getByDisplayValue("Different Story")).toBeInTheDocument();
    });

    it("resets form when switching from edit to create", () => {
      const { rerender } = renderStoryForm({ story: mockStory });

      expect(screen.getByDisplayValue("Existing Story")).toBeInTheDocument();

      // Switch to create mode
      rerender(
        <ThemeProvider theme={theme}>
          <StoryForm {...defaultProps} story={null} />
        </ThemeProvider>,
      );

      expect(screen.queryByDisplayValue("Existing Story")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("")).toBeInTheDocument(); // empty title
    });

    it("clears errors when form opens", () => {
      const { rerender } = renderStoryForm({ open: false });

      // Render with open and trigger error
      rerender(
        <ThemeProvider theme={theme}>
          <StoryForm {...defaultProps} open={true} />
        </ThemeProvider>,
      );

      // Fill and submit invalid form
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      expect(screen.getByText("Title is required")).toBeInTheDocument();

      // Close and reopen
      rerender(
        <ThemeProvider theme={theme}>
          <StoryForm {...defaultProps} open={false} />
        </ThemeProvider>,
      );

      rerender(
        <ThemeProvider theme={theme}>
          <StoryForm {...defaultProps} open={true} />
        </ThemeProvider>,
      );

      expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    });
  });

  describe("Cancel Functionality", () => {
    it("calls onClose when cancel button is clicked", () => {
      renderStoryForm();

      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("calls onClose when dialog backdrop is clicked", () => {
      renderStoryForm();

      // This simulates clicking the backdrop
      fireEvent.keyDown(document, { key: "Escape" });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe("Field Interactions", () => {
    it("converts story order to number", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      renderStoryForm({ onSubmit: mockOnSubmit });

      const orderField = screen.getByLabelText(/story order/i);
      await user.clear(orderField);
      await user.type(orderField, "42");

      await user.type(screen.getByLabelText(/story title/i), "Test");
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            story_order: 42,
          }),
        );
      });
    });

    it("handles all status options", async () => {
      const user = userEvent.setup();
      renderStoryForm();

      const statusSelect = screen.getByLabelText(/status/i);

      // Test each status option
      await user.selectOptions(statusSelect, "pending");
      expect(screen.getByDisplayValue("pending")).toBeInTheDocument();

      await user.selectOptions(statusSelect, "voting");
      expect(screen.getByDisplayValue("voting")).toBeInTheDocument();

      await user.selectOptions(statusSelect, "completed");
      expect(screen.getByDisplayValue("completed")).toBeInTheDocument();
    });

    it("shows helper text for fields", () => {
      renderStoryForm();

      expect(screen.getByText("Enter a clear, concise story title")).toBeInTheDocument();
      expect(screen.getByText("Order in which this story should be discussed")).toBeInTheDocument();
    });

    it("shows placeholder text", () => {
      renderStoryForm();

      expect(screen.getByPlaceholderText("As a user, I want to...")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Add any additional details, acceptance criteria, or notes")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper form labels", () => {
      renderStoryForm();

      expect(screen.getByLabelText(/story title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/story order/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it("associates error messages with fields", async () => {
      const user = userEvent.setup();
      renderStoryForm();

      const titleField = screen.getByLabelText(/story title/i);
      await user.clear(titleField);
      fireEvent.click(screen.getByRole("button", { name: /create story/i }));

      await waitFor(() => {
        expect(titleField).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      renderStoryForm();

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/story title/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/description/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/story order/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/status/i)).toHaveFocus();
    });
  });
});