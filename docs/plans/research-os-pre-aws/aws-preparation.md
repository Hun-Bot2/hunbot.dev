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

Researched 2026-09-16 against official AWS sources. Four of the five are now answered;
the answers are recorded in the [cloud record's checklist](../../decisions/research-os-cloud-architecture.md#verification-checklist),
which is the source of truth.

| # | To verify | Who can resolve it | Status |
|---|---|---|---|
| V1 | Account is on the **Paid** plan, not the Free plan | **Owner only** — billing console | **OPEN — the only true blocker** |
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

1. **Confirm or switch the account plan** (V1) — **STILL OPEN.** Billing details were added,
   which usually moves an account to Paid, but the plan itself has not been read off the
   console. This is the one item whose failure mode is silent and total. Check
   *Billing and Cost Management → Free tier*.
2. **Root account hygiene** — **DONE.** Root MFA enabled, no root access keys present, an
   `admin` IAM user created with MFA and confirmed working. Root is retired.
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
