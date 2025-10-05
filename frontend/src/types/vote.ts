/**
 * Type definitions for voting functionality
 */

export type FibonacciPoints = "1" | "2" | "3" | "5" | "8" | "13" | "21" | "?";

export interface User {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  created_at: string;
  last_active: string;
}

export interface Vote {
  vote_id: string;
  story: string;
  user: User;
  points: FibonacciPoints;
  created_at: string;
}

export interface VoteSubmitRequest {
  points: FibonacciPoints;
}

export interface VotingStatusResponse {
  votes_count: number;
  total_participants: number;
  revealed: boolean;
  votes: Vote[];
}
