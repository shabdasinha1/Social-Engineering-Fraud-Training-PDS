# Instructor Audit Log (ADMIN-005)

**Status:** IMPLEMENTED — 6 September 2026.
**Model:** `backend/src/models/AuditEvent.js` · **Service:** `backend/src/services/auditService.js`
**Vocabulary:** `backend/src/constants/auditLog.js` · **Route:** `GET /api/admin/audit`
**Companions:** [`ATTEMPT_API.md`](ATTEMPT_API.md) · [`RESULT_API.md`](RESULT_API.md) · [`SCENARIO_ENGINE.md`](SCENARIO_ENGINE.md)

---

## 1. Purpose

Specification section 6 requires, among the admin minimum:

> "Append-only change log for scenario publication, resets, exports and configuration
> changes."

This is that log, and **only** that log. It records administrative **changes** — never
ordinary reads, and never anything a learner does. The learner's own actions already have
an authoritative record: the `ScenarioEvent` ledger (ENGINE-001).

This task built the foundation. The operations that will write to it — the scenario
manager, attempt reset, exports and configuration — are ADMIN-001 to ADMIN-004 and do not
exist yet. **No historical data was backfilled**: the log begins at the first real
administrative action, so the `auditevents` collection does not exist until then.

## 2. Schema

| Field | Notes |
|---|---|
| `schema_version` | Set explicitly at append (see §6) |
| `actor_admin_id` | The authenticated `AdminUser`. The identity of record |
| `actor_username` | The username **as it stood at the time**, denormalised on purpose |
| `action` | From the closed vocabulary in §3 |
| `resource_type` · `resource_id` | What was affected, by type and safe internal identifier |
| `status` | `succeeded` or `failed` |
| `error_code` | A stable category on a failure. Never a message or a stack trace |
| `metadata` | Allowlisted scalars only (§5) |
| `idempotency_key` | Optional; makes a retried operation record once |
| `occurred_at` | Server-set. Never client-supplied |

`actor_username` is stored beside the id deliberately: renaming an account later must not
silently rewrite who the log says did something.

There is no `createdAt` and no `updatedAt`. The first would duplicate `occurred_at`; the
second would imply an entry can be updated.

## 3. Action vocabulary

Deliberately small, and every entry traces to a capability section 6 names:

| Section 6 category | Actions |
|---|---|
| scenario publication | `SCENARIO_PUBLISHED`, `SCENARIO_DEACTIVATED` |
| resets | `SCENARIO_RESET`, `ATTEMPT_RESET`, `PROFILE_ARCHIVED` |
| exports | `EXPORT_CREATED` |
| configuration changes | `CONFIG_CHANGED` |

