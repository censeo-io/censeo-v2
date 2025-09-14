# Spec Requirements Document

> Spec: Core MVP Foundation
> Created: 2025-09-13

## Overview

Implement the foundational infrastructure and core features for Censeo's story pointing application, including multi-environment deployment setup, authentication system, team management, and blind voting workflow. This phase establishes the secure, scalable foundation needed for real-time collaborative estimation with comprehensive local development and production environment support.

## User Stories

### Facilitator Account Creation and Team Setup

As a scrum master, I want to create a Censeo account and set up my team, so that I can begin running story pointing sessions with proper access controls.

The facilitator visits the application, enters their email for magic link authentication, receives and clicks the secure login link, then creates a team by providing team name and inviting members via email addresses. The system generates secure invitation links and establishes role-based permissions.

### Team Member Participation in Voting Sessions

As a team member, I want to join a pointing session and cast votes without bias, so that our estimates are independent and accurate.

Team members receive invitation links, authenticate via magic link, join the active session, view stories one at a time, cast votes that remain hidden from others, and see voting progress indicators until facilitator reveals results.

### Real-time Session Management with Reconnection

As a facilitator, I want to manage voting sessions with reliable real-time updates and handle disconnections gracefully, so that sessions continue smoothly despite network issues.

Facilitators create sessions, add stories manually, track who has voted in real-time, control when votes are revealed, and automatically handle member reconnections without disrupting the voting process or revealing partial results.

## Spec Scope

1. **Multi-Environment Infrastructure Setup** - Complete Google Cloud deployment with staging and production environments
2. **Magic Link Authentication System** - Passwordless login with JWT tokens and secure session management
3. **Team Management with RBAC** - Create teams, invite members, assign facilitator/member roles with appropriate permissions
4. **Real-time Voting Infrastructure** - Socket.IO implementation with automatic reconnection and state synchronization
5. **Blind Voting Workflow** - Vote casting, status tracking, facilitator-controlled reveals with bias prevention
6. **Manual Story Management** - Add, edit, and organize stories within pointing sessions
7. **Local Development Environment Setup** - Local development with Docker, hot reload, and database management

## Out of Scope

- Bulk story import (CSV, JIRA integration)
- Advanced analytics and reporting
- Mobile applications
- Passkey authentication (Phase 2)
- Advanced session features (story attachments, rich text)
- Performance optimization with caching layers

## Expected Deliverable

1. **Fully Deployed Multi-Environment System** - Working local development, staging, and production environments accessible via web browsers
2. **Complete Authentication Flow** - Users can register, login via magic links, and maintain secure sessions across environments
3. **End-to-End Voting Workflow** - Teams can create accounts, invite members, run pointing sessions, and complete blind voting cycles with real-time updates