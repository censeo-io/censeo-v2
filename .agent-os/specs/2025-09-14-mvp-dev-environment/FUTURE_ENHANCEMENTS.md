# Future Enhancements for Real-Time Features

This document tracks features that will be implemented once real-time synchronization (WebSocket/Socket.IO) is added to the application.

## Real-Time Session State Synchronization

### Current MVP Behavior
- Users must manually refresh to see session updates
- No automatic notifications when other users join, vote, or when stories change status
- Session state is fetched on page load and on manual user actions

### Planned Enhancement with Real-Time Sync
- **Participant Updates**: Automatically show when users join or leave sessions
- **Voting Progress**: Real-time updates showing vote count as participants submit votes
- **Story Status Changes**: Instant updates when facilitator changes story status
- **Vote Reveals**: All participants see revealed votes simultaneously
- **Session Activity**: Live activity indicators showing who is actively voting

### Technical Implementation Notes
- Use Socket.IO for WebSocket connections
- Create room-based channels per session
- Emit events for: user_joined, user_left, vote_submitted, story_updated, votes_revealed
- Frontend subscribes to session-specific events
- Graceful degradation to polling if WebSocket unavailable

## Automatic Vote Revelation

### Current MVP Behavior
- Facilitator manually marks story as "completed" to reveal votes
- No automatic detection of when all participants have voted

### Planned Enhancement with Real-Time Sync
- **Auto-Reveal Trigger**: When all active participants have submitted votes, automatically reveal results
- **Active Participant Detection**: Track which participants are actively in the session
- **Configurable Behavior**: Facilitator can enable/disable auto-reveal per session
- **Timeout Option**: Optional timer to auto-reveal after X minutes if not all votes received

### Technical Implementation Notes
- Track active session participants via WebSocket connections
- Calculate vote completion: votes_count >= active_participants_count
- Emit `all_votes_submitted` event when threshold reached
- Backend automatically sets `revealed=true` on the story
- Frontend updates vote display in real-time for all users

### User Experience Flow
1. Facilitator starts voting on a story
2. Participants submit votes (progress bar updates in real-time for everyone)
3. When last active participant votes:
   - Backend detects completion
   - Automatically reveals votes
   - All participants see results simultaneously
   - Optional: Play sound/notification for reveal
4. Fallback: Facilitator can still manually reveal if needed

## Session Refresh/Polling (Interim Solution)

### Current MVP Implementation
- Session data loaded on page mount
- Updates occur on user actions (create story, submit vote, etc.)
- No automatic refresh mechanism

### Interim Solution (Pre-Real-Time)
- Add "Refresh" button in session header
- Keyboard shortcut (e.g., R key) to refresh
- Optional: Implement polling with configurable interval (30-60 seconds)
- Visual indicator when data is stale (last updated timestamp)

### Migration Path
When real-time sync is added:
- Remove polling mechanism
- Keep manual refresh as backup
- Replace refresh button with connection status indicator
- Show "Reconnecting..." when WebSocket connection drops

## Other Real-Time Enhancements to Consider

### Chat/Comments
- Real-time comments on stories during voting
- Team discussion before estimation

### Session Analytics
- Live view of who is viewing which story
- Time tracking for how long voting takes
- Historical voting patterns

### Notifications
- Push notifications when voting starts
- Alerts when user's input is needed
- Session completion notifications

### Collaborative Features
- Simultaneous story editing by facilitator
- Live cursor indicators for multi-user story creation
- Undo/redo synchronized across users

## Implementation Priority

**Phase 1: WebSocket Foundation**
1. Set up Socket.IO infrastructure
2. Implement basic connection management
3. Add reconnection handling

**Phase 2: Core Real-Time Features**
1. Participant join/leave events
2. Vote submission events
3. Automatic vote reveal

**Phase 3: Enhanced Real-Time Features**
1. Story status synchronization
2. Live activity indicators
3. Session analytics

**Phase 4: Advanced Features**
1. Real-time chat/comments
2. Notifications
3. Collaborative editing

## Testing Considerations

- Test WebSocket connection stability
- Test reconnection scenarios (network drop, server restart)
- Test race conditions (simultaneous votes, story updates)
- Load testing with multiple concurrent sessions
- Test with slow/unstable network connections (key product differentiator)

## Migration Strategy

1. **Additive Implementation**: Add real-time features alongside existing REST API
2. **Feature Flags**: Use flags to enable/disable real-time features
3. **Graceful Degradation**: Fall back to polling if WebSocket fails
4. **Backward Compatibility**: Ensure old clients still work during rollout
5. **Incremental Rollout**: Deploy to small percentage of sessions first
