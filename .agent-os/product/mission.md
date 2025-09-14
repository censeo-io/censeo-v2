# Product Mission

> **📄 Original Documentation**: See [original-prd.md](./original-prd.md) for complete product requirements and user stories

## Pitch

Censeo is a story pointing application that helps agile development teams estimate work collaboratively by providing secure, real-time blind voting sessions with intelligent reconnection handling.

## Users

### Primary Customers

- **Agile Development Teams**: Small to medium teams (5-15 members) practicing Scrum or similar agile methodologies
- **Distributed Teams**: Remote and hybrid teams needing reliable real-time collaboration tools

### User Personas

**Facilitator**
- **Role:** Scrum Master, Team Lead, or Product Owner
- **Context:** Manages agile ceremonies and needs tools to ensure fair, unbiased estimation
- **Pain Points:** Existing tools are complex, unreliable, or allow voting bias through premature reveals
- **Goals:** Run efficient pointing sessions, maintain team engagement, ensure accurate estimates

**Team Member**
- **Role:** Developer, Designer, QA Engineer, or Business Analyst
- **Context:** Participates in sprint planning and story estimation sessions
- **Pain Points:** Connection issues disrupt sessions, complex interfaces slow down voting, bias from seeing others' votes
- **Goals:** Quickly and accurately estimate stories, maintain focus during sessions, seamless participation

## The Problem

### Voting Bias in Story Estimation

Current story pointing tools often show votes in real-time, creating anchoring bias where team members are influenced by others' estimates before submitting their own. This leads to inaccurate estimates and groupthink, undermining the core value of collaborative estimation.

**Our Solution:** Blind voting that hides all votes until everyone has participated, ensuring independent judgment.

### Poor Handling of Real-World Disruptions

Most tools fail gracefully when team members disconnect, go to meetings, or step away, often blocking entire sessions or requiring manual workarounds that disrupt flow.

**Our Solution:** Intelligent reconnection handling and temporary voter exclusion that keeps sessions moving while accommodating real-world interruptions.

### Security and Resource Abuse

Simple tools often lack proper rate limiting and security measures, making them vulnerable to abuse or denial-of-service attacks that can disrupt business-critical planning sessions.

**Our Solution:** Comprehensive configurable limits and security measures that protect team sessions without requiring administrative overhead.

### Unreliable Real-Time Communication

Many tools suffer from connection drops, missed updates, or sync issues that break the collaborative experience and force teams to restart sessions or manually verify state.

**Our Solution:** Robust Socket.IO implementation with automatic reconnection, state synchronization, and visual connection status indicators.

## Differentiators

### True Blind Voting with Smart Reconnection

Unlike Planning Poker or Scrum Poker Online, we provide genuine blind voting that prevents bias while handling disconnections intelligently. Users who reconnect can still vote on current stories without seeing results, maintaining the integrity of the estimation process.

### Facilitator-Controlled Session Management

Unlike tools that rely on automatic reveals or timers, we give facilitators full control over when to reveal votes and progress sessions. This results in better meeting facilitation and accommodation of team discussion needs.

### Security-First Design with Configurable Limits

Unlike simple pointing tools, we provide enterprise-grade security with configurable resource limits that prevent abuse without requiring complex administration. This results in reliable service that teams can depend on for critical planning activities.

## Key Features

### Core Features

- **Magic Link Authentication:** Passwordless login eliminates password management while maintaining security
- **Blind Voting System:** Votes remain hidden until all active participants complete voting, preventing bias
- **Facilitator Controls:** Complete session management including story progression and vote reveal timing
- **Real-Time Status Updates:** Live visibility into who has voted without revealing vote values
- **Smart Reconnection:** Disconnected users can rejoin and vote without seeing premature results

### Collaboration Features

- **Team Management:** Role-based permissions with facilitator and member roles for appropriate access control
- **Session Sharing:** Shareable links allow easy joining without complex invitation processes
- **Story Management:** Manual story entry with bulk input options for efficient session preparation
- **Temporary Exclusion:** Ability to exclude absent members so sessions aren't blocked by disconnected users
- **Audit Trail:** Complete history of all session activities for retrospectives and accountability

### Security Features

- **Resource Protection:** Configurable limits on stories, team size, and meeting frequency prevent abuse
- **Input Validation:** Comprehensive sanitization protects against injection attacks and malicious content
- **Rate Limiting:** Per-endpoint limits prevent spam and denial-of-service attempts