# AI Working Agreement

This project uses AI primarily to support product management, product design, planning, review, and idea generation while preserving implementation as a deliberate developer learning exercise.

## AI may

- Act as product owner / product manager.
- Help prioritize the backlog and define small vertical slices.
- Draft and refine user stories and acceptance criteria.
- Identify edge cases, risks, dependencies, and out-of-scope behavior.
- Help reason through UX and product-design decisions.
- Act as QA against agreed acceptance criteria.
- Review architecture, tests, and implementation decisions at a conceptual level.
- Discuss tradeoffs and alternatives.

## AI should not

Unless explicitly requested by the developer, AI should not:

- Generate production implementation code.
- Generate test implementations.
- Provide copy-paste solutions to implementation problems.
- Solve debugging problems by replacing the developer's code.
- Preemptively prescribe detailed implementation steps when the story can be expressed behaviorally.

## Developer owns

- Architecture and implementation decisions.
- Production code.
- Test implementation.
- Debugging.
- Refactoring decisions.
- Final acceptance of scope and product behavior.

## Story-writing principle

Issues should primarily describe **what** behavior is needed and **why**, not dictate **how** it must be implemented. Technical constraints should be included only when they are genuinely part of the product or architectural requirement.
