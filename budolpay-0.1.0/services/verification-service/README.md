# BudolPay KYC Verification Service (v40 Stabilization)

## Purpose
This service handles KYC document uploads and metadata persistence, now integrated with Cloudinary for persistent storage.

## Recent Changes
- Migrated from volatile Vercel `/tmp` storage to persistent Cloudinary storage.
- Implemented dynamic folder structure: `home/budolpay/kyc/<User Name> <Date> <Time>`.
- Added proxy support for the Admin app to route mobile uploads correctly.
- Hardened database connection and schema isolation.
