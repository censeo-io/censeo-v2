# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-13-core-mvp-foundation/spec.md

> Created: 2025-09-13
> Version: 1.0.0

## Database Schema Design

### Core Tables Overview

The database schema supports:
- User management with authentication
- Team-based organization with RBAC
- Story management with blind voting
- Session management for real-time collaboration
- Comprehensive audit trail

### Table Structure

```
users
├── user_sessions (1:N)
├── team_members (1:N)
├── stories (1:N, as creator)
├── votes (1:N)
├── user_audit_logs (1:N)
└── user_preferences (1:1)

teams
├── team_members (1:N)
├── stories (1:N)
├── voting_sessions (1:N)
└── team_audit_logs (1:N)

stories
├── votes (1:N)
├── story_audit_logs (1:N)
└── story_tags (M:N through story_tag_mappings)

voting_sessions
├── session_participants (1:N)
├── stories (1:N)
└── session_audit_logs (1:N)
```

## SQL DDL Statements

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    email_verification_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
```

### User Sessions Table

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
```

### User Preferences Table

```sql
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) NOT NULL DEFAULT 'system',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    voting_reminder_notifications BOOLEAN NOT NULL DEFAULT true,
    story_update_notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Teams Table

```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSONB NOT NULL DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_teams_active ON teams(is_active);
CREATE INDEX idx_teams_created_at ON teams(created_at);
```

### Team Members Table (RBAC)

```sql
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'moderator', 'member', 'viewer');

CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'member',
    permissions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_active ON team_members(is_active);
```

### Stories Table

```sql
CREATE TYPE story_status AS ENUM ('draft', 'ready', 'voting', 'voted', 'archived');
CREATE TYPE story_priority AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    acceptance_criteria TEXT,
    story_points INTEGER,
    priority story_priority NOT NULL DEFAULT 'medium',
    status story_status NOT NULL DEFAULT 'draft',
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    epic_id UUID REFERENCES stories(id),
    external_id VARCHAR(100), -- For Jira/Linear integration
    external_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    voting_started_at TIMESTAMP WITH TIME ZONE,
    voting_completed_at TIMESTAMP WITH TIME ZONE,
    final_story_points INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stories_team_id ON stories(team_id);
CREATE INDEX idx_stories_created_by ON stories(created_by);
CREATE INDEX idx_stories_assigned_to ON stories(assigned_to);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_priority ON stories(priority);
CREATE INDEX idx_stories_epic_id ON stories(epic_id);
CREATE INDEX idx_stories_external_id ON stories(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_stories_voting_status ON stories(status) WHERE status IN ('voting', 'voted');
CREATE INDEX idx_stories_created_at ON stories(created_at);
```

### Story Tags Table

```sql
CREATE TABLE story_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366f1', -- Hex color
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, name)
);

CREATE TABLE story_tag_mappings (
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES story_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (story_id, tag_id)
);

-- Indexes
CREATE INDEX idx_story_tags_team_id ON story_tags(team_id);
CREATE INDEX idx_story_tag_mappings_story_id ON story_tag_mappings(story_id);
CREATE INDEX idx_story_tag_mappings_tag_id ON story_tag_mappings(tag_id);
```

### Voting Sessions Table

```sql
CREATE TYPE session_status AS ENUM ('preparing', 'active', 'paused', 'completed', 'cancelled');

CREATE TABLE voting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    status session_status NOT NULL DEFAULT 'preparing',
    voting_scale JSONB NOT NULL DEFAULT '[0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]', -- Fibonacci
    settings JSONB NOT NULL DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_voting_sessions_team_id ON voting_sessions(team_id);
CREATE INDEX idx_voting_sessions_created_by ON voting_sessions(created_by);
CREATE INDEX idx_voting_sessions_status ON voting_sessions(status);
CREATE INDEX idx_voting_sessions_active ON voting_sessions(status) WHERE status = 'active';
```

### Session Participants Table

```sql
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_moderator BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(session_id, user_id)
);

-- Indexes
CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX idx_session_participants_active ON session_participants(left_at) WHERE left_at IS NULL;
```

### Votes Table (Blind Voting)

```sql
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    story_points INTEGER NOT NULL,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
    reasoning TEXT,
    is_final_vote BOOLEAN NOT NULL DEFAULT false,
    voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    revealed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(story_id, session_id, voter_id, is_final_vote) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_votes_story_id ON votes(story_id);
