# 🛍️ Serverless E-Commerce Platform (v2)

Welcome to the **Serverless E-Commerce Platform (v2)**—a production-grade, highly scalable, and completely serverless full-stack web application. It features a modern Single Page Application (SPA) frontend and a modular backend built on a cloud-native microservices architecture using AWS Lambda, Amazon DynamoDB, AWS API Gateway, and managed infrastructure provisioned via Terraform.

---

## 🏗️ System Architecture

This project is split into two primary areas:
1. **Frontend**: A modern, responsive dashboard and shopping experience built with React and Vite.
2. **Backend**: Six decoupled, single-responsibility microservices running on AWS Lambda with dedicated Amazon DynamoDB tables for each service, fronted by an API Gateway.

### 📐 Architectural Overview

```mermaid
graph TD
    %% Frontend Group
    subgraph Client & CDN
        User([Customer / Admin]) -->|HTTPS| CF[CloudFront CDN]
        CF -->|Fetch Web Assets| S3_FE[S3 Frontend Bucket]
    end

    %% Routing
    User -->|API Requests| APIGW[AWS API Gateway]

    %% Microservices Group
    subgraph Microservices Backend
        APIGW -->|/products| Lambda_Prod[Product Lambda]
        APIGW -->|/cart| Lambda_Cart[Cart Lambda]
        APIGW -->|/inventory| Lambda_Inv[Inventory Lambda]
        APIGW -->|/wishlist| Lambda_Wish[Wishlist Lambda]
        APIGW -->|/payments| Lambda_Pay[Payment Lambda]
        APIGW -->|/orders| Lambda_Order[Order Lambda]

        %% Cross Service Calls
        Lambda_Order -->|Invokes| Lambda_Inv
        Lambda_Order -->|Invokes| Lambda_Pay
        Lambda_Order -->|Publishes Events| SNS_Topic[SNS Order Events Topic]
    end

    %% Database Group
    subgraph Amazon DynamoDB (NoSQL)
        Lambda_Prod --> DB_Prod[(product-table)]
        Lambda_Cart --> DB_Cart[(cart-table)]
        Lambda_Inv --> DB_Inv[(inventory-table)]
        Lambda_Wish --> DB_Wish[(wishlist-table)]
        Lambda_Pay --> DB_Pay[(payment-table)]
        Lambda_Order --> DB_Order[(order-table)]
    end

    %% Monitoring & Alerting
    subgraph Observability
        Lambda_Prod & Lambda_Cart & Lambda_Inv & Lambda_Wish & Lambda_Pay & Lambda_Order -.->|ADOT OTel Traces| CW_Trace[AWS X-Ray / CloudWatch]
        CW_Trace -.-> CW_Dash[CloudWatch Dashboard]
        CW_Dash -->|Alarms| SNS_Alerts[SNS Alerts Topic]
        SNS_Alerts --> Email[Email Notifications]
    end

    %% Styling
    classDef aws fill:#FF9900,stroke:#fff,stroke-width:2px,color:#fff;
    classDef db fill:#3F51B5,stroke:#fff,stroke-width:2px,color:#fff;
    classDef monitor fill:#4CAF50,stroke:#fff,stroke-width:2px,color:#fff;
    
    class APIGW,Lambda_Prod,Lambda_Cart,Lambda_Inv,Lambda_Wish,Lambda_Pay,Lambda_Order,SNS_Topic,CF,S3_FE aws;
    class DB_Prod,DB_Cart,DB_Inv,DB_Wish,DB_Pay,DB_Order db;
    class CW_Trace,CW_Dash,SNS_Alerts monitor;
```

---

## 🛠️ Technology Stack

### 💻 Frontend
- **Framework**: React 18+ (bootstrapped with Vite)
- **Routing**: React Router DOM (v6)
- **State Management**: React Context API (Cart and Wishlist scopes)
- **Styling**: Vanilla CSS (highly polished custom utility tokens and fully responsive grids)
- **Testing**: Jest & React Testing Library (with custom Oxlint static analysis integration)

