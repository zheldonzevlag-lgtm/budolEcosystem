# BudolPay Mobile Production Configuration
# =========================================

## Version
- **App Version**: 1.3.71
- **Last Updated**: 2026-03-02

## Production API Endpoints

### External URLs (Public Access via Internet ALB)

| Service | Production URL |
|---------|---------------|
| SSO (budolID) | `https://budolid.budol.duckdns.org` |
| budolPay Gateway | `https://api.budolpay.budol.duckdns.org` |
| budolShap | `https://budolshap.budol.duckdns.org` |
| WebSocket | `wss://wss.budol.duckdns.org` |

### Internal URLs (VPC Access via Internal ALB)

| Service | Internal URL |
|---------|--------------|
| budolPay Auth | `http://budolpay-auth.budol.internal:8001` |
| budolPay Wallet | `http://budolpay-wallet.budol.internal:8002` |
| budolPay Transaction | `http://budolpay-transaction.budol.internal:8003` |
| budolPay Payment | `http://budolpay-payment.budol.internal:8004` |
| budolPay KYC | `http://budolpay-kyc.budol.internal:8006` |
| budolPay Settlement | `http://budolpay-settlement.budol.internal:8007` |
| budolAccounting | `http://budolaccounting.budol.internal:8005` |

## Build Configuration

### For Android APK
```bash
# Production build with custom API host
flutter build apk --release \
  --dart-define=API_HOST=api.budolpay.budol.duckdns.org \
  --dart-define=GATEWAY_URL=https://api.budolpay.budol.duckdns.org
```

### For iOS
```bash
flutter build ios --release \
  --dart-define=API_HOST=api.budolpay.budol.duckdns.org \
  --dart-define=GATEWAY_URL=https://api.budolpay.budol.duckdns.org
```

### Using Custom Host
```bash
# Connect to a specific server
flutter run --dart-define=API_HOST=192.168.1.10

# Or use the gateway URL directly
flutter run --dart-define=GATEWAY_URL=http://192.168.1.10:8080
```

## Environment Variables Used by ApiService

| Variable | Description | Default |
|----------|-------------|---------|
| `API_HOST` | Server hostname or IP | `localhost` |
| `GATEWAY_URL` | Full gateway URL (overrides API_HOST) | `http://localhost:8080` |
| `AUTH_URL` | Auth service URL override | Auto-computed |

## WebSocket Configuration

The mobile app supports both Socket.io and Pusher for real-time updates:

### Socket.io
- **URL**: `wss://wss.budol.duckdns.org` (production)
- **Fallback**: `http://localhost:4000` (development)

### Pusher (Alternative)
- **Cluster**: `ap1`
- **Key**: Configured via backend system settings

## Amplify Deployment

The mobile web version is deployed on Amplify:
- **URL**: `https://budolpaymobile.duckdns.org`
- **Build Spec**: `amplify-budolpaymobile-buildspec.yml`

## Testing Production Build

1. **Health Check**: `curl https://api.budolpay.budol.duckdns.org/health`
2. **Auth Check**: `curl https://budolid.budol.duckdns.org/api/health`
3. **WebSocket**: `wscat -c wss://wss.budol.duckdns.org`

## Troubleshooting

### Connection Issues
1. Check if the device can reach the external URLs
2. Verify DNS resolution: `nslookup api.budolpay.budol.duckdns.org`
3. Test SSL: `openssl s_client -connect api.budolpay.budol.duckdns.org:443`

### WebSocket Issues
1. Check WebSocket connection with browser DevTools
2. Verify Pusher/Socket.io configuration in system settings
3. Check network/firewall rules

### Authentication Issues
1. Verify SSO service is accessible
2. Check JWT token expiration
3. Verify API keys match between services