CREATE INDEX idx_votes_session_id ON votes(session_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_votes_final ON votes(is_final_vote) WHERE is_final_vote = true;
CREATE INDEX idx_votes_unrevealed ON votes(revealed_at) WHERE revealed_at IS NULL;
```

## Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email                     String    @unique @db.VarChar(255)
  passwordHash              String    @map("password_hash") @db.VarChar(255)
  firstName                 String    @map("first_name") @db.VarChar(100)
  lastName                  String    @map("last_name") @db.VarChar(100)
  displayName               String?   @map("display_name") @db.VarChar(100)
  avatarUrl                 String?   @map("avatar_url")
  isActive                  Boolean   @default(true) @map("is_active")
  emailVerified             Boolean   @default(false) @map("email_verified")
  emailVerifiedAt           DateTime? @map("email_verified_at") @db.Timestamptz(6)
  lastLoginAt               DateTime? @map("last_login_at") @db.Timestamptz(6)
  passwordResetToken        String?   @map("password_reset_token") @db.VarChar(255)
  passwordResetExpiresAt    DateTime? @map("password_reset_expires_at") @db.Timestamptz(6)
  emailVerificationToken    String?   @map("email_verification_token") @db.VarChar(255)
  createdAt                 DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt                 DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  sessions                  UserSession[]
  teamMemberships           TeamMember[]
  createdStories            Story[] @relation("StoryCreator")
  assignedStories           Story[] @relation("StoryAssignee")
  votes                     Vote[]
  createdTeams              Team[] @relation("TeamCreator")
  invitedTeamMembers        TeamMember[] @relation("TeamInviter")
  sessionParticipations     SessionParticipant[]
  createdVotingSessions     VotingSession[] @relation("SessionCreator")
  createdTags               StoryTag[] @relation("TagCreator")
  preferences               UserPreferences?
  auditLogs                 UserAuditLog[]

  @@map("users")
}

model UserSession {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  sessionToken String   @unique @map("session_token") @db.VarChar(255)
  expiresAt   DateTime  @map("expires_at") @db.Timestamptz(6)
  ipAddress   String?   @map("ip_address") @db.Inet
  userAgent   String?   @map("user_agent")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}

model UserPreferences {
  userId                      String  @id @map("user_id") @db.Uuid
  theme                       String  @default("system") @db.VarChar(20)
  language                    String  @default("en") @db.VarChar(10)
  timezone                    String  @default("UTC") @db.VarChar(50)
  emailNotifications          Boolean @default(true) @map("email_notifications")
  pushNotifications           Boolean @default(true) @map("push_notifications")
  votingReminderNotifications Boolean @default(true) @map("voting_reminder_notifications")
  storyUpdateNotifications    Boolean @default(true) @map("story_update_notifications")
  createdAt                   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt                   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_preferences")
}

model Team {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @db.VarChar(255)
  description String?
  slug        String   @unique @db.VarChar(100)
  avatarUrl   String?  @map("avatar_url")
  isActive    Boolean  @default(true) @map("is_active")
  settings    Json     @default("{}")
  createdBy   String   @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  creator         User @relation("TeamCreator", fields: [createdBy], references: [id])
  members         TeamMember[]
  stories         Story[]
  votingSessions  VotingSession[]
  tags            StoryTag[]
  auditLogs       TeamAuditLog[]

  @@map("teams")
}

enum TeamRole {
  owner
  admin
  moderator
  member
  viewer

  @@map("team_role")
}

model TeamMember {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  teamId      String    @map("team_id") @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  role        TeamRole  @default(member)
  permissions Json      @default("{}")
  isActive    Boolean   @default(true) @map("is_active")
  invitedBy   String?   @map("invited_by") @db.Uuid
  invitedAt   DateTime  @default(now()) @map("invited_at") @db.Timestamptz(6)
  joinedAt    DateTime? @map("joined_at") @db.Timestamptz(6)
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  team    Team  @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  inviter User? @relation("TeamInviter", fields: [invitedBy], references: [id])

  @@unique([teamId, userId])
  @@map("team_members")
}

enum StoryStatus {
  draft
  ready
  voting
  voted
  archived

  @@map("story_status")
}

enum StoryPriority {
  low
  medium
  high
  critical

  @@map("story_priority")
}

model Story {
  id                    String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title                 String         @db.VarChar(500)
  description           String?
  acceptanceCriteria    String?        @map("acceptance_criteria")
  storyPoints           Int?           @map("story_points")
  priority              StoryPriority  @default(medium)
  status                StoryStatus    @default(draft)
  teamId                String         @map("team_id") @db.Uuid
  createdBy             String         @map("created_by") @db.Uuid
  assignedTo            String?        @map("assigned_to") @db.Uuid
  epicId                String?        @map("epic_id") @db.Uuid
  externalId            String?        @map("external_id") @db.VarChar(100)
  externalUrl           String?        @map("external_url")
  metadata              Json           @default("{}")
  votingStartedAt       DateTime?      @map("voting_started_at") @db.Timestamptz(6)
  votingCompletedAt     DateTime?      @map("voting_completed_at") @db.Timestamptz(6)
  finalStoryPoints      Int?           @map("final_story_points")
  createdAt             DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt             DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  team          Team                @relation(fields: [teamId], references: [id], onDelete: Cascade)
  creator       User                @relation("StoryCreator", fields: [createdBy], references: [id])
  assignee      User?               @relation("StoryAssignee", fields: [assignedTo], references: [id])
  epic          Story?              @relation("StoryEpic", fields: [epicId], references: [id])
  subStories    Story[]             @relation("StoryEpic")
  votes         Vote[]
  tags          StoryTagMapping[]
  auditLogs     StoryAuditLog[]

  @@map("stories")
}

model StoryTag {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String   @db.VarChar(100)
  color     String   @default("#6366f1") @db.VarChar(7)
  teamId    String   @map("team_id") @db.Uuid
  createdBy String   @map("created_by") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  // Relations
  team    Team                @relation(fields: [teamId], references: [id], onDelete: Cascade)
  creator User                @relation("TagCreator", fields: [createdBy], references: [id])
  stories StoryTagMapping[]

  @@unique([teamId, name])
  @@map("story_tags")
}

model StoryTagMapping {
  storyId String @map("story_id") @db.Uuid
  tagId   String @map("tag_id") @db.Uuid

  // Relations
  story Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  tag   StoryTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([storyId, tagId])
  @@map("story_tag_mappings")
}

enum SessionStatus {
  preparing
  active
  paused
  completed
  cancelled

  @@map("session_status")
}

model VotingSession {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String        @db.VarChar(255)
  description  String?
  teamId       String        @map("team_id") @db.Uuid
  createdBy    String        @map("created_by") @db.Uuid
  status       SessionStatus @default(preparing)
  votingScale  Json          @default("[0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]") @map("voting_scale")
  settings     Json          @default("{}")
  startedAt    DateTime?     @map("started_at") @db.Timestamptz(6)
  completedAt  DateTime?     @map("completed_at") @db.Timestamptz(6)
  createdAt    DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  team         Team                   @relation(fields: [teamId], references: [id], onDelete: Cascade)
  creator      User                   @relation("SessionCreator", fields: [createdBy], references: [id])
  participants SessionParticipant[]
  votes        Vote[]
  auditLogs    SessionAuditLog[]

  @@map("voting_sessions")
}

model SessionParticipant {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId    String    @map("session_id") @db.Uuid
  userId       String    @map("user_id") @db.Uuid
  joinedAt     DateTime  @default(now()) @map("joined_at") @db.Timestamptz(6)
  leftAt       DateTime? @map("left_at") @db.Timestamptz(6)
  isModerator  Boolean   @default(false) @map("is_moderator")

  // Relations
  session VotingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([sessionId, userId])
  @@map("session_participants")
}

model Vote {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  storyId         String    @map("story_id") @db.Uuid
  sessionId       String    @map("session_id") @db.Uuid
  voterId         String    @map("voter_id") @db.Uuid
  storyPoints     Int       @map("story_points")
  confidenceLevel Int?      @map("confidence_level")
  reasoning       String?
  isFinalVote     Boolean   @default(false) @map("is_final_vote")
  votedAt         DateTime  @default(now()) @map("voted_at") @db.Timestamptz(6)
  revealedAt      DateTime? @map("revealed_at") @db.Timestamptz(6)

  // Relations
  story   Story         @relation(fields: [storyId], references: [id], onDelete: Cascade)
  session VotingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  voter   User          @relation(fields: [voterId], references: [id], onDelete: Cascade)

  @@map("votes")
}

// Audit Trail Models
model UserAuditLog {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  action    String   @db.VarChar(100)
  details   Json     @default("{}")
  ipAddress String?  @map("ip_address") @db.Inet
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_audit_logs")
}

model TeamAuditLog {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  teamId    String   @map("team_id") @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  action    String   @db.VarChar(100)
  details   Json     @default("{}")
  ipAddress String?  @map("ip_address") @db.Inet
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@map("team_audit_logs")
}

model StoryAuditLog {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  storyId   String   @map("story_id") @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  action    String   @db.VarChar(100)
  oldValues Json?    @map("old_values")
  newValues Json?    @map("new_values")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  story Story @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@map("story_audit_logs")
}

model SessionAuditLog {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId String   @map("session_id") @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  action    String   @db.VarChar(100)
  details   Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  session VotingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("session_audit_logs")
}
```

## Migration Strategy

### Initial Migration (v1.0.0)

```sql
-- Migration: 001_initial_schema.sql
-- Up
BEGIN;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create custom types
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'moderator', 'member', 'viewer');
CREATE TYPE story_status AS ENUM ('draft', 'ready', 'voting', 'voted', 'archived');
CREATE TYPE story_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE session_status AS ENUM ('preparing', 'active', 'paused', 'completed', 'cancelled');

-- Create all tables (DDL statements from above)
-- ... (include all CREATE TABLE statements)

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voting_sessions_updated_at BEFORE UPDATE ON voting_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Down
BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
DROP TRIGGER IF EXISTS update_voting_sessions_updated_at ON voting_sessions;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS user_audit_logs CASCADE;
DROP TABLE IF EXISTS team_audit_logs CASCADE;
DROP TABLE IF EXISTS story_audit_logs CASCADE;
DROP TABLE IF EXISTS session_audit_logs CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS voting_sessions CASCADE;
DROP TABLE IF EXISTS story_tag_mappings CASCADE;
DROP TABLE IF EXISTS story_tags CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop types
DROP TYPE IF EXISTS session_status;
DROP TYPE IF EXISTS story_priority;
DROP TYPE IF EXISTS story_status;
DROP TYPE IF EXISTS team_role;

COMMIT;
```

### Migration Commands

```bash
# Using Prisma
npx prisma migrate dev --name initial_schema
npx prisma migrate deploy  # Production
npx prisma migrate reset   # Reset database

# Manual migrations
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

### Rollback Procedures

1. **Automated Rollback (Prisma)**:
   ```bash
   npx prisma migrate reset
   npx prisma migrate deploy --to 20231201120000_previous_migration
   ```

2. **Manual Rollback**:
   ```sql
   -- Execute the "Down" section of the migration
   -- Restore from backup if needed
   ```

3. **Data Recovery**:
   - Daily automated backups
   - Point-in-time recovery capability
   - Transaction log backups every 15 minutes

## Performance Optimization

### Primary Indexes

Already included in table definitions above. Key indexes:

- **Users**: email, active status, created_at
- **Teams**: slug, created_by, active status
- **Stories**: team_id, status, priority, voting status
- **Votes**: story_id, session_id, voter_id, unrevealed votes
- **Sessions**: team_id, status, active sessions

### Composite Indexes

```sql
-- Team member lookup by team and role
CREATE INDEX idx_team_members_team_role ON team_members(team_id, role) WHERE is_active = true;

-- Story voting lookup
CREATE INDEX idx_votes_story_session ON votes(story_id, session_id) WHERE revealed_at IS NULL;

-- Session participants active lookup
CREATE INDEX idx_session_participants_active ON session_participants(session_id, user_id) WHERE left_at IS NULL;

-- Story search by team and status
CREATE INDEX idx_stories_team_status ON stories(team_id, status, created_at);

-- Audit trail time-based queries
CREATE INDEX idx_user_audit_logs_time ON user_audit_logs(user_id, created_at);
CREATE INDEX idx_story_audit_logs_time ON story_audit_logs(story_id, created_at);
```

### Query Optimization

```sql
-- Partial indexes for active records
CREATE INDEX idx_users_active_email ON users(email) WHERE is_active = true;
CREATE INDEX idx_teams_active_slug ON teams(slug) WHERE is_active = true;

-- Expression indexes for search
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email));
CREATE INDEX idx_stories_search ON stories USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

