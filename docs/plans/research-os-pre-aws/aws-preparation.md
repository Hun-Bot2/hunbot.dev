# AWS Preparation — What Happens Next, And Who Does It

Written 2026-09-16, immediately after [`aws-ready.md`](./aws-ready.md) closed the pre-AWS gate.

`AWS_READY = true` settles the **data contracts**. It does not authorize creating
infrastructure. [`research-os-cloud-architecture.md`](../../decisions/research-os-cloud-architecture.md#verification-checklist)
gates that separately and more strictly:

> items marked **blocking** must be resolved before *any* infrastructure is created

Five items are blocking, and **none is resolved**. So the correct state today is:
contracts done, account untouched, nothing built.

---

## 1. The blocking five

| # | To verify | Who can resolve it | Status |
|---|---|---|---|
| V1 | Account is on the **Paid** plan, not the Free plan | **Owner only** — billing console | OPEN |
| V2 | CloudFront: 1 TB/10M pay-as-you-go, or 100 GB/1M flat-rate Free plan | Partly research, partly V1 | OPEN |
| V3 | Lambda's 1M requests + 400,000 GB-s is always-free, not 12-month | Research, official AWS sources | OPEN |
| V4 | DynamoDB 25 WCU / 25 RCU / 25 GB is always-free, not 12-month | Research, official AWS sources | OPEN |
| V5 | SQS `ReceiveMessage` polling from a Lambda event source mapping is billable, and at what rate when idle | Research, official AWS sources | OPEN |

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

1. **Confirm or switch the account plan** (V1). Paid plan, per the record's reasoning.
2. **Root account hygiene** — MFA on root, then stop using root.
3. **A CloudWatch billing alarm at any non-zero amount.** The record is explicit that this
   is *detection, not prevention*: by the time it fires, money has been spent. There is no
   account-wide spending cap in AWS; that finding is recorded and has not changed.
4. **Region choice** (V14) — confirm it alters no allowance, then fix it and write it down.

---

## 3. What can be built before an AWS account exists

The corpus is **local and relational** (C3). None of the following touches AWS, and all of
it is on the critical path:

- The private repository skeleton — it does not exist yet.
- The local corpus store and its migrations, matching `x-contract`'s `corpus` side.
- The queue/API envelope implementation against
  [`contracts/research-os/research-item.schema.json`](../../../contracts/research-os/research-item.schema.json) —
  already versioned and machine-checked here.
- The ingestion pipeline, run locally on a schedule, with the per-run cap the record requires.

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
- **No resources of any kind** until V1–V5 are resolved.
- **Nothing on the [Forbidden In V1](../../decisions/research-os-cloud-architecture.md#forbidden-in-v1) list**
  without a separate written decision — NAT Gateway, RDS/Aurora, load balancers, OpenSearch,
  Secrets Manager, customer-managed KMS keys, DynamoDB on-demand or auto-scaling, and log
  groups without retention among them.
- **No change to the public site.** Reader indistinguishability and static-first are
  untouched by all of this, and INV-14 now enforces mechanically that the public site gains
  no runtime dependency on the private pipeline.
