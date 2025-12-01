# Snowlion - Project Background & Roadmap

## Company Vision

Snowlion is building an agentic AI SaaS platform for the Norwegian sub-contractor market, focused on eliminating documentation burden and compliance overhead.

### Core Value Proposition

**"Zero Documentation Burden"** - Eliminating 85-100% of compliance overhead and documentation work through AI automation, delivering 45-76% total cost reduction for sub-contractors.

---

## Target Market

### Industries

| Industry | Notes |
|----------|-------|
| **Upstream Energy** | Power infrastructure, storage solutions |
| **Defence** | Norwegian defence + buyback programs |
| **Shipbuilding** | West coast of Norway |
| **Datacenter Construction** | NOK 90B+ investment boom |

### Target Customers

- Mid-tier Norwegian sub-contractors (NOK 500M-2B revenue)
- Companies burdened by compliance requirements: NORSOK, AQAP-2110, Tier III/IV standards
- High labor cost environments (NOK 400-650/hour) where AI automation is economically compelling

---

## The Problem

Sub-contractors in these industries face massive documentation and compliance overhead:

- Complex regulatory standards (NORSOK, AQAP-2110, Tier III/IV)
- Manual document processing and transformation
- Bill of Materials (BOM) creation from technical documents
- Significant time spent on non-value-adding compliance work

---

## MVP: Document to BOM Converter

### Purpose

Validate the market hypothesis by offering a focused, high-value AI tool that demonstrates immediate ROI.

### What It Does

- Takes technical documents as input
- Uses generative AI (Azure OpenAI) to extract and structure data
- Outputs formatted Bill of Materials (BOM)

### Distribution Strategy

| Element | Approach |
|---------|----------|
| **Model** | Freemium for Norwegian sub-contractors |
| **Trial Period** | 1-2 weeks of free access |
| **Landing Page** | Built separately (Lovable) for lead capture |
| **Feedback Loop** | In-app collection of feature requests |

---

## Technical Requirements

### 1. Access Control & Cost Protection

- **Problem**: Azure OpenAI consumption costs must be protected from abuse
- **Solution**: User authentication + usage quotas

### 2. User Authentication

- Email-based signup with verification
- Only registered users can access the tool
- Captures lead information automatically

### 3. Usage Tracking & Limits

- Per-user quotas (e.g., 10 documents/week for freemium)
- Track consumption for cost monitoring
- Auto-expire trial after 1-2 weeks

### 4. Lead Capture

Required information:
- Email
- Company name
- Industry sector
- Company size (optional)

### 5. Feedback Collection

Capture product development input:
- "What other documents would you like AI to process automatically?"
- "What other processes could AI agents help with?"

### 6. Bot Prevention

- Email verification (primary)
- Rate limiting
- Optional: CAPTCHA for suspicious activity

---

## Architecture Overview

```
┌─────────────────────┐
│   Landing Page      │
│   (Lovable)         │
│   - Marketing       │
│   - Lead capture    │
│   - App link        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   Snowlion App      │────▶│   Azure OpenAI      │
│   - Auth            │     │   - GPT-4           │
│   - Doc upload      │     │   - Document AI     │
│   - BOM generation  │     └─────────────────────┘
│   - Feedback forms  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Database          │
│   - Users/Leads     │
│   - Usage logs      │
│   - Feedback        │
│   - Trial status    │
└─────────────────────┘
```

---

## Suggested Tech Stack

| Component | Recommendation | Rationale |
|-----------|---------------|-----------|
| **Backend** | Node.js / Python | Simple, fast to build |
| **Auth** | Supabase Auth | Free tier, includes DB, easy setup |
| **Database** | Supabase (PostgreSQL) | Integrated with auth, free tier |
| **AI** | Azure OpenAI | Already planned, enterprise-grade |
| **File Storage** | Azure Blob / Supabase Storage | For uploaded documents |
| **Hosting** | Azure App Service | Already have deployment workflow |

---

## Implementation Roadmap

### Phase 1: Foundation

- [ ] Set up database schema (users, usage, feedback)
- [ ] Implement authentication (email signup + verification)
- [ ] Create usage tracking and quota system
- [ ] Build basic API structure

### Phase 2: Core MVP

- [ ] Document upload functionality
- [ ] Azure OpenAI integration
- [ ] BOM generation logic
- [ ] Output formatting and download

### Phase 3: Feedback & Analytics

- [ ] In-app feedback form
- [ ] Admin dashboard for viewing leads
- [ ] Usage analytics
- [ ] Trial expiration logic

### Phase 4: Polish & Launch

- [ ] Error handling and edge cases
- [ ] Rate limiting and abuse prevention
- [ ] Integration with landing page (Lovable)
- [ ] Beta testing with target customers

---

## Database Schema (Draft)

### Users Table

```sql
users (
  id            UUID PRIMARY KEY
  email         VARCHAR UNIQUE NOT NULL
  company_name  VARCHAR
  industry      VARCHAR  -- energy, defence, shipbuilding, datacenter
  created_at    TIMESTAMP
  trial_ends_at TIMESTAMP
  is_active     BOOLEAN
)
```

### Usage Table

```sql
usage_logs (
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users
  action      VARCHAR  -- 'document_upload', 'bom_generated'
  tokens_used INTEGER
  created_at  TIMESTAMP
)
```

### Feedback Table

```sql
feedback (
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users
  document_types  TEXT  -- "What other docs would you like processed?"
  process_ideas   TEXT  -- "What other processes could AI help with?"
  general_notes   TEXT
  created_at      TIMESTAMP
)
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Freemium signups | 50+ in first month |
| Trial → Contact conversion | 20%+ |
| Feedback submissions | 30%+ of users |
| Docs processed per user | 5+ during trial |

---

## Open Questions

1. **Trial duration**: 1 week or 2 weeks?
2. **Usage limits**: How many documents per week for freemium?
3. **Supported document formats**: PDF only? Word? Excel?
4. **BOM output format**: Excel? CSV? JSON? PDF?

---

## Next Steps

Ready to start implementing. Priorities:

1. **Database & Auth** - Foundation for everything else
2. **Core document processing** - The actual value proposition
3. **Feedback capture** - Product development insights

---

*Document created: 2025-12-01*
*Last updated: 2025-12-01*
