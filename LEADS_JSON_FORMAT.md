# Lead JSON Format - Standard Way to Upload Leads

This is the **ONLY format** you need to use for uploading leads. Using this format prevents all backend issues and ensures consistency.

## Standard Format (COPY THIS)

```json
{
  "leads": [
    {
      "name": "Graham Wood",
      "first_name": "Graham",
      "email": "graham@shopik.io",
      "title": "CEO",
      "company": "Shopik",
      "industry": "IT Services",
      "location": "United States"
    },
    {
      "name": "Brian Murphy",
      "first_name": "Brian",
      "email": "brian@murphconsulting.com",
      "title": "Founder",
      "company": "Murph Consulting",
      "industry": "Automation Expert",
      "location": "New York"
    }
  ]
}
```

## Field Requirements

### 1. `name` (Required)
- **Type:** String
- **Example:** "Graham Wood", "John Smith"
- **Rules:** Full name required

### 2. `first_name` (Required)
- **Type:** String
- **Example:** "Graham", "John"
- **Rules:** Just first name for email personalization

### 3. `email` (Required)
- **Type:** String
- **Example:** "graham@shopik.io", "john@company.com"
- **Rules:** Valid email format (must have @domain)

### 4. `title` (Required)
- **Type:** String
- **Example:** "CEO", "Founder", "CTO", "VP of Sales"
- **Rules:** Must be decision-maker level (see qualification rules below)

### 5. `company` (Required)
- **Type:** String
- **Example:** "Shopik", "Murph Consulting"
- **Rules:** Exact company name

### 6. `industry` (Required)
- **Type:** String
- **Example:** "IT Services", "Automation Expert"
- **Rules:** Must match one of supported industries (see list below)

### 7. `location` (Required)
- **Type:** String
- **Example:** "New York", "San Francisco, California"
- **Rules:** City, state or just city

## Supported Industries (Use Exactly These)

```
1. IT Services
2. Automation Expert
3. Voice Agents
4. n8n
5. Make
6. Zapier
7. No-Code
8. Marketing & Advertising
9. Technology
```

### Why This Matters
The industry field matches to pain points and sales hooks. Using exact industry names ensures:
- ✅ Correct pain point sent
- ✅ Correct sales hook sent
- ✅ Lead properly qualified
- ❌ Wrong industry = wrong message = low response

## Decision-Maker Titles (What Qualifies)

These titles **WILL** qualify:
- CEO
- Founder
- Co-Founder
- President
- Owner
- CTO (Chief Technology Officer)
- COO (Chief Operating Officer)
- CFO (Chief Financial Officer)
- VP (Vice President)
- Director
- Managing Director
- Partner
- Principal

These titles **WILL NOT** qualify:
- Manager
- Senior Manager
- Team Lead
- Specialist
- Coordinator
- Associate
- Analyst
- Representative
- Support
- Junior anything

## Complete Example (100 Leads)

Here's a template you can use for 100 leads. Just copy, paste, and fill in:

```json
{
  "leads": [
    {
      "name": "First Last",
      "first_name": "First",
      "email": "first@company.com",
      "title": "CEO",
      "company": "Company Name",
      "industry": "IT Services",
      "location": "City, State"
    },
    {
      "name": "Name Two",
      "first_name": "Name",
      "email": "name@company2.com",
      "title": "Founder",
      "company": "Company Two",
      "industry": "Automation Expert",
      "location": "City"
    }
    // ... add 98 more leads like this
  ]
}
```

## Validation Rules

**System will reject if:**
- ❌ Missing any required field
- ❌ Email format invalid (no @)
- ❌ Title not decision-maker level
- ❌ Industry not in supported list
- ❌ Empty fields
- ❌ Invalid JSON syntax

**System will accept but may not qualify:**
- ⚠️ Misspelled industry
- ⚠️ Junior level title
- ⚠️ Generic domain email

## How to Prepare Your CSV to JSON

If you have a CSV, convert to JSON using this mapping:

```
CSV Column → JSON Field
"First Name" "Last Name" → "name" (combine: First Last)
"First Name" → "first_name"
"Email" → "email"
"Job Title" → "title"
"Company" → "company"
"Industry" → "industry" (may need to map/normalize)
"City" → "location"
```

## Excel to JSON Generator

Use this formula in Excel to generate JSON:

```
="{\n  ""name"": """ & A2 & " " & B2 & """,\n  ""first_name"": """ & A2 & """,\n  ""email"": """ & C2 & """,\n  ""title"": """ & D2 & """,\n  ""company"": """ & E2 & """,\n  ""industry"": """ & F2 & """,\n  ""location"": """ & G2 & """\n},"
```

Then combine all rows and wrap with:
```
{
  "leads": [
    // paste all generated JSON objects
  ]
}
```

## Common Mistakes to Avoid

### ❌ Wrong Format
```json
{
  "lead1": { "name": "John" },  // Don't use individual keys
  "lead2": { "name": "Jane" }
}
```
**Fix:** Use `"leads": [...]` array format

### ❌ Missing first_name
```json
{
  "name": "John Smith",
  "email": "john@company.com"
  // ... missing other fields
}
```
**Fix:** Include all 7 required fields

### ❌ Wrong industry
```json
{
  "industry": "Tech"  // Should be "Technology"
}
```
**Fix:** Use exact industry from supported list

### ❌ Invalid email
```json
{
  "email": "john.company.com"  // Missing @
}
```
**Fix:** Include @ symbol

### ❌ Junior title
```json
{
  "title": "Marketing Manager"  // Won't qualify
}
```
**Fix:** Only upload decision-makers (CEO, Founder, VP, etc.)

## Workflow to Use

### Daily Process
1. **Gather Leads** - Get your 100 leads from Apollo, LinkedIn, etc.
2. **Extract to CSV** - Export with: name, email, title, company, industry, location
3. **Generate JSON** - Use Excel formula or online converter
4. **Upload** - Paste in dashboard
5. **Done** - System handles rest

### Time Required
- Leads gathering: 30 mins (your responsibility)
- JSON conversion: 5 mins (automated or formula)
- Upload to dashboard: 30 seconds
- **Total: ~35 minutes per 100 leads**

## API Response When You Upload

You'll get back:
```json
{
  "success": true,
  "summary": {
    "total": 100,
    "successCount": 45,
    "failureCount": 0,
    "qualified": 45
  },
  "results": [
    {
      "email": "graham@shopik.io",
      "status": "email_sent",
      "score": 92,
      "messageId": "123456"
    }
  ]
}
```

This shows:
- Total leads processed
- How many qualified + got emails
- Qualification score for each
- Email message ID (for tracking)

## Testing

### Test Lead #1 (Should qualify)
```json
{
  "leads": [{
    "name": "Test CEO",
    "first_name": "Test",
    "email": "your-test@gmail.com",
    "title": "CEO",
    "company": "Test Inc",
    "industry": "Technology",
    "location": "New York"
  }]
}
```

### Test Lead #2 (Should NOT qualify)
```json
{
  "leads": [{
    "name": "Test Manager",
    "first_name": "Test",
    "email": "test@gmail.com",
    "title": "Manager",
    "company": "Test Inc",
    "industry": "Technology",
    "location": "New York"
  }]
}
```

## Support

If you get errors:
1. Check JSON syntax at jsonlint.com
2. Verify all 7 fields present
3. Check industry spelling
4. Verify title is decision-maker level
5. Confirm email format valid

---

**This is the standard format. Always use this. No variations. No custom fields.**

Consistency = No backend issues = System works smoothly
