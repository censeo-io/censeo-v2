# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-09-13-core-mvp-foundation/spec.md

> Created: 2025-09-13
> Version: 1.0.0

## API Architecture Overview

The API consists of:
- **REST API**: Standard HTTP endpoints for CRUD operations
- **Socket.IO**: Real-time communication for voting sessions
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse
- **API Versioning**: `/api/v1` prefix for all endpoints

## Authentication & Security

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  teamIds: string[];
  role: 'admin' | 'member';
  iat: number;
  exp: number;
}
```

### Authentication Middleware
```typescript
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    teamIds: string[];
    role: 'admin' | 'member';
  };
}
```

### Rate Limiting Strategy
- **Auth endpoints**: 5 requests/minute per IP
- **API endpoints**: 100 requests/minute per user
- **WebSocket connections**: 1 connection per user per session
- **Story creation**: 10 stories/hour per team

## REST API Endpoints

### Authentication Endpoints

#### POST /api/v1/auth/magic-link
Generate and send magic link for authentication.

**Request:**
```typescript
interface MagicLinkRequest {
  email: string;
}
```

**Response:**
```typescript
interface MagicLinkResponse {
  message: string;
  expires_at: string;
}
```

**Status Codes:**
- `200`: Magic link sent successfully
- `400`: Invalid email format
- `429`: Rate limit exceeded

#### POST /api/v1/auth/verify-magic-link
Verify magic link token and return JWT.

**Request:**
```typescript
interface VerifyMagicLinkRequest {
  token: string;
}
```

**Response:**
```typescript
interface VerifyMagicLinkResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}
```

**Status Codes:**
- `200`: Token verified successfully
- `400`: Invalid or expired token
- `401`: Token verification failed

#### POST /api/v1/auth/refresh
Refresh JWT token using refresh token.

**Request:**
```typescript
interface RefreshTokenRequest {
  refresh_token: string;
}
```

**Response:**
```typescript
interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}
```

#### POST /api/v1/auth/logout
Invalidate current session tokens.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface LogoutResponse {
  message: string;
}
```

### User Management Endpoints

#### GET /api/v1/users/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  teams: TeamSummary[];
  created_at: string;
  updated_at: string;
}

interface TeamSummary {
  id: string;
  name: string;
  role: 'admin' | 'member';
}
```

#### PATCH /api/v1/users/profile
Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}
```

### Team Management Endpoints

#### GET /api/v1/teams
Get teams for current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface TeamsResponse {
  teams: Team[];
}

interface Team {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  role: 'admin' | 'member';
  member_count: number;
  created_at: string;
  updated_at: string;
}
```

#### POST /api/v1/teams
Create a new team.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
interface CreateTeamRequest {
  name: string;
  description?: string;
}
```

**Response:**
```typescript
interface CreateTeamResponse {
  team: Team;
}
```

#### GET /api/v1/teams/:teamId
Get team details with members.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface TeamDetails {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  role: 'admin' | 'member';
  members: TeamMember[];
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'member';
  joined_at: string;
}
```

#### PATCH /api/v1/teams/:teamId
Update team details (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
interface UpdateTeamRequest {
  name?: string;
  description?: string;
}
```

#### DELETE /api/v1/teams/:teamId
Delete team (admin only).

**Headers:** `Authorization: Bearer <token>`

