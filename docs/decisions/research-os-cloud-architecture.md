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
| V1 | Account is on the **Paid** plan, not the Free plan | **Resolved 2026-09-16 by inference, and the inference is stronger than the banner would have been.** The Billing console's *Free tier* page shows **no credit balance and no expiry countdown** — a Free plan account displays both. Decisively, the DynamoDB tables removed during the [account baseline](#account-baseline-2026-09-16) were created **2022-04-02**, so the account is at least four years old. The Free plan's six-month clock would have expired years ago, and expiry closes the account; a Free plan account could not still be open. The Free/Paid split was introduced in 2025, so this account predates it and sits on the pay-as-you-go model. **Residual:** not read off an explicit plan label. If AWS ever migrates legacy accounts into the plan structure, re-check this row rather than trusting this reasoning |
| V2 | CloudFront: which allowance applies — 1 TB/10M pay-as-you-go, or 100 GB/1M flat-rate Free plan | **Resolved 2026-09-16, conservatively.** [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/) now presents plan tiers (Free / Pro / Business / Premium). The Free plan is **100 GB data transfer + 1M requests per month at $0, stated as "no overage charges"**. Model against 100 GB/1M — the smaller figure, and the one that fails closed rather than billing |
| V3 | Lambda's 1M requests + 400,000 GB-s is always-free, not 12-month | **Resolved 2026-09-16: always-free.** [Lambda pricing](https://aws.amazon.com/lambda/pricing/) states the 1M requests + 400,000 GB-seconds monthly allowance is for all customers and does not expire at the end of the 12-month term |
| V4 | DynamoDB 25 WCU / 25 RCU / 25 GB is always-free, not 12-month | **CONFIRMED 2026-09-16 from the account's own metering, not from documentation.** The Billing console's *Free tier* page lists `18600.0 ReadCapacityUnit-Hrs are **always free per month** as part of AWS Free Usage Tier`. 18,600 = 25 x 744 hours, so this is the 25 RCU / 25 WCU allowance stated by AWS's own meter, carrying the words "always free" with no 12-month qualifier. Read and write are metered separately, and so are `APN2-` and `USW2-` — see [Region](#region) |
| V5 | SQS `ReceiveMessage` polling from a Lambda event source mapping is billable, and at what rate when idle | **Partially resolved 2026-09-16 — and the decision no longer depends on it.** [SQS pricing](https://aws.amazon.com/sqs/pricing/) confirms *"Every Amazon SQS action counts as a request"* and each 64 KB chunk bills as one request; the 1M/month allowance is for all customers. The **idle poll rate** of a Lambda event source mapping is not documented publicly, so the worst case cannot be bounded from sources. Scheduled drain is therefore kept — it is the option whose cost is knowable in advance, which is the property that matters. Remains VERIFY only if an event source mapping is ever reconsidered |
| V6 | API Gateway HTTP API free tier is 12-month rather than always-free | Before considering it |
| V7 | S3 free storage is always-free or 12-month | **Resolved 2026-09-23: neither — this account has no S3 free tier at all.** [S3 pricing](https://aws.amazon.com/s3/pricing/) describes the post-2025-07-15 structure ($200 credits, a free plan for 6 months after account creation). This account dates to 2022 and was under the previous 12-month allowance, which expired in 2023. **S3 is billed from the first byte here.** Measured the same day: the CDK assets bucket holds 4 objects / 39.6 KB, which rounds below a cent — so the correct statement is not "S3 is free" but "this usage is too small to bill". The distinction matters because it does not scale, and it was crossed before being answered — see [First Deployment](#first-deployment-2026-09-23) |
| V8 | CloudFront OAC supports Lambda Function URL origins, and its configuration | **Resolved 2026-09-23.** [AWS announcement, April 2024](https://aws.amazon.com/about-aws/whats-new/2024/04/amazon-cloudfront-oac-lambda-function-url-origins): OAC for Lambda Function URL origins is generally available worldwide (excluding CloudFront China), configurable via console/SDK/CLI/CloudFormation, and carries **no additional fee**. Uses SigV4, matching this record's `AWS_IAM` Function URL auth type |
| V9 | DynamoDB PITR cost, and whether any free allowance applies | **Resolved 2026-09-16: PITR is billed by table size, with no free allowance.** See [Durability Has A Price](#durability-has-a-price) below — this is the first identified conflict between R1 ($0/month) and R5 (notes durability) |
| V10 | SCPs on a single account, or Organization required | Before Level 3 controls |
| V11 | Lambda Function URLs carry no separate charge | **Resolved 2026-09-23 by absence, not by statement — and the record says so deliberately.** Neither [Lambda pricing](https://aws.amazon.com/lambda/pricing/) nor the [function URL guide](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html) carries a Function URL line item or any sentence asserting there is no charge; the pricing page bills only requests and duration. Absence of a line item is weaker evidence than a positive statement, so this stays a **watch item**: confirm against the first real bill rather than treating it as closed. The API Gateway contrast is the point — that service has its own published per-request price, and this one does not |
| V12 | CloudWatch 5 GB is combined across ingestion, archive, and Insights scans | **Partially confirmed 2026-09-16 from the account.** The Free tier page shows `5.0 GB-Mo are always free per month ... (Global-TimedStorage-ByteHrs)`: 5 GB of **archive storage**, always-free, and — per the `Global-` prefix — **account-wide rather than per-region**. Whether ingestion and Insights scans draw on that *same* 5 GB is not shown by this line and stays unverified. Keep assuming they share it: the conservative reading, and the one that keeps retention short |
| V13 | Cognito Essentials free MAU and its stated indefinite duration | Confirmed 2026-09-14; recheck at go-live |
| V14 | Region choice does not alter any allowance above | **Answered 2026-09-16, with a caveat that changes the capacity model.** Free-tier *scope* is not uniform across services: [SQS](https://aws.amazon.com/sqs/pricing/) states its allowance is *"calculated each month across all regions (except the GovCloud region)"* — one pool, shared. [DynamoDB](https://aws.amazon.com/dynamodb/pricing/provisioned/) grants its 25 WCU / 25 RCU / 25 GB *"on a per Region, per-payer account basis"* — a separate pool per region. Lambda and CloudWatch region scope is **not verified**; assume account-wide (the conservative reading) until checked. Unit *rates* above free tier are higher in ap-northeast-2 than us-east-1, so an overage costs more there — which matters only if the $0 invariant is already broken |
| V15 | Lambda **Function URLs are available in `ap-northeast-2`** | **Resolved 2026-09-23 by existence.** `research-os-api` carries a live Function URL at `…lambda-url.ap-northeast-2.on.aws` with `AuthType: AWS_IAM`, so the region supports them. Raised as blocking that morning and answered the same day by a deployment that had already happened — a reminder that a checklist can only gate what it is consulted for. Original note: The [function URL guide](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html) states plainly that *"Function URLs are not supported in all AWS regions"* and points at a regional-services table rather than listing them. The whole online path in this record assumes a Function URL in the Seoul region chosen under [Region](#region), so this is a **blocking** check before the online path — not a formality. Two adjacent facts from the same page are already load-bearing here: a function URL is reachable **only over the public internet** (no PrivateLink), which is why OAC + `AWS_IAM` in V8 is the access control rather than a network boundary; and **reserved concurrency set to zero deactivates the URL outright**, returning HTTP 429 — an emergency off-switch that costs nothing and matches this record's treatment of reserved concurrency as the primary cost fuse |

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

### Region

**DECISION (owner, 2026-09-16): the Research OS runs in `ap-northeast-2` (Seoul).
Billing metrics and budget alarms stay in `us-east-1`.**

The split is not a preference. The `AWS/Billing` CloudWatch namespace exists only in
us-east-1, so cost alarms must live there regardless of where the workload runs.

Seoul is chosen for latency: this system is meant to be used from a phone, from Korea,
and Seoul is roughly a third of the round-trip to us-east-1. Region is also the most
expensive decision to reverse in this architecture — changing it later means migrating
table data, not editing a setting — so it is made before anything exists.

**Consequence for the capacity model:** DynamoDB's 25 WCU / 25 RCU / 25 GB is granted
per region, so Seoul carries its own full allowance. SQS's 1M requests is **not** —
it is one pool shared across all regions. The [One-Year Capacity Model](#one-year-capacity-model)
is unaffected, because it already models a single region and a single queue, but a
second region would silently halve the SQS headroom rather than double it.

**CONFIRMED 2026-09-16, from the account's own metering rather than from documentation.**
The Billing console's *Free tier* page lists DynamoDB's allowance twice — once as
`APN2-ReadCapacityUnit-Hrs` and once as `USW2-ReadCapacityUnit-Hrs`, each carrying its own
full 18,600 RCU-Hrs. That is the per-region grant made visible. CloudWatch appears once, as
`Global-TimedStorage-ByteHrs`: account-wide, as assumed.

**OPEN:** Lambda's free-tier region scope is still unverified — there was no Lambda usage in
the account to meter. Assume account-wide, the conservative reading, where being wrong adds
headroom rather than removing it.

---

### Cost Explorer Is Metered, 2026-09-23

**FACT:** the Cost Explorer API costs money per call. [Cost Explorer pricing](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/pricing/),
retrieved 2026-09-23: *"Each request using your primary billing view, which contains cost
management data associated with your account, will incur a cost of $0.01."* It is billed per
request, with no free allowance stated.

This surfaced from a real error while granting the `admin` IAM user billing access — a tool
calling `ce:GetCostAndUsage` returned `AccessDeniedException: IAM user access not activated`.

**DECISION: nothing in this system may call the Cost Explorer API, and no agent or automation
may be pointed at it.** A single poller on a five-minute schedule is $86.40/month against an
account whose entire premise is $0.00 — the most expensive thing here would be the tool that
watches the cost. The irony is the point: cost *observability* is itself a cost, so it has to
be chosen as deliberately as any other resource.

The free substitutes already cover what this account needs: the `zero-spend` budget
(detection after the fact, which is what Budgets is), the Billing console's **Bills** page,
and the **Free Tier** usage page, which is the one that actually found the 2022 tables above.

**Two different gates are easy to confuse, and the error message names neither cleanly:**

| Gate | Who | Covers |
|---|---|---|
| **Activate IAM Access** | root only, once per account | The Billing console *pages* — Bills, Budgets, Cost Explorer UI, Payments, Preferences |
| Cost Explorer enablement + IAM policy | root / admin | Cost Explorer itself |

[Granting access to your billing information](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/control-access-billing.html),
retrieved 2026-09-23: *"IAM users and roles in an AWS account can't access the Billing and
Cost Management console by default. This is true even if they have IAM policies that grant
access to certain Billing features."* Attaching a policy to `admin` is therefore necessary
and not sufficient — which is exactly the symptom observed.

The same page also states the setting *"doesn't control access to ... The Billing and Cost
Management SDK APIs (AWS Cost Explorer, AWS Budgets, and AWS Cost and Usage Reports APIs)"*,
while [Controlling access to Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-access.html)
says Cost Explorer is enabled by the root user and that *"Permissions for Cost Explorer apply
to all accounts and member accounts, regardless of the IAM policies."* The two pages do not
resolve cleanly against this error string, and **this record does not pretend they do.** It
does not matter here, because the decision above is to leave the API unreachable either way.

### First Deployment, 2026-09-23

**FACT: the online path exists.** The owner deployed it deliberately on 2026-09-23, ahead of
the per-component gates below V5. Read from the account, not from this document:

| Resource | Configuration |
|---|---|
| `ResearchOsOnlineStack` (CloudFormation, via CDK) | `UPDATE_COMPLETE`, 08:52 UTC |
| `CDKToolkit` bootstrap + assets bucket | 08:03 UTC, 4 objects / 39.6 KB |
| Lambda `research-os-api` | `nodejs22.x`, 256 MB, 10 s, x86_64 |
| — reserved concurrency | **5** |
| — Function URL | `AWS_IAM` |
| DynamoDB `research-os-state` | provisioned **10 RCU / 10 WCU** after the correction below (deployed at 25/25), 0 items |
| — GSI `gsi1`, `Projection: ALL` | provisioned **5 RCU / 5 WCU** |
| CloudFront distribution + OAC | `PriceClass_All`, caching disabled |
| — PITR | `DISABLED` |
| CloudWatch `/aws/lambda/research-os-api` | retention **14 days** |
| SQS | none |
| Cognito | `research-os-users` |

**Every cost guardrail this record specifies was applied.** Reserved concurrency is set, so the
primary fuse exists rather than being a habit. The Function URL is `AWS_IAM`, not `NONE`.
DynamoDB is provisioned at exactly the free allowance rather than on-demand, which this record
lists under [Forbidden In V1](#forbidden-in-v1). PITR is off, matching
[Durability Has A Price](#durability-has-a-price). The log group was created *with* retention,
which this record names as the slow-burn first bill. None of that happened by accident.

**Two gates were crossed before they were answered, and both are now closed:**

- **V7 — "Before any S3 use."** `cdk bootstrap` always creates an assets bucket, so S3 was in
  use at 08:03 UTC while V7 was still open. Answered the same day, and the answer is the
  uncomfortable one: this account has no S3 free tier. The amount is negligible; the reasoning
  was not available at the time it was needed.
- **"No Terraform or CDK."** This record defers IaC deliberately, and CDK is now bootstrapped
  and in use. **DECISION: that deferral is superseded — CDK is the chosen tool.** Recorded as a
  reversal rather than edited away, because the deferral was written down with reasons.

### Enumeration Discipline, 2026-09-23

Three sweeps of this account in one day each reported a state that was not the state, and all
three failed the same way: **only the thing already in mind was queried.**

| Reported | Actually | Missed because |
|---|---|---|
| "the account now holds nothing" (2026-09-16) | 9 stacks, 3 Lambdas, 3 buckets, 10 roles, a Cognito pool, an AppSync API, a REST API, 3 unbounded log groups | only DynamoDB was listed |
| "provisioned at exactly the free allowance, 25/25" | 30/30 — 120% | `describe-table` was run, `GlobalSecondaryIndexes` was never expanded |
| the deployed-resource inventory | CloudFront distribution + OAC also exist | CloudFront was never queried; it surfaced only when the stack source was read |

The second and third were found by reading the CDK source and the CloudFormation resource list —
that is, by asking the account what it contains instead of asking it to confirm a list. The
generalisation is cheap and worth stating: **`list-stack-resources` before `describe-<thing>`,
and expand every nested structure the first call returns.** A sweep scoped to the service you
were already thinking about reports an empty account and leaves nine stacks running.

### Stated But Not In Effect

`minimumProtocolVersion: TLS_V1_2_2021` is set on the CloudFront distribution and **does nothing**.
CDK warns on every synth: the setting has no effect without a custom certificate, and this
distribution uses the default `*.cloudfront.net` certificate, whose security policy is fixed at
TLSv1. Raising the floor requires a custom domain and an ACM certificate, which V1 does not have.

Kept in the stack with a comment saying so, rather than deleted — removing it would make the file
read as though TLS 1.2 had never been intended, and the honest state is "intended, unenforceable
today". Recorded here because a security property asserted in code and not enforced by the
platform is exactly the kind of claim this record exists to catch.

### The Infrastructure Definition Is Not Committed Anywhere

`infra/` in the private repository is **untracked**. Thirteen live resources — CloudFront, a
Lambda with a Function URL, DynamoDB with a GSI, a Cognito pool — have a single definition, in an
uncommitted directory on one laptop, in a repository that has no remote. There is no baseline to
diff against and nothing to restore from.

**DECISION: committing `infra/` is a precondition for any further change to it.** The capacity
correction above was edited into that file before it had ever been committed, which is the
concrete version of the risk rather than a hypothetical one.

### Capacity, Recomputed 2026-09-23

The paragraph that stood here said the table consumed the entire regional allowance and stopped
there. It was wrong, and wrong in the direction that costs money.

**The free allowance is a regional aggregate, and the index counts.** The account's own Free Tier
page meters `APN2-ReadCapacityUnit-Hrs` against **18,600 per month**, which is 25 units x 744 h —
so the grant is capacity-unit-hours across the Region, not a per-table number. As deployed:

| | RCU | WCU |
|---|---|---|
| table `research-os-state` | 25 | 25 |
| GSI `gsi1` | 5 | 5 |
| **total** | **30** | **30** |
| free allowance | 25 | 25 |

30 units x 744 h = 22,320 against 18,600 = **120%**. About 3,720 unit-hours of each billable,
roughly $3/month at us-east-1 rates and more in Seoul. **September survived only because the
stack was deployed on the 23rd** — 183 remaining hours put the month at 31%. October would have
been the first full month, and the first bill.

**The 25 WCU was never usable.** `gsi1` projects `ALL`, so every item carrying `gsi1pk` consumes
table *and* index write capacity, and DynamoDB throttles the base write when the index is the
smaller of the two. Sustained indexed writes were capped at **5/s by the GSI** whatever the table
said. The extra 15 units bought no throughput; they bought an overage.

**Corrected to 10/10 + 5/5 = 15 units (60%)**, deployed the same day with no table replacement.
The 5/s indexed-write ceiling is unchanged; what changed is that there are now 10 spare units for
the background collector when it moves off the laptop. At 25/25 there was no room to move it at
all without billing — so the reduction *created* the capacity ingestion will need rather than
taking any away.

**Bias low, always.** Exceeding provisioned capacity throttles and the SDK retries: the symptom
is latency. Over-provisioning has no symptom until the bill. DynamoDB also caps *decreases* at
four per day per table while increases are unlimited, so the cheap direction is also the
reversible one.

### Reserved Concurrency Is Not A $0 Fuse

This record calls reserved concurrency "the primary cost fuse", and that overstates it.

At 256 MB, five reserved concurrent executions is 1.25 GB-s of every wall-clock second. A 30-day
month pinned at saturation is 3,240,000 GB-s against a 400,000 GB-s allowance, plus up to
129.6M requests (a Function URL's ceiling is 10 x reserved concurrency = 50 RPS) against 1M.
That is roughly **$73/month** at us-east-1 rates — bounded, but not zero.

The reserved concurrency that *would* bound the month to the free tier is
400,000 / (0.25 x 2,592,000) = **0.617**. There is no integer below one, so no setting of this
control keeps Lambda free under sustained load.

| Control | Over-limit behaviour | Guarantees $0? |
|---|---|---|
| DynamoDB provisioned capacity | throttles — fails closed | **yes** |
| Lambda reserved concurrency | keeps executing up to the cap | **no** — bounds the rate, not the total |

**DECISION: reserved concurrency is a blast-radius limit, not a cost fuse.** It converts an
unbounded bill into a bounded one, which is worth having and is not what the earlier wording
claimed.

**The fuse that does fail closed is a Budgets action**, and [Budgets pricing](https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/)
(2026-09-23) gives the first two action-enabled budgets free. Setting reserved concurrency to
zero deactivates a Function URL outright — the [function URL guide](https://docs.aws.amazon.com/lambda/latest/dg/urls-configuration.html)
says so explicitly — so a budget action at the $0.01 threshold is a real stop, not an email. The
existing `zero-spend` budget is notification-only. **This is the one guardrail still missing.**

### The Free Tier Page Is A Trailing Indicator

The page that found the 2022 tables did not show the stack deployed at 08:52 UTC the same day.
Read hours later it still reported 352 RCU-Hrs — the residue of the two 1-RCU tables deleted on
2026-09-16, identical to the unit-hour in `ap-northeast-2` and `us-west-2` because both tables
were the same size and were deleted together. Thirty units running for two hours would have
shown 412. Its forecast column extrapolated from data that predated the deployment entirely.

**DECISION: the Free Tier page answers "what did this account do", never "what is it doing".**
For the second question, read the resource: `describe-table`, `get-function-concurrency`,
`describe-log-groups`.



**The lesson is about the gate, not the build.** The checklist above cannot block anything; it
is prose in a repository, and the deploy ran from a laptop. What it can do is be read first.
The build was disciplined enough that the guardrails held anyway — which is the argument for
writing them down, and not an argument that the checklist worked.

### Account Baseline, 2026-09-16

**FACT:** the account was not empty when this work began. The Free tier page showed DynamoDB
consuming 1.83% of the monthly allowance in **two** regions, which is how the following were
found — none of them related to this project:

| Table | Region | Created | Items | Capacity |
|---|---|---|---|---|
| `test` | ap-northeast-2 | 2022-04-02 | 0 | 1 RCU / 1 WCU |
| `user_info` | us-west-2 | 2022-04-02 | 0 | 1 RCU / 1 WCU |
| `Todo-...-dev` (Amplify) | ap-northeast-2 | 2022-09-25 | 2 | on-demand |

The two empty 1-RCU tables were what consumed the allowance — 1 RCU x ~341 hours matches the
341 RCU-Hrs metered in each region exactly. The Amplify-generated `Todo` table was on-demand
and contributed nothing to it. All three were deleted by the owner on 2026-09-16, after the
`Todo` table's two items were exported; both regions now list no tables.

**Re-checked 2026-09-23, one week after the deletions.** The owner read the Billing console
as root and reported the month-to-date bill as **$0.00**. This is the first confirmation that
the account is quiet *after* the 2022 tables were removed, rather than a claim about the
architecture: nothing from this system exists yet, so what it establishes is the baseline the
first resource will be measured against.

Read from the console, not from the Cost Explorer API — see [Cost Explorer Is Metered](#cost-explorer-is-metered-2026-09-23).
Free-tier consumption was not separately reported in this check, so the 1.83% DynamoDB figure
above has a deletion recorded against it but no post-deletion reading. Worth one look at the
Free Tier page before the first resource is created, so the baseline is a measurement rather
than an inference.

**Corrected 2026-09-23. "The account now holds nothing" was wrong when it was written.**
Only DynamoDB was checked in 2026-09-16; the rest of the 2022 estate was never enumerated. A
later look at the IAM console showed **25 roles**, which is what prompted a full sweep. What
was actually still there, all from 2022-09:

| Kind | Count |
|---|---|
| CloudFormation stacks (3 root + 6 nested) | 9 |
| Lambda functions, all `nodejs14.x` | 3 |
| S3 deployment buckets | 3 (66 objects, 3.2 MB) |
| IAM roles | 10 |
| Cognito user pool | 1 (**0 users**) |
| AppSync API | 1 |
| API Gateway REST API | 1 |
| CloudWatch log groups, **no retention** | 3 |

Contents were checked before anything was removed — the Cognito pool was empty and the buckets
held only Amplify backend config, so unlike the `Todo` table in 2026-09-16 there was nothing to
export. Removed 2026-09-23: the owner deleted the three buckets, the three root stacks were
deleted and cascaded to everything above, and the three orphaned log groups were deleted
separately because Lambda creates them outside CloudFormation and they therefore survive stack
deletion. Verified after: 6 IAM roles remain (5 CDK + 1 stack role), one Lambda, one Cognito
pool, no AppSync, no API Gateway, one log group with 14-day retention, and `us-east-1`,
`us-west-2` and `ap-northeast-1` return zero stacks, functions, log groups and tables.

Two `unauthRole` entries were live for four years — roles whose whole purpose is unauthenticated
access, attached to applications nobody had opened since 2022. That is the part worth
remembering: the cost was nil, the exposure was not.

**The correction is the point.** A sweep that stops at the service you were already thinking
about reports an empty account and leaves nine stacks running. The 2026-09-16 entry was not a
lie; it was a check scoped to what had just been found, written up as though it were a scope of
the whole account.

**The lesson outranks the log entry.** A $0 invariant is a claim about an **account**, not
about a project. Four-year-old experiments were quietly drawing on the same allowance the
[capacity model](#one-year-capacity-model) assumes it holds in full — and nothing in this
record would have noticed, because the model reasons about what this system will consume,
never about what else already does. **The Free tier page is therefore a precondition for
trusting any projection here**, and is worth re-reading whenever the model is revised.

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
