# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-14-mvp-dev-environment/spec.md

> Created: 2025-09-14
> Version: 1.0.0

## Authentication Endpoints (Mock)

### POST /api/auth/login
**Purpose:** Temporary login with name and email for development
**Parameters:**
- `name` (string, required)
- `email` (string, required)
**Response:** `{"user_id": 1, "name": "User Name", "session_token": "temp_token"}`
**Errors:** 400 for invalid input

## Session Management Endpoints

### POST /api/sessions/
**Purpose:** Create a new voting session
**Parameters:**
- `name` (string, required)
- `facilitator_id` (integer, required)
**Response:** `{"id": 1, "name": "Session Name", "facilitator_id": 1, "status": "active"}`
**Errors:** 400 for invalid input, 401 for unauthorized

### GET /api/sessions/{id}/
**Purpose:** Get session details and participants
**Parameters:** None
**Response:** `{"id": 1, "name": "Session Name", "facilitator": {...}, "participants": [...]}`
**Errors:** 404 for not found

### POST /api/sessions/{id}/join/
**Purpose:** Join an existing session
**Parameters:**
- `user_id` (integer, required)
**Response:** `{"success": true, "session": {...}}`
**Errors:** 404 for session not found, 400 for invalid user

## Story Management Endpoints

### POST /api/sessions/{session_id}/stories/
**Purpose:** Add a story to a session (facilitator only)
**Parameters:**
- `title` (string, required)
- `description` (string, optional)
**Response:** `{"id": 1, "title": "Story Title", "description": "...", "status": "pending"}`
**Errors:** 401 for unauthorized, 400 for invalid input

### GET /api/sessions/{session_id}/stories/
**Purpose:** List all stories in a session
**Parameters:** None
**Response:** `{"stories": [{"id": 1, "title": "...", "status": "pending"}, ...]}`
**Errors:** 404 for session not found

### PUT /api/stories/{id}/status/
**Purpose:** Update story status (facilitator only)
**Parameters:**
- `status` (string: 'pending', 'voting', 'completed')
**Response:** `{"id": 1, "status": "voting"}`
**Errors:** 401 for unauthorized, 400 for invalid status

## Voting Endpoints

### POST /api/stories/{story_id}/votes/
**Purpose:** Submit or update vote for a story
**Parameters:**
- `user_id` (integer, required)
- `points` (string: '1','2','3','5','8','13','21','?')
**Response:** `{"id": 1, "story_id": 1, "points": "5", "created_at": "..."}`
**Errors:** 400 for invalid points, 404 for story not found

### GET /api/stories/{story_id}/votes/
**Purpose:** Get voting status (before reveal) or results (after reveal)
**Parameters:** None
**Response:**
- Before reveal: `{"votes_count": 3, "total_participants": 5, "votes": []}`
- After reveal: `{"votes_count": 3, "votes": [{"user": "Name", "points": "5"}, ...]}`
**Errors:** 404 for story not found

### POST /api/stories/{story_id}/reveal/
**Purpose:** Reveal votes for a story (facilitator only)
**Parameters:** None
**Response:** `{"revealed": true, "votes": [{"user": "Name", "points": "5"}, ...]}`
**Errors:** 401 for unauthorized, 404 for story not found

## Utility Endpoints

### GET /api/sessions/{session_id}/status/
**Purpose:** Get current session state and active participants
**Parameters:** None
**Response:** `{"session": {...}, "current_story": {...}, "participants": [...], "voting_status": {...}}`
**Errors:** 404 for session not found

## Error Handling

All endpoints return consistent error format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

## Response Format Standards

- All timestamps in ISO 8601 format
- Consistent JSON structure with camelCase
- Proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Pagination for list endpoints when needed