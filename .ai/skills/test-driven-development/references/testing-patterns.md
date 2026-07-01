# Testing Patterns Reference

Detailed testing patterns, examples, and anti-patterns to support the
`test-driven-development` skill. This is a starter document — flesh out each
section with patterns specific to your stack and frameworks.

## Framework Setup

Document the test runner, assertion library, and conventions for each language
in your stack.

### JavaScript / TypeScript (Vitest / Jest)

- Test file naming: `*.test.ts` / `*.spec.ts`
- Run all: `npm test`
- Run one file: `npm test -- path/to/file.test.ts`
- Watch mode: `npm test -- --watch`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('feature', () => {
  beforeEach(() => {
    // Fresh state per test — no shared mutable fixtures
  });

  it('describes expected behavior', () => {
    // Arrange / Act / Assert
  });
});
```

### Python (pytest)

- Test file naming: `test_*.py`
- Run all: `pytest`
- Run one: `pytest path/to/test_file.py::test_name`

```python
def test_describes_expected_behavior():
    # Arrange
    # Act
    # Assert
    assert result == expected
```

## Fixtures and Test Doubles

### Fakes (preferred)

Provide an in-memory implementation that honors the real contract.

```typescript
class FakeTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();

  async insert(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }
}
```

### Stubs

Return canned data with no behavior. Use for read-only collaborators.

### Mocks (use sparingly)

Only verify interactions at true boundaries (email, payment, external APIs)
where real calls are slow, costly, or non-deterministic.

## Parameterized / Table-Driven Tests

```typescript
it.each([
  ['', 'Title is required'],
  ['   ', 'Title is required'],
  ['a'.repeat(256), 'Title too long'],
])('rejects invalid title %j', (title, message) => {
  expect(() => createTask({ title })).toThrow(message);
});
```

## Testing Async and Time

- Inject clocks / `now()` instead of calling `Date.now()` directly.
- Use fake timers for debounce/throttle/retry logic.
- Avoid real `sleep` in tests — advance virtual time instead.

## Testing Errors

```typescript
it('throws NotFoundError for missing task', async () => {
  await expect(taskService.completeTask('missing'))
    .rejects.toThrow(NotFoundError);
});
```

## Coverage Guidance

- Coverage is a signal, not a target. 100% coverage with weak assertions
  proves nothing.
- Prioritize covering branches, edge cases, and error paths over raw line %.

## Anti-Pattern Examples

Add concrete before/after examples from your codebase here so the agent can
recognize and fix the anti-patterns listed in `SKILL.md`.