### ⚙️ Backend Microservices
- **Runtime**: Node.js 20+ / Node.js 22
- **Framework**: Clean Layered Architecture (Handler ➡️ Service ➡️ Repository pattern)
- **Deployment & Orchestration**: AWS Lambda & HTTP API Gateway proxy integration
- **Persistence**: Amazon DynamoDB
- **Validation**: Joi (schema enforcement for JSON payloads)
- **Observability**: AWS Distro for OpenTelemetry (ADOT) JavaScript Layer for automatic tracing and X-Ray mapping

### ⚙️ Infrastructure as Code (IaC)
- **Tool**: Terraform (v1.5.0+)
- **Provider**: AWS Provider (~> 5.0)
- **Design Patterns**:
  - **DRY Loop Declarations**: Table configurations are structured as dynamic local maps (`locals.tf`) and created via `for_each` loops (`dynamodb.tf`).
  - **Centralized Tagging**: Global tags (`Project`, `Environment`, `ManagedBy`) are configured once via provider `default_tags`.
  - **Multi-Dev Isolation**: Dynamically appends a developer suffix (`resource_owner`) to keep development databases and Lambda resources segregated.
  - **Monitoring Dashboards**: Auto-provisions custom CloudWatch metrics dashboards, metrics filters, system-wide alarms, and SNS-backed notifications.

### 🚀 CI/CD & Security Pipelines
- **CI/CD Platform**: GitHub Actions
- **Static Code Analysis**: SonarCloud (monitored via `sonar-project.properties`)
- **Vulnerability Scanning**: Snyk Security Scanning

---

## 📦 Repository Structure

The project code is organized as a monorepo containing front-end, backend, and infrastructure folders:

```text
ecommerce-v2/
├── .github/
│   └── workflows/                # 17 GitHub Action workflows for CI/CD, tests, and security scans
├── ecommerce-frontend/           # React + Vite client-side code
│   ├── src/
│   │   ├── components/           # Reusable components (e.g. ProtectedRoute)
│   │   ├── context/              # Context Providers (Cart, Wishlist)
│   │   ├── pages/                # Public, Customer, and Admin pages
│   │   ├── services/             # API connection and Authentication services
│   │   └── styles/               # Styling sheets and custom CSS variables
│   ├── package.json
│   └── vite.config.js
├── ecommerce-microservices/      # Node.js backend microservices
│   ├── cart-service/             # Cart operations
│   ├── inventory-service/        # Inventory and Stock Management
│   ├── order-service/            # Order Creation, Cancellation & Tracking
│   ├── payment-service/          # Mock payment processing
│   ├── product-service/          # Product catalog service
│   ├── wishlist-service/         # User wishlist management
│   └── terraform/                # Terraform configuration files (IaC)
├── sonar-project.properties      # SonarCloud static analysis config
└── README.md                     # This file
```

---

## 🧩 Microservices Catalog

Each microservice is built using the **Repository-Service Pattern** for separation of concerns:
- **Handler**: Parses incoming HTTP requests from API Gateway, manages payload schema validations, and prepares HTTP responses.
- **Service**: Processes business logic, maps entities, and coordinates database operations.
- **Repository**: Manages raw read/write logic to DynamoDB tables using the AWS SDK document client.

| Service | Dedicated Database | Purpose | Key API Routes |
|---|---|---|---|
| **Product** | `product-{owner}` | Manages catalog items | `POST /products`, `GET /products`, `GET /products/{id}`, `PUT /products/{id}` |
| **Cart** | `cart-{owner}` | Handles user shopping carts | `GET /cart/{userId}`, `POST /cart`, `PUT /cart`, `DELETE /cart` |
| **Inventory** | `inventory-{owner}`| Manages item stock levels | `GET /inventory`, `GET /inventory/{id}`, `POST /inventory/reduce` |
| **Wishlist** | `wishlist` | Manages wishlist items | `GET /wishlist`, `POST /wishlist`, `DELETE /wishlist/{id}` |
| **Payment** | `payment-{owner}` | Processes simulation payments | `ANY /payments`, `ANY /payments/{id}`, `ANY /payments/refund` |
| **Order** | `order-{owner}` | Orchestrates checkouts & tracking | `POST /orders`, `GET /orders/{id}`, `POST /orders/track`, `POST /orders/cancel` |

