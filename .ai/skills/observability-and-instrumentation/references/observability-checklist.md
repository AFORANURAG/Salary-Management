# Observability Checklist

The at-a-glance companion to `SKILL.md`. Copy the relevant block into a PR description or incident retro and check items off.

## Pre-launch instrumentation gate

Do not ship a production feature until every box is checked. A "no" anywhere means the feature is blind in production.

```
PRE-LAUNCH GATE — feature: ____________________

[ ] On-call questions written down (2–4), each mapped to a signal
[ ] Structured logs emit at the key events (success, handled failure, hard failure)
[ ] Correlation/request ID generated at the boundary and on every log line + span + outbound call
[ ] Secrets / tokens / full PII confirmed absent from log output (spot-checked, not assumed)
[ ] RED metrics on every new endpoint and every external dependency
[ ] Latency recorded as a histogram (p50/p95/p99 queryable), never a bare average
[ ] Metric labels are bounded sets only (no user IDs, raw URLs, error text)
[ ] Trace spans propagate across every async boundary; no broken spans in the UI
[ ] Each new alert is symptom-based, actionable, threshold-justified, and links a runbook
[ ] Telemetry verified by inducing a failure in staging and finding it via telemetry alone
```

## Signal selection (quick reference)

| Question shape | Use |
|---|---|
| "What happened in this one case?" | Structured log |
| "How often / how fast, in aggregate?" | Metric (RED for requests, USE for resources) |
| "Where did time go across services?" | Trace |

Metrics say **that** it's wrong → traces say **where** → logs say **why**.

## Log hygiene

```
[ ] JSON objects, not interpolated strings
[ ] Stable, machine-readable event name on every line
[ ] Levels used consistently: error=investigate, warn=trend, info=business event, debug=off in prod
[ ] Correlation ID present everywhere
[ ] No secrets, tokens, passwords, or unredacted PII; fields allowlisted, not whole bodies
```

## Metric hygiene

```
[ ] RED on endpoints + dependencies; USE on queues/pools/hosts
[ ] Labels from small fixed sets (route template, status_class, provider)
[ ] status_class ("5xx") not raw status ("500"); never user_id / email / request_id / URL / error text
[ ] Latency is a histogram with sane buckets; percentiles read, averages ignored
```

## Alert hygiene

```
[ ] Pages on symptoms users feel (error rate, latency, queue age) — not causes (CPU, disk, restarts)
[ ] Actionable: if the response is "ignore, it self-heals", the alert is deleted
[ ] Runbook link present (even three lines: meaning, first query, escalation)
[ ] Threshold + duration justified by SLO or history, not a guess
[ ] Two severities only: page (act now) and ticket (act this week)
[ ] Test-fired once (temporarily lowered threshold) to confirm delivery + runbook link
```

## Verify-the-telemetry pass

```
[ ] Forced error in staging → found by requestId, fields structured (not [object Object])
[ ] Test traffic → metric series appear with expected labels and sane values
[ ] One request followed end-to-end in tracing UI → no gaps
[ ] Each new alert reached the right channel; runbook link resolves
```
