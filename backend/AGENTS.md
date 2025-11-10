# Kanban Backend – Java/Spring Boot Development Standards

## Technology Stack

-   Java 17 LTS with modern language features adopted across the codebase.
-   Spring Boot 3.2 orchestrated through Gradle Kotlin DSL builds.
-   H2 database for development, PostgreSQL for production, Spring Data JPA/Hibernate for persistence.

## Modern Java Guardrails

-   Favor recent platform capabilities (var, records, streams, Optionals, text blocks, switch expressions, pattern matching) whenever they clarify intent and reduce boilerplate.
-   Restrict var to local variables with obvious types; never use it for fields, parameters, or values whose type is unclear.
-   Use records for immutable DTOs and lightweight value objects; keep classic classes when validation annotations, inheritance, or mutability are required.
-   Prefer immutable collection factory methods (List.of, Map.of, Set.of) and only fall back to mutable constructors when necessary.
-   Keep stream pipelines side-effect free, end them with clear terminal operations, and avoid collecting into structures that are immediately copied.
-   Wrap nullable results in Optional, forbid null returns from public APIs, and centralize optional-handling helpers for consistency.
-   Use text blocks for multi-line literals, switch expressions for concise branching, pattern matching for instanceof checks, and modern exception types that preserve stack traces.
-   Modern Java checklist: rely on immutable data structures, document any legacy API usage, enforce new-language lint rules, and keep IDE/shared formatter settings aligned.

## Project Structure & Layer Responsibilities

-   Controllers stay thin: expose REST endpoints, trigger validation, convert requests to service commands, and map service responses to DTOs without business logic or persistence code.
-   Services own transactional boundaries, orchestrate repositories, enforce business rules, convert between entities and DTOs, and ensure pagination conversions happen while the transaction is active.
-   Repositories declare descriptive query methods per aggregate, encapsulate pagination and sorting defaults, and prefer derived queries or targeted JPQL instead of ad-hoc implementations.
-   Entities contain persistence-only concerns with auditing timestamps, lazy relationships by default, explicit ownership of associations, and value objects for complex fields.
-   DTOs are separated for requests and responses, include their own validation metadata, and provide mapper helpers so that entities never leak past the service layer.

## Naming, Validation, and Error Handling

-   Apply consistent suffixes (Controller, Service, Repository, Request, Response) with PascalCase class names; command methods use verbs while read methods use prefixes like find, get, list, or count.
-   Validate every inbound payload with Bean Validation annotations, activate validation at controller boundaries, and surface localized error messages through the response body.
-   Global exception handling maps domain-specific errors to HTTP status codes, logs each failure exactly once, and strips internal details from client-visible responses.
-   Custom exceptions communicate intent (ResourceNotFound, DuplicateResource, ValidationFailure, ForbiddenAction, etc.) and always include contextual identifiers for easier support.

## Configuration & Profile Management

-   Configuration classes stay scoped to a single concern: WebMvcConfig (CORS, formatters, interceptors), RestClientConfig (HTTP client defaults, timeouts, codecs), OpenApiConfig (documentation metadata), JacksonConfig (serialization policies), AsyncConfig (executors and thread pools), JpaConfig (auditing and converters).
-   Favor constructor injection, final fields, and minimal bean exposure; document any manual overrides of Spring Boot auto-configuration.
-   Profiles dev, test, and prod each load dedicated property files that can be overridden via command-line arguments or environment variables at deploy time.
-   Logging, connection pools, and JPA tuning parameters are centralized: structured logs with correlation IDs, HikariCP sizing per environment, batching/bulk hints enabled when safe, and SQL logging scoped to troubleshooting only.

## Testing Standards

-   Unit tests isolate business logic with mocks, cover happy paths and edge cases, and run quickly without Spring context startup.
-   Integration tests load the Spring container, hit REST endpoints via MockMvc or WebTestClient, and back persistence with testcontainers for deterministic data access.
-   Repository tests verify custom queries, pagination ordering, and fetch strategies while resetting database state between runs.

## Best Practices & Database Guidance

-   Apply SOLID principles so controllers remain slim, services cohesive, and repositories minimal.
-   Follow Spring Boot idioms: constructor injection, configuration properties, no field injection, minimal manual bean wiring, and avoidance of static state.
-   Manage database schema through migration tooling, index join columns and search filters, prevent N+1 queries with fetch joins or entity graphs, and paginate every read endpoint.
-   Critical pagination rule: repositories should return entities, services must convert them to DTOs inside a transactional method, and controllers may only work with the DTO page; converting after the transaction closes triggers lazy-loading failures.
-   Transaction checklist: mark read-only queries accordingly, resolve required lazy relationships before returning, keep fetch strategies consistent, and ensure service methods clearly express their transactional intent.

## Security & Performance

-   Enforce authentication and authorization policies, validate every input, guard against injection, enable CSRF protection, and avoid leaking internal details in error payloads.
-   Secure outbound HTTP calls with timeouts, retries, and circuit breakers; manage secrets outside source control and inject them via configuration properties.
-   Meet performance targets through caching hot queries, batching writes, leveraging asynchronous execution for long-running work, and instrumenting metrics plus tracing for observability.

## Code Review Checklist

-   Layering, naming, and package structure follow the conventions above.
-   Error handling, validation, logging, and configuration updates align with standards.
-   Tests accompany new behavior, pass locally, and maintain coverage expectations.
-   Transaction boundaries, pagination handling, and security implications are explicitly verified.
-   Documentation or comments are refreshed when behavior changes, and no hardcoded secrets remain.
