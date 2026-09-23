# AWS Preparation — What Happens Next, And Who Does It

Written 2026-09-16, immediately after [`aws-ready.md`](./aws-ready.md) closed the pre-AWS gate.

`AWS_READY = true` settles the **data contracts**. It does not authorize creating
infrastructure. [`research-os-cloud-architecture.md`](../../decisions/research-os-cloud-architecture.md#verification-checklist)
gates that separately and more strictly:

> items marked **blocking** must be resolved before *any* infrastructure is created

Five items were blocking when this was written, and none was resolved.

**Updated 2026-09-23.** All five (V1–V5) are now resolved or resolved-with-a-recorded-residual,
and every owner-only action in §2 is done. The blocking gate on *creating infrastructure*
is therefore **open**. What has not changed is the state of the account: still empty, still
nothing built. That is now a choice rather than a constraint, and the next thing built
should be the smallest resource that proves the cost model — not the architecture.

Per-component gates below V5 remain: V8 and V11 (2026-09-23) clear the online path's pricing
questions, but **V15 — whether Lambda Function URLs exist in `ap-northeast-2` at all — is open
and blocks that path**. V6, V7 and V10 gate components not yet reached.

---

## 1. The blocking five

Researched 2026-09-16 against official AWS sources. All five are now answered — four
outright, V5 partially and in a way the decision no longer depends on. The answers are
recorded in the [cloud record's checklist](../../decisions/research-os-cloud-architecture.md#verification-checklist),
which is the source of truth.

| # | To verify | Who can resolve it | Status |
|---|---|---|---|
| V1 | Account is on the **Paid** plan, not the Free plan | Owner — billing console | **Resolved 2026-09-16.** No credit balance or expiry shown, and the account dates to at least 2022-04-02 — a Free plan account could not still be open |
| V2 | CloudFront allowance | Research | Resolved: 100 GB + 1M req/month, $0, no overage charges |
| V3 | Lambda 1M req + 400,000 GB-s always-free | Research | Resolved: always-free |
| V4 | DynamoDB 25 WCU / 25 RCU / 25 GB always-free | Research | **Confirmed from the account's own meter** — the Free tier page says "always free per month" |
| V5 | SQS poller billing when idle | Research | Partially resolved; scheduled drain no longer depends on the answer |

**V1 got worse on inspection, not better.** The Free plan expires at *the earlier of* six
months from account opening **or** credit exhaustion — the six-month clock runs regardless
of usage — and expiry closes the account and destroys its data. A $0 workload does not
avoid this. The Paid plan is not a precaution; it is the only plan compatible with R5.

**A new conflict surfaced while answering V9.** DynamoDB PITR is billed by table size with
no free allowance, which puts R1 ($0/month) and R5 (notes durable) in genuine conflict for
the first time. Resolved in the cloud record under
[Durability Has A Price](../../decisions/research-os-cloud-architecture.md#durability-has-a-price):
PITR stays off, durability comes from scheduled export into the corpus, and the $0 invariant
holds until someone writes down why it should not.

**V1 is the one that matters most and the one an agent must not touch.** The cloud record
established that the Free plan *closes the account* when its credits are exhausted, which
would destroy research notes — and that R5 (notes durability) outranks R1 (cost). Choosing
and confirming the plan requires the billing console and the owner's own identity and
payment details. I will not do it, and should not be asked to: entering payment or account
credentials is outside what I do regardless of convenience.

**V3, V4 and V5 are answerable from official AWS documentation without an account.**
That is the highest-value work available right now, and it is the natural next step.

---

## 2. Owner-only actions, before anything is created

None of these can be delegated to an agent. Each needs console access, and the first two
need billing and identity details.

Progress as of 2026-09-16:

1. **Confirm the account plan** (V1) — **DONE.** The account predates the 2025 Free/Paid
   split (tables found from 2022-04-02) and shows no credit balance or expiry, so it is on
   pay-as-you-go. A Free plan account would have closed years ago.
2. **Root account hygiene** — **DONE, with one part reversed 2026-09-23.** Root MFA enabled,
   no root access keys present, an `admin` IAM user created with MFA and confirmed working.

   **Root is *not* retired.** The owner decided on 2026-09-23 to keep using root for billing
   rather than activate IAM access to the Billing console. The trigger was a real one: root
   is the only identity that can read Billing by default, `Activate IAM Access` is the
   root-only switch that would extend it to `admin`, and the owner declined it. That is a
   reasonable call for a single-owner account where the billing check is occasional and
   manual — it trades a permission boundary for one fewer setting to maintain.

   What the earlier note got wrong was not the hardening but the claim. The hardening is
   real and now matters *more*, not less: an identity still in regular use with no permission
   boundary is exactly the one that needs MFA and no long-lived access keys, both of which
   are in place. Recorded rather than quietly corrected, because "root is retired" was stated
   as fact in this plan and anything built on that assumption should be re-read.
3. **Spend alerting** — **DONE.** A `zero-spend` budget ($0.01 monthly, alert at 100% of
   actual) with an email subscriber. Still *detection, not prevention*: it reports after
   money has been spent, and AWS provides no account-wide spending cap.
4. **Region choice** (V14) — **DONE.** `ap-northeast-2` (Seoul) for the Research OS,
   `us-east-1` for billing metrics. See
   [Region](../../decisions/research-os-cloud-architecture.md#region).
5. **Account baseline** — **DONE.** Three unrelated DynamoDB tables from 2022 were found
   consuming the free tier in two regions, and removed. See
   [Account Baseline](../../decisions/research-os-cloud-architecture.md#account-baseline-2026-09-16).
   The account now holds nothing.

---

## 3. What can be built before an AWS account exists

The corpus is **local and relational** (C3). None of the following touches AWS, and all of
it is on the critical path:

**Built 2026-09-16.** The private repository now exists, local only, with no AWS
resources and no network calls. It has **zero dependencies** — `node:sqlite`,
`node:crypto` and `node --test` are built in — because a pipeline meant to run
unattended on a schedule should not be able to break because of someone else's release.

| Piece | State |
|---|---|
| Private repository skeleton | Done. Local git, no remote |
| Corpus store (relational, `corpus` side of `x-contract`) | Done. 10 tables, CHECK constraints in SQL |
| Queue/API envelope against the contract schema | Done. Rules read from the schema at load time, never retyped |
| Ingestion pipeline with per-run cap | Done. File-backed source only |
| Tests | 34, all passing |

What it enforces in code rather than in prose: the ingestion cap has no default at
the boundary (a missing or zero cap is refused, so forgetting an argument cannot
start an uncapped run); every ingested item lands `RADAR` and `VERIFIED` requires
both human review and a registry venue; merged items keep their row and id, with
identifiers and dedup keys following the merge and chain resolution bounded so a
cycle raises instead of hanging; the envelope is closed and capped at one 64 KB SQS
chunk; and the two files vendored from this repository — the contract schema and
`canonicalization.ts` — are checked **byte-for-byte**, because a drifted
`CONTENT_HASH_FIELDS` would leave both copies individually valid while silently
invalidating every stored hash.

**Deliberately absent: any network source.** Every external API, licence and rate
limit in [`research-discovery-system.md`](../../decisions/research-discovery-system.md)
is marked as requiring verification, and none has been verified. A fabricated
adapter is the most expensive kind of shortcut — everything above it would inherit
an assumption nobody checked, and the failure would arrive as data that looks
plausible.

**Still local.** The repository has no remote. Pushing it anywhere is an owner
decision, not a side effect of building it.

Doing this first also de-risks AWS: a pipeline that already works locally arrives in Lambda
with its behaviour known, and the first cloud deploy stops being the first test.

---

## 4. Invariants this repository cannot check — private-repo handoff

T10 implemented all fifteen of T02's invariants, because all fifteen were specified as
checkable here. The following are **not** in that list and are genuinely out of reach of
this repository. They need their own checks wherever the private system is built:

| Needs enforcing | Why not here |
|---|---|
| Real DynamoDB item-size accounting | This repo checks the size *model* (INV-10/INV-11 — 815 ≤ 1024, budget equals field set). Actual stored item sizes exist only in DynamoDB |
| TTL and eviction behaviour | `provenance` drives destructive TTL. Only observable against real tables |
| Identifier-index replica correctness | The replica is bounded and regenerable by design; whether it *stays* consistent with the corpus is a runtime property |
| SQS idempotency under real delivery | At-least-once delivery cannot be simulated by a schema check |
| Reserved concurrency actually set on every Lambda | The primary cost fuse. Free, platform-enforced, fails closed — and worth a deploy-time assertion, not a habit |
| Log groups created with retention | The record names this as the slow-burn first bill |

---

## 5. Not yet

- **No Terraform or CDK.** The cloud record defers this deliberately; it has not been revisited.
- **No resources of any kind** until V1–V5 are resolved. *(Satisfied 2026-09-23. This line
  stays because it records what the gate was, not because it still blocks; the per-component
  gates V6–V15 are what remain.)*
- **Nothing on the [Forbidden In V1](../../decisions/research-os-cloud-architecture.md#forbidden-in-v1) list**
  without a separate written decision — NAT Gateway, RDS/Aurora, load balancers, OpenSearch,
  Secrets Manager, customer-managed KMS keys, DynamoDB on-demand or auto-scaling, and log
  groups without retention among them.
- **No change to the public site.** Reader indistinguishability and static-first are
  untouched by all of this, and INV-14 now enforces mechanically that the public site gains
  no runtime dependency on the private pipeline.
