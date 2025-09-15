# Product Mission

> Last Updated: 2025-09-14
> Version: 1.0.0

## Pitch

Censeo is a story pointing application that helps agile development teams collaboratively estimate work through blind voting sessions by providing real-time collaboration and secure vote management.

## Users

### Primary Customers
- Agile development teams (5-15 members): Teams that need focused, bias-free story estimation
- Project managers and scrum masters: Leaders who facilitate planning sessions

### User Personas
**Facilitator** (25-45 years old)
- **Role:** Scrum Master/Team Lead
- **Context:** Manages agile ceremonies and team coordination
- **Pain Points:** Voting bias in story pointing, handling disconnected members, managing voting sessions
- **Goals:** Efficient story pointing sessions, accurate estimations, team engagement

**Team Member** (22-40 years old)
- **Role:** Developer/Designer/Tester
- **Context:** Participates in sprint planning and estimation
- **Pain Points:** Intimidation by senior member votes, connection issues during remote sessions, missing context on stories
- **Goals:** Fair voting environment, reliable session participation, clear story understanding

## The Problem

### Voting Bias in Story Estimation
Traditional story pointing suffers from anchoring bias where early votes influence others. Teams waste 30-60% more time on estimation sessions due to bias and social pressure effects.

**Our Solution:** Blind voting that hides all votes until everyone has participated, ensuring independent estimation.

### Unreliable Remote Collaboration
Remote teams lose 20-40% of members during story pointing due to technical issues and connection problems. Sessions often restart or exclude valuable team input.

**Our Solution:** Robust real-time communication with automatic reconnection and catch-up features for disconnected users.

### Lack of Audit Trail and Accountability
Teams can't track estimation accuracy or identify patterns in their planning sessions. Post-session retrospectives lack concrete data for improvement.

**Our Solution:** Comprehensive audit trails and session history that enable data-driven estimation improvements.

## Differentiators

### Advanced Disconnection Handling
Unlike Scrum Poker or Planning Poker tools, we provide intelligent reconnection with automatic catch-up and temporary voter exclusion. This results in 95% session completion rates even with unstable connections.

### Facilitator-Controlled Transparency
Unlike tools that auto-reveal votes, we give facilitators complete control over when votes are shown. This results in more thoughtful estimation and reduced groupthink.

### Enterprise-Grade Security with Simplicity
Unlike complex enterprise tools, we provide passwordless magic link authentication with comprehensive audit trails. This results in faster onboarding while maintaining compliance requirements.

## Key Features

### Core Features
- **Blind Voting System:** Prevents estimation bias by hiding votes until all participants complete voting
- **Real-time Collaboration:** Socket.IO-powered live updates with sub-200ms latency for seamless teamwork
- **Magic Link Authentication:** Passwordless login system that eliminates password management overhead
- **Story Management:** Manual entry with bulk import capabilities for efficient session preparation
- **Configurable Pointing Scales:** Fibonacci, T-shirt sizes, or Powers of 2 to match team preferences

### Collaboration Features
- **Smart Reconnection:** Automatic catch-up for disconnected users without disrupting active sessions
- **Facilitator Controls:** Complete session management with vote reveal timing and member exclusion
- **Team Management:** Role-based permissions with secure team invitation system
- **Session History:** Complete audit trails for retrospectives and process improvement
- **Resource Protection:** Configurable limits preventing abuse while maintaining team productivity