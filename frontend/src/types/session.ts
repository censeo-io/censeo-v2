/**
 * Session-related type definitions
 */

export interface User {
  id: string;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  last_active?: string;
}

export interface SessionParticipant {
  name: string;
  email: string;
  joined_at: string;
  is_active: boolean;
}

export interface Session {
  session_id: string;
  name: string;
  facilitator: User;
  status: "active" | "completed" | "paused";
  participants: SessionParticipant[];
  participant_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionRequest {
  name: string;
}

export interface CreateSessionResponse extends Session {}

export interface JoinSessionResponse {
  message: string;
  session: Session;
  user: SessionParticipant;
}

export interface SessionListResponse {
  sessions: Session[];
  count: number;
}

export interface SessionError {
  error: string;
  status?: number;
}
