# 🛍️ Serverless E-Commerce Platform (v2)

A production-ready, serverless full-stack e-commerce application featuring a React frontend and modular AWS Lambda microservices backends.

🚀 **Live Deployment Link:** [https://d30dvwr72k2y05.cloudfront.net/](https://d30dvwr72k2y05.cloudfront.net/)

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Frontend Group
    subgraph "Client & CDN"
        User([Customer / Admin]) -->|HTTPS| CF[CloudFront CDN]
        CF -->|Fetch Web Assets| S3_FE[S3 Frontend Bucket]
    end

    %% Routing
    User -->|API Requests| APIGW[AWS API Gateway]

    %% Microservices Group
    subgraph "Microservices Backend"
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
    subgraph "Amazon DynamoDB (NoSQL)"
        Lambda_Prod --> DB_Prod[(product-table)]
        Lambda_Cart --> DB_Cart[(cart-table)]
        Lambda_Inv --> DB_Inv[(inventory-table)]
        Lambda_Wish --> DB_Wish[(wishlist-table)]
        Lambda_Pay --> DB_Pay[(payment-table)]
        Lambda_Order --> DB_Order[(order-table)]
    end

    %% Monitoring & Alerting
    subgraph "Observability"
        Lambda_Prod -.->|OTel Traces| CW_Trace[AWS X-Ray / CloudWatch]
        Lambda_Cart -.->|OTel Traces| CW_Trace
        Lambda_Inv -.->|OTel Traces| CW_Trace
        Lambda_Wish -.->|OTel Traces| CW_Trace
        Lambda_Pay -.->|OTel Traces| CW_Trace
        Lambda_Order -.->|OTel Traces| CW_Trace
        
        CW_Trace -.-> CW_Dash[CloudWatch Dashboard]
        CW_Dash -->|Alarms| SNS_Alerts[SNS Alerts Topic]
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

* **Frontend**: React (Vite), React Router v6, Context API, Vanilla CSS, Jest.
* **Backend Microservices**: Node.js, AWS Lambda (HTTP API Gateway proxy), Amazon DynamoDB, Joi schema validation.
* **Infrastructure as Code**: Terraform (Dynamic DRY mappings, CloudWatch dashboards, SNS alerting).
* **Observability**: AWS Distro for OpenTelemetry (ADOT) layer for Lambda tracing & X-Ray service maps.
* **CI/CD**: GitHub Actions (17 workflows for automated tests and deployments), SonarCloud, and Snyk security scans.

---

## 📦 Project Structure

```text
ecommerce-v2/
├── .github/workflows/         # CI/CD pipelines (unit testing & Lambda/S3 deploys)
├── ecommerce-frontend/        # React client application code
└── ecommerce-microservices/   # Backend services & Infrastructure definitions
    ├── cart-service/          # Shopping cart logic
    ├── inventory-service/     # Stock management logic
    ├── order-service/         # Checkout & Order processing logic
    ├── payment-service/       # Simulated checkout payment gateway
    ├── product-service/       # Catalog & Item management logic
    ├── wishlist-service/      # Wishlist operations logic
    └── terraform/             # AWS resources IaC configurations
```

---

## 🧩 Microservices Catalog

| Service | Route Base | Table Name | Purpose |
|---|---|---|---|
| **Product** | `/products` | `product-{owner}` | Catalog lookup & inventory details |
| **Cart** | `/cart` | `cart-{owner}` | Shopping cart storage |
| **Inventory**| `/inventory`| `inventory-{owner}`| Product stock availability |
| **Wishlist** | `/wishlist` | `wishlist` | User's favorite products list |
| **Payment** | `/payments` | `payment-{owner}` | simulated checkouts & refunds |
| **Order** | `/orders` | `order-{owner}` | Checkout coordination & tracking |

---

## ⚡ Setup & Deployment

### Local Development

#### 💻 Frontend client
```bash
cd ecommerce-frontend
npm install
npm run dev   # Runs on http://localhost:5173
npm test      # Run frontend unit tests
```

#### ⚙️ Microservices (e.g. Product Service)
```bash
cd ecommerce-microservices/product-service
npm install
npm test      # Run service unit tests
```

### ☁️ AWS Cloud Deployment (Terraform)
```bash
cd ecommerce-microservices/terraform
cp terraform.tfvars.example terraform.tfvars # Set your custom resource_owner value
terraform init
terraform plan
terraform apply
```
