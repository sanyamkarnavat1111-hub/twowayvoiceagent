export interface DefaultDoc {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  content: string;
}

export const DEFAULT_COMPANY_DOCUMENTS: DefaultDoc[] = [
  {
    id: 'doc-sla-infra',
    title: 'Enterprise Cloud SLA & High Availability Architecture',
    category: 'Infrastructure & SLA',
    description: 'Service level agreements, uptime guarantees, RPO/RTO metrics, and multi-region failover architecture.',
    tags: ['SLA', 'Uptime', 'Disaster Recovery', 'Security', 'Compliance'],
    content: `# Enterprise Cloud Infrastructure & SLA Specification

## 1. Service Level Availability (SLA)
- **Production Availability Target**: 99.99% monthly uptime guarantee across all enterprise clusters.
- **Scheduled Maintenance Window**: Sundays between 02:00 UTC and 04:00 UTC with a minimum 72-hour advance customer advisory.
- **Service Credits**: If monthly uptime falls below 99.99%:
  - 99.9% to 99.98%: 10% monthly subscription credit.
  - 99.0% to 99.89%: 25% monthly subscription credit.
  - Below 99.0%: 50% monthly subscription credit.

## 2. Disaster Recovery & Continuity (RPO / RTO)
- **Recovery Point Objective (RPO)**: <= 5 minutes for transactional databases with continuous WAL replication.
- **Recovery Time Objective (RTO)**: <= 15 minutes for automated cross-region traffic shifting via global Anycast DNS.
- **Data Replication**: Triple-replicated hot storage across three distinct availability zones in primary regions (us-east, us-west, eu-central).

## 3. Compliance & Security Certifications
- SOC 2 Type II certified annually by third-party auditors.
- ISO/IEC 27001, 27017, and 27018 audited.
- HIPAA Business Associate Agreement (BAA) available for Healthcare Tier clients.
- Encryption standards: AES-256 at rest (KMS hardware security module backed) and TLS 1.3 in transit with strict HSTS.`
  },
  {
    id: 'doc-billing-refunds',
    title: 'Customer Billing, Subscription Lifecycle & Refund Policy',
    category: 'Billing & Finance',
    description: 'Payment terms, subscription upgrade/downgrade rules, refund eligibility, invoice cycles, and credit terms.',
    tags: ['Billing', 'Refunds', 'Invoices', 'Payment Methods', 'Subscriptions'],
    content: `# Customer Billing & Financial Operations Policy

## 1. Billing Cycles & Payment Methods
- **Billing Frequency**: Monthly recurring on the 1st of each calendar month or Annual prepaid with a 20% discount.
- **Accepted Payment Methods**: Major credit cards (Visa, MasterCard, Amex), ACH direct debit (US), SEPA direct debit (EU), and Net-30 Wire Transfers for enterprise accounts above $10,000 annual contract value (ACV).
- **Grace Period**: 14 calendar days upon failed payment attempt before service throttling. Automated notifications are sent on Day 1, Day 5, and Day 10.

## 2. Refund Eligibility & Exceptions
- **30-Day Satisfaction Guarantee**: Full 100% refund available for new annual subscriptions within 30 days of initial provisioning.
- **Monthly Subscriptions**: Prorated credit applied to account balance upon mid-cycle cancellation. Direct cash refunds on monthly plans are permitted if service experienced verified downtime exceeding SLA limits.
- **Add-on Services**: Dedicated onboarding workshops and custom model fine-tuning hours are non-refundable once hours have been delivered.

## 3. License Upgrades & Seat Proration
- Adding seats or upgrading tiers takes effect immediately. Charges are prorated for the remaining days of the active billing cycle.
- Downgrades take effect at the conclusion of the current prepaid billing period to preserve uninterrupted historical data access.`
  },
  {
    id: 'doc-api-webhooks',
    title: 'Developer API, Rate Limiting & Webhook Integration Specs',
    category: 'API & Developer Specs',
    description: 'REST API authentication, rate limits, webhook delivery retries, idempotency keys, and error status codes.',
    tags: ['API', 'Webhooks', 'Authentication', 'Rate Limits', 'SDK'],
    content: `# Developer API & Webhook Specifications

## 1. Authentication & Security
- **API Keys**: Bearer token authentication via \`Authorization: Bearer <API_SECRET_KEY>\` header.
- **Key Rotation**: Dual-key rollover mechanism allows zero-downtime key rotation with 48-hour deprecation grace periods.
- **IP Allowlisting**: Configurable in Developer Dashboard; CIDR blocks supported for enterprise endpoints.

## 2. Rate Limits & Throttling
- **Developer Sandbox Tier**: 120 requests/minute with 1,000 daily maximum.
- **Standard Business Tier**: 2,500 requests/minute with burst capacity up to 5,000 req/min for 30 seconds.
- **Enterprise Dedicated Tier**: 10,000+ requests/minute with custom dedicated rate ceiling.
- **Rate Limit Response Headers**:
  - \`X-RateLimit-Limit\`: Total allowed requests in current window.
  - \`X-RateLimit-Remaining\`: Remaining requests available.
  - \`X-RateLimit-Reset\`: Unix timestamp when quota resets.
- HTTP Status \`429 Too Many Requests\` returned with retry-after header when ceiling is hit.

## 3. Webhook Delivery & Retry Matrix
- **Signature Verification**: Every webhook payload includes \`X-Signature-SHA256\` computed using HMAC-SHA256 with the customer secret.
- **Retry Schedule**: Exponential backoff on non-2xx HTTP responses:
  - Attempt 1: Immediate
  - Attempt 2: 5 minutes later
  - Attempt 3: 15 minutes later
  - Attempt 4: 1 hour later
  - Attempt 5: 6 hours later
  - Final Attempt 6: 24 hours later before dead-letter quarantine.`
  },
  {
    id: 'doc-support-escalations',
    title: 'Customer Care Matrix, Severity Levels & Escalation Protocol',
    category: 'Support & Escalations',
    description: 'Incident severity definitions, response time SLAs, on-call engineer paging, and executive escalation paths.',
    tags: ['Support', 'Incidents', 'Severity', 'Escalation', 'Response Time'],
    content: `# Customer Support Protocol & Incident Escalation Matrix

## 1. Incident Severity Definitions & Response SLAs
- **Severity 1 (Critical Outage)**:
  - Definition: Core production services completely inaccessible or severe data loss event impacting all users.
  - First Response SLA: <= 15 minutes (24/7/365 coverage).
  - Status Updates: Every 30 minutes until resolution.
  - Action: Automatically pages Tier 3 on-call principal engineer and notifies Incident Commander.

- **Severity 2 (Major Degradation)**:
  - Definition: Key features degraded or significant latency increase; workaround is available.
  - First Response SLA: <= 1 hour (24/7/365).
  - Status Updates: Every 2 hours.

- **Severity 3 (Minor Defect / Operational Inquiry)**:
  - Definition: Non-critical feature bug, UI cosmetic issue, or general technical inquiry.
  - First Response SLA: <= 4 business hours.

## 2. Live Agent Routing & Voice Bot Hand-off
- The AI Voice Bot will immediately route to a live human tier-2 engineer under the following trigger conditions:
  1. Customer explicitly utters phrases like "speak to a human", "connect to agent", or "transfer me".
  2. Detected high customer frustration sentiment score over 2 consecutive turns.
  3. Security incident or data breach report keywords detected.
- During hand-off, the Voice Bot packages the entire conversation transcript, vector retrieval history, and customer metadata to the incoming agent console.`
  }
];
