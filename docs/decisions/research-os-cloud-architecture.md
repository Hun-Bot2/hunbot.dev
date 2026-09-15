# Research OS Cloud Architecture

Status: Direction proposed. No infrastructure created. No account configured.

Reviewed: 2026-09-14

Pricing facts retrieved: 2026-09-14. See [Verification Checklist](#verification-checklist) — every pricing fact in this record is volatile and carries a retrieval date.

This record selects the cloud platform and the first architecture for the **private** Research OS: the authenticated, mutable, mobile-accessible system that runs the loop defined in [Research Discovery And Learning System](./research-discovery-system.md).

It does not change the public site. [`product-boundaries.md`](./product-boundaries.md), [`discover-direction.md`](./discover-direction.md), and [`creative-direction.md`](./creative-direction.md) are unmodified, and the reader-indistinguishability and static-first decisions stand exactly as written. No amendments to those records are proposed here.

Marker convention is inherited from [`research-discovery-system.md`](./research-discovery-system.md#marker-convention): **FACT** / **ASSUMPTION** / **DECISION** / **VERIFY** / **OPEN**.

---

## Context

**FACT:** the system described in [`research-discovery-system.md`](./research-discovery-system.md) is currently specified to run locally — a private repository, local Postgres or SQLite, scheduled scripts, a review CLI. **FACT:** [`discover-direction.md`](./discover-direction.md) explicitly defers cloud adoption until a trigger fires, the first being *"collection must run when the machine is off."*

That trigger is now in view for a different reason than anticipated. The requirement is not unattended collection; it is **unattended use**. The Research OS should be usable from a phone or tablet, away from the desk, while collection, filtering, queueing, and note-taking continue.

This is a genuine escalation, and it crosses a line the existing records drew deliberately:

| | Public site | Research OS |
|---|---|---|
| Domain | `hun-bot.dev` | Separate, private |
| Hosting | Astro / Vercel, static | AWS, this record |
| State | None per reader | Authenticated, mutable |
| Auth | None, ever | Required |
| Readers | Indistinguishable | Exactly one |

**DECISION:** these are two systems, not one system with a private section. They share no runtime, no database, no auth, and no deployment. The only permitted coupling is **one-directional and asynchronous**: the Research OS may emit static artifacts that the public site's build consumes, exactly as [`research-discovery-system.md`](./research-discovery-system.md#technical-boundary) already specifies. The public repository's dependency on the Research OS stays at zero, and `scripts/validate-product-boundaries.mjs` keeps passing unmodified.

---

## Requirements

**R1 — The AWS infrastructure bill is $0.00/month, indefinitely.** This is an invariant, not a budget. It is stronger than "cheap." A design that costs $4/month has failed this requirement.

**R2 — $0 must rest on recurring free allowances, not introductory credits.** A design that works for six months and then bills is a failed design.

**R3 — Usable from phone, tablet, and desktop.** Mobile is the primary client, not a responsive afterthought.

**R4 — Background collection continues while no client is connected.**

**R5 — Personal state is durable.** Notes, reading state, ideas, and confirmed interpretations are the one thing in the system that cannot be recomputed ([`research-discovery-system.md`](./research-discovery-system.md#research-notebook)). Losing them is the worst available outcome — worse than downtime, and worse than a bill.

**R6 — Fail closed before spending.** Unexpected traffic or a pipeline bug should degrade or halt the Research OS rather than silently accrue cost.

**R7 — The project should teach cloud engineering.** Explicitly a requirement, not a preference. It is the reason a managed BaaS is rejected below.

**R8 — Small enough to actually ship.** A first version that is architecturally admirable and never deployed fails every other requirement.

**DECISION:** where R1 and R5 conflict, **R5 wins.** Durability of notes outranks the cost invariant. This ordering matters and is exercised immediately — see [The Free Plan Is A Trap](#the-free-plan-is-a-trap).

---

## Alternatives Considered

### Supabase / managed BaaS

Attractive: Postgres, auth, storage, and a working app in a weekend.

**DECISION: rejected as the architectural centre.** Not on cost or capability — on **R7**. Too much infrastructure behavior is hidden behind the product, the user already has significant experience shipping on managed BaaS, and this project is explicitly intended to produce practical experience in event-driven design, IAM, queues, retries, idempotency, and cost engineering. A BaaS would deliver the product and none of that.

It remains a useful conceptual reference, and it remains the correct answer if the goal ever changes from *learn while building* to *ship fastest*.

### GCP

Genuinely strong for this workload: Cloud Run and Cloud Run Jobs fit containerized Python well, Scheduler and Pub/Sub are clean, and the ML story is better.

**DECISION: not selected, narrowly.** The deciding factor is that the modelled workload ([One-Year Capacity Model](#one-year-capacity-model)) sits far inside AWS's recurring free allowances, so AWS satisfies R1 and R2 while offering a denser learning surface for R7 — IAM in particular. **DECISION:** this is a close call and is recorded as close. If heavy containerized or GPU-adjacent work later becomes central, GCP is the first place to look, and revisiting is not an admission of error.

### Cloudflare

Workers, D1, R2, and Queues are an excellent fit, and some Cloudflare free plans fail by quota rather than by billing — which is structurally closer to R6 than anything AWS offers. R2's egress characteristics are the best available.

**DECISION: not selected for V1, and specifically not mixed in.** Introducing Cloudflare alongside AWS at the start doubles the operational surface for one user. **DECISION: no multi-cloud without measured evidence that AWS cannot satisfy a requirement.** Cloudflare is the first candidate if that evidence appears — most plausibly around static asset hosting or egress.

### Oracle OCI

Always Free compute is unusually generous and would comfortably run this.

**DECISION: not selected.** **ASSUMPTION** (**VERIFY** if ever reconsidered): Always Free capacity can be unavailable in a region, and idle Always Free compute can be reclaimed. For a system expected to be continuously available and holding the only copy of irreplaceable notes, reclamation risk conflicts with **R5**. Recorded as interesting, not selected.

### Azure

Permanent free allowances exist for Functions and Cosmos DB.

**DECISION: not selected.** No sufficient advantage for this workload over AWS or GCP to justify the choice. Recorded for completeness.

---

## Decision

**DECISION: AWS-first, serverless, single-region, with $0.00/month as a validated design target rather than an aspiration.**

The reason is not that it is AWS. It is that the modelled workload appears to consume **single-digit percentages** of the relevant recurring free allowances, leaving enough headroom that the design can be wrong by an order of magnitude and still hold — while AWS supplies the densest available learning surface for event-driven architecture, IAM, queueing, idempotency, observability, and FinOps.

**DECISION:** if measurement shows the workload does not fit, the correct response is to **reduce the workload**, not to add paid services. Ingestion caps and collection frequency are the adjustment mechanism.

### The Free Plan Is A Trap

This is the most consequential finding in the record and it inverts the naive reading of the requirement.

**FACT** (AWS Free Tier FAQs, retrieved 2026-09-14): AWS now offers a **Free plan** — up to $200 in credits, for up to 6 months or until credits are exhausted — and a **Paid plan**. **FACT:** *"30+ AWS services are always free within monthly usage limits on both the Free and Paid plans,"* and always-free offers apply *"as long as you are an AWS customer."*

**FACT, and this is the trap:** when the Free plan expires, **AWS closes the account and access to resources and data is lost**, with a 90-day grace period to upgrade before permanent deletion.

**DECISION: the account must be on the Paid plan.** The Free plan is not the route to $0/month — it is the route to account closure with the notebook inside it. Under **R5**, that is the worst outcome in this document, and it would arrive on a schedule.

So the shape of the requirement is:

> Paid plan, with a payment method attached, operating permanently inside always-free monthly allowances, with the guardrails in [Cost Guardrails](#cost-guardrails) preventing the bill from ever becoming non-zero.

**FACT:** AWS provides **no account-wide hard spending cap** (confirmed absent from the Free Tier FAQs, retrieved 2026-09-14). **DECISION:** $0 is therefore an *engineered property*, not a platform guarantee, and this record does not claim otherwise. See [Failure Behavior](#reliability-and-failure-behavior) for the three-level model.

---

## Proposed Architecture

Deliberately minimal. Every component must justify its presence against R8.

**Online path**

```
Phone / Tablet / Desktop
        │  HTTPS
    CloudFront  (OAC-signed)
        │
  Lambda Function URL  (auth: AWS_IAM)
        │
     API Lambda  ── Cognito (JWT verification)
        │
    DynamoDB
```

**Background path**

```
EventBridge Scheduler  (6×/day)
        │
  Collector Lambda  ── ingestion cap: N candidates/run
        │
       SQS  (bounded, DLQ)
        │
  Processor Lambda  (drains on schedule — see below)
        │
    DynamoDB
```

**Operations:** CloudWatch Logs with explicit retention, CloudWatch alarms, IAM roles per function, and infrastructure as code (**tool deferred**, see [Deferred Decisions](#deferred-decisions)).

### Component Decisions

**DECISION: no API Gateway.** **VERIFY:** HTTP API's 1M-requests/month free allowance appears to be a **12-month** offer rather than always-free, which would directly violate **R2**. A Lambda Function URL has no additional charge and meets the need. If verification shows otherwise, this is still the simpler choice under R8.

**DECISION: CloudFront in front, with Origin Access Control.** Its job here is not caching — with one user there is nothing to cache. Its job is to keep the Function URL from being a directly-addressable public endpoint. **DECISION:** the Function URL auth type is `AWS_IAM` and CloudFront signs requests via OAC, so the origin cannot be bypassed by discovering its URL. **VERIFY:** OAC support for Lambda Function URL origins, and its exact configuration.

**DECISION: the app shell is served by the Lambda, not from S3.** A single-user private app is a small bundle, and serving it from the function that is already invoked removes a service, removes a deployment step, and removes the one component whose always-free status is uncertain. **VERIFY:** whether S3's 5 GB allowance is always-free or 12-month under the current plan structure. Until that is answered, S3 is not in V1 for any purpose.

**DECISION: no WAF.** **ASSUMPTION:** a WAF web ACL carries a recurring monthly charge, which violates R1 outright. Request-level protection comes from OAC, Cognito, and reserved concurrency instead.

**DECISION: Cognito for auth, TOTP MFA only.** **FACT** (Cognito pricing, retrieved 2026-09-14): 10,000 MAU/month free on the Essentials and Lite tiers, and the free tier *"does not automatically expire at the end of your 12-month AWS Free Tier term, and it is available to both existing and new AWS customers indefinitely."* One user against 10,000 is the largest margin in the system. **DECISION: SMS MFA is prohibited** — it bills through SNS and is a direct R1 violation. **DECISION: Advanced Security Features are prohibited in V1** — priced per MAU, and at one user the absolute cost is trivial but the invariant is binary.

### The SQS Polling Problem

**DECISION: the processor is invoked on a schedule and drains the queue itself, rather than being wired to an SQS event source mapping.**

The reason is a real and easily-missed cost path. **ASSUMPTION (VERIFY):** a Lambda SQS event source mapping polls continuously whether or not messages exist, and those `ReceiveMessage` calls are billable SQS requests. A single long-polling consumer at 20-second waits is roughly 4,300 requests/day — about 1.6M/year, or **13% of the annual free allowance consumed by an empty queue**. If the poller scales out, that multiplies.

The collector runs six times a day. A queue that is active for minutes and polled for twenty-four hours is the wrong shape. A scheduled drain makes SQS request volume **deterministic and bounded**, which is the property R6 actually wants.

**DECISION:** this is the clearest instance in the record of the general rule — *under a $0 constraint, prefer the design whose consumption is bounded by construction over the one whose consumption is bounded by expectation.*

---

## One-Year Capacity Model

**ASSUMPTION — every input below.** These are the brief's figures, restated as assumptions and checked for internal consistency. **OPEN:** the brief's "30/365-day operation" is ambiguous; modelled here as 365-day continuous operation, which is the conservative reading.

| Input | Value |
|---|---|
| New research candidates | 500/day |
| Deeper-processing candidates | 20/day |
| User / API actions | 300/day |
| Collection runs | 6/day |
| Operation | 365 days |
| Users | 1 |

### Verified Allowances

**FACT**, all retrieved 2026-09-14 from official AWS pricing pages:

| Service | Recurring free allowance |
|---|---|
| Lambda | 1,000,000 requests + 400,000 GB-seconds per month |
| DynamoDB | 25 WCU + 25 RCU + 25 GB storage + 2.5M Streams reads, per region per payer account |
| SQS | 1,000,000 requests/month; each 64 KB of payload counts as one request |
| EventBridge Scheduler | 14,000,000 invocations/month |
| CloudWatch | 5 GB logs (ingestion + archive + Insights scans combined), 10 custom metrics, 3 dashboards, 10 alarms, 1M API requests — stated as always-free |
| Cognito | 10,000 MAU/month (Essentials, Lite) — stated as indefinite |
| CloudFront | **Contested — see below** |

**VERIFY — CloudFront.** Two different figures are currently reachable. An AWS announcement establishes **1 TB data transfer out + 10M HTTP/S requests per month, permanent, under pay-as-you-go**. The current CloudFront pricing page presents flat-rate pricing plans whose Free plan shows **100 GB + 1M requests/month**. These are not the same offer and the applicable one depends on which CloudFront pricing plan the distribution is on. **DECISION:** this must be resolved before the distribution is created. Either figure is ample for one user; the point is that the record must not assert the wrong one.

### Modelled Consumption

| Resource | Modelled/year | Modelled/month | Free allowance/month | Consumed |
|---|---|---|---|---|
| Lambda requests | ~301,000 | ~25,100 | 1,000,000 | **~2.5%** |
| Lambda compute | ~100,000 GB-s | ~8,300 GB-s | 400,000 GB-s | **~2.1%** |
| SQS requests | ~562,000 | ~46,800 | 1,000,000 | **~4.7%** |
| Scheduler invocations | ~2,190 | ~183 | 14,000,000 | **~0.001%** |

The Lambda figure reconciles: 2,190 collector + ~182,500 processor (one invocation per candidate) + 7,300 deep-processing + 109,500 API ≈ 301,500. The SQS figure reconciles at roughly three requests per message (send, receive, delete) plus overhead. The compute figure implies roughly 1 second average duration at ~330 MB, which is a reasonable starting point and must be replaced by measurement.

**DECISION:** batching the processor across SQS messages would cut the largest line item by an order of magnitude. It is deliberately **not** in V1 — the headroom does not require it, and unbatched processing is simpler to make idempotent. Recorded as the first optimization if headroom shrinks.

### Storage

500 candidates/day × 10 KB ≈ **5 MB/day**.

| Retention | Steady-state storage | Share of 25 GB |
|---|---|---|
| Full 1-year | ~1.8 GB | ~7% |
| 90-day TTL | ~0.45 GB | ~1.8% |

**Storage is not the binding constraint.** Even with full retention and no TTL, the 25 GB allowance lasts on the order of a decade. **DECISION:** TTL on disposable Radar candidates is still adopted, but for data-hygiene reasons rather than cost — an unbounded candidate table makes every query slower and every review harder.

### The Actual Binding Constraint

**DECISION: the constraint is DynamoDB write capacity, and it is a burst-shape problem rather than a volume problem.**

25 WCU provides 2,160,000 WCU-seconds/day. Daily writes at 500 candidates × 10 KB — and **FACT:** a 10 KB item consumes 10 WCU per write — is ~5,000 WCU-seconds, or **0.23% of daily capacity.** On average, nothing.

But a collection run that writes 500 items in a few seconds demands ~5,000 WCU against a 25 WCU/sec ceiling — roughly 200 seconds of sustained capacity delivered in a burst. Naive parallel writes will throttle.

Three consequences, and they are the most actionable findings in this section:

1. **DECISION: throttling is correct behavior, not a failure.** The processor writes with exponential backoff and treats throttling as flow control. This is **R6** operating exactly as intended — the system slows down instead of buying capacity.
2. **DECISION: keep hot items under 1 KB.** A 10 KB item costs 10× a 1 KB item to write. Bulky derived metadata belongs in a separate item, fetched only when needed. This is an access-pattern decision with a direct cost consequence, which is the clearest possible argument for designing access patterns first.
3. **DECISION: provisioned capacity, explicitly, never on-demand.** On-demand mode has no ceiling; it absorbs a runaway loop by billing for it. Provisioned capacity fails closed. **DECISION: auto-scaling is disabled.**

### The Most Likely First Bill

**DECISION: CloudWatch Logs, and it is a slow burn rather than a spike.**

The 5 GB allowance covers ingestion *and archive storage* combined, and **FACT:** log retention defaults to never-expire. Archived volume therefore grows monthly and eventually crosses 5 GB permanently, at $0.03/GB/month — small, recurring, and a breach of R1.

**DECISION: every log group is created with an explicit retention period.** No log group may exist without one. This is the single cheapest guardrail in the record and the one most likely to be forgotten.

---

## Data And Storage Strategy

**DECISION: no PDFs in AWS.** For incoming papers, persist canonical metadata, DOI, venue and source provenance, official URL, arXiv/OpenReview URL, processing state, and lightweight derived metadata. Open the original from its authoritative source when reading.

This is not only a cost decision. **FACT:** [`product-boundaries.md`](./product-boundaries.md) already requires raw PDF text and copied paper text to stay private, and [`research-discovery-system.md`](./research-discovery-system.md#source-grounding) forbids publishing quotations. Not storing the corpus is the cheapest way to comply with both.

**DECISION: persist permanently** — saved papers, reading state, notes, questions, ideas, content candidates, and confirmed interpretations. **DECISION: TTL** — disposable Radar candidates.

### Conflict With The Existing Record, And Its Resolution

**FACT:** [`research-discovery-system.md`](./research-discovery-system.md#storage-shape) decides on a **relational primary store**, with the graph as derived tables. This record proposes DynamoDB. That is a real contradiction and is resolved here rather than left to be discovered later.

**DECISION: two stores, different systems, different locations, both decisions stand.**

| | Research corpus + citation graph | Research OS state |
|---|---|---|
| Contents | Papers, references, edges, annotations | Queue, reading state, notes, ideas |
| Access | Analytical, ad-hoc, multi-hop | Key-value, known patterns, per-user |
| Size | Large | Small |
| Location | **Local**, private repo, as already decided | **AWS DynamoDB** |
| Mobile | Never | Primary client |

The corpus is analytical, bulky, and only needed at a desk — exactly what the existing local-first decision says. Research OS state is small, mobile-facing, and must be reachable from a phone. **DECISION:** the corpus is not migrated to DynamoDB, and mobile access to corpus queries is out of scope for V1.

### Access Patterns First

**DECISION:** the table design is derived from these patterns and nothing else. **DECISION:** a new access pattern requires a documented design change, not a Scan.

- Today's Radar
- Saved papers
- Papers by reading state (unread / reading / completed)
- Notes for a paper
- Recent ideas
- Content candidates
- Processing and job state

**DECISION: a Scan in application code is a defect.** Under provisioned capacity a Scan consumes the RCU budget and throttles the system — which means the design fails loudly, which is the intended behavior.

**DECISION: single-table design is not mandated.** **OPEN:** single-table versus a few purpose-shaped tables. The free allowance is per payer account per region, not per table, so this choice does not affect R1. It should be decided on modelling clarity.

---

## Cost Guardrails

### Forbidden In V1

Prohibited without a separate written decision. Each is either recurring-cost-by-existence or unbounded-by-design.

| Prohibited | Why |
|---|---|
| NAT Gateway | Hourly charge merely for existing. The most common surprise bill in AWS |
| RDS, Aurora | Hourly, and Aurora Serverless v2 has a non-zero floor |
| Always-on EC2 | Hourly |
| ALB / NLB | Hourly |
| Long-running ECS / Fargate | Per-second, continuous |
| OpenSearch | Hourly, expensive |
| SageMaker | Hourly, expensive |
| Paid Bedrock inference | Model cost — see [AI Cost Boundary](#ai-cost-boundary) |
| Customer-managed KMS keys | Per-key monthly charge. Use AWS-managed keys |
| Secrets Manager | Per-secret monthly. Use Lambda environment variables, or SSM Parameter Store Standard |
| WAF | Per-web-ACL monthly |
| SMS-based Cognito MFA | Bills via SNS. TOTP only |
| DynamoDB on-demand or auto-scaling | No ceiling; absorbs bugs by billing |
| Permanent S3 PDF archive | Unbounded growth; and always-free status unverified |
| Log groups without retention | Slow-burn archive growth past 5 GB |
| VPC-attached Lambda | Pulls in NAT Gateway for egress |
| **Any service without a verified $0 path for this workload** | The general rule the rest are instances of |

**DECISION:** adding anything to this architecture requires first answering *"what is its always-free allowance, and what is our modelled consumption as a percentage of it?"* A component that cannot answer is not added.

### Required Controls

**DECISION — reserved concurrency on every Lambda.** This is the primary cost fuse. It is free, it is enforced by the platform, and it fails closed: a runaway loop or a discovered endpoint throttles instead of scaling. **DECISION:** the API Lambda's reserved concurrency is set to a small number, because one user needs almost none, and a low ceiling converts an availability incident into a bill that never happens.

Also required: short Lambda timeouts, set from measurement; memory sized from measurement rather than rounded up; a per-run ingestion cap in the collector; capped collection frequency; a bounded queue with a dead-letter queue and a maximum receive count; idempotency keys on every write so retries cannot duplicate; explicit log retention on every group; TTL on disposable records; and provisioned DynamoDB capacity with auto-scaling off.

**DECISION:** a CloudWatch billing alarm at any non-zero amount. It is detection, not prevention — by the time it fires, money has been spent. It is required anyway, because the alternative is finding out monthly.

---

## Reliability And Failure Behavior

**DECISION: the system fails closed before it spends money.**

**DECISION: this record does not claim a mathematically absolute $0 guarantee for the account.** AWS provides no hard spending cap (**FACT**, retrieved 2026-09-14), so such a claim would be false. Three distinct levels, with honestly different strengths:

**Level 1 — Architecture.** Expected $0 operation, because modelled consumption is single-digit percentages of recurring allowances. *Strength: depends on the model being right.*

**Level 2 — Service quotas and throttling.** Reserved concurrency, provisioned capacity, ingestion caps, queue bounds, timeouts. *Strength: platform-enforced, and holds even when the model is wrong.* This is the level that does the real work.

**Level 3 — Account structure.** IAM permission boundaries and, if an AWS Organization is used, Service Control Policies denying creation of the forbidden services outright. *Strength: prevents the mistake rather than limiting its cost.* **VERIFY:** whether a single-account setup can use SCPs, or whether an Organization is required. **OPEN:** whether an Organization is worth its complexity for one person — it is the most robust control available and also the most overhead.

**DECISION:** degradation order under stress, from first to last: reject excess API requests → stop ingesting new candidates → let the queue back up to its bound → shed to the DLQ → stop the scheduler. **Notes and personal state remain readable and writable at every step.** R5 outranks R1, and this ordering is where that is enforced.

**DECISION — durability.** Point-in-time recovery on the DynamoDB table is **OPEN**: it carries a storage-based charge (**VERIFY** the rate and whether any free allowance applies). At the modelled sub-2 GB scale the absolute cost would be small but non-zero. **DECISION:** if PITR proves to cost anything at all, the alternative is a scheduled export of personal state to the private repository — which is free, versioned, diffable, and aligns with the existing private-repo pattern. **DECISION:** some backup mechanism is mandatory before the notebook holds real content. R5 is not negotiable against R1 here.

---

## Security Boundary

**DECISION: one user, and the system should assume it.** No multi-tenancy, no sharing, no public read path.

- **Identity:** Cognito, TOTP MFA, no SMS.
- **Edge:** CloudFront with OAC; Function URL auth `AWS_IAM` so the origin is not independently reachable.
- **Authorization:** the API Lambda verifies the Cognito JWT on every request. There is no unauthenticated route.
- **IAM:** one role per function, least privilege, scoped to specific table and queue ARNs. No wildcard resources. **DECISION:** this is also an R7 deliverable — least-privilege IAM is a main reason AWS was selected, and taking a shortcut here forfeits the reason.
- **Secrets:** environment variables or SSM Parameter Store Standard. Never Secrets Manager in V1.
- **Logging:** **DECISION:** no paper text, note content, or token in logs. Beyond privacy, verbose logging is the most likely path to the first bill.

**FACT:** the public site's security register is [`security.md`](./security.md) and is unaffected. **DECISION:** the Research OS gets its own register once infrastructure exists; this record is not it.

---

## AI Cost Boundary

**DECISION: infrastructure cost and model inference cost are separate budgets and are never netted against each other.** $0 infrastructure does not mean $0 total.

**DECISION: no paid model inference is included in the $0 baseline.** Bedrock and any external model API are outside it by definition.

**DECISION: provider selection is out of scope for this record.** It requires its own decision. What this record fixes is the *shape*: deterministic filtering first, cheap before expensive, caching, processing only selected candidates, deep analysis on demand only, and local or free inference where practical. **FACT:** this is the same funnel [`research-discovery-system.md`](./research-discovery-system.md#ai-usage) already specifies, and its two-regime split — cheap pipeline, expensive reading — maps directly onto the cost boundary.

---

## Deferred Decisions

Not decided here. Each needs its own record.

| Deferred | Note |
|---|---|
| IaC tool | Terraform vs CDK vs SAM. **DECISION:** IaC is required before anything beyond a throwaway experiment; the choice is not made here |
| Single-table vs multi-table DynamoDB | Does not affect R1; decide on modelling clarity |
| Frontend framework for the private app | Constrained only by being servable from the Lambda |
| Region | **OPEN:** latency from Korea versus free-tier and service availability |
| AWS Organization / SCPs | Strongest Level 3 control; heaviest overhead for one person |
| Point-in-time recovery vs scheduled export | Depends on verifying PITR cost |
| Model provider | Explicitly out of scope |
| Public write-up | Measure first, then decide whether there is a result worth publishing |

---

## Verification Checklist

Every row must be checked before the corresponding component is created, and this table updated with the answer and a date. **DECISION:** items marked **blocking** must be resolved before *any* infrastructure exists.

| # | To verify | Status |
|---|---|---|
| V1 | Account is on the **Paid** plan, not the Free plan | **Blocking — OPEN.** Owner action; requires the billing console. Reconfirmed 2026-09-16 from [Free Tier FAQs](https://aws.amazon.com/free/free-tier-faqs/), with a detail this record did not previously carry: the Free plan expires at *the earlier of* 6 months from account opening **or** credit exhaustion, after which *"AWS closes your account, and you'll lose access to your resources and data."* The 6-month clock is unconditional, so the Free plan is not merely risky — it is terminal by default |
| V2 | CloudFront: which allowance applies — 1 TB/10M pay-as-you-go, or 100 GB/1M flat-rate Free plan | **Resolved 2026-09-16, conservatively.** [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/) now presents plan tiers (Free / Pro / Business / Premium). The Free plan is **100 GB data transfer + 1M requests per month at $0, stated as "no overage charges"**. Model against 100 GB/1M — the smaller figure, and the one that fails closed rather than billing |
| V3 | Lambda's 1M requests + 400,000 GB-s is always-free, not 12-month | **Resolved 2026-09-16: always-free.** [Lambda pricing](https://aws.amazon.com/lambda/pricing/) states the 1M requests + 400,000 GB-seconds monthly allowance is for all customers and does not expire at the end of the 12-month term |
| V4 | DynamoDB 25 WCU / 25 RCU / 25 GB is always-free, not 12-month | **Resolved 2026-09-16: always-free.** [DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/provisioned/) grants 25 WCU / 25 RCU / 25 GB *"each month on a per Region, per-payer account basis"* and separately marks only data transfer as 12-month-enhanced — the contrast is the evidence |
| V5 | SQS `ReceiveMessage` polling from a Lambda event source mapping is billable, and at what rate when idle | **Partially resolved 2026-09-16 — and the decision no longer depends on it.** [SQS pricing](https://aws.amazon.com/sqs/pricing/) confirms *"Every Amazon SQS action counts as a request"* and each 64 KB chunk bills as one request; the 1M/month allowance is for all customers. The **idle poll rate** of a Lambda event source mapping is not documented publicly, so the worst case cannot be bounded from sources. Scheduled drain is therefore kept — it is the option whose cost is knowable in advance, which is the property that matters. Remains VERIFY only if an event source mapping is ever reconsidered |
| V6 | API Gateway HTTP API free tier is 12-month rather than always-free | Before considering it |
| V7 | S3 free storage is always-free or 12-month | Before any S3 use |
| V8 | CloudFront OAC supports Lambda Function URL origins, and its configuration | Before the online path |
| V9 | DynamoDB PITR cost, and whether any free allowance applies | **Resolved 2026-09-16: PITR is billed by table size, with no free allowance.** See [Durability Has A Price](#durability-has-a-price) below — this is the first identified conflict between R1 ($0/month) and R5 (notes durability) |
| V10 | SCPs on a single account, or Organization required | Before Level 3 controls |
| V11 | Lambda Function URLs carry no separate charge | Before the online path |
| V12 | CloudWatch 5 GB is combined across ingestion, archive, and Insights scans | Before setting retention |
| V13 | Cognito Essentials free MAU and its stated indefinite duration | Confirmed 2026-09-14; recheck at go-live |
| V14 | Region choice does not alter any allowance above | Before creating resources |

**V1-V5 and V9 re-checked 2026-09-16** against official AWS pricing and Free Tier pages; answers are inline in the table above and carry that date. Every figure below remains volatile.

**Sources retrieved 2026-09-14:** [AWS Free Tier](https://aws.amazon.com/free/), [Free Tier FAQs](https://aws.amazon.com/free/free-tier-faqs/), [Lambda pricing](https://aws.amazon.com/lambda/pricing/), [DynamoDB provisioned pricing](https://aws.amazon.com/dynamodb/pricing/provisioned/), [SQS pricing](https://aws.amazon.com/sqs/pricing/), [Cognito pricing](https://aws.amazon.com/cognito/pricing/), [EventBridge pricing](https://aws.amazon.com/eventbridge/pricing/), [CloudWatch pricing](https://aws.amazon.com/cloudwatch/pricing/), [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/), [AWS Free Tier data transfer expansion](https://aws.amazon.com/blogs/aws/aws-free-tier-data-transfer-expansion-100-gb-from-regions-and-1-tb-from-amazon-cloudfront-per-month/).

**DECISION:** every pricing fact in this record carries the 2026-09-14 retrieval date and is treated as volatile. **DECISION:** re-verify the whole table annually and after any AWS free-tier policy announcement. A stale pricing fact in a document whose entire premise is $0 is worse than no fact.

---

### Durability Has A Price

**Added 2026-09-16, from the V9 answer.** DynamoDB point-in-time recovery is charged by
table size and **no free allowance applies to it**. This is the first place where two of
this record's own requirements genuinely conflict rather than merely coexist:

- **R1** — the AWS bill stays $0.00/month.
- **R5** — research notes are durable. The whole reason the [Paid plan is required](#verification-checklist) is that losing notes is worse than paying.

PITR is the managed answer to "notes survive my mistakes," and it is not free. The
resolution is *not* to weaken R5, which already outranks R1 by this record's own reasoning.

**DECISION:** V1 does not change — the Paid plan stays, for the same reason as before.
**DECISION:** PITR is **not** enabled by default. Instead, durability in V1 is met by
**export to the corpus**: personal state is small, bounded, and already mirrored by a
corpus-owned canonical item, so a scheduled export into the local relational store is both
cheaper and more useful than PITR — it puts notes where the research actually happens.

**OPEN:** if personal state ever grows past what an export can cover, or if the export
itself proves unreliable, PITR becomes the right answer and this becomes the first
deliberate non-zero line item. That is a decision to make explicitly, with a number, not
by drifting into it. **The $0.00 invariant holds until someone writes down why it should
not.**

---

## Cost Observability

**DECISION: cost is a system metric, emitted by the Research OS itself, not a thing checked in the console monthly.**

Track: candidates ingested per run; Lambda invocations and GB-seconds; SQS request count; DynamoDB consumed capacity and throttle events; storage size; log volume ingested; percentage of each free allowance consumed month-to-date; and estimated monthly bill.

**DECISION:** the primary display is **percentage of allowance consumed**, not absolute usage. "47,000 SQS requests" requires a lookup to interpret; "4.7% of the monthly allowance" does not. **DECISION:** custom CloudWatch metrics are capped at 10 free, so most of this is derived at read time rather than published as metrics — which is itself an instance of the design rule.

**DECISION — throttle events are a headline metric, not an error.** Under this architecture throttling is the cost invariant working. A dashboard that treats it as a fault would create pressure to remove the guardrail.

A retrospective becomes possible later — expected cost versus actual bill, free-tier utilization, optimizations, and incidents that nearly generated cost. **DECISION:** whether that becomes public writing is decided after there is a measured result. The interesting version of *"can a personal AI Research OS run on AWS for $0/month?"* is the one with a year of data behind it, including the months it nearly failed.

---

## Migration Triggers

**DECISION:** each trigger names its response. Migration happens when a trigger fires, not when something feels limiting.

| Trigger | Response |
|---|---|
| Idea Graph needs multi-hop traversal or ad-hoc joins | Keep it in the **local** relational store, per [`research-discovery-system.md`](./research-discovery-system.md#storage-shape). Do not move it to DynamoDB, and do not add Aurora |
| Any free allowance exceeds ~50% sustained | Reduce ingestion first; batch the processor second; only then reconsider platform |
| Full-text search over the corpus needed from mobile | **Not** OpenSearch. Re-scope, or accept desk-only. This is the trigger most likely to fire and most likely to be answered wrongly |
| Heavy containerized or GPU work becomes central | Revisit GCP Cloud Run Jobs. This is the strongest multi-cloud case |
| Egress becomes material | Revisit Cloudflare R2 |
| A second user | Stop. Re-read [`product-boundaries.md`](./product-boundaries.md); this becomes a different product with a different decision |
| Personal state exceeds ~10 GB | Investigate before it approaches 25 GB. At the modelled rate this is roughly a decade away |

---

## Open Questions

- Which region, balancing latency from Korea against allowance and service availability?
- Is an AWS Organization worth its overhead for one person, given SCPs are the only control that prevents rather than limits?
- Point-in-time recovery, or scheduled export to the private repository? Depends on V9.
- Should the collector run in AWS at all in V1, or stay on the local machine with only the *online* path in AWS? A smaller first step that satisfies R3 without touching R4 — and it is plausibly the correct V1 under **R8**.
- What is the recovery path if the account is suspended for a billing problem? The notebook lives there, and R5 has no answer today beyond the backup decision above.
- Does the mobile client work offline, and if so, what is the conflict-resolution rule? Deferred, but note-taking on a train is a plausible primary use.
- At what measured point does the $0 constraint start degrading the product rather than disciplining it? **DECISION:** this question stays open deliberately. The constraint is valuable because it forces design discipline; it stops being valuable the moment it prevents the notebook from being usable.
