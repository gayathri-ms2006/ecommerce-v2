# Order Service Deployment Guide

## Setup
Install packages:
```bash
npm install
```

## Run Local
Requires DynamoDB Local on port 8000. Start:
```bash
npx serverless offline start
```
Note: Ensure other mock/offline services are configured on the expected endpoints.

## Cloud Deploy
```bash
npx serverless deploy --stage dev
```
