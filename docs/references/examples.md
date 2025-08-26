# Workflow Generation Examples

A collection of practical n8n workflow examples that can be generated, categorized by use case.

## Table of Contents

1. [Basic Workflows](#basic-workflows)
2. [AI & Machine Learning](#ai--machine-learning)
3. [Data Processing](#data-processing)
4. [Communication](#communication)
5. [Automation & Efficiency](#automation--efficiency)
6. [E-commerce & Business](#e-commerce--business)
7. [Developer Tools](#developer-tools)

---

## Basic Workflows

### 1. Hello World

The simplest workflow. Perfect for testing.

```markdown
### Workflow Name
hello-world

### Workflow Description
Simple workflow that receives webhook and returns "Hello World"

### Trigger Type
Webhook

### Data Flow Specification
1. Receive POST request
2. Add "Hello World" message
3. Return JSON response
```

**Generated Nodes**: Webhook → Set → Respond to Webhook

---

### 2. Scheduled Execution

Basic pattern for running tasks periodically.

```markdown
### Workflow Name
daily-backup

### Workflow Description
Backup database every day at 2 AM

### Trigger Type
Schedule/Cron

### Data Flow Specification
1. Trigger at 2:00 AM daily
2. Export database
3. Save to Google Drive
4. Send completion notification to Slack
```

**Generated Nodes**: Schedule Trigger → PostgreSQL → Google Drive → Slack

---

## AI & Machine Learning

### 3. AI Chatbot (Discord)

Advanced chatbot using GPT models.

```markdown
### Workflow Name
discord-ai-assistant

### Workflow Description
Discord Q&A bot using GPT with conversation history and context awareness.

### Trigger Type
Webhook

### Required Integrations
- Discord (message handling)
- OpenAI GPT (AI processing)
- PostgreSQL (conversation history)

### Data Flow Specification
1. Receive message from Discord
2. Fetch conversation history by user ID
3. Send to GPT with context
4. Send response to Discord
5. Save conversation to database

### Required Features
[x] Error Handling
[x] Rate Limiting
[x] Logging/Audit Trail
```

**Generated Nodes**: Discord Trigger → Database → OpenAI → Discord → Database

---

### 4. Image Analysis

AI-powered image recognition and processing.

```markdown
### Workflow Name
image-analyzer

### Workflow Description
Analyze uploaded images for content, text extraction, and moderation

### Trigger Type
Webhook

### Required Integrations
- AWS S3 (storage)
- OpenAI Vision (image analysis)
- Google Cloud Vision (OCR)

### Data Flow Specification
1. Receive image upload
2. Store in S3
3. Analyze with AI
4. Extract text if present
5. Return analysis results
```

---

## Data Processing

### 5. ETL Pipeline

Extract, Transform, Load data between systems.

```markdown
### Workflow Name
sales-etl-pipeline

### Workflow Description
Daily ETL process for sales data synchronization

### Trigger Type
Schedule/Cron

### Required Integrations
- PostgreSQL (source)
- MongoDB (destination)
- Redis (caching)

### Data Flow Specification
1. Extract sales data from PostgreSQL
2. Transform data format
3. Validate and clean data
4. Load into MongoDB
5. Update cache in Redis
6. Send summary report
```

---

### 6. CSV Processing

Automated CSV file processing and transformation.

```markdown
### Workflow Name
csv-processor

### Workflow Description
Process uploaded CSV files and import to database

### Trigger Type
Webhook

### Data Flow Specification
1. Receive CSV file upload
2. Parse and validate CSV
3. Transform data format
4. Check for duplicates
5. Insert into database
6. Generate processing report
```

---

## Communication

### 7. Multi-channel Notification

Send notifications across multiple platforms.

```markdown
### Workflow Name
multi-channel-alert

### Workflow Description
Send critical alerts to multiple communication channels

### Trigger Type
Webhook

### Required Integrations
- Slack
- Discord
- Email (SendGrid)
- SMS (Twilio)

### Data Flow Specification
1. Receive alert trigger
2. Format message for each platform
3. Send to Slack channel
4. Post to Discord
5. Send email notification
6. Send SMS for critical alerts
```

---

### 8. Email Campaign

Automated email marketing campaign.

```markdown
### Workflow Name
email-campaign

### Workflow Description
Automated drip email campaign for new subscribers

### Trigger Type
Webhook

### Required Integrations
- Mailchimp
- PostgreSQL
- Google Analytics

### Data Flow Specification
1. New subscriber webhook
2. Add to database
3. Add to Mailchimp list
4. Schedule email sequence
5. Track engagement
6. Update subscriber status
```

---

## Automation & Efficiency

### 9. Invoice Processing

Automated invoice generation and processing.

```markdown
### Workflow Name
invoice-automation

### Workflow Description
Generate and send invoices automatically

### Trigger Type
Schedule/Cron

### Required Integrations
- QuickBooks
- PDF Generator
- SendGrid

### Data Flow Specification
1. Fetch pending invoices
2. Generate PDF invoices
3. Send via email
4. Update invoice status
5. Log in accounting system
```

---

### 10. Social Media Scheduler

Automated social media posting.

```markdown
### Workflow Name
social-media-scheduler

### Workflow Description
Schedule and post content across social platforms

### Trigger Type
Schedule/Cron

### Required Integrations
- Twitter/X
- LinkedIn
- Facebook
- Instagram

### Data Flow Specification
1. Fetch scheduled posts from database
2. Format for each platform
3. Post to Twitter
4. Post to LinkedIn
5. Post to Facebook
6. Update post status
```

---

## E-commerce & Business

### 11. Order Processing

Complete e-commerce order workflow.

```markdown
### Workflow Name
order-processor

### Workflow Description
Process new orders from checkout to fulfillment

### Trigger Type
Webhook

### Required Integrations
- Shopify
- Stripe
- Shipping API
- Email

### Data Flow Specification
1. Receive new order webhook
2. Process payment via Stripe
3. Create shipping label
4. Update inventory
5. Send confirmation email
6. Update order status
```

---

### 12. Customer Support Ticket

Automated support ticket routing.

```markdown
### Workflow Name
support-ticket-router

### Workflow Description
Automatically categorize and route support tickets

### Trigger Type
Webhook

### Required Integrations
- Zendesk
- OpenAI (categorization)
- Slack

### Data Flow Specification
1. Receive new ticket
2. Analyze with AI for category
3. Assign priority level
4. Route to appropriate team
5. Send Slack notification
6. Create ticket in Zendesk
```

---

## Developer Tools

### 13. CI/CD Pipeline

Automated deployment pipeline.

```markdown
### Workflow Name
deployment-pipeline

### Workflow Description
Automated deployment when code is pushed to main

### Trigger Type
Webhook

### Required Integrations
- GitHub
- Docker
- AWS

### Data Flow Specification
1. Receive GitHub push webhook
2. Run tests
3. Build Docker image
4. Push to registry
5. Deploy to AWS
6. Send deployment notification
```

---

### 14. Error Monitoring

Automated error tracking and alerting.

```markdown
### Workflow Name
error-monitor

### Workflow Description
Monitor application errors and alert developers

### Trigger Type
Webhook

### Required Integrations
- Sentry
- Slack
- PagerDuty

### Data Flow Specification
1. Receive error webhook
2. Analyze error severity
3. Check error frequency
4. Send Slack alert
5. Create PagerDuty incident if critical
6. Log to database
```

---

### 15. API Health Check

Monitor API endpoints and alert on failures.

```markdown
### Workflow Name
api-health-monitor

### Workflow Description
Regular health checks of critical API endpoints

### Trigger Type
Schedule/Cron

### Data Flow Specification
1. Run every 5 minutes
2. Check multiple endpoints
3. Measure response time
4. Verify response format
5. Alert if failure detected
6. Update status dashboard
```

---

## Advanced Examples

### 16. Machine Learning Pipeline

Complete ML workflow from data to prediction.

```markdown
### Workflow Name
ml-prediction-pipeline

### Workflow Description
End-to-end ML pipeline for predictions

### Trigger Type
Webhook

### Required Integrations
- AWS S3
- Python (ML models)
- PostgreSQL

### Data Flow Specification
1. Receive prediction request
2. Fetch relevant data
3. Preprocess data
4. Run ML model
5. Post-process results
6. Store predictions
7. Return results
```

---

### 17. Document Processing

Intelligent document processing system.

```markdown
### Workflow Name
document-processor

### Workflow Description
Extract and process information from documents

### Trigger Type
Webhook

### Required Integrations
- Google Cloud Vision (OCR)
- OpenAI (extraction)
- PostgreSQL

### Data Flow Specification
1. Receive document upload
2. Perform OCR
3. Extract key information with AI
4. Validate extracted data
5. Store in database
6. Generate summary report
```

---

## Tips for Creating Custom Workflows

1. **Be Specific**: Clearly describe each step in the data flow
2. **Include Error Handling**: Specify what should happen when errors occur
3. **Consider Rate Limits**: Include rate limiting for external APIs
4. **Add Logging**: Request logging for debugging and audit trails
5. **Test Incrementally**: Start simple and add complexity gradually

---

*Need a custom workflow? Create an issue with your requirements!*