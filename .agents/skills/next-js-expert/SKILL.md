---
name: next-js-expert
description: Build and maintain production full-stack applications with Next.js App Router, React, TypeScript, Tailwind CSS, Route Handlers, Server Actions, authentication, databases, caching, and deployment-safe configuration. Use when changing routes, UI, server-side data access, APIs, mutations, middleware, environment variables, or project architecture.
---

# Next.js Expert

Build on the repository's installed Next.js version and existing conventions. Inspect the current structure, dependencies, and configuration before choosing an implementation. Reuse existing patterns before adding libraries or abstractions.

## Architecture

- Use App Router only. Do not add Pages Router files or `getServerSideProps`.
- Prefer Server Components. Add `"use client"` only for browser state, effects, event handlers, or client-only libraries.
- Keep route-specific components, loading states, errors, and metadata near their route. Put genuinely shared UI and domain logic outside `app/`.
- Separate presentation, domain logic, and infrastructure. Components must not contain database or external-service implementation details.
- Use `server-only` in modules that handle credentials, privileged SDKs, or direct database access.
- Do not introduce a second pattern for routing, validation, data access, or mutations when the project already has one.

## Server-Side Data And APIs

- Fetch initial data in Server Components and pass only serializable, minimal props to Client Components.
- Keep database queries and external API calls in focused server-side modules. Reuse the project's repository or service layer if one exists.
- Use Route Handlers for public HTTP APIs, webhooks, callbacks, streaming, or endpoints consumed outside the Next.js application.
- Use Server Actions for application-owned form mutations when they simplify the flow. Authenticate and authorize inside every action; never trust hidden fields or client state.
- Validate all untrusted input at the server boundary with the project's existing schema validator. Return structured, typed errors without leaking internals.
- Avoid request waterfalls: start independent work concurrently and compose data at the nearest common Server Component.

## Mutations, Caching, And Runtime

- After a mutation, revalidate the smallest affected path or cache tag. Redirect only after the mutation succeeds.
- Choose caching deliberately. User-specific or permission-sensitive data must not enter a shared cache.
- Keep Node-only packages out of Edge code. Set a route runtime explicitly when package or platform constraints require it.
- Make webhook and retryable operations idempotent. Use database transactions for multi-write invariants.
- Treat background work as platform-dependent: enqueue durable jobs instead of relying on work continuing after a response.

## Authentication And Security

- Use the existing authentication provider and session helpers. Enforce authorization in server-side data access, Route Handlers, and Server Actions—not only in layouts or UI.
- Never expose secrets through `NEXT_PUBLIC_*`, serialized props, logs, or error responses.
- Verify webhook signatures against the raw request body. Apply rate limits and origin/CSRF protections where appropriate.
- Use parameterized ORM/query APIs. Escape or sanitize user-controlled rich content before rendering; avoid `dangerouslySetInnerHTML`.
- Keep environment-variable access centralized and validated at startup or first use. Document required variables in an example env file without real values.

## Code Style

- Use named exports by default.
- Use kebab-case folders.
- Avoid `any`; use explicit domain types and narrow `unknown` at boundaries.
- Avoid TypeScript enums; use `as const` objects or literal unions.
- Derive types from schemas, ORM models, and functions where practical instead of duplicating shapes.
- Keep files focused and split unrelated responsibilities. Prefer existing components, utilities, hooks, and server modules.
- Do not create pass-through abstractions that have only one caller and no policy, transformation, or test seam.

## UI, Forms, And Accessibility

- Use Tailwind utilities for styling.
- Use `next/image` for raster images and `next/font` for managed fonts.
- Write semantic HTML with keyboard-accessible controls and navigation.
- Prefer native form actions and progressive enhancement. Represent pending, success, empty, and failure states explicitly.
- Provide route-level `loading.tsx`, `error.tsx`, and `not-found.tsx` where those states materially improve the experience.
- Keep metadata server-side and use the Metadata API for static or data-driven SEO.

## Verification

- Run the repository's type-check, lint, test, and production build commands after relevant changes.
- Test server code at trust boundaries and domain logic directly. Add browser tests for critical user journeys when the project has an end-to-end setup.
- Check both authenticated and unauthorized behavior for protected operations.
- Confirm environment, runtime, caching, and deployment assumptions against the target hosting platform.