`SCENARIO_DEACTIVATED` is the other half of the publication lifecycle the scenario manager
owns ("create/edit/clone/deactivate versioned scenarios"), and `PROFILE_ARCHIVED` is the
other instructor control listed beside the attempt reset ("archive a profile under local
policy"). Nothing speculative was added beyond those.

### Two names for the reset capability

| Name | Role |
|---|---|
| `SCENARIO_RESET` | **Client-specification compatibility vocabulary** for the section 6 reset capability, so the required action names are satisfied exactly |
| `ATTEMPT_RESET` | **The precise operational action**, and the name to prefer internally |

The capability section 6 describes is *"Reset an incomplete attempt"*, so the thing
actually reset is an attempt, never a scenario definition. Both names are accepted, both
are **stored verbatim** — an entry is never rewritten into the other name — and both map to
the same resource type, because they record the same operation.

`RESET_ACTIONS` groups them, and `PREFERRED_RESET_ACTION` names the one to write. **A
reader looking for "resets" should filter on `RESET_ACTIONS`, or it will miss half of
them.**

> Section 6 of the PDF states the requirement as categories — "Append-only change log for
> scenario publication, resets, exports and configuration changes" — rather than as literal
> action tokens. The four required names come from the project brief, and the vocabulary
> now satisfies them exactly while keeping the operationally accurate name alongside.

## 4. Resource vocabulary

`scenario_definition` · `attempt` · `learner_profile` · `export` · `configuration`

One collection serves all of them. `ACTION_RESOURCE_TYPES` pins which types each action may
name, so an `EXPORT_CREATED` entry cannot claim to be about a scenario.

| Action | Resource type |
|---|---|
| `SCENARIO_PUBLISHED`, `SCENARIO_DEACTIVATED` | `scenario_definition` |
| `SCENARIO_RESET`, `ATTEMPT_RESET` | `attempt` |
| `PROFILE_ARCHIVED` | `learner_profile` |
| `EXPORT_CREATED` | `export` |
| `CONFIG_CHANGED` | `configuration` |

**`SCENARIO_RESET` maps to `attempt`, not to `scenario_definition`, despite its name** —
the capability it records resets an attempt, and mapping it to a scenario would make the
log say something untrue. Both reset names are refused against any other resource type.

A `resource_id` is always a **safe internal identifier** — an ObjectId string, `W01`, a
configuration key — capped at 128 characters. Never a document, never scenario content,
never learner text.

## 5. Metadata allowlist

An **allowlist**, not a denylist: a key that is not named is rejected, so a future caller
cannot widen the log by accident.

```
scenario_id · scenario_version · scenario_platform · previously_active_version
attempt_id · attempt_status · scenarios_discarded
export_format · export_scope · export_record_count
config_key · config_previous_value · config_new_value
reason_code
```

Values must be **scalars** (a document or array is content, not a fact) and at most 200
characters. A second layer, `looksSensitive()`, rejects anything whose key reads like a
credential — `password`, `token`, `secret`, `cookie`, `otp`, `card`, `payment`,
`rationale`, `message` and the rest — to catch a future edit that adds such a key to the
allowlist without thinking.

> **That guard matches words, not letters.** A plain substring check rejected
> `scenarios_discarded`, because "discarded" contains "card". Keys are tokenised
> (snake_case and camelCase alike) and single-word fragments must match a whole word; a
> fragment that already spans words, like `account_number`, is matched against the whole
> key. A test asserts both directions.

A rejection names the offending **key** and never echoes the **value** — the value is
precisely what might be sensitive.

## 6. Append-only

Four independent guards, because a log that can be quietly rewritten is worse than no log
at all — it looks like evidence:

1. every identifying field is `immutable`;
2. `pre('save')` refuses **any** save of a document that is not new, modified or not;
3. every `updateOne` / `updateMany` / `replaceOne` / `findOneAndUpdate` /
   `findOneAndReplace` / `findOneAndDelete` / `deleteOne` / `deleteMany` hook throws
   `AuditImmutableError`;
4. the service exposes no update or delete function, and no HTTP route mutates.

> **A Mongoose trap worth recording.** `schema_version` originally carried both a `default`
> and `immutable: true`. Loading a document re-applies the default, which marks the
> immutable path modified, so *every* subsequent save failed validation — including one
> that changed nothing. The field is now set at the single write site with no schema
> default, which keeps it immutable without the side effect.

### The stated limit

This is a local single-machine application, so the guarantee is an **application-layer**
guarantee: someone with direct database access can still alter the collection. Enforcing
more would need infrastructure this deployment does not have, and claiming otherwise here
would be worse than saying it plainly. A test exercises that boundary rather than leaving
it as prose — and it is why the test fixtures clear the collection through the raw driver,
since the model itself refuses.

## 7. Transactions and sessions

`append({ ..., session })` joins a caller's transaction and **never opens one of its own** —
nesting would defeat the point. A future scenario publication will pass its own session so
the publication and its audit record either both land or neither does.

Two tests prove it end to end: an entry committed inside `withEngineTransaction` is
readable afterwards, and an entry whose transaction aborts leaves nothing behind.

**Idempotency.** With an `idempotencyKey`, a retried administrative operation records once —
the duplicate insert is caught by a unique partial index and the original entry returned.
Without one, every call appends, because two identical administrative actions genuinely are
two facts.

## 8. Security boundary

### Authentication

Reuses the existing admin identity exactly: `requireAdmin` resolves a signed, httpOnly
`admin_session` cookie against the `AdminUser` collection. **No second authentication
system was created.**

`append()` takes the resolved **AdminUser document**, not an id and not a name — an actor
cannot be conjured from a string, so only something that has already been through
`requireAdmin` can be recorded as one.

### There is no write route, for anyone

`GET /api/admin/audit` is the log's entire HTTP surface.

> An audit entry is a **side effect** of an administrative change, written inside that
> change's own transaction — never something a client asks for. A route that appended on
> request would let an administrator forge history, which is the one thing an audit log
> must not permit.

`POST`, `PUT`, `PATCH` and `DELETE` on the audit namespace match no route and fall through
to the 404 handler. A test drives all of them, as an administrator, as a candidate and
unauthenticated, and asserts nothing is created and nothing changes.

A candidate session on the read route is **rejected, not downgraded**: `401 NO_ADMIN_SESSION`.

### Never stored

Passwords, password hashes, session secrets, cookies, tokens, OTPs, payment data,
credentials, learner rationale text, raw scenario JSON, raw `Event.metadata`, arbitrary
request bodies, arbitrary administrator input, or stack traces.

## 9. Reading

`GET /api/admin/audit` — admin-only, newest first, read-only.

| Query | |
|---|---|
| `page`, `page_size` | Default 50, capped at 200 |
| `action`, `resource_type` | Validated against the closed vocabulary |
| `resource_id`, `actor_admin_id` | Exact match |
| `from`, `to` | On `occurred_at` |

An unknown filter value matches nothing rather than erroring, so browsing cannot 500. The
response carries exactly the ten keys of `toAdminJSON()` and nothing else.

`auditTrailFor(resourceType, resourceId)` returns every entry naming one resource, for a
future "history of this scenario" view.

## 10. Testing

| Suite | Tests | Runs under |
|---|---|---|
| `tests/auditLog.test.js` | 27, no database | `npm test` |
| `tests/auditLogApi.test.js` | 25, real HTTP + replica set | `npm run test:engine` |

The unit suite covers the rules that decide what may be recorded — actor, action, resource,
status, and every metadata rejection path — all of which run before any insert. The
integration suite covers what only a real database can show: persistence, the four
append-only guards, transaction commit and rollback, idempotency, the admin/candidate/
anonymous boundary on the read route, pagination, filters, and that no verb anywhere
writes.

Both reset names are covered in both suites: that each is accepted, that each maps to
`attempt` and is refused against any other resource type, that the four
specification-required names are present spelled exactly, and that an entry written under
either name persists verbatim and is found by a filter on that name.

## 11. Future Admin integrations

ADMIN-001 to ADMIN-004 call `append()` from inside the transaction of the change they make:

```js
await withEngineTransaction(async (session) => {
  await publishScenario(definition, { session })
  await append({
    actor: req.admin,
    action: 'SCENARIO_PUBLISHED',
    resourceType: 'scenario_definition',
    resourceId: definition.scenario_id,
    metadata: { scenario_version: definition.version, scenario_platform: definition.platform },
    session,
  })
})
```

## 12. Not in this task

The scenario manager, attempt viewer, CSV/PDF export, instructor controls and any admin
frontend. Nothing writes to the log yet.