#### POST /api/v1/teams/:teamId/regenerate-invite
Regenerate team invite code (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface RegenerateInviteResponse {
  invite_code: string;
}
```

#### POST /api/v1/teams/join
Join team using invite code.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
interface JoinTeamRequest {
  invite_code: string;
}
```

**Response:**
```typescript
interface JoinTeamResponse {
  team: Team;
}
```

#### DELETE /api/v1/teams/:teamId/members/:memberId
Remove team member (admin only).

**Headers:** `Authorization: Bearer <token>`

### Story Management Endpoints

#### GET /api/v1/teams/:teamId/stories
Get stories for team.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: filter by status (`draft`, `voting`, `completed`)
- `page`: pagination page number
- `limit`: items per page (max 100)

**Response:**
```typescript
interface StoriesResponse {
  stories: Story[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface Story {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'voting' | 'completed';
  team_id: string;
  created_by: string;
  votes_count: number;
  average_points?: number;
  consensus_reached: boolean;
  created_at: string;
  updated_at: string;
}
```

#### POST /api/v1/teams/:teamId/stories
Create new story.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
interface CreateStoryRequest {
  title: string;
  description?: string;
}
```

**Response:**
```typescript
interface CreateStoryResponse {
  story: Story;
}
```

#### GET /api/v1/stories/:storyId
Get story details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface StoryDetails {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'voting' | 'completed';
  team_id: string;
  created_by: string;
  votes_count: number;
  average_points?: number;
  consensus_reached: boolean;
  created_at: string;
  updated_at: string;
  votes?: Vote[]; // Only included if voting is completed
}

interface Vote {
  id: string;
  user_id: string;
  user_email: string;
  points: number;
  created_at: string;
}
```

#### PATCH /api/v1/stories/:storyId
Update story (creator or team admin only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```typescript
interface UpdateStoryRequest {
  title?: string;
  description?: string;
}
```

#### DELETE /api/v1/stories/:storyId
Delete story (creator or team admin only).

**Headers:** `Authorization: Bearer <token>`

### Voting Session Endpoints

#### POST /api/v1/stories/:storyId/start-voting
Start voting session for story.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface StartVotingResponse {
  session_id: string;
  story: Story;
  websocket_url: string;
}
```

#### POST /api/v1/stories/:storyId/end-voting
End voting session and reveal results.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface EndVotingResponse {
  story: StoryDetails;
  consensus_reached: boolean;
  voting_summary: {
    total_votes: number;
    average_points: number;
    point_distribution: Record<number, number>;
  };
}
```

#### GET /api/v1/stories/:storyId/voting-status
Get current voting session status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
interface VotingStatusResponse {
  session_id?: string;
  status: 'not_started' | 'active' | 'completed';
  participants: number;
  votes_submitted: number;
  can_vote: boolean;
  user_has_voted: boolean;
}
```

## Socket.IO Real-time Events

### Connection & Authentication

#### Client → Server Events

**`authenticate`**
```typescript
interface AuthenticateEvent {
  token: string;
}
```

**`join_voting_session`**
```typescript
interface JoinVotingSessionEvent {
  story_id: string;
  session_id: string;
}
```

**`leave_voting_session`**
```typescript
interface LeaveVotingSessionEvent {
  session_id: string;
}
```

#### Server → Client Events

**`authenticated`**
```typescript
interface AuthenticatedEvent {
  user_id: string;
  user_email: string;
}
```

**`authentication_error`**
```typescript
interface AuthenticationErrorEvent {
  message: string;
}
```

### Voting Session Events

#### Client → Server Events

**`submit_vote`**
```typescript
interface SubmitVoteEvent {
  story_id: string;
  session_id: string;
  points: number; // Fibonacci: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89
}
```

**`change_vote`**
```typescript
interface ChangeVoteEvent {
  story_id: string;
  session_id: string;
  points: number;
}
```

#### Server → Client Events

**`voting_session_started`**
```typescript
interface VotingSessionStartedEvent {
  session_id: string;
  story_id: string;
  story_title: string;
  participants: ParticipantInfo[];
}

interface ParticipantInfo {
  user_id: string;
  user_email: string;
  has_voted: boolean;
}
```

**`participant_joined`**
```typescript
interface ParticipantJoinedEvent {
  session_id: string;
  participant: ParticipantInfo;
  total_participants: number;
}
```

**`participant_left`**
```typescript
interface ParticipantLeftEvent {
  session_id: string;
  user_id: string;
  total_participants: number;
}
```

**`vote_submitted`**
```typescript
interface VoteSubmittedEvent {
  session_id: string;
  user_id: string;
  votes_count: number;
  total_participants: number;
  all_voted: boolean;
}
```

**`vote_changed`**
```typescript
interface VoteChangedEvent {
  session_id: string;
  user_id: string;
}
```

**`voting_session_ended`**
```typescript
interface VotingSessionEndedEvent {
  session_id: string;
  story_id: string;
  results: VotingResults;
}

interface VotingResults {
  votes: Vote[];
  average_points: number;
  consensus_reached: boolean;
  point_distribution: Record<number, number>;
}
```

**`voting_error`**
```typescript
interface VotingErrorEvent {
  message: string;
  code: string;
}
```

### Connection Management Events

**`disconnect`**
Automatically triggered when client disconnects.

**`reconnect_attempt`**
Client attempting to reconnect to session.

**`session_expired`**
```typescript
interface SessionExpiredEvent {
  message: string;
}
```

## Error Handling Patterns

### Standard Error Response
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    request_id: string;
  };
}
```

### Common Error Codes
- `INVALID_REQUEST`: Malformed request data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., duplicate)
- `RATE_LIMITED`: Too many requests
- `VALIDATION_ERROR`: Input validation failed
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion)
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Unprocessable Entity (validation error)
- `429`: Too Many Requests
- `500`: Internal Server Error

