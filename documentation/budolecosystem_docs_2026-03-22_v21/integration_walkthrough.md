# BudolEcosystem v21 Integration Walkthrough

## 1. The 13-Service Engine
The system is now a perfect mirror of your local environment.

| Service | Port | Integration Role |
| :--- | :--- | :--- |
| **budol-id** | 8000 | Primary Identity Provider (Issuer of JWTs) |
| **budol-auth** | 8001 | Session Validator & Persistence |
| **budolpay-admin** | 3000 | Command Center for Payments & Logistics |
| **budol-shap** | 3001 | Main Consumer Portal (Marketplace) |
| **budolpay-gateway** | 8080 | Traffic Controller (Routes requests to sub-services) |
| **budol-accounting** | 8005 | Logistics Engine (Calculates Lalamove/Shipping fees) |
| **budol-pay** | 8004 | The "Bridge" to Paymongo / GCash APIs |

## 2. The Admin Handshake
The Admin Panel integrates via three main channels:
1. **API Channel**: Proxied through Port 8080.
2. **Event Channel**: Listening to Port 4000 (WebSocket) for new order alerts.
3. **Identity Channel**: Authenticating via Port 8000 (BudolID).

## 3. Verified Networking
All services share:
- **Security Group**: `sg-0ce5df1ba5bd90a2c` (Full Inter-service communication allowed)
- **Subnets**: `subnet-0dff713a9f3776f78`, `subnet-09034f591a2e8ef12`
- **Internal DNS**: `*.budol.internal` protocol.
