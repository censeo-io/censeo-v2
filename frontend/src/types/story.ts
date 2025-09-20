/**
 * Type definitions for story management
 */

export type StoryStatus = "pending" | "voting" | "completed";

export interface Story {
  id: string;
  session: string;
  title: string;
  description: string;
  story_order: number;
  status: StoryStatus;
  created_at: string;
}

export interface CreateStoryRequest {
  title: string;
  description?: string;
  story_order?: number;
  status?: StoryStatus;
}

export interface UpdateStoryRequest {
  title?: string;
  description?: string;
  story_order?: number;
  status?: StoryStatus;
}

export interface StoryListResponse extends Array<Story> {}