---

## ⚡ Local Development

### Prerequisites
- Node.js (v20 or v22)
- npm (v10+)
- AWS CLI (configured for deploy/run privileges)
- Terraform CLI (v1.5.0+)

### 1. Setup the Frontend
```bash
cd ecommerce-frontend
npm install
npm run dev
```
The client dashboard runs locally on [http://localhost:5173](http://localhost:5173).

#### Run Frontend Tests
```bash
npm test -- --watchAll=false
```

### 2. Setup Microservices locally
Each microservice is an independent Node.js package. Navigate into the desired microservice folder:
```bash
cd ecommerce-microservices/product-service
npm install
npm test
```

---

## ☁️ Infrastructure Deployment (IaC)

AWS resources are managed using Terraform. To deploy the infrastructure:

### 1. Configure variables
Navigate to the Terraform folder and create your custom variables configuration:
```bash
cd ecommerce-microservices/terraform
cp terraform.tfvars.example terraform.tfvars
```
Open `terraform.tfvars` and set the configuration values, paying close attention to:
* `resource_owner = "yourname"` (This suffix isolates your DynamoDB tables and resources from others in the same AWS account).

### 2. Run Terraform Lifecycle
```bash
# Initialize Terraform and download provider plug-ins
terraform init

# Generate and review the deployment plan
terraform plan

# Apply changes to deploy in AWS
terraform apply
```

Outputs will display API Gateway URLs, CloudFront distribution endpoints, and DynamoDB table identifiers.

---

## 🚀 CI/CD Pipeline & Workflows

This project incorporates **17 distinct GitHub Action Workflows** inside `.github/workflows/` to enforce code quality, security, and continuous delivery:

### Continuous Testing & Quality
- **Unit Test Runners**: Separate `.yml` workflows run automated Jest tests on every single push for the Frontend and all 6 backend services (`product-tests.yml`, `cart-tests.yml`, etc.).
- **SonarCloud Integration (`sonarcloud.yml`)**: Automates static code quality analysis and checks code health against quality gates.
- **Snyk Vulnerability Scan (`snyk.yml`)**: Automates dependency vulnerability and security checks on codebase pushes.

### Continuous Deployment (CD)
- **Frontend Deployment (`deploy-frontend.yml`)**: Triggers when changes are pushed to `ecommerce-frontend/**`. It builds the React application, uploads the build bundle to AWS S3, and invalidates the CloudFront CDN cache.
- **Backend Deployment (`deploy-{service}.yml`)**: Separate workflows for each microservice trigger after their respective unit tests pass. These package the codebase dependencies into a deployment ZIP file and execute CLI commands to update the target AWS Lambda function code:
  ```bash
  aws lambda update-function-code --function-name <service> --zip-file fileb://<service>.zip
  ```

---

## 📈 Observability & Monitoring

The system features robust serverless logging, metrics tracing, and alarms:
- **Tracing**: Active tracing is enabled across all Lambda handlers using **AWS Distro for OpenTelemetry (ADOT)** layers. This reports execution spans and service maps to AWS X-Ray.
- **Monitoring**: Terraform provisions a unified dashboard containing graphs for:
  - API Gateway request counts and error rates.
  - Lambda execution durations, throttles, and error metrics.
  - DynamoDB read/write capacities and system errors.
- **Alarms**: High-priority CloudWatch alarms send alerts via Amazon SNS to notify engineering teams of execution spikes, resource throttling, or system-level failures.
