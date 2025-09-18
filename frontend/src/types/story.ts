/**
 * Type definitions for story management
 */

export interface Story {
  id: string;
  session: string;
  title: string;
  description: string;
  story_order: number;
  status: "pending" | "voting" | "completed";
  created_at: string;
}

export interface CreateStoryRequest {
  title: string;
  description?: string;
  story_order?: number;
  status?: "pending" | "voting" | "completed";
}

export interface UpdateStoryRequest {
  title?: string;
  description?: string;
  story_order?: number;
  status?: "pending" | "voting" | "completed";
}

export interface StoryListResponse extends Array<Story> {}
