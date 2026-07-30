# Inventory Service Deployment Guide

## Setup
Install packages:
```bash
npm install
```

## Run Local
Requires DynamoDB Local on port 8000:
```bash
npx serverless offline start
```

## Cloud Deploy
```bash
npx serverless deploy --stage dev
```