## Database Seeding

### Development Seed Data

```sql
-- Development seed script
INSERT INTO users (id, email, password_hash, first_name, last_name, display_name, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', '$2b$12$HASH_HERE', 'Admin', 'User', 'Admin', true),
('550e8400-e29b-41d4-a716-446655440002', 'user1@example.com', '$2b$12$HASH_HERE', 'John', 'Doe', 'John', true),
('550e8400-e29b-41d4-a716-446655440003', 'user2@example.com', '$2b$12$HASH_HERE', 'Jane', 'Smith', 'Jane', true);

INSERT INTO teams (id, name, description, slug, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'Development Team', 'Core development team', 'dev-team', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440102', 'Product Team', 'Product management team', 'product-team', '550e8400-e29b-41d4-a716-446655440001');

INSERT INTO team_members (team_id, user_id, role) VALUES
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'owner'),
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440002', 'member'),
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440003', 'member');

INSERT INTO stories (id, title, description, team_id, created_by, status, priority) VALUES
('550e8400-e29b-41d4-a716-446655440201', 'User Authentication', 'Implement user login and registration', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'ready', 'high'),
('550e8400-e29b-41d4-a716-446655440202', 'Story Management', 'Create and manage user stories', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'ready', 'medium');
```

### Seeding Commands

