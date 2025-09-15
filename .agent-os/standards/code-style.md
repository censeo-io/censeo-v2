# Code Style Guide

## Context

Global code style rules for Agent OS projects.

<conditional-block context-check="general-formatting">
IF this General Formatting section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using General Formatting rules already in context"
ELSE:
  READ: The following formatting rules

## General Formatting

### Indentation
- Use 2 spaces for indentation (never tabs)
- Maintain consistent indentation throughout files
- Align nested structures for readability

### Naming Conventions
- **Methods and Variables**: Use snake_case (e.g., `user_profile`, `calculate_total`)
- **Classes and Modules**: Use PascalCase (e.g., `UserProfile`, `PaymentProcessor`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

### String Formatting
- Use single quotes for strings: `'Hello World'`
- Use double quotes only when interpolation is needed
- Use template literals for multi-line strings or complex interpolation

### Code Comments
- Add brief comments above non-obvious business logic
- Document complex algorithms or calculations
- Explain the "why" behind implementation choices
- Never remove existing comments unless removing the associated code
- Update comments when modifying code to maintain accuracy
- Keep comments concise and relevant
</conditional-block>

<conditional-block task-condition="python-django" context-check="python-django-style">
IF current task involves writing or updating Python:
  IF python-style.md already in context:
    SKIP: Re-reading these files
    NOTE: "Using Python style guides already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get Python formatting rules from code-style/python-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ the following style guides (only if not already in context):
        - @.agent-os/standards/code-style/python-style.md (if not in context)
    </context_fetcher_strategy>
ELSE:
  SKIP: Python style guides not relevant to current task

IF current task involves Django models/migrations:
  IF django-models-style.md already in context:
    SKIP: Re-reading these files
    NOTE: "Using Django models/migrations style guides already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get Django models/migrations formatting rules from code-style/django-models-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ the following style guides (only if not already in context):
        - @.agent-os/standards/code-style/django-models-style.md (if not in context)
    </context_fetcher_strategy>
ELSE:
  SKIP: Django models/migrations style guides not relevant to current task

IF current task involves Django API/serialization:
  IF django-api-style.md already in context:
    SKIP: Re-reading these files
    NOTE: "Using Django API/serialization style guides already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get Django API/serialization formatting rules from code-style/django-api-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ the following style guides (only if not already in context):
        - @.agent-os/standards/code-style/django-api-style.md (if not in context)
    </context_fetcher_strategy>
ELSE:
  SKIP: Django API/serialization style guides not relevant to current task
</conditional-block>

<conditional-block task-condition="typescript" context-check="typescript-style">
IF current task involves writing or updating TypeScript:
  IF typescript-style.md already in context:
    SKIP: Re-reading this file
    NOTE: "Using TypeScript style guide already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get TypeScript style rules from code-style/typescript-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ: @.agent-os/standards/code-style/typescript-style.md
    </context_fetcher_strategy>
ELSE:
  SKIP: TypeScript style guide not relevant to current task
</conditional-block>

<conditional-block task-condition="jsx-react" context-check="jsx-react-style">
IF current task involves writing or updating React/JSX:
  IF jsx-style.md already in context:
    SKIP: Re-reading this file
    NOTE: "Using React/JSX style guide already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get React/JSX style rules from code-style/jsx-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ: @.agent-os/standards/code-style/jsx-style.md
    </context_fetcher_strategy>
ELSE:
  SKIP: React/JSX style guide not relevant to current task
</conditional-block>

<conditional-block task-condition="css-tailwind-styling" context-check="css-tailwind-style">
IF current task involves CSS or TailwindCSS:
  IF css-style.md already in context:
    SKIP: Re-reading this file
    NOTE: "Using CSS/TailwindCSS style guide already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get CSS/TailwindCSS style rules from code-style/css-tailwind-style.md"
        PROCESS: Returned style rules
      ELSE:
        READ: @.agent-os/standards/code-style/css-tailwind-style.md
    </context_fetcher_strategy>
ELSE:
  SKIP: CSS style guide not relevant to current task
</conditional-block>