## API Versioning Strategy

### Version Header
```
Accept: application/vnd.api+json;version=1
```

### URL Versioning (Current)
All endpoints prefixed with `/api/v1`

### Deprecation Policy
- New versions introduced as `/api/v2` etc.
- Previous versions supported for 12 months
- Deprecation warnings in response headers:
  ```
  Deprecation: true
  Sunset: Sat, 31 Dec 2024 23:59:59 GMT
  Link: </api/v2/docs>; rel="successor-version"
  ```

## Integration Points: REST API ↔ WebSocket

### Voting Session Flow
1. **REST**: `POST /api/v1/stories/:storyId/start-voting` creates session
2. **WebSocket**: Clients join session via `join_voting_session` event
3. **WebSocket**: Real-time voting via `submit_vote`/`change_vote` events
4. **WebSocket**: Live updates via `vote_submitted`/`participant_joined` events
5. **REST**: `POST /api/v1/stories/:storyId/end-voting` ends session
6. **WebSocket**: `voting_session_ended` broadcasts results

### Session State Synchronization
- WebSocket connections track active sessions
- REST endpoints validate session state before operations
- Session expiry handled by both REST and WebSocket layers
- Reconnection logic restores session state from REST API

### Authentication Bridge
- JWT tokens validated by both REST middleware and WebSocket handlers
- Token refresh handled via REST API
- WebSocket connections re-authenticate on token expiry
- Session state persisted across connection drops

### Data Consistency
- Vote submissions via WebSocket immediately persisted to database
- REST endpoints return real-time data consistent with WebSocket state
- Story status updates propagated through both channels
- Conflict resolution for simultaneous operations

## Security Measures

### Request Validation
- All inputs sanitized and validated
- SQL injection prevention via parameterized queries
- XSS prevention via output encoding
- CSRF protection for state-changing operations

### WebSocket Security
- Origin validation for WebSocket connections
- Connection-level authentication required
- Session-based authorization for voting operations
- Automatic disconnection on authentication failure

### Rate Limiting Implementation
```typescript
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message: string;       // Error message when exceeded
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}
```

### Data Privacy
- Votes hidden during active sessions
- Personal data anonymized in logs
- Secure token storage and transmission
- GDPR-compliant data handling

## Performance Considerations

### Caching Strategy
- Team membership cached for 15 minutes
- Story lists cached with invalidation on updates
- Vote counts cached during active sessions
- CDN caching for static API documentation

### Database Optimization
- Indexed queries for team/user lookups
- Pagination for large result sets
- Connection pooling for WebSocket persistence
- Read replicas for non-critical queries

### WebSocket Scaling
- Session affinity for WebSocket connections
- Redis pub/sub for multi-server coordination
- Connection limits per user/session
- Graceful degradation on server overload