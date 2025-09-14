# TypeScript/JavaScript Style Guide

## TypeScript Configuration
- Use TypeScript strict mode enabled
- Prefer explicit types over `any`
- Use interfaces for object shapes, types for unions
- Enable all strict type checking options

## Code Style
- Use Prettier for formatting with 2-space indentation
- Use ESLint with TypeScript rules
- Prefer const over let, never use var
- Use meaningful variable and function names
- Use camelCase for variables and functions
- Use PascalCase for classes, interfaces, and types

## Functions
- Prefer arrow functions for inline callbacks
- Use function declarations for main module functions
- Always specify return types for public functions
- Use async/await over Promises chains

## Error Handling
- Use typed error handling with custom error classes
- Always handle async errors with try/catch
- Validate inputs at function boundaries
- Log errors with context information

## Imports/Exports
- Use ES6 import/export syntax
- Group imports: external libraries first, then internal modules
- Use absolute imports when available
- Export interfaces and types for reusability

## React-Specific Guidelines
- Use TypeScript throughout React components and custom hooks
- Prefer React Context API for shared state management
- Use custom hooks for reusable logic and side effects
- Keep component logic focused and testable
- Extract complex logic to separate utility functions
