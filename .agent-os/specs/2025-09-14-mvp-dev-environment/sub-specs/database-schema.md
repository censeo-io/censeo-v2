# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-14-mvp-dev-environment/spec.md

> Created: 2025-09-14
> Version: 1.0.0

## New Tables

**Users Table** (temporary auth)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sessions Table**
```sql
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    facilitator_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Stories Table**
```sql
CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    story_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Votes Table**
```sql
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    points VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id)
);
```

## Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_sessions_facilitator ON sessions(facilitator_id);
CREATE INDEX idx_stories_session ON stories(session_id, story_order);
CREATE INDEX idx_votes_story ON votes(story_id);
CREATE INDEX idx_votes_user ON votes(user_id);

-- Data integrity constraints
ALTER TABLE sessions ADD CONSTRAINT check_status
    CHECK (status IN ('active', 'completed', 'paused'));

ALTER TABLE stories ADD CONSTRAINT check_story_status
    CHECK (status IN ('pending', 'voting', 'completed'));

ALTER TABLE votes ADD CONSTRAINT check_points_format
    CHECK (points IN ('1', '2', '3', '5', '8', '13', '21', '?'));
```

## Initial Data Migration

```sql
-- Insert sample data for development
INSERT INTO users (name, email) VALUES
    ('Test Facilitator', 'facilitator@example.com'),
    ('Test Member 1', 'member1@example.com'),
    ('Test Member 2', 'member2@example.com');
```

## Migration Strategy

- **Django Migrations**: Use Django's migration system for schema changes
- **Initial Setup**: Create initial migration with all tables
- **Development Data**: Include fixture data for local testing
- **Schema Evolution**: Plan for future authentication system migration

## Performance Considerations

- **Query Optimization**: Indexes on foreign keys and frequently queried fields
- **Data Integrity**: Cascading deletes for data consistency
- **Constraint Validation**: Database-level validation for critical business rules

## Data Integrity Rules

- **Session Ownership**: Only facilitators can modify session settings
- **Vote Uniqueness**: One vote per user per story enforced at database level
- **Referential Integrity**: Foreign key relationships maintain data consistency
- **Status Validation**: Enum constraints ensure valid status values