```bash
# Using Prisma
npx prisma db seed

# Manual seeding
psql $DATABASE_URL -f seeds/local.sql
```

## Security Considerations

### Data Protection Measures

1. **Password Security**:
   - bcrypt hashing with salt rounds >= 12
   - Password reset tokens with expiration
   - No plain text password storage

2. **Session Security**:
   - Cryptographically secure session tokens
   - Session expiration and cleanup
   - IP address and user agent tracking

3. **Data Encryption**:
   ```sql
   -- Enable row-level security
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
   ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

   -- Create policies for team-based access
   CREATE POLICY users_policy ON users FOR ALL TO app_user USING (id = current_user_id());
   CREATE POLICY team_stories_policy ON stories FOR ALL TO app_user
     USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = current_user_id()));
   ```

4. **Audit Trail Protection**:
   - Immutable audit logs (no UPDATE allowed)
   - Separate audit database user with limited permissions
   - Automated log rotation and archival

5. **Database Security**:
   ```sql
   -- Create application-specific database user
   CREATE USER app_user WITH PASSWORD 'secure_password';
   GRANT CONNECT ON DATABASE censeo TO app_user;
   GRANT USAGE ON SCHEMA public TO app_user;

   -- Grant specific table permissions
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   GRANT INSERT ON user_audit_logs, team_audit_logs, story_audit_logs, session_audit_logs TO app_user;

   -- Prevent direct access to sensitive fields
   REVOKE ALL ON users.password_hash FROM app_user;
   ```

6. **Data Validation**:
   - Email format validation at database level
   - Constraint checks for role hierarchies
   - Foreign key constraints for data integrity

7. **Backup Security**:
   - Encrypted database backups
   - Secure backup storage with access controls
   - Regular backup restoration testing

### Connection Security

```env
# Secure database connection
DATABASE_URL="postgresql://app_user:secure_password@localhost:5432/censeo?sslmode=require&connect_timeout=10"
```

## Schema Changes

All schema modifications must follow this process:

1. **Create Migration**:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

2. **Test Migration**:
   - Test on local environment
   - Verify data integrity
   - Test rollback procedure

3. **Deploy Migration**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Monitor Performance**:
   - Check query performance after migration
   - Monitor index usage
   - Update statistics if needed

This database schema provides a robust foundation for the MVP while maintaining scalability, security, and performance optimization for the blind voting workflow and team management features.