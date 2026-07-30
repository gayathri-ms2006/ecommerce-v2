# Product Service Deployment Guide

This guide details steps to deploy the Product Service locally and to AWS.

## Prerequisites
- Node.js 20+ installed
- AWS CLI configured with active credentials
- Serverless CLI installed (`npm install -g serverless`)

## Local Development
To run this service locally using Serverless Offline:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up DynamoDB Local (using Docker or local jar) on port 8000.
3. Start Serverless Offline:
   ```bash
   npx serverless offline start
   ```

## AWS Deployment
Deploy the service using the Serverless Framework CLI:

1. Deploy to default `dev` stage:
   ```bash
   npx serverless deploy
   ```
2. Deploy to a custom region and stage (e.g., production):
   ```bash
   npx serverless deploy --stage prod --region us-west-2
   ```

## Cleanup
To remove all deployed resources from AWS:
```bash
npx serverless remove --stage dev
```
