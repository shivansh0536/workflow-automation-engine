# System Architecture

## Overview

The Event-Driven Intelligent Workflow Automation System follows a **layered, event-driven architecture** that separates concerns across distinct modules.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                 │
│              React.js Frontend (SPA)                 │
│         Communicates via REST API (JSON)              │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP
┌───────────────────────▼─────────────────────────────┐
│                    API Layer                         │
│           Express.js Routes & Controllers            │
│    routes/ → controllers/ → services/                │
│   Middleware: CORS, JSON Parser, Validation,         │
│              Error Handler                           │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│                 Business Logic Layer                  │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ EventBus │→ │ Rule Engine  │→ │ Action Factory│  │
│  │(Observer)│  │ (Singleton)  │  │  (Factory)    │  │
│  └──────────┘  └──────┬───────┘  └───────────────┘  │
│                       │                              │
│              ┌────────▼────────┐                     │
│              │  RuleEvaluator  │                     │
│              │   (Strategy)    │                     │
│              └────────┬────────┘                     │
│              ┌────────▼────────┐                     │
│              │ RuleRepository  │                     │
│              │  (Repository)   │                     │
│              └─────────────────┘                     │
└───────────────────────┬─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│                   Data Layer                         │
│            Prisma ORM + PostgreSQL                   │
│   Models: Workflow, Step, WorkflowRun, StepRun,      │
│   Employee, Attendance, Leave, Rule, HREvent,        │
│   ActionLog                                          │
└─────────────────────────────────────────────────────┘
```

---

## Event Flow (Event → Condition → Action)

```
1. User Action (e.g., Mark Attendance)
        │
2. Controller creates DB record
        │
3. HREvent created in database
        │
4. ruleEngine.processEvent(event) called async
        │
5. RuleEngine validation pipeline:
   ├── EventTypeValidator → validates event type
   ├── RuleLoader → fetches matching active rules from DB
   └── EmployeeLoader → loads employee if needed
        │
6. For each matching rule:
   ├── RuleEvaluator.evaluate() → checks condition (Strategy)
   ├── If condition met:
   │   ├── ActionFactory.create(actionType) → instantiate action (Factory)
   │   ├── action.execute() → run the action (Command)
   │   └── ActionLog created with SUCCESS
   └── If condition NOT met:
       └── ActionLog created with SKIPPED
        │
7. HREvent status updated (PROCESSED/FAILED)
```

---

## Module Dependencies

```
                    app.js
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    routes/     middleware/    errorHandler
        │
   controllers/
        │
    ┌───┼───┐
    │   │   │
services/ ruleEngine/ models/
    │        │          │
 actions/  EventBus     │
    │      RuleEvaluator │
    │      RuleRepository│
    │         │         │
    └────┬────┘─────────┘
         │
    database/prisma.js
         │
    PostgreSQL
```

---

## Key Design Decisions

1. **Async Event Processing**: Events are processed asynchronously (fire-and-forget from controllers) to keep API responses fast.

2. **Separate Rule Engine Module**: The rule engine is isolated in `src/ruleEngine/` with its own evaluator, repository, and event bus — making it independently testable.

3. **Domain Models**: Business logic is encapsulated in `src/models/` domain objects, separate from Prisma's generated types.

4. **Validation Pipeline**: Uses Chain of Responsibility pattern for pre-processing validation before rule evaluation.

5. **Extensible Action System**: New actions are added by extending BaseAction and registering with ActionFactory — zero modifications to existing code.
