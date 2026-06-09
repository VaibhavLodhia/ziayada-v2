"""Hardcoded conversational history for the demo user.

Each entry is a complete chat turn (user prompt + assistant reply). When
seeded, we run the extraction pipeline over each session as if the user
had actually had these chats, populating their entity graph.

These conversations are written to produce *rich, interconnected* graph data:
- Recurring people (Layla, Henry, Vaibhav, Alice, Daniel)
- Recurring orgs and systems (DataCorp, Snowflake, Stripe, Ollama Cloud)
- Linked decisions that reference each other
- Compliance/security topics that span multiple decisions
"""

DEMO_SESSIONS: list[list[dict[str, str]]] = [
    # Session 1: M&A due diligence
    [
        {
            "role": "user",
            "content": (
                "We're evaluating an acquisition of DataCorp. Their CTO Alice Tan said "
                "they run their analytics on Snowflake and integrate with Salesforce. "
                "Layla N. wants to know the data-architecture risk before the March 6 "
                "board meeting. Recording this as D-2026-061."
            ),
        },
        {
            "role": "assistant",
            "content": (
                "Captured D-2026-061 (Evaluate DataCorp acquisition). Key risks I see for "
                "Layla to review: Snowflake compute cost at scale, data-residency overlap "
                "with our existing warehouse, and Salesforce-side identity reconciliation. "
                "I'll surface comparable deals in our graph for context."
            ),
        },
    ],
    # Session 2: Compliance
    [
        {
            "role": "user",
            "content": (
                "Henry K. just flagged that our new vendor-risk policy requires SOC 2 "
                "Type II for any critical integration. We currently have three vendors "
                "out of scope: Mailchimp, Linear, and Slack. Need a decision by April 1."
            ),
        },
        {
            "role": "assistant",
            "content": (
                "Logged as D-2026-062 (SOC 2 vendor remediation). The blast radius is "
                "uneven: Slack holds customer PII via support threads, Mailchimp holds "
                "marketing PII, Linear holds engineering metadata only. I'd prioritise "
                "Slack and Mailchimp; Linear can wait for renewal. Henry K. should be "
                "the approver on this one."
            ),
        },
    ],
    # Session 3: Payments
    [
        {
            "role": "user",
            "content": (
                "Vaibhav L. demoed the new billing dashboard today. We're moving forward "
                "with Stripe for the payment processor. Layla approved it. Daniel from "
                "Stripe's partnerships team is our point of contact. PCI scope is the "
                "main open concern."
            ),
        },
        {
            "role": "assistant",
            "content": (
                "Recorded D-2026-063 (Adopt Stripe for billing). Stripe's Elements/Checkout "
                "keeps card data off the Ziyada Backend entirely, so we should stay at "
                "SAQ A. Daniel can help confirm the integration pattern. Vaibhav owns the "
                "frontend wiring; Layla approved."
            ),
        },
    ],
    # Session 4: Infra
    [
        {
            "role": "user",
            "content": (
                "We need to decide whether to migrate inference from Ollama Cloud to "
                "self-hosted GPUs. Latency for our top customer Acme Corp is hitting "
                "1.2s p95. Ops cost is the tradeoff. Khusrav B. is owning the analysis."
            ),
        },
        {
            "role": "assistant",
            "content": (
                "Captured as D-2026-064 (Inference hosting tradeoff). Three variables to "
                "weigh: Acme Corp latency SLA, monthly GPU cost (~$4k/mo for 4xA10G), and "
                "ops burden on Khusrav's team. Suggest a 30-day prototype on a single "
                "self-hosted node before committing. Related to D-2026-051 (original "
                "Ollama Cloud adoption)."
            ),
        },
    ],
]
