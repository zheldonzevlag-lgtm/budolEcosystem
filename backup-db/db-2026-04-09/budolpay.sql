--
-- PostgreSQL database dump
--

\restrict CChKViO70ieNa3nneWXTscl1L0YFjUmMKgcd2hNZ7D1XJnSTNGjK8MbcdedyRWT

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Wallet" DROP CONSTRAINT IF EXISTS "Wallet_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."VerificationDocument" DROP CONSTRAINT IF EXISTS "VerificationDocument_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_settlementId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_senderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_receiverId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_appId_fkey";
ALTER TABLE IF EXISTS ONLY public."LedgerEntry" DROP CONSTRAINT IF EXISTS "LedgerEntry_accountId_fkey";
ALTER TABLE IF EXISTS ONLY public."FavoriteRecipient" DROP CONSTRAINT IF EXISTS "FavoriteRecipient_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."FavoriteRecipient" DROP CONSTRAINT IF EXISTS "FavoriteRecipient_recipientId_fkey";
ALTER TABLE IF EXISTS ONLY public."Dispute" DROP CONSTRAINT IF EXISTS "Dispute_transactionId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequest" DROP CONSTRAINT IF EXISTS "ChangeRequest_makerId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequest" DROP CONSTRAINT IF EXISTS "ChangeRequest_checkerId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
DROP INDEX IF EXISTS public."Wallet_userId_key";
DROP INDEX IF EXISTS public."VerificationDocument_userId_idx";
DROP INDEX IF EXISTS public."User_phoneNumber_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."Transaction_storeId_idx";
DROP INDEX IF EXISTS public."Transaction_settlementId_idx";
DROP INDEX IF EXISTS public."Transaction_senderId_idx";
DROP INDEX IF EXISTS public."Transaction_referenceId_key";
DROP INDEX IF EXISTS public."Transaction_referenceId_idx";
DROP INDEX IF EXISTS public."Transaction_receiverId_idx";
DROP INDEX IF EXISTS public."SystemSetting_key_key";
DROP INDEX IF EXISTS public."Settlement_merchantId_idx";
DROP INDEX IF EXISTS public."Session_token_key";
DROP INDEX IF EXISTS public."RateLimit_key_key";
DROP INDEX IF EXISTS public."RateLimit_key_idx";
DROP INDEX IF EXISTS public."RateLimit_expiresAt_idx";
DROP INDEX IF EXISTS public."LedgerEntry_transactionId_idx";
DROP INDEX IF EXISTS public."LedgerEntry_referenceId_idx";
DROP INDEX IF EXISTS public."LedgerEntry_accountId_idx";
DROP INDEX IF EXISTS public."FavoriteRecipient_userId_recipientId_key";
DROP INDEX IF EXISTS public."FavoriteRecipient_userId_idx";
DROP INDEX IF EXISTS public."EcosystemApp_name_key";
DROP INDEX IF EXISTS public."EcosystemApp_apiSecret_key";
DROP INDEX IF EXISTS public."EcosystemApp_apiKey_key";
DROP INDEX IF EXISTS public."Dispute_transactionId_key";
DROP INDEX IF EXISTS public."ChartOfAccount_code_key";
DROP INDEX IF EXISTS public."ChangeRequest_status_idx";
DROP INDEX IF EXISTS public."ChangeRequest_makerId_idx";
DROP INDEX IF EXISTS public."ChangeRequest_entity_entityId_idx";
DROP INDEX IF EXISTS public."ChangeRequest_checkerId_idx";
DROP INDEX IF EXISTS public."AuditLog_userId_idx";
DROP INDEX IF EXISTS public."AuditLog_entity_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Wallet" DROP CONSTRAINT IF EXISTS "Wallet_pkey";
ALTER TABLE IF EXISTS ONLY public."VerificationDocument" DROP CONSTRAINT IF EXISTS "VerificationDocument_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_pkey";
ALTER TABLE IF EXISTS ONLY public."SystemSetting" DROP CONSTRAINT IF EXISTS "SystemSetting_pkey";
ALTER TABLE IF EXISTS ONLY public."Settlement" DROP CONSTRAINT IF EXISTS "Settlement_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."RateLimit" DROP CONSTRAINT IF EXISTS "RateLimit_pkey";
ALTER TABLE IF EXISTS ONLY public."LedgerEntry" DROP CONSTRAINT IF EXISTS "LedgerEntry_pkey";
ALTER TABLE IF EXISTS ONLY public."FavoriteRecipient" DROP CONSTRAINT IF EXISTS "FavoriteRecipient_pkey";
ALTER TABLE IF EXISTS ONLY public."EcosystemApp" DROP CONSTRAINT IF EXISTS "EcosystemApp_pkey";
ALTER TABLE IF EXISTS ONLY public."Dispute" DROP CONSTRAINT IF EXISTS "Dispute_pkey";
ALTER TABLE IF EXISTS ONLY public."ChartOfAccount" DROP CONSTRAINT IF EXISTS "ChartOfAccount_pkey";
ALTER TABLE IF EXISTS ONLY public."ChangeRequest" DROP CONSTRAINT IF EXISTS "ChangeRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."Wallet";
DROP TABLE IF EXISTS public."VerificationDocument";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Transaction";
DROP TABLE IF EXISTS public."SystemSetting";
DROP TABLE IF EXISTS public."Settlement";
DROP TABLE IF EXISTS public."Session";
DROP TABLE IF EXISTS public."RateLimit";
DROP TABLE IF EXISTS public."LedgerEntry";
DROP TABLE IF EXISTS public."FavoriteRecipient";
DROP TABLE IF EXISTS public."EcosystemApp";
DROP TABLE IF EXISTS public."Dispute";
DROP TABLE IF EXISTS public."ChartOfAccount";
DROP TABLE IF EXISTS public."ChangeRequest";
DROP TABLE IF EXISTS public."AuditLog";
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."TransactionType";
DROP TYPE IF EXISTS public."TransactionStatus";
DROP TYPE IF EXISTS public."KYCTier";
DROP TYPE IF EXISTS public."KYCStatus";
DROP TYPE IF EXISTS public."DisputeStatus";
DROP TYPE IF EXISTS public."ChangeRequestStatus";
DROP TYPE IF EXISTS public."AccountType";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AccountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountType" AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);


--
-- Name: ChangeRequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChangeRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: DisputeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DisputeStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


--
-- Name: KYCStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KYCStatus" AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED',
    'NONE'
);


--
-- Name: KYCTier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KYCTier" AS ENUM (
    'BASIC',
    'SEMI_VERIFIED',
    'FULLY_VERIFIED'
);


--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionType" AS ENUM (
    'CASH_IN',
    'CASH_OUT',
    'P2P_TRANSFER',
    'MERCHANT_PAYMENT',
    'REFUND',
    'FEE'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'MERCHANT',
    'DRIVER',
    'STAFF',
    'DEACTIVATED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    entity text,
    "entityId" text,
    "oldValue" jsonb,
    "newValue" jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    city text,
    country text,
    device text,
    latitude text,
    longitude text,
    metadata jsonb
);


--
-- Name: ChangeRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChangeRequest" (
    id text NOT NULL,
    entity text NOT NULL,
    "entityId" text NOT NULL,
    details jsonb NOT NULL,
    "makerId" text NOT NULL,
    "checkerId" text,
    status public."ChangeRequestStatus" DEFAULT 'PENDING'::public."ChangeRequestStatus" NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ChartOfAccount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChartOfAccount" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type public."AccountType" NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Dispute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Dispute" (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    reason text NOT NULL,
    status public."DisputeStatus" DEFAULT 'OPEN'::public."DisputeStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);


--
-- Name: EcosystemApp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EcosystemApp" (
    id text NOT NULL,
    name text NOT NULL,
    "apiKey" text NOT NULL,
    "redirectUri" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "apiSecret" text NOT NULL
);


--
-- Name: FavoriteRecipient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FavoriteRecipient" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "recipientId" text NOT NULL,
    alias text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LedgerEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LedgerEntry" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "transactionId" text,
    "referenceId" text NOT NULL,
    description text NOT NULL,
    debit numeric(18,2) DEFAULT 0.0 NOT NULL,
    credit numeric(18,2) DEFAULT 0.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RateLimit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RateLimit" (
    id text NOT NULL,
    key text NOT NULL,
    hits integer DEFAULT 1 NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "appId" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Settlement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Settlement" (
    id text NOT NULL,
    "merchantId" text NOT NULL,
    amount numeric(18,2) NOT NULL,
    "feeDeducted" numeric(18,2) NOT NULL,
    "netAmount" numeric(18,2) NOT NULL,
    "periodStart" timestamp(3) without time zone NOT NULL,
    "periodEnd" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL
);


--
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SystemSetting" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "isSecret" boolean DEFAULT false NOT NULL,
    description text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "appId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "group" text,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    amount numeric(18,2) NOT NULL,
    type public."TransactionType" NOT NULL,
    status public."TransactionStatus" DEFAULT 'PENDING'::public."TransactionStatus" NOT NULL,
    description text,
    "senderId" text,
    "receiverId" text,
    "referenceId" text NOT NULL,
    fee numeric(18,2) DEFAULT 0.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "settlementId" text,
    metadata text,
    "storeId" text,
    "storeName" text
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "phoneNumber" text NOT NULL,
    "passwordHash" text NOT NULL,
    "firstName" text,
    "lastName" text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "kycStatus" public."KYCStatus" DEFAULT 'NONE'::public."KYCStatus" NOT NULL,
    "kycData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "avatarUrl" text,
    "biometricKeyId" text,
    "biometricPublicKey" bytea,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "faceTemplate" text,
    "isFaceVerified" boolean DEFAULT false NOT NULL,
    "kycTier" public."KYCTier" DEFAULT 'BASIC'::public."KYCTier" NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "otpCode" text,
    "otpExpiresAt" timestamp(3) without time zone,
    "phoneVerified" boolean DEFAULT false NOT NULL,
    "pinHash" text,
    "trustedDevices" text,
    department text,
    "otpUpdatedAt" timestamp(3) without time zone
);


--
-- Name: VerificationDocument; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VerificationDocument" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    "documentType" text NOT NULL,
    "faceTemplate" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "blobData" bytea,
    "remoteUrl" text,
    "ocrData" jsonb,
    rotation integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Wallet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wallet" (
    id text NOT NULL,
    "userId" text NOT NULL,
    balance numeric(18,2) DEFAULT 0.0 NOT NULL,
    currency text DEFAULT 'PHP'::text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "userId", action, entity, "entityId", "oldValue", "newValue", "ipAddress", "userAgent", "createdAt", city, country, device, latitude, longitude, metadata) FROM stdin;
e0342d20-6a89-4c56-853c-2956afc59b4f	\N	SECURITY_QUICK_REG_INIT	Security	a72f0a5e-d0f2-4f13-9efe-220b1aa5b970	null	null	::ffff:127.0.0.1	\N	2026-02-18 23:39:04.61	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
27ab37b2-5b6c-425b-a2d7-b2051efbc34c	\N	SECURITY_OTP_VERIFIED	Security	a72f0a5e-d0f2-4f13-9efe-220b1aa5b970	null	null	::ffff:127.0.0.1	\N	2026-02-18 23:39:06.657	\N	\N	\N	\N	\N	{"type": "SMS", "device": "jest-device-123", "status": "SUCCESS", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "timestamp": "2026-02-18T23:39:06.656Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
30308e5a-e4d0-4224-b45d-87b40a3a3883	\N	SECURITY_QUICK_REG_INIT	Security	ed754d35-1348-475f-8e41-0cfacc9d8bda	null	null	::ffff:127.0.0.1	\N	2026-02-18 23:54:08.412	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
c51aca57-2cb1-4f5a-bfbb-802fcdea4f2b	\N	SECURITY_QUICK_REG_INIT	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:22:49.522	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "dev_1771435703141_2268", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
580420a2-b5ce-4cff-8d7a-d2fc093c7156	\N	SECURITY_OTP_VERIFIED	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:23:23.357	\N	\N	\N	\N	\N	{"type": "REGISTRATION", "device": "dev_1771435703141_2268", "status": "SUCCESS", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T10:23:23.356Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
9e9b3c7c-ebc6-45e2-9515-2c42f8859162	b361327f-00ed-4214-9387-0668b77ecd0f	USER_LOGIN	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	192.168.1.2	\N	2026-02-22 14:56:45.006	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_BUDOLID", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
9465f66a-ad03-4b28-b59b-0fa27404b3a9	\N	SECURITY_MOBILE_PIN_SETUP	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:23:34.152	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T10:23:34.151Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
959228de-8eb9-4d31-810f-5b398c83845e	\N	SECURITY_LOGOUT	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:46:56.178	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T10:46:56.176Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
28d589bf-84c0-42ef-bb9d-75c05389a481	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:47:11.382	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
3e989ce7-b9dc-4476-971b-5c22c2171f6c	\N	SECURITY_QUICK_REG_INIT	Security	104b4531-58a5-494c-b00c-a97e60bbb655	null	null	::ffff:127.0.0.1	\N	2026-02-15 08:05:04.332	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
26485d94-5f0f-462c-9fcc-f0a174f5dcb5	\N	SECURITY_QUICK_REG_INIT	Security	6ad5374b-1af9-44a0-9f42-d88448c71176	null	null	::ffff:127.0.0.1	\N	2026-02-15 08:08:28.501	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
fdd44790-e72f-445b-9469-204fe238c338	\N	SECURITY_QUICK_REG_INIT	Security	5eaab140-2f1f-403c-aff4-9a20d305c955	null	null	::1	\N	2026-02-15 08:47:10.139	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "test-device-id-123", "deviceId": "test-device-id-123", "ipAddress": "::1", "userAgent": "node-fetch", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
a1a14918-45f5-4bde-b0b3-3b93b2105c5e	\N	SECURITY_OTP_VERIFIED	Security	5eaab140-2f1f-403c-aff4-9a20d305c955	null	null	::1	\N	2026-02-15 08:47:10.181	\N	\N	\N	\N	\N	{"type": "REGISTRATION", "device": "test-device-id-123", "status": "SUCCESS", "deviceId": "test-device-id-123", "ipAddress": "::1", "timestamp": "2026-02-15T08:47:10.179Z", "userAgent": "node-fetch", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e01ea798-fcb1-4375-96b3-cdd05ac99ddd	\N	SECURITY_QUICK_REG_INIT	Security	f3557892-8ade-4f6b-b979-3e131935b8e6	null	null	::ffff:127.0.0.1	\N	2026-02-15 08:03:05.336	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
bc281a7a-de4b-4f9e-a70f-a9eba35564ad	\N	SECURITY_QUICK_REG_INIT	Security	f224f58c-a852-4c43-b646-17dafda2fe1f	null	null	::ffff:127.0.0.1	\N	2026-02-15 08:05:04.255	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
273fa1a8-2123-4591-908e-308f3a5f4c02	\N	SECURITY_MOBILE_LOGIN_PIN	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:47:15.663	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T10:47:15.661Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
4c434852-d654-4ad6-bbf8-b7ac227ac527	\N	CASH_IN_COMPLETED	Financial	9fc4261b-bb7f-4176-a2a6-2e135366a2be	\N	{"type": "CASH_IN", "amount": 500.0, "provider": "7-Eleven", "referenceId": "CI-C9364837"}	\N	\N	2026-02-18 10:48:10.15	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-18T10:48:10.148Z", "compliance": "BSP Circular No. 808"}
7b8a41fe-525a-4e37-8155-b2818261fd05	b361327f-00ed-4214-9387-0668b77ecd0f	USER_LOGOUT	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	192.168.1.2	\N	2026-02-22 14:58:52.546	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.3"}}
05f5117c-7046-4bec-b2aa-d47d5fb0f614	b361327f-00ed-4214-9387-0668b77ecd0f	USER_LOGIN	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	192.168.1.2	\N	2026-02-22 14:58:56.268	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_BUDOLID", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
ff4c2429-eb0a-4cdb-96bf-f853ac5bb523	\N	CASH_IN_COMPLETED	Financial	62775aa2-ce63-4811-be14-bb8d7572a5df	\N	{"type": "CASH_IN", "amount": 500.0, "provider": "GCash", "referenceId": "CI-F1C45D90"}	\N	\N	2026-02-18 10:48:47.548	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-18T10:48:47.547Z", "compliance": "BSP Circular No. 808"}
1fc0a4c4-d64e-4881-912c-8e4c4dc2b140	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	9b6cba5b-22c4-4218-90ce-924cd906c609	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:10:37.008	\N	\N	\N	\N	\N	{"device": "dev_1772319636074_1665", "deviceId": "dev_1772319636074_1665", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
ad4c8d9d-8992-41fd-b3fc-830ed5209dd5	\N	SECURITY_OTP_VERIFIED	Security	9b6cba5b-22c4-4218-90ce-924cd906c609	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:11:01.207	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1772319636074_1665", "status": "SUCCESS", "deviceId": "dev_1772319636074_1665", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:11:01.205Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
99826919-eee0-49be-8500-b5128354f56c	\N	SECURITY_MOBILE_PIN_SETUP	Security	9b6cba5b-22c4-4218-90ce-924cd906c609	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:11:07.587	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:11:07.586Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
603455b0-e4e2-49d6-8bb4-7614d1dee864	\N	CASH_IN_COMPLETED	Financial	60a8c46e-1943-4904-9dec-b7c94dab5ad0	\N	{"type": "CASH_IN", "amount": 800.0, "provider": "Maya", "referenceId": "CI-38B19E26"}	\N	\N	2026-02-18 10:49:01.044	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-18T10:49:01.042Z", "compliance": "BSP Circular No. 808"}
fe993518-2184-44f4-adcb-aa4ccc07fc46	\N	CASH_IN_COMPLETED	Financial	d9dbfd45-79e6-43df-841a-adbd59c297cd	\N	{"type": "CASH_IN", "amount": 200.0, "provider": "BDO", "referenceId": "CI-7668BFFF"}	\N	\N	2026-02-18 10:49:15.451	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-18T10:49:15.449Z", "compliance": "BSP Circular No. 808"}
89793c70-8b56-4799-ae6d-169acb06f7dd	\N	CASH_IN_COMPLETED	Financial	f45dd09c-f4ea-4177-bf89-6867e36d627b	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "BPI", "referenceId": "CI-0A732456"}	\N	\N	2026-02-18 10:49:27.545	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-18T10:49:27.544Z", "compliance": "BSP Circular No. 808"}
50c3bda9-3ce6-4ff4-9013-72f568d23898	\N	CASH_IN_COMPLETED	Financial	cd39b4eb-f2f2-44b5-8676-3ae1dfc22d5b	\N	{"type": "CASH_IN", "amount": 100.0, "provider": "BPI", "referenceId": "CI-855828D3"}	\N	\N	2026-02-18 10:49:42.521	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-18T10:49:42.520Z", "compliance": "BSP Circular No. 808"}
bb392e5d-0f26-4033-805b-5e02688982a3	\N	CASH_IN_COMPLETED	Financial	2d0190c7-f6f7-43e8-86be-122d41e9b509	\N	{"type": "CASH_IN", "amount": 700.0, "provider": "UnionBank", "referenceId": "CI-9013BABA"}	\N	\N	2026-02-18 10:50:09.177	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-18T10:50:09.176Z", "compliance": "BSP Circular No. 808"}
b39487fc-838a-4848-9927-a61c6de1181c	\N	CASH_IN_COMPLETED	Financial	3f193e2d-0466-44ce-a5a0-f294b6040b95	\N	{"type": "CASH_IN", "amount": 300.0, "provider": "Over-the-Counter", "referenceId": "CI-A5C83DEC"}	\N	\N	2026-02-18 10:50:43.856	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-18T10:50:43.855Z", "compliance": "BSP Circular No. 808"}
5c1b626b-00bf-4d1e-9068-b860e74d9bc6	\N	SECURITY_LOGOUT	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.14	\N	2026-02-18 11:05:50.215	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T11:05:50.213Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
b09830cb-256e-4ebb-9527-e89e0c30336c	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	46fc3f9d-35d1-4639-a071-07cb7e654fc1	null	null	::1	\N	2026-02-15 11:56:22.682	\N	\N	\N	\N	\N	{"device": "test-device-v3.2.0", "deviceId": "test-device-v3.2.0", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
ada01d7c-8ed5-403a-88e8-35858ab2da0c	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	46fc3f9d-35d1-4639-a071-07cb7e654fc1	null	null	::1	\N	2026-02-15 11:56:58.976	\N	\N	\N	\N	\N	{"device": "test-device-v3.2.0", "deviceId": "test-device-v3.2.0", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
3741fd59-9e22-4362-9fec-949ae4760d5a	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	46fc3f9d-35d1-4639-a071-07cb7e654fc1	null	null	::1	\N	2026-02-15 11:57:42.418	\N	\N	\N	\N	\N	{"device": "test-device-v3.2.0", "deviceId": "test-device-v3.2.0", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
8de9c501-358f-4522-8b11-77eeda28b6f1	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	46fc3f9d-35d1-4639-a071-07cb7e654fc1	null	null	::1	\N	2026-02-15 11:58:40.836	\N	\N	\N	\N	\N	{"device": "test-device-v3.2.0", "deviceId": "test-device-v3.2.0", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
b8d89946-a536-444c-b4ca-8371833ed459	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	46fc3f9d-35d1-4639-a071-07cb7e654fc1	null	null	::1	\N	2026-02-18 22:48:51.912	\N	\N	\N	\N	\N	{"device": "test-device-v3.2.0", "deviceId": "test-device-v3.2.0", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
f2ce4196-ef50-4120-bf4b-3b129f160047	\N	SECURITY_QUICK_REG_INIT	Security	438cd58f-0dd8-47db-8add-d5b52ffe0d7c	null	null	::ffff:127.0.0.1	\N	2026-02-18 23:54:08.493	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e9efb3cf-1ffd-4485-929f-fab450190069	\N	SECURITY_OTP_VERIFIED	Security	438cd58f-0dd8-47db-8add-d5b52ffe0d7c	null	null	::ffff:127.0.0.1	\N	2026-02-18 23:54:08.507	\N	\N	\N	\N	\N	{"type": "SMS", "device": "jest-device-123", "status": "SUCCESS", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "timestamp": "2026-02-18T23:54:08.506Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1acb4b95-49ec-4bc9-8b13-215daca25f61	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:02:45.803	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
41c97d82-24dc-4640-aabc-5a000de629cd	\N	SECURITY_OTP_VERIFIED	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:02:57.107	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771435703141_2268", "status": "SUCCESS", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T10:02:57.105Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e8efaaac-feb6-446f-abd8-9fd968db9a73	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:03:01.265	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T10:03:01.263Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
26c44c66-1280-4da7-b241-44de5dad960b	\N	SECURITY_LOGOUT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.14	\N	2026-02-18 10:06:10.018	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T10:06:10.017Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
fcb1e148-b9c8-45cc-9914-a7b174f40954	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.14	\N	2026-02-18 11:06:04.607	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
a0479c12-45e5-4149-8fab-8d3d993fe732	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.14	\N	2026-02-18 11:06:08.587	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T11:06:08.586Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
f66e6d0c-7012-4f37-b536-49b7a6511861	\N	SECURITY_LOGOUT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.14	\N	2026-02-18 12:24:30.736	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T12:24:30.734Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
34e41262-1ad6-473f-8adc-556b05dc9da5	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.14	\N	2026-02-18 12:25:08	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
ce16ae75-f9a6-43db-9bb4-7b979fef5c7e	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.14	\N	2026-02-18 12:25:12.255	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T12:25:12.254Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
b34fa82c-6fcf-4d19-912a-9053c440b64c	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 20:57:15.078	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
3c988295-839f-49f2-bf86-c60c601e82dd	\N	SECURITY_OTP_VERIFIED	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 20:57:25.946	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1770229339355_4194", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T20:57:25.944Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
80d3df6c-115f-49bf-9b6f-b95c907626ea	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 20:57:29.465	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T20:57:29.464Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
2919c146-e89d-4272-9a8f-8033a8ee4a97	\N	PROFILE_UPDATE	User	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 20:58:33.093	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "changes": {"email": false, "lastName": true, "firstName": true}, "updated": {"email": "joseph@omsmpc.com", "lastName": "G*****", "firstName": "J*****"}, "previous": {"email": "joseph@omsmpc.com", "lastName": "Garcia", "firstName": "Joseph"}, "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
74ea006d-ebc3-44fa-a2be-7f4fbab6344e	\N	SECURITY_LOGOUT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 20:58:42.512	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T20:58:42.511Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
8d1a3d2d-2237-44d4-a279-894e0f20ef4f	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:01:49.947	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
93b86cec-c2b9-450d-ba57-84e45c708f8a	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:01:57.44	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:01:57.439Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
2651a707-7bda-480b-85b6-565c06e77290	\N	PROFILE_UPDATE	User	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:02:42.406	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "changes": {"email": false, "lastName": true, "firstName": true}, "updated": {"email": "joseph@omsmpc.com", "lastName": "Garcia", "firstName": "Joseph"}, "previous": {"email": "joseph@omsmpc.com", "lastName": "G*****", "firstName": "J*****"}, "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
dfcbe477-355c-4e00-9004-5a6b515da08b	\N	SECURITY_LOGOUT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:04:34.37	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:04:34.368Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
a0df31cd-3293-41bf-8832-4abf110d59af	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 08:06:49.847	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "authMethod": "SSO_BUDOLID", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
64d4147f-72ff-4d57-8501-985999625472	b361327f-00ed-4214-9387-0668b77ecd0f	USER_LOGIN	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	192.168.1.18	\N	2026-02-24 10:26:10.061	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_BUDOLID", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
a02ab15d-3cc6-41c5-8c3b-de31032237da	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:05:20.473	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
9e466657-4a84-45a8-bed4-6d425974b0dd	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:05:25.437	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:05:25.435Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
21002b43-1160-4519-9a7d-e08ed086a860	\N	CASH_IN_COMPLETED	Financial	c982a832-2d3f-4a50-b226-2af91a5b879c	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "GCash", "referenceId": "CI-87CE50C0"}	\N	\N	2026-02-28 15:12:07.381	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T15:12:07.379Z", "compliance": "BSP Circular No. 808"}
1a95903c-500c-4ca9-ace0-248a4d5e1cfe	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:16:15.757	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
7b5b3d65-fe96-415a-afe0-29c05298a5b5	\N	CASH_IN_COMPLETED	Financial	80a16ab0-545a-433f-a0d7-3a371e199f1a	\N	{"type": "CASH_IN", "amount": 200.0, "provider": "Maya", "referenceId": "CI-E4094939"}	\N	\N	2026-02-28 15:12:18.26	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T15:12:18.259Z", "compliance": "BSP Circular No. 808"}
ba8e7697-a83e-46a8-ac54-877374a6da54	b361327f-00ed-4214-9387-0668b77ecd0f	USER_LOGIN	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	192.168.1.10	\N	2026-02-28 15:14:07.812	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_BUDOLID", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
b98a5166-b4f9-4a2c-bb99-e8fe120aca0a	\N	SECURITY_QUICK_REG_INIT	Security	a68d8340-302c-4c4f-a4e6-30bd16c2929b	null	null	::ffff:127.0.0.1	\N	2026-02-15 08:03:05.504	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
73f8bb24-e362-4bab-bc7e-d275f76ac2ca	\N	SECURITY_QUICK_REG_INIT	Security	954fc322-d61f-4b8e-8838-1151d15d9d23	null	null	::ffff:127.0.0.1	\N	2026-02-15 08:08:28.426	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
7c92daa7-c61a-414b-bc71-20b533156032	\N	SECURITY_QUICK_REG_INIT	Security	839256c6-6a6a-41c7-8845-ba20716e4b23	null	null	::ffff:127.0.0.1	\N	2026-02-15 08:08:49.661	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
05ccdf77-539d-4f3b-a406-26413f4283a6	\N	SECURITY_QUICK_REG_INIT	Security	b63c3881-f6ea-4959-b952-48f811fc10f7	null	null	::ffff:127.0.0.1	\N	2026-02-15 08:08:49.734	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
83ed25a3-9d67-4971-98c1-cc9eae50cf60	\N	SECURITY_OTP_VERIFIED	Security	b63c3881-f6ea-4959-b952-48f811fc10f7	null	null	::ffff:127.0.0.1	\N	2026-02-15 08:08:49.76	\N	\N	\N	\N	\N	{"type": "SMS", "device": "jest-device-123", "status": "SUCCESS", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "timestamp": "2026-02-15T08:08:49.758Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
4073f8f2-a915-422e-a817-7719b508b655	\N	SECURITY_QUICK_REG_INIT	Security	0dafb90a-f895-412f-b25a-a25b50beed50	null	null	::ffff:127.0.0.1	\N	2026-02-15 09:02:18.107	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
997be40d-1eba-42b7-abdb-aa8f1ce69aec	\N	SECURITY_QUICK_REG_INIT	Security	3ac1195f-61e8-40f8-9da0-7719f18a92e5	null	null	::ffff:127.0.0.1	\N	2026-02-15 09:02:18.158	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
ff9644f2-b6b8-434b-9308-16eb6b9ce4cd	\N	SECURITY_OTP_VERIFIED	Security	3ac1195f-61e8-40f8-9da0-7719f18a92e5	null	null	::ffff:127.0.0.1	\N	2026-02-15 09:02:18.172	\N	\N	\N	\N	\N	{"type": "SMS", "device": "jest-device-123", "status": "SUCCESS", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "timestamp": "2026-02-15T09:02:18.171Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
2b93b54d-2dca-4262-8196-01fbd922a64b	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:15:52.58	\N	\N	\N	\N	\N	{"device": "dev_1772319636074_1665", "deviceId": "dev_1772319636074_1665", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
fd9cd5dd-c50e-4358-9271-7309049db74c	\N	CASH_IN_COMPLETED	Financial	b0d40626-7217-4612-a42d-24d240c9e40b	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "7-Eleven", "referenceId": "CI-7BE14934"}	\N	\N	2026-02-28 15:11:50.098	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T15:11:50.097Z", "compliance": "BSP Circular No. 808"}
15e235e1-e887-4790-8d28-ecd83a9bead0	\N	SECURITY_LOGOUT	Security	9b6cba5b-22c4-4218-90ce-924cd906c609	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:15:36.417	\N	\N	\N	\N	\N	{"device": "dev_1772319636074_1665", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:15:36.415Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
05530ed0-20aa-40bb-bd0e-d0f2e8dbbd5d	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 22:52:52.83	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
21fc67f8-1ddd-41b8-9f89-4491512d2226	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 22:52:52.863	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
b67c6e42-feca-45a0-b678-88281cac5f4e	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_OTP_VERIFIED	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:16:24.876	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1772319636074_1665", "status": "SUCCESS", "deviceId": "dev_1772319636074_1665", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:16:24.875Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
159133f2-5ec7-4346-a478-53a3d99af21b	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_MOBILE_PIN_SETUP	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:16:34.26	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:16:34.259Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
aba6b3ca-ced4-4ec6-85f3-dc8d62e15249	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 22:53:11.792	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
4b41d7cd-0d57-445a-b1c2-902c34b81d85	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 22:53:11.799	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
f6af9fc3-c53b-472c-80c0-548851591f1b	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	7ff3de6b-f68b-441e-bb06-48338f67d6e4	null	null	::1	\N	2026-02-28 15:17:44.959	\N	\N	\N	\N	\N	{"device": "test_device_id", "deviceId": "test_device_id", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
0da1f4cb-01ba-4f25-a01d-443cf23c456f	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::1	\N	2026-02-28 15:20:30.984	\N	\N	\N	\N	\N	{"device": "test_device_id", "deviceId": "test_device_id", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
5ae153b4-4e13-4fc0-91b5-99c0ae10d952	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 22:53:36.762	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
c9d3961a-57da-4458-b2c6-4dcd7acd895f	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 22:53:36.773	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
1f60ac8d-dd7d-4c30-9265-c3c3982d3cb3	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_LOGOUT	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:25:53.914	\N	\N	\N	\N	\N	{"device": "dev_1772319636074_1665", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:25:53.912Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
0a57b2be-9117-44da-845b-c748ed176163	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:28:06.495	\N	\N	\N	\N	\N	{"device": "dev_1772321225075_1674", "deviceId": "dev_1772321225075_1674", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
4c879a46-67ce-4326-b6ab-e7446fa5cda2	\N	SECURITY_OTP_RESENT	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:29:46.577	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:29:46.576Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
5134361c-aa63-47f2-b55d-231f1447e96e	\N	SECURITY_OTP_RESENT	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:30:47.466	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:30:47.464Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
9475a72e-6b61-49c6-9b89-405d6e44b8ab	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 22:53:56.991	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
056e1f27-d071-4350-a550-e1e2d9ecda12	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 22:53:56.998	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
1c862a0f-1938-4432-8c9e-700eb3a31082	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:31:23.459	\N	\N	\N	\N	\N	{"device": "dev_1772321225075_1674", "deviceId": "dev_1772321225075_1674", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
8e2d1950-596a-4537-adcb-83e9b0ea25f4	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:35:18.244	\N	\N	\N	\N	\N	{"device": "dev_1772321673975_9774", "deviceId": "dev_1772321673975_9774", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
15209c87-5755-4f6a-a858-ff1fc7e3a89d	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:00:58.963	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
9541dac9-6492-4da4-941c-f026ccdbaae0	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:00:58.982	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
5bdb80cd-48e6-4f18-bd26-79981d6c8041	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:43:51.268	\N	\N	\N	\N	\N	{"device": "dev_1772321801807_8262", "deviceId": "dev_1772321801807_8262", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
0071f558-8afb-4323-b322-a5b7a58a0eae	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::1	\N	2026-02-28 15:44:24.931	\N	\N	\N	\N	\N	{"device": "test_device_id", "deviceId": "test_device_id", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
b00bf59f-d5e2-4294-9148-954549949bf0	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:05:38.733	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
393c95ef-f5a6-4801-aa81-73031eadf1be	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:05:38.767	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
172eb8aa-6c53-4e2a-86a8-7a2d459bd473	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_OTP_RESENT	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:45:47.283	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:45:47.279Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
b8f1a0c2-6796-4afc-9dbe-ee9f5002ded3	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:47:25.465	\N	\N	\N	\N	\N	{"device": "dev_1772322414109_1980", "deviceId": "dev_1772322414109_1980", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
d26b90f1-2669-42be-9f9d-952e88e75769	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_OTP_VERIFIED	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:47:39.243	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1772322414109_1980", "status": "SUCCESS", "deviceId": "dev_1772322414109_1980", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:47:39.242Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
fdf68847-9b80-4ddf-9780-59a7355bc8b1	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_MOBILE_PIN_SETUP	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 15:47:54.765	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T15:47:54.764Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
d7ff2f8d-0f4c-48b4-b158-ed67fd42f319	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:06:25.327	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
9049700c-b3b0-4ae5-95de-0f316a4f9e59	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:06:25.335	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
8363ddde-d1cf-4e9f-9711-667c751fcdc9	\N	UPDATE_REALTIME_CONFIG	SystemSetting	REALTIME_CONFIG	null	{"method": "PUSHER", "swrInterval": null}	Internal System	\N	2026-02-19 00:00:45.297	\N	\N	\N	\N	\N	{"actor": "reynaldomgalvez@gmail.com", "ssoId": null, "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
f4d41c3f-ef4f-4aa6-9be3-4894be599812	8e462c3d-6243-4231-be2b-174db21b2dd6	CASH_IN_COMPLETED	Financial	1dabb8eb-24ed-42fb-8284-fb2842557f9e	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "7-Eleven", "referenceId": "CI-4DD4E739"}	\N	\N	2026-02-28 15:48:14.388	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T15:48:14.387Z", "compliance": "BSP Circular No. 808"}
eedf0ab8-4f7a-440e-adbc-67a85b38625c	8e462c3d-6243-4231-be2b-174db21b2dd6	CASH_IN_COMPLETED	Financial	50b0b2c2-022f-4258-be83-5f10c78f4829	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "7-Eleven", "referenceId": "CI-8F1E935F"}	\N	\N	2026-02-28 15:48:22.233	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T15:48:22.232Z", "compliance": "BSP Circular No. 808"}
991a54d0-bafe-4fe3-aa16-39ac9c0b898d	8e462c3d-6243-4231-be2b-174db21b2dd6	CASH_IN_COMPLETED	Financial	2bdbb250-44a0-45a3-9158-289ed92df2a3	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "GCash", "referenceId": "CI-B23C750E"}	\N	\N	2026-02-28 15:48:32.128	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T15:48:32.127Z", "compliance": "BSP Circular No. 808"}
91fc9cf7-657e-43f0-8c4e-791e1e8da7bd	8e462c3d-6243-4231-be2b-174db21b2dd6	CASH_IN_COMPLETED	Financial	f36c1110-cc56-419d-bdbe-6ae3f090da38	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "Maya", "referenceId": "CI-23D1709D"}	\N	\N	2026-02-28 15:48:42.175	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T15:48:42.174Z", "compliance": "BSP Circular No. 808"}
5dc7387b-1495-4b78-a5c1-1212e6bb7337	8e462c3d-6243-4231-be2b-174db21b2dd6	CASH_IN_COMPLETED	Financial	6b03fa80-a39d-4446-b252-6a63d561b5a9	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "BDO", "referenceId": "CI-368755B0"}	\N	\N	2026-02-28 15:49:01.52	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T15:49:01.519Z", "compliance": "BSP Circular No. 808"}
d9604779-20ca-46fa-bef9-5cfb06999ce0	8e462c3d-6243-4231-be2b-174db21b2dd6	CASH_IN_COMPLETED	Financial	0e62a589-05b0-4532-8e7d-ccbbebd03263	\N	{"type": "CASH_IN", "amount": 500.0, "provider": "BPI", "referenceId": "CI-79143E9E"}	\N	\N	2026-02-28 15:49:14.311	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T15:49:14.311Z", "compliance": "BSP Circular No. 808"}
390c6733-a825-4ff2-b139-7651dc849820	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:07:13.815	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
72e9dbd0-542b-4d9b-85f2-0c5f46692f0f	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:07:13.823	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
dace7d7d-dc17-4578-83d5-7c62fc4cd118	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_MOBILE_LOGIN_PIN	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:00:02.125	\N	\N	\N	\N	\N	{"device": "dev_1772322414109_1980", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1772322414109_1980", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:00:02.123Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e688aac0-623e-47f6-8c62-e46435321f7f	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_LOGOUT	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:00:38.104	\N	\N	\N	\N	\N	{"device": "dev_1772322414109_1980", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:00:38.102Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
6f876267-ab7c-41d0-bfdb-8df6c3b51f71	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:00:53.066	\N	\N	\N	\N	\N	{"device": "dev_1772322414109_1980", "deviceId": "dev_1772322414109_1980", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
3d6290d1-6f36-4a7a-9b93-ea803c43877d	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_MOBILE_LOGIN_PIN	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:00:56.306	\N	\N	\N	\N	\N	{"device": "dev_1772322414109_1980", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1772322414109_1980", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:00:56.304Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
a9d0db68-ed10-46f9-af02-f62242f0a181	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_LOGOUT	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:01:16.502	\N	\N	\N	\N	\N	{"device": "dev_1772322414109_1980", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:01:16.500Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
f7def59d-ae5d-4296-ac4c-a154d83ccacc	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:01:31.701	\N	\N	\N	\N	\N	{"device": "dev_1772322414109_1980", "deviceId": "dev_1772322414109_1980", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
424116b4-665e-4e25-94d6-14075cf0ef94	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_OTP_VERIFIED	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:01:49.022	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1772322414109_1980", "status": "SUCCESS", "deviceId": "dev_1772322414109_1980", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:01:49.021Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
0aaf237f-3856-4784-9dca-006ee0b662b9	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_MOBILE_LOGIN_PIN	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:01:55.783	\N	\N	\N	\N	\N	{"device": "dev_1772322414109_1980", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1772322414109_1980", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:01:55.782Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
0aefcf92-9ae1-41cf-a748-498ddc0d56ee	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_LOGOUT	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:02:26.21	\N	\N	\N	\N	\N	{"device": "dev_1772322414109_1980", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:02:26.208Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1106b380-1f14-4691-8813-302de724e07a	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:08:35.956	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
2a10dc73-149f-48e4-8d4d-3be26d9a370c	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:08:35.976	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
88e093b1-701a-44f3-ad4c-6d6f8ab8f1cf	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:14:41.02	\N	\N	\N	\N	\N	{"device": "dev_1772324049275_3474", "deviceId": "dev_1772324049275_3474", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
32e59e20-6eb0-4ab3-a9d1-1dba2944502d	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_OTP_VERIFIED	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:14:52.541	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1772324049275_3474", "status": "SUCCESS", "deviceId": "dev_1772324049275_3474", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:14:52.539Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
4f735fa7-ef7c-4654-a75b-aa4862c19422	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:14:59.314	\N	\N	\N	\N	\N	{"device": "dev_1772324049275_3474", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1772324049275_3474", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1bd275fa-58cf-4d5b-adf0-23a61a20095c	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:15:05.341	\N	\N	\N	\N	\N	{"device": "dev_1772324049275_3474", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1772324049275_3474", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
6099a521-8059-4622-93c4-5cb75f025efe	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_MOBILE_LOGIN_PIN	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:15:10.226	\N	\N	\N	\N	\N	{"device": "dev_1772324049275_3474", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1772324049275_3474", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:15:10.224Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e840120b-fe4e-48b5-a828-32cc67c27e40	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:10:58.012	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
c48e44bb-6229-4a2e-838e-35e5298b4792	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:10:58.022	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
1f181f8a-366f-457f-a3d8-615cf140f1dc	b361327f-00ed-4214-9387-0668b77ecd0f	CASH_IN_COMPLETED	Financial	eeb32024-4083-43b1-adb2-9d196ebdfb22	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "7-Eleven", "referenceId": "CI-7DC9E4D1"}	\N	\N	2026-02-28 16:15:22.815	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T16:15:22.814Z", "compliance": "BSP Circular No. 808"}
881e75e2-9cad-4ced-9def-f22c89b4055f	b361327f-00ed-4214-9387-0668b77ecd0f	CASH_IN_COMPLETED	Financial	2bdd814d-f56e-4b5c-8be5-a57cae8a852c	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "UnionBank", "referenceId": "CI-2EEAF0C4"}	\N	\N	2026-02-28 16:15:36.064	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T16:15:36.063Z", "compliance": "BSP Circular No. 808"}
df9d5800-7b5c-433c-9dff-9389ae7480fb	b361327f-00ed-4214-9387-0668b77ecd0f	CASH_IN_COMPLETED	Financial	1bd98422-acbb-42fe-8654-0dd136fac041	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "BPI", "referenceId": "CI-1FA58B06"}	\N	\N	2026-02-28 16:15:49.508	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T16:15:49.507Z", "compliance": "BSP Circular No. 808"}
c198d1ce-78d8-4aa7-8280-8ef1c1a24956	b361327f-00ed-4214-9387-0668b77ecd0f	CASH_IN_COMPLETED	Financial	3170b8ee-1420-4a4f-85b7-96ddf2c4aa21	\N	{"type": "CASH_IN", "amount": 300.0, "provider": "BDO", "referenceId": "CI-8F4F9E1E"}	\N	\N	2026-02-28 16:16:04.95	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T16:16:04.949Z", "compliance": "BSP Circular No. 808"}
c28c9a05-2422-478c-82fa-e03908ae5e1d	b361327f-00ed-4214-9387-0668b77ecd0f	CASH_IN_COMPLETED	Financial	665eaeec-6df6-41c1-a2a4-f2eb31870f9a	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "BDO", "referenceId": "CI-EDD670BE"}	\N	\N	2026-02-28 16:16:17.797	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T16:16:17.796Z", "compliance": "BSP Circular No. 808"}
1cbc7cb2-3662-4421-90c0-48e46ac5e9d8	b361327f-00ed-4214-9387-0668b77ecd0f	CASH_IN_COMPLETED	Financial	93d087ea-1ebd-40a7-b2c3-8b4cf6aa7847	\N	{"type": "CASH_IN", "amount": 100.0, "provider": "Maya", "referenceId": "CI-BFC32AB5"}	\N	\N	2026-02-28 16:16:33.025	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-28T16:16:33.023Z", "compliance": "BSP Circular No. 808"}
c36571cc-8f0a-44a0-9839-9548309b2cb3	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:11:23.47	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
f21ef55e-9351-4fda-b3ec-a1122cd8a6c8	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:11:23.478	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
22871544-0f17-49d5-95a8-980c45f6a4eb	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:11:45.344	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
f0e0b38d-682e-4e6a-8a22-1201926435f7	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:11:45.352	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
f25bc6b1-c0f0-4034-aaad-1e99f67ec493	b361327f-00ed-4214-9387-0668b77ecd0f	QR_PAYMENT_INITIATED	Financial	e96e0e52-c9e8-4a14-9929-9e9e5b90bd11	null	null	192.168.1.10	\N	2026-02-28 16:24:15.481	\N	\N	\N	\N	\N	{"amount": 126.0, "device": "UNKNOWN_DEVICE", "orderId": "cmm6j6ago0009gpwsijndvhia", "merchant": "Stark Industries", "ipAddress": "192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "referenceId": "JON-20260228162347-43CCC1C9", "transactionId": "e96e0e52-c9e8-4a14-9929-9e9e5b90bd11"}
0275ab58-8f56-475c-a422-2d05731e90a4	b361327f-00ed-4214-9387-0668b77ecd0f	QR_PAYMENT_COMPLETED	Financial	e96e0e52-c9e8-4a14-9929-9e9e5b90bd11	null	null	192.168.1.10	\N	2026-02-28 16:24:20.537	\N	\N	\N	\N	\N	{"amount": 126.0, "device": "UNKNOWN_DEVICE", "merchant": "Stark Industries", "ipAddress": "192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "newBalance": 4874, "referenceId": "JON-20260228162347-43CCC1C9", "transactionId": "e96e0e52-c9e8-4a14-9929-9e9e5b90bd11"}
39423c11-8b23-45e8-91df-3a7c443429fb	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:12:25.361	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
dc2b44b2-a1bc-460f-a6cd-970c2becedd8	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:12:25.371	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
dd9ca492-c281-4b5f-b589-f1e1f96cacc2	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_MOBILE_LOGIN_PIN	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:41:20.266	\N	\N	\N	\N	\N	{"device": "dev_1772324049275_3474", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1772324049275_3474", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:41:20.266Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
55bd65eb-42b2-4107-a402-b947af3db73c	b361327f-00ed-4214-9387-0668b77ecd0f	SECURITY_LOGOUT	Security	b361327f-00ed-4214-9387-0668b77ecd0f	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:41:59.576	\N	\N	\N	\N	\N	{"device": "dev_1772324049275_3474", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:41:59.575Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
43d40151-a3ad-44ea-a674-d38589f4e745	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:42:22.032	\N	\N	\N	\N	\N	{"device": "dev_1772324049275_3474", "deviceId": "dev_1772324049275_3474", "ipAddress": "::ffff:192.168.1.10", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
27c21595-9554-4601-9496-2289c9b7e048	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_OTP_VERIFIED	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:42:37.261	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1772324049275_3474", "status": "SUCCESS", "deviceId": "dev_1772324049275_3474", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:42:37.260Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
a112d5fa-0f13-4b8e-88a2-6d6af8e2b275	8e462c3d-6243-4231-be2b-174db21b2dd6	SECURITY_MOBILE_LOGIN_PIN	Security	8e462c3d-6243-4231-be2b-174db21b2dd6	null	null	::ffff:192.168.1.10	\N	2026-02-28 16:42:45.773	\N	\N	\N	\N	\N	{"device": "dev_1772324049275_3474", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1772324049275_3474", "ipAddress": "::ffff:192.168.1.10", "timestamp": "2026-02-28T16:42:45.772Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
9b56354b-d9d3-4830-96d3-6dcc305447da	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:12:49.174	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
dfe3b5bd-28c0-4d22-b006-3c7fa4328ccc	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:12:49.187	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
0f490191-3428-4c64-a0dc-90fd391205ad	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	USER_LOGIN	Security	\N	\N	\N	127.0.0.1	\N	2026-04-07 23:13:26.467	\N	\N	\N	\N	\N	{"method": "SSO", "compliance": {"pci_dss": "10.2.2"}}
9c1b3b45-0505-4fab-ba7f-7c32ba8a3773	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	KYC_STATUS_UPDATED	User	5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	\N	\N	127.0.0.1	\N	2026-04-07 23:13:26.493	\N	\N	\N	\N	\N	{"newValue": "TIER_1", "oldValue": "TIER_0", "compliance": {"bsp": "Circular 808"}}
ade4085f-6153-44d8-9b93-12843d7e1924	b361327f-00ed-4214-9387-0668b77ecd0f	CHANGE_REQUEST_CREATED	User	b361327f-00ed-4214-9387-0668b77ecd0f	null	{"changes": {"phoneNumber": "+639484099388"}, "changeRequestId": "4de28446-8ed1-41e6-b8f7-c413537113d3"}	Internal System	\N	2026-02-28 17:51:54.798	\N	\N	\N	\N	\N	{"bsp": "Circular 808", "pci_dss": "8.2.1", "compliance": "Maker-Checker Phase 1"}
a9e19a12-72f0-428e-9cf8-fa0c050f4676	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.2	\N	2026-02-22 06:28:39.041	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
cdee5551-be8d-475c-a565-2a203a95f6f8	\N	SECURITY_OTP_VERIFIED	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.2	\N	2026-02-22 06:28:49.132	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771537360471_5238", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-22T06:28:49.130Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
500c74b4-e2ae-40f1-bf49-88b2a8e08a72	\N	SECURITY_MOBILE_LOGIN_PIN	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.2	\N	2026-02-22 06:28:55.101	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-22T06:28:55.099Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
19f45d10-4bd0-48ca-bc84-f1caa76e7e6d	\N	SECURITY_LOGOUT	Security	deafcf27-566d-43fb-8efe-a307e1d1e05d	null	null	::ffff:192.168.1.2	\N	2026-02-22 06:44:49.405	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-22T06:44:49.392Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
90424bf1-6c83-4263-9b52-d03780bf252a	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:16:19.177	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:16:19.176Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
15ff6f8b-4aaf-453a-a9d4-b1c7244176cd	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:20:04.931	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
b84a8195-c510-45d4-9c6a-15ef5b527052	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:20:07.066	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:20:07.065Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
93e5c808-11d3-44ab-88d7-1c2829109f97	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:24:32.182	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
84a54aad-6d97-4141-8941-fab9441844b8	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:24:35.604	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:24:35.602Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
91a22356-ca42-4ba3-87b6-e3ad1a1048e6	\N	USER_LOGOUT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 08:07:05.896	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.3"}}
132c9ad3-a555-4f39-9b71-47417314fd6e	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:28:52.766	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
04ee7c92-dd89-44ad-b021-3cd36aa63614	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:28:56.156	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:28:56.155Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
a5d12a07-c38d-4f4a-9115-cc5050e03349	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:33:34.892	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
abdf139a-4b09-4fcc-b960-88afb751dc7f	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:33:38.476	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:33:38.475Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
794ee4ba-1104-4635-b32a-50766e336775	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:42:47.856	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
9c22db36-b129-4346-99f4-adcfdd906caf	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:42:50.648	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:42:50.642Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
b4fa1e3a-1f3c-4cbb-8ce5-8d751f3e07d0	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:44:14.929	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "deviceId": "dev_1771479802768_7911", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
b74b7036-4b76-42d9-89a4-053d246873cb	\N	SECURITY_OTP_VERIFIED	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:44:24.907	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771479802768_7911", "status": "SUCCESS", "deviceId": "dev_1771479802768_7911", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:44:24.905Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
a51796ed-d2c0-4c41-82b8-52628d3203e4	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:44:28.213	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771479802768_7911", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:44:28.211Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
21259514-2448-4601-b7a5-f26c4aa602ae	\N	SECURITY_LOGOUT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:01:34.572	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:01:34.569Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
eda52b06-d321-45ba-8a63-01229541bf1a	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:01:43.491	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "deviceId": "dev_1771479802768_7911", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
d52d2b0c-c1da-4ef2-9795-f119d1e5b1ac	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:01:46.938	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771479802768_7911", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:01:46.935Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
fbe0a5cd-7a65-4ddc-8b89-926c9c89d9e0	\N	SECURITY_LOGOUT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:38:15.831	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:38:15.829Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
8205e2c8-805c-4e2f-8a9d-95f5639db638	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:38:25.478	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "deviceId": "dev_1771479802768_7911", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
67ce97f2-edce-4477-a20d-6c7101603234	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:38:29.025	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771479802768_7911", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:38:29.022Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1460295e-5b50-4325-9195-6ded76b80bf2	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:38:55.752	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "deviceId": "dev_1771479802768_7911", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
8c8d9c35-e8e9-4b8c-881d-8fcde034fbf7	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:38:59.025	\N	\N	\N	\N	\N	{"device": "dev_1771479802768_7911", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771479802768_7911", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:38:59.022Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
6fa8904c-b88e-424a-ac8b-7c15841affcf	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:40:44.285	\N	\N	\N	\N	\N	{"device": "dev_1771483230799_8190", "deviceId": "dev_1771483230799_8190", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
c018ed17-f6e7-4fa3-8bba-503c773bb531	\N	SECURITY_OTP_VERIFIED	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:40:55.283	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771483230799_8190", "status": "SUCCESS", "deviceId": "dev_1771483230799_8190", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:40:55.282Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
af74f0c6-09c3-4e26-b341-33b27ee4694e	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:40:58.854	\N	\N	\N	\N	\N	{"device": "dev_1771483230799_8190", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771483230799_8190", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:40:58.852Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
9342698e-2ad3-4cf4-85d6-6da10e464af5	\N	SECURITY_LOGOUT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:46:31.323	\N	\N	\N	\N	\N	{"device": "dev_1771483230799_8190", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:46:31.322Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
6d6476dc-69b0-4ae8-9779-af3acab58369	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:46:44.453	\N	\N	\N	\N	\N	{"device": "dev_1771483230799_8190", "deviceId": "dev_1771483230799_8190", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
86eea7ed-8dd6-40ff-8a0f-52df68be93d5	\N	SECURITY_MOBILE_LOGIN_PIN	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:46:47.667	\N	\N	\N	\N	\N	{"device": "dev_1771483230799_8190", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771483230799_8190", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:46:47.665Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
b6af2025-ac56-4dff-9a2b-509197c57e5e	\N	SECURITY_LOGOUT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:52:20.54	\N	\N	\N	\N	\N	{"device": "dev_1771483230799_8190", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:52:20.538Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
17660165-779d-4e73-a0b7-adfe96e9e0b6	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 23:41:19.031	\N	\N	\N	\N	\N	{"device": "dev_1771486864596_6363", "deviceId": "dev_1771486864596_6363", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
8e9dc6eb-655e-43a8-901e-2b40d4b1e420	\N	SECURITY_OTP_RESENT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 23:42:20.359	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T23:42:20.358Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
ef708ad3-370c-48ee-b21c-3192cc9b5e82	\N	SECURITY_OTP_RESENT	Security	b8d73be5-b0a0-4d2b-ab2b-057bd550e475	null	null	::ffff:192.168.1.2	\N	2026-02-18 23:44:19.387	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T23:44:19.386Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
7ae1ec99-5174-434b-93fd-70fdc7ba33ee	\N	USER_LOGOUT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 08:06:44.559	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.3"}}
3d2c395b-6be4-48ff-a84c-a1ff17ca3501	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 08:07:15.082	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "authMethod": "SSO_CALLBACK", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
c1a20fff-bed0-4ca8-8a99-89d0b86e66b0	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 23:30:34.944	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_CALLBACK", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
21796f7a-9535-4e1a-bf2b-bd4877e1f463	\N	USER_LOGOUT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 23:30:39.558	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.3"}}
5481c431-fa4c-43e0-9e27-38acd87a8b84	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 23:30:44.907	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_CALLBACK", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
fd1a0a37-0af7-48f2-81ac-1f2414ef7e1a	\N	USER_LOGOUT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 23:30:57.315	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.3"}}
55b7ed9e-877c-4b01-9e69-0697b31fdcc3	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 23:31:01.672	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_BUDOLID", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
3258f950-ee1d-4708-a527-fc86c72e2eb2	\N	USER_LOGOUT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 23:31:09.159	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.3"}}
831cd97e-fc23-405f-8501-c5b78ae29913	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-15 23:31:23.779	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_BUDOLID", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
d350a8c3-faa2-4eb6-91a1-80ce2afccc00	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.14	\N	2026-02-17 15:52:12.4	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_CALLBACK", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
ab857264-5a3e-4708-8e49-ab8d7a90c8bb	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.2	\N	2026-02-18 22:51:14.734	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_CALLBACK", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
f5212110-d4d3-4d49-b5c2-56dd029a1bc6	\N	ADMIN_ACCOUNT_UPDATED	Security	7efe3976-0846-4af5-8250-d91428532892	\N	\N	127.0.0.1	Budol Bootstrap Engine/1.0	2026-02-18 23:18:15.007	\N	\N	\N	\N	\N	{"method": "create-admin-account.js", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "target_email": "reynaldomgalvez@gmail.com"}
be2fca83-5cc0-487f-a3fe-1d44430e8a56	\N	WEB_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::1	\N	2026-02-18 23:18:27.575	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "method": "PASSWORD", "status": "SUCCESS", "ipAddress": "::1", "timestamp": "2026-02-18T23:18:27.573Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
87b4af9d-bde7-45e9-9017-7b89500578d6	\N	WEB_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::1	\N	2026-02-18 23:18:52.297	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "method": "PASSWORD", "status": "SUCCESS", "ipAddress": "::1", "timestamp": "2026-02-18T23:18:52.295Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
04229470-b85c-4ac1-a868-0e34cc90e751	\N	WEB_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::1	\N	2026-02-18 23:20:27.538	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "method": "PASSWORD", "status": "SUCCESS", "ipAddress": "::1", "timestamp": "2026-02-18T23:20:27.537Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
468d1a2e-fecb-4f34-ad43-1760ffd18ceb	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.2	\N	2026-02-18 23:58:05.777	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_CALLBACK", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
65a2f13f-7e79-4056-941f-dd3710032663	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.2	\N	2026-02-18 23:58:08.016	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_CALLBACK", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
0a61aa85-6274-4280-8a07-3d9fa6ad6712	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.2	\N	2026-02-19 09:39:27.906	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_BUDOLID", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
a6d4ccc9-5269-4257-92cf-f58ff7140eb7	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.2	\N	2026-02-21 16:16:36.73	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_CALLBACK", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
09385ce6-07c7-4ca1-96ee-f86ee324711a	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 10:41:35.582	\N	\N	\N	\N	\N	{"device": "dev_1771526380886_8973", "deviceId": "dev_1771526380886_8973", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
307feb8c-fb59-4bcb-89b1-167b22db585d	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 11:45:10.306	\N	\N	\N	\N	\N	{"device": "dev_1771526380886_8973", "deviceId": "dev_1771526380886_8973", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
33eb6350-2480-4bdc-97c7-6e85d9bc8ca2	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 11:46:34.05	\N	\N	\N	\N	\N	{"device": "dev_1771530377831_8478", "deviceId": "dev_1771530377831_8478", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
f74ef0ee-986d-42b4-8dc5-ca15da1164d5	\N	SECURITY_OTP_RESENT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 11:47:56.463	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T11:47:56.461Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
270bf919-8078-4767-bda9-02fd86c511cf	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:26:37.967	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
91345952-1fe6-4229-a774-f0ea4f9ce49a	\N	SECURITY_OTP_VERIFIED	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:26:55.333	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771532781497_5472", "status": "SUCCESS", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:26:55.332Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
7e590b27-89dd-4c8f-a4e0-5e62fe3cebe6	\N	SECURITY_MOBILE_PIN_SETUP	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:27:02.779	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:27:02.778Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1632b4c0-b0de-4988-9d39-ceb18d70fcb8	\N	SECURITY_LOGOUT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:27:47.026	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:27:47.024Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
54f9ea40-cdfc-4748-8fa3-6842cf6f0d4d	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:35:17.853	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
380479fc-823d-4a14-b694-02e46a789fcf	\N	SECURITY_MOBILE_LOGIN_PIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:35:22.127	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:35:22.126Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
d5795f55-7537-4600-b8da-171c27eb54bd	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:37:35.529	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
62ccf472-6869-4dec-9a98-7bebfbfc0866	\N	SECURITY_MOBILE_LOGIN_PIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:37:39.37	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:37:39.369Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
5380881d-7964-407d-bc54-f879ff311de3	\N	SECURITY_LOGOUT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:55:22.2	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:55:22.106Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
f239a300-1164-4dae-8107-b54e298d6b0d	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:26:57.155	\N	\N	\N	\N	\N	{"device": "dev_1771535931205_2844", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
68f3c35a-c028-4d08-a798-a19498c93197	\N	SECURITY_OTP_VERIFIED	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:27:07.353	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771535931205_2844", "status": "SUCCESS", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:27:07.351Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
b3ba65ce-fda5-487f-83c2-deae84b2db47	\N	SECURITY_MOBILE_LOGIN_PIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:27:16.116	\N	\N	\N	\N	\N	{"device": "dev_1771535931205_2844", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:27:16.114Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
c2b7a127-c165-4764-bc51-1f9401cde7a4	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:46:23.941	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
31891b2c-45e2-42f7-82f2-4338bdbb6611	\N	SECURITY_OTP_VERIFIED	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:46:32.842	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771537360471_5238", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:46:32.840Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
a8663b25-c457-467b-9bd9-e4585de2a374	\N	SECURITY_MOBILE_LOGIN_PIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:46:37.289	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:46:37.288Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
6d752dd8-19f6-4fbb-8d31-422638f73b7e	\N	SECURITY_LOGOUT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:51:50.471	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:51:50.469Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
4b1cbaa7-846e-41f5-acb0-ced702e0ca0a	\N	USER_LOGIN	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.2	\N	2026-02-20 17:27:29.485	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "authMethod": "SSO_BUDOLID", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.1"}}
78b3a479-ab95-4077-8483-1557ab0a9722	\N	USER_LOGOUT	Security	7efe3976-0846-4af5-8250-d91428532892	null	null	192.168.1.2	\N	2026-02-21 03:00:59.035	\N	\N	\N	\N	\N	{"userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.3"}}
1fbe2563-7056-410d-8742-265337cd0c68	\N	SECURITY_QUICK_REG_INIT	Security	8b0ceda1-6180-4095-91f8-c0188a374576	null	null	::ffff:127.0.0.1	\N	2026-02-18 23:39:02.529	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
041bd851-eff4-473e-81f9-d28f9dc2f230	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-15 09:59:21.522	\N	\N	\N	\N	\N	{"device": "dev_1771097835634_6705", "deviceId": "dev_1771097835634_6705", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
b39ab25d-29ae-436e-9d7b-753cbfecc99e	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-15 10:22:45.821	\N	\N	\N	\N	\N	{"device": "dev_1771097835634_6705", "deviceId": "dev_1771097835634_6705", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
dcea9f55-b676-4c11-83fb-b2a778705c83	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 01:25:16.019	\N	\N	\N	\N	\N	{"device": "dev_1771158686391_4518", "deviceId": "dev_1771158686391_4518", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
35c13d6c-0610-4139-95a7-a954dc150ea1	\N	CASH_IN_COMPLETED	Financial	49b76e65-5695-4aac-ac03-962d79325d13	\N	{"type": "CASH_IN", "amount": 500.0, "provider": "BDO", "referenceId": "CI-C05DE397"}	\N	\N	2026-02-17 08:00:33.951	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-17T08:00:33.949Z", "compliance": "BSP Circular No. 808"}
bfe097a1-9cdf-46d0-8a87-5d2cf4a2a689	\N	SECURITY_OTP_VERIFIED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 01:25:35.273	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771158686391_4518", "status": "SUCCESS", "deviceId": "dev_1771158686391_4518", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T01:25:35.272Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
6057e181-ab2b-4047-869c-6405515de107	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 01:25:44.502	\N	\N	\N	\N	\N	{"device": "dev_1771158686391_4518", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1771158686391_4518", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
7c9e2f5c-b5ea-44e0-94e6-2f48b6ee2bbf	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 01:25:49.677	\N	\N	\N	\N	\N	{"device": "dev_1771158686391_4518", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771158686391_4518", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T01:25:49.675Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
d7bfece8-38b7-4633-a316-a785b8d8a55c	\N	CASH_IN_COMPLETED	Financial	19967149-4f31-441e-afdd-abd3be703de1	\N	{"type": "CASH_IN", "amount": 500.0, "provider": "BDO", "referenceId": "CI-9AC89647"}	\N	\N	2026-02-16 01:27:20.579	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-16T01:27:20.577Z", "compliance": "BSP Circular No. 808"}
471b5aa6-e5bd-489b-bbc3-52f821fa6e38	\N	SECURITY_LOGOUT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:15:18.788	\N	\N	\N	\N	\N	{"device": "dev_1771158686391_4518", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T04:15:18.778Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
c25e34f6-42f8-40c6-9672-99198b08e938	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:15:33.126	\N	\N	\N	\N	\N	{"device": "dev_1771158686391_4518", "deviceId": "dev_1771158686391_4518", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
ec6343ee-5db1-4a74-a12b-2467359242c5	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:15:38.159	\N	\N	\N	\N	\N	{"device": "dev_1771158686391_4518", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771158686391_4518", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T04:15:38.158Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
6bb4393c-6162-4f4a-b11e-f63d27e1afb9	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:20:01.177	\N	\N	\N	\N	\N	{"device": "dev_1771244327776_7983", "deviceId": "dev_1771244327776_7983", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
72fb2941-d90b-4a9c-bffe-d4cfcce7e0c7	\N	SECURITY_OTP_VERIFIED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:20:12.978	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771244327776_7983", "status": "SUCCESS", "deviceId": "dev_1771244327776_7983", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T04:20:12.977Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e394be91-a5d4-46ab-b4aa-793aebf39a08	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:20:23.026	\N	\N	\N	\N	\N	{"device": "dev_1771244327776_7983", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771244327776_7983", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T04:20:23.024Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
9c7450e6-f760-4bf0-a9ed-67a93ac479be	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:20:43.826	\N	\N	\N	\N	\N	{"device": "dev_1771244327776_7983", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771244327776_7983", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T04:20:43.825Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
84c8fbc4-3b68-47e4-8a51-1b99ee4dc3d6	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:21:52.415	\N	\N	\N	\N	\N	{"device": "dev_1771244327776_7983", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771244327776_7983", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T04:21:52.413Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
9e041d35-4810-44ea-9230-fbb289d5a507	\N	SECURITY_LOGOUT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:22:05.857	\N	\N	\N	\N	\N	{"device": "dev_1771244327776_7983", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T04:22:05.855Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1045dc4c-ac10-496b-832e-1b7f7d9b5041	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:22:20.175	\N	\N	\N	\N	\N	{"device": "dev_1771244327776_7983", "deviceId": "dev_1771244327776_7983", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
3f831e7f-7886-4c7f-b570-4eb19ed11aa8	\N	CASH_IN_COMPLETED	Financial	8b904749-27cd-4cb2-881e-6d49581de541	\N	{"type": "CASH_IN", "amount": 800.0, "provider": "BPI", "referenceId": "CI-424F924D"}	\N	\N	2026-02-17 08:00:46.466	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-17T08:00:46.465Z", "compliance": "BSP Circular No. 808"}
3c786495-2df8-4b00-809b-217cd126801e	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:22:54.853	\N	\N	\N	\N	\N	{"device": "dev_1771244327776_7983", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771244327776_7983", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T04:22:54.851Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
3d33efde-79bd-4efd-9e57-6a16f4a10be1	\N	SECURITY_LOGOUT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-16 04:23:38.191	\N	\N	\N	\N	\N	{"device": "dev_1771158686391_4518", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-16T04:23:38.189Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
2fa04d5b-4925-4873-9b26-042f5af1213c	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-17 07:44:10.12	\N	\N	\N	\N	\N	{"device": "dev_1771097835634_6705", "deviceId": "dev_1771097835634_6705", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
f95a577d-0a5c-4aa3-a90f-cdfb2d466e9f	\N	SECURITY_OTP_VERIFIED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-17 07:44:20.719	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771097835634_6705", "status": "SUCCESS", "deviceId": "dev_1771097835634_6705", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-17T07:44:20.718Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1b59aca5-4f89-4111-b76c-ddadb12b36ce	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-17 07:44:26.517	\N	\N	\N	\N	\N	{"device": "dev_1771097835634_6705", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1771097835634_6705", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1be468c1-5d59-45e2-9ecd-174deca5c74c	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-17 07:44:34.242	\N	\N	\N	\N	\N	{"device": "dev_1771097835634_6705", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1771097835634_6705", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
53664eb4-d080-423c-8c07-9e863cc44718	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-17 07:44:44.587	\N	\N	\N	\N	\N	{"device": "dev_1771097835634_6705", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1771097835634_6705", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
37b6d3e2-231a-4b19-8ad5-2431ae7905cf	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-17 07:44:50.531	\N	\N	\N	\N	\N	{"device": "dev_1771097835634_6705", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771097835634_6705", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-17T07:44:50.529Z", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
38600599-8176-4fd2-b853-c5dd68d7886d	\N	QR_PAYMENT_INITIATED	Financial	b57bafc1-3c54-4a19-9d58-8a5b330754f4	null	null	192.168.1.14	\N	2026-02-17 07:46:37.335	\N	\N	\N	\N	\N	{"amount": 70.0, "device": "UNKNOWN_DEVICE", "orderId": "cmlqatpn9000bgpowtuk3kxwi", "merchant": "Stark Enterprise", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "referenceId": "JON-20260217074546-083D445C", "transactionId": "b57bafc1-3c54-4a19-9d58-8a5b330754f4"}
f44c002a-491e-4a08-8ccd-1c62ef59413f	\N	QR_PAYMENT_COMPLETED	Financial	b57bafc1-3c54-4a19-9d58-8a5b330754f4	null	null	192.168.1.14	\N	2026-02-17 07:46:42.439	\N	\N	\N	\N	\N	{"amount": 70.0, "device": "UNKNOWN_DEVICE", "merchant": "Stark Enterprise", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "newBalance": 1430, "referenceId": "JON-20260217074546-083D445C", "transactionId": "b57bafc1-3c54-4a19-9d58-8a5b330754f4"}
ce7c9c04-c84e-4308-88f6-a8804b202a47	\N	QR_PAYMENT_INITIATED	Financial	92fbf855-0520-404c-9fe5-163b74e80899	null	null	192.168.1.14	\N	2026-02-17 07:59:16.077	\N	\N	\N	\N	\N	{"amount": 2412.0, "device": "UNKNOWN_DEVICE", "orderId": "cmlqbamgk000igpow97efnwlq", "merchant": "Stark Enterprise", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "referenceId": "JON-20260217075855-4451D5EC", "transactionId": "92fbf855-0520-404c-9fe5-163b74e80899"}
2fed3494-9127-4d07-a06a-ec12899e0155	\N	CASH_IN_COMPLETED	Financial	f1138975-d740-4089-88b2-b55a726b2c17	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "Maya", "referenceId": "CI-6AFFAEE0"}	\N	\N	2026-02-17 08:00:04.653	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-17T08:00:04.652Z", "compliance": "BSP Circular No. 808"}
74b6785e-4a69-47c4-b780-bb6cf3f6af81	\N	CASH_IN_COMPLETED	Financial	6656028e-3bdc-4238-8b82-0b72502f83ed	\N	{"type": "CASH_IN", "amount": 900.0, "provider": "GCash", "referenceId": "CI-19D548CD"}	\N	\N	2026-02-17 08:00:20.52	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-17T08:00:20.519Z", "compliance": "BSP Circular No. 808"}
8bd062f9-6219-4485-8a89-7a114c020fa7	\N	CASH_IN_COMPLETED	Financial	278c8708-2b09-40b0-8e4d-92caef2e60a6	\N	{"type": "CASH_IN", "amount": 45.0, "provider": "UnionBank", "referenceId": "CI-975CC717"}	\N	\N	2026-02-17 08:01:24.542	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-17T08:01:24.541Z", "compliance": "BSP Circular No. 808"}
21cc41df-7897-4a1a-86e3-465a5a51a615	\N	QR_PAYMENT_INITIATED	Financial	31e09eca-5268-4156-8e4d-9444b63e238d	null	null	192.168.1.14	\N	2026-02-17 08:02:04.371	\N	\N	\N	\N	\N	{"amount": 2412.0, "device": "UNKNOWN_DEVICE", "orderId": "cmlqbe638000ogpow173og5zk", "merchant": "Stark Enterprise", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "referenceId": "JON-20260217080136-EB686935", "transactionId": "31e09eca-5268-4156-8e4d-9444b63e238d"}
657a93a4-43df-4a7f-a0d6-53be510706d3	\N	QR_PAYMENT_COMPLETED	Financial	31e09eca-5268-4156-8e4d-9444b63e238d	null	null	192.168.1.14	\N	2026-02-17 08:02:09.392	\N	\N	\N	\N	\N	{"amount": 2412.0, "device": "UNKNOWN_DEVICE", "merchant": "Stark Enterprise", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "newBalance": 2163, "referenceId": "JON-20260217080136-EB686935", "transactionId": "31e09eca-5268-4156-8e4d-9444b63e238d"}
a505a30e-fb10-4af7-8894-16902616d471	\N	QR_PAYMENT_INITIATED	Financial	13b17e46-5db2-4615-8820-20f08694b84b	null	null	192.168.1.14	\N	2026-02-17 09:18:03.617	\N	\N	\N	\N	\N	{"amount": 70.0, "device": "UNKNOWN_DEVICE", "orderId": "cmlqe1wgv0014gpowkwugp1lv", "merchant": "Stark Enterprise", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "referenceId": "JON-20260217091608-8DA8ACAB", "transactionId": "13b17e46-5db2-4615-8820-20f08694b84b"}
2f88b8e8-37bc-431a-be75-bbabb60f57e3	\N	QR_PAYMENT_COMPLETED	Financial	13b17e46-5db2-4615-8820-20f08694b84b	null	null	192.168.1.14	\N	2026-02-17 09:18:08.783	\N	\N	\N	\N	\N	{"amount": 70.0, "device": "UNKNOWN_DEVICE", "merchant": "Stark Enterprise", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "newBalance": 2093, "referenceId": "JON-20260217091608-8DA8ACAB", "transactionId": "13b17e46-5db2-4615-8820-20f08694b84b"}
53323e94-604e-48bc-8f3e-7340106c7cdb	\N	QR_PAYMENT_INITIATED	Financial	c80eb127-c4b9-4e5f-9069-b53228e82aff	null	null	192.168.1.14	\N	2026-02-17 10:03:44.198	\N	\N	\N	\N	\N	{"amount": 71.0, "device": "UNKNOWN_DEVICE", "orderId": "cmlqfq0or001agpuc9182poe8", "merchant": "Stark Industries", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "referenceId": "JON-20260217100251-31AADA50", "transactionId": "c80eb127-c4b9-4e5f-9069-b53228e82aff"}
3cfff0ee-a96f-4f95-8141-ac2d4e125ae6	\N	QR_PAYMENT_COMPLETED	Financial	c80eb127-c4b9-4e5f-9069-b53228e82aff	null	null	192.168.1.14	\N	2026-02-17 10:03:49.273	\N	\N	\N	\N	\N	{"amount": 71.0, "device": "UNKNOWN_DEVICE", "merchant": "Stark Industries", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "newBalance": 2022, "referenceId": "JON-20260217100251-31AADA50", "transactionId": "c80eb127-c4b9-4e5f-9069-b53228e82aff"}
6d78d574-9a16-46bb-b0d9-ff4ad7c3ffb2	\N	QR_PAYMENT_INITIATED	Financial	652a59b2-9ebe-4fac-a97f-dafeca113d96	null	null	192.168.1.14	\N	2026-02-17 10:05:26.698	\N	\N	\N	\N	\N	{"amount": 70.0, "device": "UNKNOWN_DEVICE", "orderId": "cmlqfsv9w001ggpuct8s0twnz", "merchant": "Stark Industries", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "referenceId": "JON-20260217100505-DC24B255", "transactionId": "652a59b2-9ebe-4fac-a97f-dafeca113d96"}
c7f3ba9a-d453-4199-87d6-59aa8dd09ae8	\N	QR_PAYMENT_COMPLETED	Financial	652a59b2-9ebe-4fac-a97f-dafeca113d96	null	null	192.168.1.14	\N	2026-02-17 10:05:31.722	\N	\N	\N	\N	\N	{"amount": 70.0, "device": "UNKNOWN_DEVICE", "merchant": "Stark Industries", "ipAddress": "192.168.1.14", "userAgent": "Dart/3.10 (dart:io)", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "newBalance": 1952, "referenceId": "JON-20260217100505-DC24B255", "transactionId": "652a59b2-9ebe-4fac-a97f-dafeca113d96"}
2fe5ce3e-722f-4e58-a0b6-c548331db847	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-18 09:29:23.538	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
e95e8fb4-af6c-4ed0-a421-77fb898e6640	\N	SECURITY_OTP_VERIFIED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-18 09:29:41.395	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771435703141_2268", "status": "SUCCESS", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T09:29:41.394Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
81c652ea-ca14-43b6-afef-3a446f4417ee	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-18 09:29:48.322	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771435703141_2268", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T09:29:48.321Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
90cc5c53-3dc3-41b0-a96b-88b2714055ec	\N	SECURITY_LOGOUT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.14	\N	2026-02-18 09:59:48.497	\N	\N	\N	\N	\N	{"device": "dev_1771435703141_2268", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.14", "timestamp": "2026-02-18T09:59:48.495Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
dbf72a87-72d1-46d7-91e2-de3581e58d01	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:19:32.304	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
eb2d88c9-20cc-406f-9f36-f24430558270	\N	SECURITY_OTP_VERIFIED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:19:43.124	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1770229339355_4194", "status": "SUCCESS", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T21:19:43.123Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
36dd065d-d1fc-467d-8a26-d48b11c4040c	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:19:47.04	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
697a16ef-85e9-47fd-a2ed-7f1eca6bed00	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:19:48.509	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
d2e43086-ed02-4490-bf52-3e52c5643865	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 21:19:54.755	\N	\N	\N	\N	\N	{"device": "dev_1770229339355_4194", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1770229339355_4194", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
711293f6-5d27-4a44-91de-e74a36a95a9b	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 23:45:10.725	\N	\N	\N	\N	\N	{"device": "dev_1771486864596_6363", "deviceId": "dev_1771486864596_6363", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
7139927d-6489-4d92-a938-ad7afeeb3c8b	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 23:48:46.832	\N	\N	\N	\N	\N	{"device": "dev_1771486864596_6363", "deviceId": "dev_1771486864596_6363", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
1a7d84f1-4590-4642-95bd-68e088aa3618	\N	SECURITY_OTP_RESENT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 23:55:59.245	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T23:55:59.244Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
5ae9d628-dee3-4864-9bdd-6e1bcb956369	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 23:57:26.944	\N	\N	\N	\N	\N	{"device": "dev_1771487827930_9369", "deviceId": "dev_1771487827930_9369", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
c5ab83a1-7e6b-46ca-9769-8758d027316a	\N	SECURITY_OTP_RESENT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-18 23:59:29.667	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T23:59:29.665Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
96fe74bf-79f0-4652-b211-d16dcf125ed0	\N	SECURITY_OTP_RESENT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:01:00.939	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T00:01:00.937Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1c0cd2af-7c58-4bce-8d47-d4db75b0206f	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:05:10.19	\N	\N	\N	\N	\N	{"device": "dev_1771488296303_3726", "deviceId": "dev_1771488296303_3726", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
ffade2aa-4d62-494c-a894-4bd6c1457cfc	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:10:01.793	\N	\N	\N	\N	\N	{"device": "dev_1771488584016_1143", "deviceId": "dev_1771488584016_1143", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
bbae4358-3c0a-4699-8d1b-f1be13fbeddc	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:11:29.94	\N	\N	\N	\N	\N	{"device": "dev_1771488668342_4077", "deviceId": "dev_1771488668342_4077", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
5a8102e2-d569-4f37-9671-ce50828fd5ee	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:17:35.957	\N	\N	\N	\N	\N	{"device": "dev_1771488668342_4077", "deviceId": "dev_1771488668342_4077", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
1314893f-2192-4332-a633-7966a29538fd	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:20:43.299	\N	\N	\N	\N	\N	{"device": "dev_1771488668342_4077", "deviceId": "dev_1771488668342_4077", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
c2851f8c-0dff-43d0-a3e4-914ad112d14a	\N	SECURITY_OTP_VERIFIED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:20:52.017	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771488668342_4077", "status": "SUCCESS", "deviceId": "dev_1771488668342_4077", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T00:20:52.016Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
506ad63a-15cc-4ec0-93b3-331604d723c0	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:21:00.116	\N	\N	\N	\N	\N	{"device": "dev_1771488668342_4077", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771488668342_4077", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T00:21:00.115Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1cef68c7-6c59-4906-a7e0-97095856bf8e	\N	SECURITY_LOGOUT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:21:24.964	\N	\N	\N	\N	\N	{"device": "dev_1771488668342_4077", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T00:21:24.963Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
99f6a5fb-b3bc-4f37-a165-e3833912f284	\N	SECURITY_LOGOUT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-21 14:22:15.872	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-21T14:22:15.771Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
f46b7961-8b8a-425c-aa29-3eb289a4d157	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-21 12:56:38.138	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
11268d58-b55f-4bd2-8145-6d50cece5d23	\N	SECURITY_OTP_VERIFIED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-21 12:57:12.827	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771537360471_5238", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-21T12:57:12.825Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
46fd5266-02c1-4aa3-9442-91f6d0cc3aed	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-21 12:57:17.104	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
a84e2397-ca93-4a95-b764-42916d6af0d6	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-21 12:57:23.126	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-21T12:57:23.124Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
81a076d9-1c65-448d-8b43-d03d10450513	\N	CASH_IN_COMPLETED	Financial	82d0913e-3730-4f8f-8c99-639ebb16e93d	\N	{"type": "CASH_IN", "amount": 48.0, "provider": "7-Eleven", "referenceId": "CI-EE038787"}	\N	\N	2026-02-21 12:57:44.432	\N	\N	\N	\N	\N	{"standard": "Financial Transaction Audit", "timestamp": "2026-02-21T12:57:44.430Z", "compliance": "BSP Circular No. 808"}
2c8b7ca7-bec4-459b-8886-0482f143649c	\N	SECURITY_LOGOUT	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-21 13:18:15.806	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-21T13:18:15.803Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
a998b6ba-027e-41fe-af5f-31649b08b4da	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-21 13:18:44.455	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
281726a6-b272-409a-abea-826248965939	\N	SECURITY_MOBILE_LOGIN_PIN	Security	d53f1fa0-2f5e-431e-acdd-48d05b56f810	null	null	::ffff:192.168.1.2	\N	2026-02-21 13:18:48.606	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-21T13:18:48.604Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
317af5e1-7b5d-4b96-bf2d-729e65fc5649	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	797689f4-0ce9-4c4d-8ba0-4e056842c383	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:23:01.971	\N	\N	\N	\N	\N	{"device": "dev_1771488668342_4077", "deviceId": "dev_1771488668342_4077", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
8587955c-c784-415a-affa-7d50cdf9a7c4	\N	SECURITY_OTP_VERIFIED	Security	797689f4-0ce9-4c4d-8ba0-4e056842c383	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:23:39.894	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771488668342_4077", "status": "SUCCESS", "deviceId": "dev_1771488668342_4077", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T00:23:39.892Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e042d3c1-5c1c-40a1-b21c-d4083e74ae80	\N	SECURITY_MOBILE_LOGIN_PIN	Security	797689f4-0ce9-4c4d-8ba0-4e056842c383	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:23:44.133	\N	\N	\N	\N	\N	{"device": "dev_1771488668342_4077", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771488668342_4077", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T00:23:44.131Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
c9a5ee47-d5ba-44a7-a40a-c83a25342f1b	\N	SECURITY_LOGOUT	Security	797689f4-0ce9-4c4d-8ba0-4e056842c383	null	null	::ffff:192.168.1.2	\N	2026-02-19 00:25:13.963	\N	\N	\N	\N	\N	{"device": "dev_1771488668342_4077", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T00:25:13.961Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
622634cb-e92e-4de6-8b5d-c30af53a17c4	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	457c8ed7-ec57-4505-bec9-be0ad0111eb1	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:44:34.158	\N	\N	\N	\N	\N	{"device": "dev_1771494035635_6714", "deviceId": "dev_1771494035635_6714", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
9f1ffce6-e7ee-460c-bb5c-b46a55201068	\N	SECURITY_OTP_VERIFIED	Security	457c8ed7-ec57-4505-bec9-be0ad0111eb1	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:44:45.173	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771494035635_6714", "status": "SUCCESS", "deviceId": "dev_1771494035635_6714", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T01:44:45.171Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
0a49d724-6b5d-4a30-8b34-dded76bdf96f	\N	SECURITY_MOBILE_LOGIN_PIN	Security	457c8ed7-ec57-4505-bec9-be0ad0111eb1	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:44:48.54	\N	\N	\N	\N	\N	{"device": "dev_1771494035635_6714", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771494035635_6714", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T01:44:48.539Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e8d4e753-e017-4e4d-af65-30e632386657	\N	SECURITY_LOGOUT	Security	457c8ed7-ec57-4505-bec9-be0ad0111eb1	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:45:07.583	\N	\N	\N	\N	\N	{"device": "dev_1771494035635_6714", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T01:45:07.581Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
22e6d976-7469-4afc-ac53-dd340bd05876	\N	WEB_LOGIN	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-18 11:26:36.345	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "method": "PASSWORD", "status": "SUCCESS", "ipAddress": "::1", "timestamp": "2026-02-18T11:26:36.344Z", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
2b7dc3dd-36ea-4704-b007-7f28c000c956	\N	WEB_LOGIN	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-18 11:27:21.128	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "method": "PASSWORD", "status": "SUCCESS", "ipAddress": "::1", "timestamp": "2026-02-18T11:27:21.126Z", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
30c62505-068a-4932-8d56-a508962646d8	\N	WEB_LOGIN	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-18 11:28:07.16	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "method": "PASSWORD", "status": "SUCCESS", "ipAddress": "::1", "timestamp": "2026-02-18T11:28:07.159Z", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
c6ff7a6a-ece5-4e3d-9190-67b64539b936	\N	WEB_LOGIN	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-18 11:37:15.587	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "method": "PASSWORD", "status": "SUCCESS", "ipAddress": "::1", "timestamp": "2026-02-18T11:37:15.586Z", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
28194dff-d403-4f77-be84-21c2178d84d2	\N	WEB_LOGIN	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-18 11:38:13.572	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "method": "PASSWORD", "status": "SUCCESS", "ipAddress": "::1", "timestamp": "2026-02-18T11:38:13.570Z", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
3066ff78-8d29-4436-9807-e0491358e442	\N	WEB_LOGIN	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-18 11:40:24.512	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "method": "PASSWORD", "status": "SUCCESS", "ipAddress": "::1", "timestamp": "2026-02-18T11:40:24.510Z", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
66cb3644-8693-46f3-be4f-8cbdb15e89c8	\N	PROFILE_UPDATE	User	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-18 11:40:24.561	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "changes": {"email": true, "lastName": true, "firstName": true}, "updated": {"email": "updated_email@budolpay.com", "lastName": "UpdatedLast", "firstName": "UpdatedFirst"}, "previous": {"email": "test_profile_update@budolpay.com", "lastName": "User", "firstName": "Test"}, "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
2e779f9b-7ff2-4130-9308-ac2075de2a6e	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:52:25.4	\N	\N	\N	\N	\N	{"device": "dev_1771483230799_8190", "deviceId": "dev_1771483230799_8190", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
63f73f30-0f93-40d7-a401-28a2817efd02	\N	SECURITY_OTP_VERIFIED	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:52:37.172	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771483230799_8190", "status": "SUCCESS", "deviceId": "dev_1771483230799_8190", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:52:37.170Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
61510ad4-cca4-4016-a000-6e60dc93f721	\N	SECURITY_MOBILE_PIN_SETUP	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::ffff:192.168.1.2	\N	2026-02-18 22:52:44.202	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-18T22:52:44.200Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
c0a6ff87-e4e7-472e-8551-3acfb2b55a8f	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-19 09:43:36.328	\N	\N	\N	\N	\N	{"device": "dev_test_123", "deviceId": "dev_test_123", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
10302a9b-0b04-4cd1-b674-4e510512d364	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-19 09:43:36.452	\N	\N	\N	\N	\N	{"device": "dev_test_123", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_test_123", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
36c7b58f-bcda-4946-b9f1-4bcf08700d61	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	943ecea0-1e28-4928-bb90-c544dbc89b68	null	null	::1	\N	2026-02-19 09:57:08.81	\N	\N	\N	\N	\N	{"device": "dev_test_123", "deviceId": "dev_test_123", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
33ad1fd1-4db6-4bdf-aff5-076f54960396	\N	SECURITY_QUICK_REG_INIT	Security	220433ed-0061-4f7a-a90e-ab44711cbee1	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:47:37.6	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
0555517a-9c5d-4e16-976f-cfc1be932632	\N	SECURITY_QUICK_REG_INIT	Security	f5bad8e1-f195-4bed-ae4c-c0e7c199f9b0	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:35:28.421	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
125fb766-42b9-4187-9e0a-f4d2c7c845c6	\N	SECURITY_QUICK_REG_INIT	Security	a7531045-4e03-40bb-96a9-a82cf9b42aca	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:35:28.5	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
d946d0f5-3116-4e1f-af92-bf94a1758ad1	\N	SECURITY_OTP_VERIFIED	Security	a7531045-4e03-40bb-96a9-a82cf9b42aca	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:35:28.532	\N	\N	\N	\N	\N	{"type": "SMS", "device": "jest-device-123", "status": "SUCCESS", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "timestamp": "2026-02-19T10:35:28.530Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
eb9cf48f-06d0-4291-b9fa-938a47dfa808	\N	SECURITY_QUICK_REG_INIT	Security	0c2261a9-426c-4ab9-a872-e3d857f18f9b	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:35:46.343	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
904e183f-af77-4b9c-8468-d05bc485b1cf	\N	SECURITY_QUICK_REG_INIT	Security	c93b2aa0-8d9c-4476-a478-10e115b951d0	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:35:46.398	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
771fe947-d48d-4d68-8db0-f2a607b1914e	\N	SECURITY_OTP_VERIFIED	Security	c93b2aa0-8d9c-4476-a478-10e115b951d0	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:35:46.417	\N	\N	\N	\N	\N	{"type": "SMS", "device": "jest-device-123", "status": "SUCCESS", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "timestamp": "2026-02-19T10:35:46.415Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
60edb45d-c910-42f8-bb86-086f8cf9e4b1	\N	SECURITY_QUICK_REG_INIT	Security	6f1c095e-a2fd-41c4-bf2f-4d6d805f0d9f	null	null	::1	\N	2026-02-19 12:02:33.785	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "device-1771502553564", "deviceId": "device-1771502553564", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
65f397ac-8766-4840-a800-84d605b6bf48	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	6f1c095e-a2fd-41c4-bf2f-4d6d805f0d9f	null	null	::1	\N	2026-02-19 12:02:33.804	\N	\N	\N	\N	\N	{"device": "device-1771502553799", "deviceId": "device-1771502553799", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
3c3c1fc8-c053-494f-814a-2bbd205dde16	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	6f1c095e-a2fd-41c4-bf2f-4d6d805f0d9f	null	null	::1	\N	2026-02-19 12:08:02.982	\N	\N	\N	\N	\N	{"device": "device-1771502882974", "deviceId": "device-1771502882974", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
6e58080c-be33-4856-8ecb-bfe0702e2ca7	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	6f1c095e-a2fd-41c4-bf2f-4d6d805f0d9f	null	null	::1	\N	2026-02-19 12:23:45.866	\N	\N	\N	\N	\N	{"device": "device-1771503825860", "deviceId": "device-1771503825860", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
173a49a2-0a58-4d96-851a-80c68fccd932	\N	SECURITY_QUICK_REG_INIT	Security	d076283e-f171-4fc0-8a6f-9cb566a4a5d7	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:47:37.677	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
b0f6d395-f7b1-4a51-886b-b3cfe5e31fe7	\N	SECURITY_OTP_VERIFIED	Security	d076283e-f171-4fc0-8a6f-9cb566a4a5d7	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:47:37.706	\N	\N	\N	\N	\N	{"type": "SMS", "device": "jest-device-123", "status": "SUCCESS", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "timestamp": "2026-02-19T10:47:37.704Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
34d979e3-6fc6-43b0-8698-e51e1934cd53	\N	SECURITY_QUICK_REG_INIT	Security	a95c979a-4591-4f76-bd16-43943990ff6d	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:49:56.684	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "jest-device-123", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
d83829fc-8190-4ecf-bdce-767274d1041f	\N	SECURITY_QUICK_REG_INIT	Security	ffbd6c35-badd-413d-91a4-eff600a6df94	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:49:56.753	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:127.0.0.1", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
056a9e14-c2e7-499f-9188-9039dcb73d5d	\N	SECURITY_OTP_VERIFIED	Security	ffbd6c35-badd-413d-91a4-eff600a6df94	null	null	::ffff:127.0.0.1	\N	2026-02-19 10:49:56.779	\N	\N	\N	\N	\N	{"type": "SMS", "device": "jest-device-123", "status": "SUCCESS", "deviceId": "jest-device-123", "ipAddress": "::ffff:127.0.0.1", "timestamp": "2026-02-19T10:49:56.777Z", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
f3160135-42ed-45c2-ad2f-df47bc925af1	\N	SECURITY_QUICK_REG_INIT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:45:29.514	\N	\N	\N	\N	\N	{"mode": "QUICK_PHONE_ONLY", "device": "dev_1771494035635_6714", "deviceId": "dev_1771494035635_6714", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
b968f3b9-f41c-411b-9d01-0c18ecdf4e0d	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:45:43.608	\N	\N	\N	\N	\N	{"type": "REGISTRATION", "device": "dev_1771494035635_6714", "status": "SUCCESS", "deviceId": "dev_1771494035635_6714", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T01:45:43.607Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
d022dd3d-28aa-48f3-9e31-32fd78385e79	\N	SECURITY_MOBILE_PIN_SETUP	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:45:51.383	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T01:45:51.382Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
726a3d22-7721-430a-998a-2e0c4242d4c0	\N	PROFILE_UPDATE	User	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:49:46.512	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "changes": {"email": true, "lastName": true, "firstName": true}, "updated": {"email": "marijoy@omsmpc.com", "lastName": "Buenaventura", "firstName": "Marijoy"}, "previous": {"email": "09484099405@budol.temp", "lastName": "Quick-Reg", "firstName": "Budol User"}, "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1f8d7f4b-d8f8-4177-830e-3b9cadfffa1a	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:50:37.311	\N	\N	\N	\N	\N	{"device": "dev_1771494035635_6714", "deviceId": "dev_1771494035635_6714", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
4e650c00-105f-40ab-9210-8e25b197346c	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:50:55.803	\N	\N	\N	\N	\N	{"device": "dev_1771494035635_6714", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771494035635_6714", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T01:50:55.802Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
3676c0ba-8516-459c-832e-9761a4cf71b4	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:56:08.132	\N	\N	\N	\N	\N	{"device": "dev_1771494035635_6714", "deviceId": "dev_1771494035635_6714", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
42464f1f-686d-4b0d-90e1-72a14fc58b99	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:56:12.038	\N	\N	\N	\N	\N	{"device": "dev_1771494035635_6714", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771494035635_6714", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T01:56:12.036Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e8aa4801-87f9-4cd5-b413-dad8b890760c	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:58:49.744	\N	\N	\N	\N	\N	{"device": "dev_1771495116961_9648", "deviceId": "dev_1771495116961_9648", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
a8a8a98e-cb47-46e5-8310-2db3b2dea59d	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:58:59.773	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771495116961_9648", "status": "SUCCESS", "deviceId": "dev_1771495116961_9648", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T01:58:59.771Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
836cb0ec-7274-4a1c-b706-081f6a0a3c7a	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 01:59:04.926	\N	\N	\N	\N	\N	{"device": "dev_1771495116961_9648", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771495116961_9648", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T01:59:04.924Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
0c3fde4c-e36a-45c8-a974-3af55f8b15e1	\N	SECURITY_LOGOUT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:05:32.252	\N	\N	\N	\N	\N	{"device": "dev_1771495116961_9648", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:05:32.250Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
5f73449a-09ed-47a5-8ce5-956278eff221	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:05:46.887	\N	\N	\N	\N	\N	{"device": "dev_1771495116961_9648", "deviceId": "dev_1771495116961_9648", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
a2937500-592b-44d9-842e-a06955262045	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:05:56.365	\N	\N	\N	\N	\N	{"device": "dev_1771495116961_9648", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771495116961_9648", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:05:56.364Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
2c08472d-61c9-4376-89d0-7b823d5603ad	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:09:41.251	\N	\N	\N	\N	\N	{"device": "dev_1771495765116_2043", "deviceId": "dev_1771495765116_2043", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
fd71de8a-dbd7-4ec2-ad11-00dd557cb4f6	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:09:51.309	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771495765116_2043", "status": "SUCCESS", "deviceId": "dev_1771495765116_2043", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:09:51.308Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
bb5b8f4d-6139-48bf-87df-eb1b135558f4	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:09:56.841	\N	\N	\N	\N	\N	{"device": "dev_1771495765116_2043", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771495765116_2043", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:09:56.840Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
de53e2b6-e3d5-41e3-9703-6f497000420e	\N	SECURITY_LOGOUT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:41:28.302	\N	\N	\N	\N	\N	{"device": "dev_1771495765116_2043", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:41:28.300Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
01738b7e-946c-471a-a9f5-6893748447eb	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:41:41.145	\N	\N	\N	\N	\N	{"device": "dev_1771495765116_2043", "deviceId": "dev_1771495765116_2043", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
91240c90-0492-4e7e-89e7-d3f5f6507b48	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:41:46.652	\N	\N	\N	\N	\N	{"device": "dev_1771495765116_2043", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771495765116_2043", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:41:46.650Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
35674704-49c3-4da9-82d4-5eb93f9badc3	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:43:11.072	\N	\N	\N	\N	\N	{"device": "dev_1771497777822_8397", "deviceId": "dev_1771497777822_8397", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
ae6bacbd-165a-4d9b-b318-578f4b9b4c39	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:43:27.262	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771497777822_8397", "status": "SUCCESS", "deviceId": "dev_1771497777822_8397", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:43:27.260Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
02b19a73-0c22-4f59-bd1e-8ea71b220fff	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:43:31.044	\N	\N	\N	\N	\N	{"device": "dev_1771497777822_8397", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771497777822_8397", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:43:31.043Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
7ec25936-169c-4eeb-82ac-fee0566e0cca	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:46:19.67	\N	\N	\N	\N	\N	{"device": "dev_1771497967682_7137", "deviceId": "dev_1771497967682_7137", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
3191c0a4-fc1b-4543-b274-6a18037ff34f	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:46:28.574	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771497967682_7137", "status": "SUCCESS", "deviceId": "dev_1771497967682_7137", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:46:28.573Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
5c444757-3ca0-4d96-9a4f-99520fcb8ca2	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 02:46:33.371	\N	\N	\N	\N	\N	{"device": "dev_1771497967682_7137", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771497967682_7137", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T02:46:33.369Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
73adc3c2-6061-443d-bb26-e371dea3d79b	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:20:22.744	\N	\N	\N	\N	\N	{"device": "dev_1771497967682_7137", "deviceId": "dev_1771497967682_7137", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
9623d2bc-f306-4c5d-8fb8-4a91be79b454	\N	SECURITY_MOBILE_LOGIN_PIN_FAILED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:20:27.126	\N	\N	\N	\N	\N	{"device": "dev_1771497967682_7137", "method": "PIN", "reason": "INCORRECT_PIN", "status": "FAILURE", "deviceId": "dev_1771497967682_7137", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
ac8be91f-0326-40e2-9fd5-5ada1fad0dcf	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:20:28.763	\N	\N	\N	\N	\N	{"device": "dev_1771497967682_7137", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771497967682_7137", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T08:20:28.761Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1462df4b-e5af-4081-9d6e-a18508d0697a	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:23:48.014	\N	\N	\N	\N	\N	{"device": "dev_1771518214178_2601", "deviceId": "dev_1771518214178_2601", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
d2bc2855-0b46-4456-9a99-0b25af266d37	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:23:57.481	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771518214178_2601", "status": "SUCCESS", "deviceId": "dev_1771518214178_2601", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T08:23:57.479Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
43331e66-79bc-4624-b64f-70b83b65a59b	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:24:01.786	\N	\N	\N	\N	\N	{"device": "dev_1771518214178_2601", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771518214178_2601", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T08:24:01.784Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
01da01a7-9810-4d0d-8ba0-109593d970d8	\N	SECURITY_LOGOUT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:31:38.924	\N	\N	\N	\N	\N	{"device": "dev_1771518214178_2601", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T08:31:38.922Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
7ddd94e6-3242-474e-82d4-ab175255a70e	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:31:51.001	\N	\N	\N	\N	\N	{"device": "dev_1771518214178_2601", "deviceId": "dev_1771518214178_2601", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
df28475e-fa6b-40f4-8c2c-a9f958a917db	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:31:54.774	\N	\N	\N	\N	\N	{"device": "dev_1771518214178_2601", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771518214178_2601", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T08:31:54.772Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
72dd6aca-075d-4796-ae73-1dbfce589b66	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:34:04.213	\N	\N	\N	\N	\N	{"device": "dev_1771518829774_7965", "deviceId": "dev_1771518829774_7965", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
ac197214-7534-49b1-8540-02b25f24033d	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:34:13.575	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771518829774_7965", "status": "SUCCESS", "deviceId": "dev_1771518829774_7965", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T08:34:13.573Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
7ff72dbd-9218-4208-918e-aa9c7a19f77c	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 08:34:17.133	\N	\N	\N	\N	\N	{"device": "dev_1771518829774_7965", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771518829774_7965", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T08:34:17.131Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
344d472c-ae13-452c-9296-1b53a1999dbd	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::1	\N	2026-02-19 08:42:06.163	\N	\N	\N	\N	\N	{"device": "TEST_DEVICE_ID", "deviceId": "TEST_DEVICE_ID", "ipAddress": "::1", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
ccda0d54-38f1-46df-a96c-a848a847de8e	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::1	\N	2026-02-19 08:42:06.227	\N	\N	\N	\N	\N	{"type": "SMS", "device": "TEST_DEVICE_ID", "status": "SUCCESS", "deviceId": "TEST_DEVICE_ID", "ipAddress": "::1", "timestamp": "2026-02-19T08:42:06.226Z", "userAgent": "axios/1.13.4", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
e44f3cae-6738-4fd8-9397-45ae3530ae6c	\N	SECURITY_LOGOUT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 10:20:45.607	\N	\N	\N	\N	\N	{"device": "dev_1771518829774_7965", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T10:20:45.604Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
4b41dde3-ba55-4fd9-9832-1085588799aa	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 10:21:17.015	\N	\N	\N	\N	\N	{"device": "dev_1771525262950_9549", "deviceId": "dev_1771525262950_9549", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
ac8e65dd-ccf6-4c2a-898d-36e5a98b4d7d	\N	SECURITY_OTP_RESENT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 10:27:57.036	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T10:27:57.035Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
31647998-e02c-47a8-a6c2-4ec9b4bc0341	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 10:36:04.047	\N	\N	\N	\N	\N	{"device": "dev_1771525262950_9549", "deviceId": "dev_1771525262950_9549", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
cbaa2249-690d-48b8-9b5a-c1f8919506df	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 10:39:55.78	\N	\N	\N	\N	\N	{"device": "dev_1771526380886_8973", "deviceId": "dev_1771526380886_8973", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
d43453f9-860d-488d-9b83-4996568fac3e	\N	SECURITY_OTP_RESENT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 10:40:57.129	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T10:40:57.127Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
5aac15b3-e95b-43d7-a5a1-48f1b874e0a6	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:27:57.37	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
adb823f6-8502-4fe3-a1dc-47a397d2fee9	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:28:08.305	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771532781497_5472", "status": "SUCCESS", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:28:08.303Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
124697e7-ea75-4211-8a50-acd63b794a50	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:28:16.486	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:28:16.485Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
2db608f8-8ff8-4d5e-9572-4e6c5f04f71b	\N	PROFILE_UPDATE	User	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:28:25.189	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "changes": {"email": false, "lastName": false, "firstName": false}, "updated": {"email": "marijoy@omsmpc.com", "lastName": "Buenaventura", "firstName": "Marijoy"}, "previous": {"email": "marijoy@omsmpc.com", "lastName": "Buenaventura", "firstName": "Marijoy"}, "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
7167f03a-42e5-4804-b1db-54567d078b40	\N	SECURITY_LOGOUT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:28:37.247	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:28:37.245Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
2696832a-f88d-43e5-8c71-31bfe7d7c9a5	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:28:48.914	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
639a51ee-9654-4407-9de3-67d761285d48	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:28:52.426	\N	\N	\N	\N	\N	{"device": "dev_1771532781497_5472", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771532781497_5472", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:28:52.424Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
ad101785-9c71-40cf-aeb4-7c19503e8f72	\N	PROFILE_UPDATE	User	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:29:02.853	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "changes": {"email": false, "lastName": false, "firstName": false}, "updated": {"email": "marijoy@omsmpc.com", "lastName": "Buenaventura", "firstName": "Marijoy"}, "previous": {"email": "marijoy@omsmpc.com", "lastName": "Buenaventura", "firstName": "Marijoy"}, "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
fe57e825-d9a8-4291-8bd5-33210ccc9418	\N	PROFILE_UPDATE	User	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:30:00.834	\N	\N	\N	\N	\N	{"device": "UNKNOWN_DEVICE", "changes": {"email": false, "lastName": false, "firstName": false}, "updated": {"email": "marijoy@omsmpc.com", "lastName": "Buenaventura", "firstName": "Marijoy"}, "previous": {"email": "marijoy@omsmpc.com", "lastName": "Buenaventura", "firstName": "Marijoy"}, "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
101709e4-fec9-433b-a4bb-dc778ffa3746	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:58:01.129	\N	\N	\N	\N	\N	{"device": "dev_1771534537138_2241", "deviceId": "dev_1771534537138_2241", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
a16e1b5f-70a0-4706-98a1-19a8b81447f3	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:58:10.549	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771534537138_2241", "status": "SUCCESS", "deviceId": "dev_1771534537138_2241", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:58:10.547Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
c7f16f1b-03e7-47c4-b43e-35c37fe296ea	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 12:58:14.109	\N	\N	\N	\N	\N	{"device": "dev_1771534537138_2241", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771534537138_2241", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T12:58:14.107Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
0964346a-c24a-41d0-a2c7-380c7a230bc6	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:05:41.988	\N	\N	\N	\N	\N	{"device": "dev_1771535113822_8397", "deviceId": "dev_1771535113822_8397", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
2f71a1d4-3d04-4065-bf60-0a9962551202	\N	SECURITY_OTP_RESENT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:07:02.804	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "UNKNOWN_DEVICE", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:07:02.800Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
216b428c-fef2-4a62-97f6-14456a885c4e	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:07:14.357	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771535113822_8397", "status": "SUCCESS", "deviceId": "dev_1771535113822_8397", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:07:14.356Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
66754fb5-0e3d-4998-9999-29eb09d08f56	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:07:18.296	\N	\N	\N	\N	\N	{"device": "dev_1771535113822_8397", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771535113822_8397", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:07:18.295Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
32c3eb16-fbe0-4f4a-9685-8b27f1083e73	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:12:00.175	\N	\N	\N	\N	\N	{"device": "dev_1771535113822_8397", "deviceId": "dev_1771535113822_8397", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
3a98e73a-e8d9-4334-9834-a35b62bafb4c	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:12:03.435	\N	\N	\N	\N	\N	{"device": "dev_1771535113822_8397", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771535113822_8397", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:12:03.433Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
db6c28a3-fb42-4609-bf5b-30f7a0b58f41	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:14:36.412	\N	\N	\N	\N	\N	{"device": "dev_1771535659590_6309", "deviceId": "dev_1771535659590_6309", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
1b959409-a605-4141-afca-3df10d706ba8	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:14:49.432	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771535659590_6309", "status": "SUCCESS", "deviceId": "dev_1771535659590_6309", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:14:49.431Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
8cec7e71-4307-4c9e-958d-15e015e5a09f	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:14:53.995	\N	\N	\N	\N	\N	{"device": "dev_1771535659590_6309", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771535659590_6309", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:14:53.993Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
3f8a0ce9-25e3-422e-b700-91b5b917b797	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:19:07.096	\N	\N	\N	\N	\N	{"device": "dev_1771535931205_2844", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
0b2062b6-7fdf-4ffd-9644-c1e7354ecb5b	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:19:23.967	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771535931205_2844", "status": "SUCCESS", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:19:23.966Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
337e644a-2eed-4c14-b1b9-351eb85a3cce	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:19:27.695	\N	\N	\N	\N	\N	{"device": "dev_1771535931205_2844", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:19:27.694Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
60b1542f-df1e-4759-86b8-e3f946860178	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:24:21.634	\N	\N	\N	\N	\N	{"device": "dev_1771535931205_2844", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
369dbad5-54cb-46a8-926f-ee174eae01df	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:24:25.479	\N	\N	\N	\N	\N	{"device": "dev_1771535931205_2844", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:24:25.477Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
1a731f3b-457a-420b-b99b-18b2bf14581c	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:25:46.572	\N	\N	\N	\N	\N	{"device": "dev_1771535931205_2844", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
193453e5-8bae-4711-b2b3-44d25f86ede8	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:25:51.447	\N	\N	\N	\N	\N	{"device": "dev_1771535931205_2844", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771535931205_2844", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:25:51.445Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
9a1b2de6-fcd7-4a1c-b4b5-5439ce8c8019	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:37:16.127	\N	\N	\N	\N	\N	{"device": "dev_1771537021616_6543", "deviceId": "dev_1771537021616_6543", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
9c9a3fe5-e9a3-4149-8260-3c05805db0aa	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:37:24.028	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771537021616_6543", "status": "SUCCESS", "deviceId": "dev_1771537021616_6543", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:37:24.026Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
0c649327-2824-43e8-8e53-af03394b4b39	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:37:29.805	\N	\N	\N	\N	\N	{"device": "dev_1771537021616_6543", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771537021616_6543", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:37:29.804Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
b0a2b4ce-1389-4f1a-90df-64917bd2bcf9	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:43:11.79	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": false}
7e722ef2-b7b2-4648-b5aa-f7a468ea62ad	\N	SECURITY_OTP_VERIFIED	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:43:22.053	\N	\N	\N	\N	\N	{"type": "TRUST_DEVICE", "device": "dev_1771537360471_5238", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:43:22.052Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
c28e94cf-1799-4f22-b57b-503460313764	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:43:28.684	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:43:28.683Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
73ea4a47-9618-4434-954c-d273a0556f2e	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:51:58.032	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
ef3466f2-dace-4d01-8e1e-34ad290657df	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 13:52:03.356	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T13:52:03.355Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
cdf9c831-7c6b-4a94-9bfe-2490d798ab55	\N	SECURITY_LOGOUT	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-19 15:52:28.211	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "status": "SUCCESS", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-19T15:52:28.207Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
7e7862de-2971-4de9-83d9-6982fb0e7908	\N	SECURITY_MOBILE_IDENTIFY_SUCCESS	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-20 16:15:49.673	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}, "isDeviceTrusted": true}
753a7c6a-e8e2-46e8-8b29-41c5d6302c36	\N	SECURITY_MOBILE_LOGIN_PIN	Security	3e7e7b09-abe9-4a68-8035-887aa7ace8f2	null	null	::ffff:192.168.1.2	\N	2026-02-20 16:15:54.226	\N	\N	\N	\N	\N	{"device": "dev_1771537360471_5238", "method": "PIN", "status": "SUCCESS", "deviceId": "dev_1771537360471_5238", "ipAddress": "::ffff:192.168.1.2", "timestamp": "2026-02-20T16:15:54.225Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0", "compliance": {"bsp": "Circular 808", "pci_dss": "10.2.2"}}
\.


--
-- Data for Name: ChangeRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChangeRequest" (id, entity, "entityId", details, "makerId", "checkerId", status, reason, "createdAt", "updatedAt") FROM stdin;
4de28446-8ed1-41e6-b8f7-c413537113d3	User	b361327f-00ed-4214-9387-0668b77ecd0f	{"phoneNumber": "+639484099388"}	b361327f-00ed-4214-9387-0668b77ecd0f	\N	PENDING	\N	2026-02-28 17:51:54.796	2026-02-28 17:51:54.796
\.


--
-- Data for Name: ChartOfAccount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChartOfAccount" (id, code, name, type, description, "isActive", "createdAt") FROM stdin;
0b41f11b-2bae-48d6-928d-30a42020a16e	1000	Cash at Bank	ASSET	Main operating bank account	t	2026-02-15 07:55:19.748
3b5ef148-7a14-4628-a651-99f3e3a18fe8	1010	User Wallet Balances	LIABILITY	Total funds held for users	t	2026-02-15 07:55:19.75
0ae1752a-6d56-496a-a2f7-2a6a11d4bcc4	2000	Accounts Payable	LIABILITY	Pending payouts to merchants/partners	t	2026-02-15 07:55:19.75
7b9fcadc-a8b1-4e09-8f35-5e77bb330a2c	3000	Retained Earnings	EQUITY	Accumulated profits	t	2026-02-15 07:55:19.751
6c514f2b-b5e2-4df7-87ca-3823285206d6	4000	Transaction Fees Revenue	REVENUE	Revenue from processing fees	t	2026-02-15 07:55:19.752
aa6909bc-df65-4691-83c6-fb1dbaf2fc01	5000	Bank Charges	EXPENSE	Fees charged by payment providers/banks	t	2026-02-15 07:55:19.752
\.


--
-- Data for Name: Dispute; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Dispute" (id, "transactionId", reason, status, "createdAt", "resolvedAt") FROM stdin;
\.


--
-- Data for Name: EcosystemApp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EcosystemApp" (id, name, "apiKey", "redirectUri", "createdAt", "apiSecret") FROM stdin;
c0cfe255-b933-4a8b-a3ec-d51b550992ce	budolPay	bp_key_2025	http://192.168.1.14:3000/auth/callback	2026-02-15 07:55:19.743	bp_secret_2025
1a411de8-8434-4372-a9a1-0ff0b35b2176	budolShap	bs_key_2025	http://192.168.1.14:3001/auth/callback	2026-02-15 07:55:19.746	bs_secret_2025
cefdebb3-8522-4eba-96bf-05b275412da0	budolExpress	be_key_2025	http://192.168.1.14:3002/auth/callback	2026-02-15 07:55:19.747	be_secret_2025
\.


--
-- Data for Name: FavoriteRecipient; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FavoriteRecipient" (id, "userId", "recipientId", alias, "createdAt") FROM stdin;
\.


--
-- Data for Name: LedgerEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LedgerEntry" (id, "accountId", "transactionId", "referenceId", description, debit, credit, "createdAt") FROM stdin;
164ecaf6-c07a-4f5d-855c-bae9bd014c3c	0b41f11b-2bae-48d6-928d-30a42020a16e	19967149-4f31-441e-afdd-abd3be703de1	CI-9AC89647	Cash In: Deposit	500.00	0.00	2026-02-16 01:27:20.568
24864914-c0a3-4667-b6eb-e097bce8c7fb	3b5ef148-7a14-4628-a651-99f3e3a18fe8	19967149-4f31-441e-afdd-abd3be703de1	CI-9AC89647	Cash In: Deposit	0.00	500.00	2026-02-16 01:27:20.573
16f2f39b-2965-4761-a495-d9062f403759	0b41f11b-2bae-48d6-928d-30a42020a16e	f1138975-d740-4089-88b2-b55a726b2c17	CI-6AFFAEE0	Cash In: Deposit	900.00	0.00	2026-02-17 08:00:04.638
72225ba0-1dba-4d20-96fd-7ca09e2872cf	3b5ef148-7a14-4628-a651-99f3e3a18fe8	f1138975-d740-4089-88b2-b55a726b2c17	CI-6AFFAEE0	Cash In: Deposit	0.00	900.00	2026-02-17 08:00:04.646
bfd64d56-23e5-455e-beee-e9f10eac5abb	0b41f11b-2bae-48d6-928d-30a42020a16e	6656028e-3bdc-4238-8b82-0b72502f83ed	CI-19D548CD	Cash In: Deposit	900.00	0.00	2026-02-17 08:00:20.517
75560ab3-7182-44f4-a919-d427a2168b3c	3b5ef148-7a14-4628-a651-99f3e3a18fe8	6656028e-3bdc-4238-8b82-0b72502f83ed	CI-19D548CD	Cash In: Deposit	0.00	900.00	2026-02-17 08:00:20.518
c9237865-a34c-49b2-9809-ca29a5a602c9	0b41f11b-2bae-48d6-928d-30a42020a16e	49b76e65-5695-4aac-ac03-962d79325d13	CI-C05DE397	Cash In: Deposit	500.00	0.00	2026-02-17 08:00:33.947
9a01f919-34ab-48fb-aa4f-45a460aac88b	3b5ef148-7a14-4628-a651-99f3e3a18fe8	49b76e65-5695-4aac-ac03-962d79325d13	CI-C05DE397	Cash In: Deposit	0.00	500.00	2026-02-17 08:00:33.948
c65136bc-9a26-4159-aa77-6e7d53f4c183	0b41f11b-2bae-48d6-928d-30a42020a16e	8b904749-27cd-4cb2-881e-6d49581de541	CI-424F924D	Cash In: Deposit	800.00	0.00	2026-02-17 08:00:46.462
472eaa3b-0fa5-45d8-b2ed-8499b8d7cc2f	3b5ef148-7a14-4628-a651-99f3e3a18fe8	8b904749-27cd-4cb2-881e-6d49581de541	CI-424F924D	Cash In: Deposit	0.00	800.00	2026-02-17 08:00:46.463
f05ce8f2-4ba3-499b-a094-dfb9556e2a85	0b41f11b-2bae-48d6-928d-30a42020a16e	278c8708-2b09-40b0-8e4d-92caef2e60a6	CI-975CC717	Cash In: Deposit	45.00	0.00	2026-02-17 08:01:24.538
9ad9cf2d-8802-4073-a3b2-ee11e84c50cc	3b5ef148-7a14-4628-a651-99f3e3a18fe8	278c8708-2b09-40b0-8e4d-92caef2e60a6	CI-975CC717	Cash In: Deposit	0.00	45.00	2026-02-17 08:01:24.539
021a5e52-daa1-4968-93c3-75929491bd21	0b41f11b-2bae-48d6-928d-30a42020a16e	9fc4261b-bb7f-4176-a2a6-2e135366a2be	CI-C9364837	Cash In: Deposit	500.00	0.00	2026-02-18 10:48:10.143
a10e8438-8905-49c4-b900-6f82c0b450d5	3b5ef148-7a14-4628-a651-99f3e3a18fe8	9fc4261b-bb7f-4176-a2a6-2e135366a2be	CI-C9364837	Cash In: Deposit	0.00	500.00	2026-02-18 10:48:10.146
65837743-9e44-45a6-b0a2-6a30a02910ef	0b41f11b-2bae-48d6-928d-30a42020a16e	62775aa2-ce63-4811-be14-bb8d7572a5df	CI-F1C45D90	Cash In: Deposit	500.00	0.00	2026-02-18 10:48:47.543
2fdd8dd9-246e-4c8f-b6b4-e634a100b058	3b5ef148-7a14-4628-a651-99f3e3a18fe8	62775aa2-ce63-4811-be14-bb8d7572a5df	CI-F1C45D90	Cash In: Deposit	0.00	500.00	2026-02-18 10:48:47.545
471197fd-79d5-4414-8a7d-90fd8bed4108	0b41f11b-2bae-48d6-928d-30a42020a16e	60a8c46e-1943-4904-9dec-b7c94dab5ad0	CI-38B19E26	Cash In: Deposit	800.00	0.00	2026-02-18 10:49:01.038
13ce59cf-af09-487b-88c4-daae473b19b5	3b5ef148-7a14-4628-a651-99f3e3a18fe8	60a8c46e-1943-4904-9dec-b7c94dab5ad0	CI-38B19E26	Cash In: Deposit	0.00	800.00	2026-02-18 10:49:01.04
603f1449-5114-4663-9e04-ad317d0c7276	0b41f11b-2bae-48d6-928d-30a42020a16e	d9dbfd45-79e6-43df-841a-adbd59c297cd	CI-7668BFFF	Cash In: Deposit	200.00	0.00	2026-02-18 10:49:15.446
f1ca56ac-222b-40bc-985c-e3aea04068af	3b5ef148-7a14-4628-a651-99f3e3a18fe8	d9dbfd45-79e6-43df-841a-adbd59c297cd	CI-7668BFFF	Cash In: Deposit	0.00	200.00	2026-02-18 10:49:15.447
f476ff43-aa34-4925-964c-6bef7836a15a	0b41f11b-2bae-48d6-928d-30a42020a16e	f45dd09c-f4ea-4177-bf89-6867e36d627b	CI-0A732456	Cash In: Deposit	900.00	0.00	2026-02-18 10:49:27.541
74f55c60-b1b0-44f2-9ec3-737c2780372e	3b5ef148-7a14-4628-a651-99f3e3a18fe8	f45dd09c-f4ea-4177-bf89-6867e36d627b	CI-0A732456	Cash In: Deposit	0.00	900.00	2026-02-18 10:49:27.542
4a3cc09e-5fd2-4f47-8c28-c38bd8d6b8f2	0b41f11b-2bae-48d6-928d-30a42020a16e	cd39b4eb-f2f2-44b5-8676-3ae1dfc22d5b	CI-855828D3	Cash In: Deposit	100.00	0.00	2026-02-18 10:49:42.516
46c56c47-fdc3-4bfb-9b7c-d0d268cd7226	3b5ef148-7a14-4628-a651-99f3e3a18fe8	cd39b4eb-f2f2-44b5-8676-3ae1dfc22d5b	CI-855828D3	Cash In: Deposit	0.00	100.00	2026-02-18 10:49:42.518
cac071ec-1af6-44cd-825d-0ff69c330be2	0b41f11b-2bae-48d6-928d-30a42020a16e	2d0190c7-f6f7-43e8-86be-122d41e9b509	CI-9013BABA	Cash In: Deposit	700.00	0.00	2026-02-18 10:50:09.173
09315915-160c-4897-a4dc-1291f0c837a3	3b5ef148-7a14-4628-a651-99f3e3a18fe8	2d0190c7-f6f7-43e8-86be-122d41e9b509	CI-9013BABA	Cash In: Deposit	0.00	700.00	2026-02-18 10:50:09.174
12a0650c-8187-424b-a4bc-631fbb6e213a	0b41f11b-2bae-48d6-928d-30a42020a16e	3f193e2d-0466-44ce-a5a0-f294b6040b95	CI-A5C83DEC	Cash In: Deposit	300.00	0.00	2026-02-18 10:50:43.851
5ab36783-7f11-47aa-8eb0-5f1c5772e1ec	3b5ef148-7a14-4628-a651-99f3e3a18fe8	3f193e2d-0466-44ce-a5a0-f294b6040b95	CI-A5C83DEC	Cash In: Deposit	0.00	300.00	2026-02-18 10:50:43.853
84ab6152-0966-4a83-a1d7-a45d69db867b	0b41f11b-2bae-48d6-928d-30a42020a16e	82d0913e-3730-4f8f-8c99-639ebb16e93d	CI-EE038787	Cash In: Deposit	48.00	0.00	2026-02-21 12:57:44.418
8d9acfa8-7ab6-4054-b6a2-3a7e7e2e82ba	3b5ef148-7a14-4628-a651-99f3e3a18fe8	82d0913e-3730-4f8f-8c99-639ebb16e93d	CI-EE038787	Cash In: Deposit	0.00	48.00	2026-02-21 12:57:44.427
6bda8b26-c0c0-41f6-95f5-a9bea2a2f046	0b41f11b-2bae-48d6-928d-30a42020a16e	b0d40626-7217-4612-a42d-24d240c9e40b	CI-7BE14934	Cash In: Deposit	900.00	0.00	2026-02-28 15:11:50.089
50cc98dd-0148-487b-aff4-ef7f5a5e9968	3b5ef148-7a14-4628-a651-99f3e3a18fe8	b0d40626-7217-4612-a42d-24d240c9e40b	CI-7BE14934	Cash In: Deposit	0.00	900.00	2026-02-28 15:11:50.095
f41b2588-ec0e-48eb-9d29-658bb3aa07f9	0b41f11b-2bae-48d6-928d-30a42020a16e	c982a832-2d3f-4a50-b226-2af91a5b879c	CI-87CE50C0	Cash In: Deposit	900.00	0.00	2026-02-28 15:12:07.375
a52a10a3-4300-4dea-baf5-d94d4ce00070	3b5ef148-7a14-4628-a651-99f3e3a18fe8	c982a832-2d3f-4a50-b226-2af91a5b879c	CI-87CE50C0	Cash In: Deposit	0.00	900.00	2026-02-28 15:12:07.376
b744cc58-c2a7-4924-be62-e8afd3255a0e	0b41f11b-2bae-48d6-928d-30a42020a16e	80a16ab0-545a-433f-a0d7-3a371e199f1a	CI-E4094939	Cash In: Deposit	200.00	0.00	2026-02-28 15:12:18.254
757de1a7-e639-4c54-9fef-ecc28884f1a5	3b5ef148-7a14-4628-a651-99f3e3a18fe8	80a16ab0-545a-433f-a0d7-3a371e199f1a	CI-E4094939	Cash In: Deposit	0.00	200.00	2026-02-28 15:12:18.256
1b11f2d7-af2a-4458-b5b1-c8b9d20fa132	0b41f11b-2bae-48d6-928d-30a42020a16e	1dabb8eb-24ed-42fb-8284-fb2842557f9e	CI-4DD4E739	Cash In: Deposit	900.00	0.00	2026-02-28 15:48:14.381
d20d61bb-41b6-4cd1-b506-ef167a9a715e	3b5ef148-7a14-4628-a651-99f3e3a18fe8	1dabb8eb-24ed-42fb-8284-fb2842557f9e	CI-4DD4E739	Cash In: Deposit	0.00	900.00	2026-02-28 15:48:14.385
deca1599-abf6-482e-b66a-3fed624739ae	0b41f11b-2bae-48d6-928d-30a42020a16e	50b0b2c2-022f-4258-be83-5f10c78f4829	CI-8F1E935F	Cash In: Deposit	900.00	0.00	2026-02-28 15:48:22.228
5dda6e11-c0f8-4739-9fe7-b33516d84107	3b5ef148-7a14-4628-a651-99f3e3a18fe8	50b0b2c2-022f-4258-be83-5f10c78f4829	CI-8F1E935F	Cash In: Deposit	0.00	900.00	2026-02-28 15:48:22.229
d140b90f-5ff4-4734-9ba2-d1fab94363f4	0b41f11b-2bae-48d6-928d-30a42020a16e	2bdbb250-44a0-45a3-9158-289ed92df2a3	CI-B23C750E	Cash In: Deposit	900.00	0.00	2026-02-28 15:48:32.122
32ac56ff-df85-4d8c-8325-aa0931e39418	3b5ef148-7a14-4628-a651-99f3e3a18fe8	2bdbb250-44a0-45a3-9158-289ed92df2a3	CI-B23C750E	Cash In: Deposit	0.00	900.00	2026-02-28 15:48:32.123
a9eed338-edf0-4296-80bb-3012e9d2b369	0b41f11b-2bae-48d6-928d-30a42020a16e	f36c1110-cc56-419d-bdbe-6ae3f090da38	CI-23D1709D	Cash In: Deposit	900.00	0.00	2026-02-28 15:48:42.168
55ad404b-cd24-4d9d-8441-d498ebb4ed54	3b5ef148-7a14-4628-a651-99f3e3a18fe8	f36c1110-cc56-419d-bdbe-6ae3f090da38	CI-23D1709D	Cash In: Deposit	0.00	900.00	2026-02-28 15:48:42.169
8bbc23de-013d-4855-b58b-4c11cb94d748	0b41f11b-2bae-48d6-928d-30a42020a16e	6b03fa80-a39d-4446-b252-6a63d561b5a9	CI-368755B0	Cash In: Deposit	900.00	0.00	2026-02-28 15:49:01.515
5a54105e-274f-42f9-a2d6-f1d3a5689f58	3b5ef148-7a14-4628-a651-99f3e3a18fe8	6b03fa80-a39d-4446-b252-6a63d561b5a9	CI-368755B0	Cash In: Deposit	0.00	900.00	2026-02-28 15:49:01.516
00c127d6-6c02-4eba-a7a9-3282209506b7	0b41f11b-2bae-48d6-928d-30a42020a16e	0e62a589-05b0-4532-8e7d-ccbbebd03263	CI-79143E9E	Cash In: Deposit	500.00	0.00	2026-02-28 15:49:14.306
e231b570-98fe-4f04-babe-0cfcea92461a	3b5ef148-7a14-4628-a651-99f3e3a18fe8	0e62a589-05b0-4532-8e7d-ccbbebd03263	CI-79143E9E	Cash In: Deposit	0.00	500.00	2026-02-28 15:49:14.307
a297e5ae-e8e3-4901-bc55-956293d4da50	0b41f11b-2bae-48d6-928d-30a42020a16e	eeb32024-4083-43b1-adb2-9d196ebdfb22	CI-7DC9E4D1	Cash In: Deposit	900.00	0.00	2026-02-28 16:15:22.809
d65320d4-9b7d-43ec-94bd-fa6ca63ec113	3b5ef148-7a14-4628-a651-99f3e3a18fe8	eeb32024-4083-43b1-adb2-9d196ebdfb22	CI-7DC9E4D1	Cash In: Deposit	0.00	900.00	2026-02-28 16:15:22.812
c93dbaee-c0fe-4c35-a42b-66a52a191d26	0b41f11b-2bae-48d6-928d-30a42020a16e	2bdd814d-f56e-4b5c-8be5-a57cae8a852c	CI-2EEAF0C4	Cash In: Deposit	900.00	0.00	2026-02-28 16:15:36.059
96dffcf2-d3bc-4365-9a23-093b6da98146	3b5ef148-7a14-4628-a651-99f3e3a18fe8	2bdd814d-f56e-4b5c-8be5-a57cae8a852c	CI-2EEAF0C4	Cash In: Deposit	0.00	900.00	2026-02-28 16:15:36.06
754db53d-e370-422d-8f5e-f53503b82c80	0b41f11b-2bae-48d6-928d-30a42020a16e	1bd98422-acbb-42fe-8654-0dd136fac041	CI-1FA58B06	Cash In: Deposit	900.00	0.00	2026-02-28 16:15:49.503
b4f2928d-3948-4316-b7ff-390ed26fa502	3b5ef148-7a14-4628-a651-99f3e3a18fe8	1bd98422-acbb-42fe-8654-0dd136fac041	CI-1FA58B06	Cash In: Deposit	0.00	900.00	2026-02-28 16:15:49.504
84650573-d61a-4637-8b79-f3bf7e23313b	0b41f11b-2bae-48d6-928d-30a42020a16e	3170b8ee-1420-4a4f-85b7-96ddf2c4aa21	CI-8F4F9E1E	Cash In: Deposit	300.00	0.00	2026-02-28 16:16:04.945
2dd835ba-1afd-4669-9913-9a012b2e064f	3b5ef148-7a14-4628-a651-99f3e3a18fe8	3170b8ee-1420-4a4f-85b7-96ddf2c4aa21	CI-8F4F9E1E	Cash In: Deposit	0.00	300.00	2026-02-28 16:16:04.946
9afbb03b-5d57-4ed3-817c-a9583a540cf3	0b41f11b-2bae-48d6-928d-30a42020a16e	665eaeec-6df6-41c1-a2a4-f2eb31870f9a	CI-EDD670BE	Cash In: Deposit	900.00	0.00	2026-02-28 16:16:17.792
f9743290-e400-4d30-b574-ba74e46743c2	3b5ef148-7a14-4628-a651-99f3e3a18fe8	665eaeec-6df6-41c1-a2a4-f2eb31870f9a	CI-EDD670BE	Cash In: Deposit	0.00	900.00	2026-02-28 16:16:17.793
4c309a40-9431-4f32-ae07-3452a6c67484	0b41f11b-2bae-48d6-928d-30a42020a16e	93d087ea-1ebd-40a7-b2c3-8b4cf6aa7847	CI-BFC32AB5	Cash In: Deposit	100.00	0.00	2026-02-28 16:16:33.019
dfeba9f8-5dde-4234-8fef-75a80134d6c3	3b5ef148-7a14-4628-a651-99f3e3a18fe8	93d087ea-1ebd-40a7-b2c3-8b4cf6aa7847	CI-BFC32AB5	Cash In: Deposit	0.00	100.00	2026-02-28 16:16:33.021
\.


--
-- Data for Name: RateLimit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RateLimit" (id, key, hits, "expiresAt", "createdAt", "updatedAt") FROM stdin;
ee1c532b-4a48-4898-94f7-f4e0e9cc92bc	auth_login_192.168.1.14	3	2026-02-15 23:46:01.577	2026-02-15 08:06:49.761	2026-02-15 23:31:23.705
55a5dcea-6176-4675-8087-a528658bcffb	auth_login_192.168.1.2	2	2026-02-22 15:11:44.89	2026-02-19 09:39:27.759	2026-02-22 14:58:56.148
969d5744-6a66-46ff-9c48-39e6198eca7a	auth_login_192.168.1.18	1	2026-02-24 10:41:09.848	2026-02-24 10:26:09.865	2026-02-24 10:26:09.865
b976807c-540f-424b-b96e-80bbfd275cfc	auth_login_192.168.1.10	1	2026-02-28 15:29:07.529	2026-02-28 15:14:07.534	2026-02-28 15:14:07.534
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, "userId", token, "appId", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Settlement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Settlement" (id, "merchantId", amount, "feeDeducted", "netAmount", "periodStart", "periodEnd", "createdAt", "updatedAt", status) FROM stdin;
\.


--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SystemSetting" (id, key, value, "isSecret", description, "updatedAt", "appId", "createdAt", "group", "isActive") FROM stdin;
dde00ea7-f1ae-4b0b-9745-1270bda8eab4	AUTH_SERVICE_URL	http://192.168.1.14:8001	f	\N	2026-02-15 07:55:19.725	\N	2026-02-15 07:55:19.725	SYSTEM	t
a35a4f2a-79cf-43cb-8336-ecb38b00ae4b	WALLET_SERVICE_URL	http://192.168.1.14:8002	f	\N	2026-02-15 07:55:19.728	\N	2026-02-15 07:55:19.728	SYSTEM	t
11067c2b-0809-41b3-ad77-03fb811c0892	TRANSACTION_SERVICE_URL	http://192.168.1.14:8003	f	\N	2026-02-15 07:55:19.73	\N	2026-02-15 07:55:19.73	SYSTEM	t
26672624-ccc7-42a7-8463-705027e3626f	ACTIVE_PAYMENT_PROVIDER	paymongo	f	\N	2026-02-15 07:55:19.732	\N	2026-02-15 07:55:19.732	PAYMENT	t
21d79d23-0ec3-4eb1-9b99-0d720da62c3e	PAYMONGO_SECRET_KEY	sk_test_placeholder	f	\N	2026-02-15 07:55:19.733	\N	2026-02-15 07:55:19.733	PAYMENT	t
2444d4cb-1665-408f-be05-bad2e890d9fe	XENDIT_SECRET_KEY	xnd_test_placeholder	f	\N	2026-02-15 07:55:19.734	\N	2026-02-15 07:55:19.734	PAYMENT	t
01e5e35d-63ae-48fd-b25e-76a237a6ce1b	DRAGONPAY_MERCHANT_ID	example_id	f	\N	2026-02-15 07:55:19.735	\N	2026-02-15 07:55:19.735	PAYMENT	t
f60d8679-d092-448b-961d-ff5b1de3bb0b	emailProvider	GOOGLE	f	\N	2026-02-15 07:55:19.737	\N	2026-02-15 07:55:19.737	NOTIFICATION	t
c6104b7b-962a-47e1-a73b-bd3818d9543c	smsProvider	CONSOLE	f	\N	2026-02-15 07:55:19.738	\N	2026-02-15 07:55:19.738	NOTIFICATION	t
f2b0ee3d-8921-4b07-89db-2b23f00da932	smtpHost	smtp.gmail.com	f	\N	2026-02-15 07:55:19.74	\N	2026-02-15 07:55:19.74	NOTIFICATION	t
093e12fa-51dd-474d-a5a3-e7009d3f41d1	smtpPort	587	f	\N	2026-02-15 07:55:19.741	\N	2026-02-15 07:55:19.741	NOTIFICATION	t
3172aed6-2430-4299-b564-a38bb0770aef	REALTIME_METHOD	PUSHER	f	Setting for REALTIME_METHOD	2026-02-19 00:00:45.05	\N	2026-02-19 00:00:45.05	REALTIME	t
ae80aad2-d14b-4ec4-b2c9-9ac7d4884b9b	REALTIME_PUSHER_APP_ID	2090861	f	Setting for REALTIME_PUSHER_APP_ID	2026-02-19 00:00:45.053	\N	2026-02-19 00:00:45.053	REALTIME	t
1a8542e5-6c6f-4527-9bcd-ad4af7e29add	REALTIME_PUSHER_KEY	7c449017a85bda0ae88a	f	Setting for REALTIME_PUSHER_KEY	2026-02-19 00:00:45.054	\N	2026-02-19 00:00:45.054	REALTIME	t
51794bc5-bb7e-49b6-964e-136d55b3fe2a	REALTIME_PUSHER_SECRET	2ceb82a5951aa226ce93	f	Setting for REALTIME_PUSHER_SECRET	2026-02-19 00:00:45.055	\N	2026-02-19 00:00:45.055	REALTIME	t
2d5055e3-852b-4112-b99e-414db76ab30f	REALTIME_PUSHER_CLUSTER	ap1	f	Setting for REALTIME_PUSHER_CLUSTER	2026-02-19 00:00:45.056	\N	2026-02-19 00:00:45.056	REALTIME	t
7386f583-dd85-4412-87d4-797ffdee2542	REALTIME_SOCKETIO_URL		f	Setting for REALTIME_SOCKETIO_URL	2026-02-19 00:00:45.056	\N	2026-02-19 00:00:45.056	REALTIME	t
48f7d268-5385-4054-83f9-14a149dae9d8	REALTIME_SWR_REFRESH_INTERVAL		f	Setting for REALTIME_SWR_REFRESH_INTERVAL	2026-02-19 00:00:45.057	\N	2026-02-19 00:00:45.057	REALTIME	t
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, amount, type, status, description, "senderId", "receiverId", "referenceId", fee, "createdAt", "completedAt", "settlementId", metadata, "storeId", "storeName") FROM stdin;
d8c6c67e-e004-4b1f-8445-6092a6122c8a	1.00	MERCHANT_PAYMENT	PENDING	Order #cmlqaqrib0005gpow7nr8ezqu - budolPay	\N	\N	JON-20260217074326-23D8D003	0.00	2026-02-17 07:43:26.911	\N	\N	{"orderId":"cmlqaqrib0005gpow7nr8ezqu","app":"budolShap","storeName":"Stark Enterprise","customer_email":"joseph@omsmpc.com","customer_name":"Joseph Garcia"}	\N	\N
92fbf855-0520-404c-9fe5-163b74e80899	2412.00	MERCHANT_PAYMENT	PENDING	Order #cmlqbamgk000igpow97efnwlq - budolPay	\N	\N	JON-20260217075855-4451D5EC	0.00	2026-02-17 07:58:55.38	\N	\N	{"orderId":"cmlqbamgk000igpow97efnwlq","app":"budolShap","storeName":"Stark Enterprise","customer_email":"joseph@omsmpc.com","customer_name":"Joseph Garcia"}	\N	\N
c7b4865e-0456-4bc1-9cf7-7c7eb037d2ff	1302.00	MERCHANT_PAYMENT	PENDING	Order #cmlqs2y6v000agphwe5funmhy - budolPay	\N	\N	JON-20260217154847-81AD21DF	0.00	2026-02-17 15:48:47.966	\N	\N	{"orderId":"cmlqs2y6v000agphwe5funmhy","app":"budolShap","storeName":"Online Micro Sellers Multipurpose Cooperative","customer_email":"joseph@omsmpc.com","customer_name":"Joseph Garcia"}	\N	\N
9fc4261b-bb7f-4176-a2a6-2e135366a2be	500.00	CASH_IN	COMPLETED	Cash In via 7-Eleven	\N	\N	CI-C9364837	0.00	2026-02-18 10:48:10.094	2026-02-18 10:48:10.146	\N	\N	\N	\N
62775aa2-ce63-4811-be14-bb8d7572a5df	500.00	CASH_IN	COMPLETED	Cash In via GCash	\N	\N	CI-F1C45D90	0.00	2026-02-18 10:48:47.534	2026-02-18 10:48:47.545	\N	\N	\N	\N
60a8c46e-1943-4904-9dec-b7c94dab5ad0	800.00	CASH_IN	COMPLETED	Cash In via Maya	\N	\N	CI-38B19E26	0.00	2026-02-18 10:49:01.029	2026-02-18 10:49:01.04	\N	\N	\N	\N
d9dbfd45-79e6-43df-841a-adbd59c297cd	200.00	CASH_IN	COMPLETED	Cash In via BDO	\N	\N	CI-7668BFFF	0.00	2026-02-18 10:49:15.438	2026-02-18 10:49:15.447	\N	\N	\N	\N
f45dd09c-f4ea-4177-bf89-6867e36d627b	900.00	CASH_IN	COMPLETED	Cash In via BPI	\N	\N	CI-0A732456	0.00	2026-02-18 10:49:27.533	2026-02-18 10:49:27.542	\N	\N	\N	\N
cd39b4eb-f2f2-44b5-8676-3ae1dfc22d5b	100.00	CASH_IN	COMPLETED	Cash In via BPI	\N	\N	CI-855828D3	0.00	2026-02-18 10:49:42.51	2026-02-18 10:49:42.517	\N	\N	\N	\N
2d0190c7-f6f7-43e8-86be-122d41e9b509	700.00	CASH_IN	COMPLETED	Cash In via UnionBank	\N	\N	CI-9013BABA	0.00	2026-02-18 10:50:09.165	2026-02-18 10:50:09.174	\N	\N	\N	\N
3f193e2d-0466-44ce-a5a0-f294b6040b95	300.00	CASH_IN	COMPLETED	Cash In via Over-the-Counter	\N	\N	CI-A5C83DEC	0.00	2026-02-18 10:50:43.845	2026-02-18 10:50:43.853	\N	\N	\N	\N
b57bafc1-3c54-4a19-9d58-8a5b330754f4	70.00	MERCHANT_PAYMENT	COMPLETED	Order #cmlqatpn9000bgpowtuk3kxwi - budolPay	\N	\N	JON-20260217074546-083D445C	0.00	2026-02-17 07:45:46.552	2026-02-17 07:46:37.363	\N	{"orderId":"cmlqatpn9000bgpowtuk3kxwi","app":"budolShap","storeName":"Stark Enterprise","customer_email":"joseph@omsmpc.com","customer_name":"Joseph Garcia"}	\N	Stark Enterprise
31e09eca-5268-4156-8e4d-9444b63e238d	2412.00	MERCHANT_PAYMENT	COMPLETED	Order #cmlqbe638000ogpow173og5zk - budolPay	\N	\N	JON-20260217080136-EB686935	0.00	2026-02-17 08:01:36.741	2026-02-17 08:02:04.378	\N	{"orderId":"cmlqbe638000ogpow173og5zk","app":"budolShap","storeName":"Stark Enterprise","customer_email":"joseph@omsmpc.com","customer_name":"Joseph Garcia"}	\N	Stark Enterprise
13b17e46-5db2-4615-8820-20f08694b84b	70.00	MERCHANT_PAYMENT	COMPLETED	Order #cmlqe1wgv0014gpowkwugp1lv - budolPay	\N	\N	JON-20260217091608-8DA8ACAB	0.00	2026-02-17 09:16:08.102	2026-02-17 09:18:03.77	\N	{"orderId":"cmlqe1wgv0014gpowkwugp1lv","app":"budolShap","storeName":"Stark Enterprise","customer_email":"joseph@omsmpc.com","customer_name":"Joseph Garcia"}	\N	Stark Enterprise
c80eb127-c4b9-4e5f-9069-b53228e82aff	71.00	MERCHANT_PAYMENT	COMPLETED	Order #cmlqfq0or001agpuc9182poe8 - budolPay	\N	\N	JON-20260217100251-31AADA50	0.00	2026-02-17 10:02:51.54	2026-02-17 10:03:44.252	\N	{"orderId":"cmlqfq0or001agpuc9182poe8","app":"budolShap","storeName":"Stark Industries","customer_email":"joseph@omsmpc.com","customer_name":"Joseph Garcia"}	\N	Stark Industries
652a59b2-9ebe-4fac-a97f-dafeca113d96	70.00	MERCHANT_PAYMENT	COMPLETED	Order #cmlqfsv9w001ggpuct8s0twnz - budolPay	\N	\N	JON-20260217100505-DC24B255	0.00	2026-02-17 10:05:05.493	2026-02-17 10:05:26.706	\N	{"orderId":"cmlqfsv9w001ggpuct8s0twnz","app":"budolShap","storeName":"Stark Industries","customer_email":"joseph@omsmpc.com","customer_name":"Joseph Garcia"}	\N	Stark Industries
19967149-4f31-441e-afdd-abd3be703de1	500.00	CASH_IN	COMPLETED	Cash In via BDO	\N	\N	CI-9AC89647	0.00	2026-02-16 01:27:20.506	2026-02-16 01:27:20.573	\N	\N	\N	\N
f1138975-d740-4089-88b2-b55a726b2c17	900.00	CASH_IN	COMPLETED	Cash In via Maya	\N	\N	CI-6AFFAEE0	0.00	2026-02-17 08:00:04.605	2026-02-17 08:00:04.647	\N	\N	\N	\N
6656028e-3bdc-4238-8b82-0b72502f83ed	900.00	CASH_IN	COMPLETED	Cash In via GCash	\N	\N	CI-19D548CD	0.00	2026-02-17 08:00:20.506	2026-02-17 08:00:20.517	\N	\N	\N	\N
49b76e65-5695-4aac-ac03-962d79325d13	500.00	CASH_IN	COMPLETED	Cash In via BDO	\N	\N	CI-C05DE397	0.00	2026-02-17 08:00:33.939	2026-02-17 08:00:33.947	\N	\N	\N	\N
8b904749-27cd-4cb2-881e-6d49581de541	800.00	CASH_IN	COMPLETED	Cash In via BPI	\N	\N	CI-424F924D	0.00	2026-02-17 08:00:46.454	2026-02-17 08:00:46.463	\N	\N	\N	\N
278c8708-2b09-40b0-8e4d-92caef2e60a6	45.00	CASH_IN	COMPLETED	Cash In via UnionBank	\N	\N	CI-975CC717	0.00	2026-02-17 08:01:24.53	2026-02-17 08:01:24.539	\N	\N	\N	\N
82d0913e-3730-4f8f-8c99-639ebb16e93d	48.00	CASH_IN	COMPLETED	Cash In via 7-Eleven	\N	\N	CI-EE038787	0.00	2026-02-21 12:57:44.332	2026-02-21 12:57:44.427	\N	\N	\N	\N
cfd51db6-7587-4dbb-9237-09524f5dfcab	88.00	MERCHANT_PAYMENT	PENDING	Order #cmlzttvo00017gpugh092hspf - budolPay	\N	\N	JON-20260223234741-0B61B019	0.00	2026-02-23 23:47:41.417	\N	\N	{"orderId":"cmlzttvo00017gpugh092hspf","orderIds":["cmlzttvo00017gpugh092hspf"],"checkoutId":"cmlzttvny0015gpugvg1gl4s3","app":"budolShap","storeName":"Stark Industries","customer_email":"galvezjon59@gmail.com","customer_name":"Jon Galvez"}	\N	\N
75d21f9e-7578-4ede-867b-f724e862af65	106.00	MERCHANT_PAYMENT	PENDING	Order #cmm31q2zu0018gpw84ua1rppa - budolPay	\N	\N	JON-20260226055203-17A55A87	0.00	2026-02-26 05:52:03.745	\N	\N	{"orderId":"cmm31q2zu0018gpw84ua1rppa","orderIds":["cmm31q2zu0018gpw84ua1rppa"],"checkoutId":"cmm31q2zo0016gpw81d39drqj","app":"budolShap","storeName":"Stark Industries","customer_email":"caspermilan80@gmail.com","customer_name":"Peter Parker"}	\N	\N
20408e10-7367-411d-bd43-d05b655fdafa	1335.00	MERCHANT_PAYMENT	PENDING	Order #cmm3340j3001lgpw8bmwcfuu6 - budolPay	\N	\N	JON-20260226063049-A265AD15	0.00	2026-02-26 06:30:49.94	\N	\N	{"orderId":"cmm3340j3001lgpw8bmwcfuu6","orderIds":["cmm3340j3001lgpw8bmwcfuu6"],"checkoutId":"cmm3340j0001jgpw85w558wdi","app":"budolShap","storeName":"Stark Industries","customer_email":"caspermilan80@gmail.com","customer_name":"Peter Parker"}	\N	\N
3ef4b638-3ec8-438b-a7a2-be8a24388f77	1622.00	MERCHANT_PAYMENT	PENDING	Order #cmm336i7a001ygpw8xm4dpejy - budolPay	\N	\N	JON-20260226063245-09BEC02F	0.00	2026-02-26 06:32:45.301	\N	\N	{"orderId":"cmm336i7a001ygpw8xm4dpejy","orderIds":["cmm336i7a001ygpw8xm4dpejy"],"checkoutId":"cmm336i78001wgpw8359reixf","app":"budolShap","storeName":"Stark Industries","customer_email":"caspermilan80@gmail.com","customer_name":"Peter Parker"}	\N	\N
70b5804b-de28-4ca5-8ea7-2e87f4c8bcc3	103.00	MERCHANT_PAYMENT	PENDING	Order #cmm33j6w3002fgpw8u9z9wxu1 - budolPay	\N	\N	JON-20260226064236-05BE19ED	0.00	2026-02-26 06:42:36.834	\N	\N	{"orderId":"cmm33j6w3002fgpw8u9z9wxu1","orderIds":["cmm33j6w3002fgpw8u9z9wxu1"],"checkoutId":"cmm33j6vz002dgpw8xo4zqarv","app":"budolShap","storeName":"Stark Industries","customer_email":"caspermilan80@gmail.com","customer_name":"Peter Parker"}	\N	\N
814a1fd2-515e-40d3-a1ee-a1d5223102cf	103.00	MERCHANT_PAYMENT	PENDING	Order #cmm33kdrz002pgpw8xt2zslfa - budolPay	\N	\N	JON-20260226064330-0B1F019B	0.00	2026-02-26 06:43:30.057	\N	\N	{"orderId":"cmm33kdrz002pgpw8xt2zslfa","orderIds":["cmm33kdrz002pgpw8xt2zslfa"],"checkoutId":"cmm33kdrx002ngpw8wh0e9nmg","app":"budolShap","storeName":"Stark Industries","customer_email":"caspermilan80@gmail.com","customer_name":"Peter Parker"}	\N	\N
565e3765-b5d8-4314-844e-d26136eb626f	103.00	MERCHANT_PAYMENT	PENDING	Order #cmm35ff39002zgpw8sru2yu56 - budolPay	\N	\N	JON-20260226073542-0546498E	0.00	2026-02-26 07:35:42.645	\N	\N	{"orderId":"cmm35ff39002zgpw8sru2yu56","orderIds":["cmm35ff39002zgpw8sru2yu56"],"checkoutId":"cmm35ff2r002xgpw80grybd4g","app":"budolShap","storeName":"Stark Industries","customer_email":"caspermilan80@gmail.com","customer_name":"Peter Parker"}	\N	\N
1dabb8eb-24ed-42fb-8284-fb2842557f9e	900.00	CASH_IN	COMPLETED	Cash In via 7-Eleven	\N	8e462c3d-6243-4231-be2b-174db21b2dd6	CI-4DD4E739	0.00	2026-02-28 15:48:14.339	2026-02-28 15:48:14.385	\N	\N	\N	\N
50b0b2c2-022f-4258-be83-5f10c78f4829	900.00	CASH_IN	COMPLETED	Cash In via 7-Eleven	\N	8e462c3d-6243-4231-be2b-174db21b2dd6	CI-8F1E935F	0.00	2026-02-28 15:48:22.219	2026-02-28 15:48:22.229	\N	\N	\N	\N
2bdbb250-44a0-45a3-9158-289ed92df2a3	900.00	CASH_IN	COMPLETED	Cash In via GCash	\N	8e462c3d-6243-4231-be2b-174db21b2dd6	CI-B23C750E	0.00	2026-02-28 15:48:32.113	2026-02-28 15:48:32.124	\N	\N	\N	\N
f36c1110-cc56-419d-bdbe-6ae3f090da38	900.00	CASH_IN	COMPLETED	Cash In via Maya	\N	8e462c3d-6243-4231-be2b-174db21b2dd6	CI-23D1709D	0.00	2026-02-28 15:48:42.16	2026-02-28 15:48:42.171	\N	\N	\N	\N
6b03fa80-a39d-4446-b252-6a63d561b5a9	900.00	CASH_IN	COMPLETED	Cash In via BDO	\N	8e462c3d-6243-4231-be2b-174db21b2dd6	CI-368755B0	0.00	2026-02-28 15:49:01.507	2026-02-28 15:49:01.517	\N	\N	\N	\N
0e62a589-05b0-4532-8e7d-ccbbebd03263	500.00	CASH_IN	COMPLETED	Cash In via BPI	\N	8e462c3d-6243-4231-be2b-174db21b2dd6	CI-79143E9E	0.00	2026-02-28 15:49:14.298	2026-02-28 15:49:14.308	\N	\N	\N	\N
eeb32024-4083-43b1-adb2-9d196ebdfb22	900.00	CASH_IN	COMPLETED	Cash In via 7-Eleven	\N	b361327f-00ed-4214-9387-0668b77ecd0f	CI-7DC9E4D1	0.00	2026-02-28 16:15:22.798	2026-02-28 16:15:22.812	\N	\N	\N	\N
2bdd814d-f56e-4b5c-8be5-a57cae8a852c	900.00	CASH_IN	COMPLETED	Cash In via UnionBank	\N	b361327f-00ed-4214-9387-0668b77ecd0f	CI-2EEAF0C4	0.00	2026-02-28 16:15:36.052	2026-02-28 16:15:36.06	\N	\N	\N	\N
1bd98422-acbb-42fe-8654-0dd136fac041	900.00	CASH_IN	COMPLETED	Cash In via BPI	\N	b361327f-00ed-4214-9387-0668b77ecd0f	CI-1FA58B06	0.00	2026-02-28 16:15:49.496	2026-02-28 16:15:49.505	\N	\N	\N	\N
3170b8ee-1420-4a4f-85b7-96ddf2c4aa21	300.00	CASH_IN	COMPLETED	Cash In via BDO	\N	b361327f-00ed-4214-9387-0668b77ecd0f	CI-8F4F9E1E	0.00	2026-02-28 16:16:04.938	2026-02-28 16:16:04.946	\N	\N	\N	\N
665eaeec-6df6-41c1-a2a4-f2eb31870f9a	900.00	CASH_IN	COMPLETED	Cash In via BDO	\N	b361327f-00ed-4214-9387-0668b77ecd0f	CI-EDD670BE	0.00	2026-02-28 16:16:17.785	2026-02-28 16:16:17.793	\N	\N	\N	\N
93d087ea-1ebd-40a7-b2c3-8b4cf6aa7847	100.00	CASH_IN	COMPLETED	Cash In via Maya	\N	b361327f-00ed-4214-9387-0668b77ecd0f	CI-BFC32AB5	0.00	2026-02-28 16:16:33.012	2026-02-28 16:16:33.021	\N	\N	\N	\N
b0d40626-7217-4612-a42d-24d240c9e40b	900.00	CASH_IN	COMPLETED	Cash In via 7-Eleven	\N	\N	CI-7BE14934	0.00	2026-02-28 15:11:50.047	2026-02-28 15:11:50.094	\N	\N	\N	\N
c982a832-2d3f-4a50-b226-2af91a5b879c	900.00	CASH_IN	COMPLETED	Cash In via GCash	\N	\N	CI-87CE50C0	0.00	2026-02-28 15:12:07.366	2026-02-28 15:12:07.376	\N	\N	\N	\N
80a16ab0-545a-433f-a0d7-3a371e199f1a	200.00	CASH_IN	COMPLETED	Cash In via Maya	\N	\N	CI-E4094939	0.00	2026-02-28 15:12:18.247	2026-02-28 15:12:18.256	\N	\N	\N	\N
e96e0e52-c9e8-4a14-9929-9e9e5b90bd11	126.00	MERCHANT_PAYMENT	COMPLETED	Order #cmm6j6ago0009gpwsijndvhia - budolPay	b361327f-00ed-4214-9387-0668b77ecd0f	\N	JON-20260228162347-43CCC1C9	0.00	2026-02-28 16:23:47.631	2026-02-28 16:24:15.513	\N	{"orderId":"cmm6j6ago0009gpwsijndvhia","orderIds":["cmm6j6ago0009gpwsijndvhia"],"checkoutId":"cmm6j6agg0007gpwsqcw1lqc6","app":"budolShap","storeName":"Stark Industries","customer_email":"caspermilan80@gmail.com","customer_name":"Peter Parker"}	\N	Stark Industries
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "phoneNumber", "passwordHash", "firstName", "lastName", role, "kycStatus", "kycData", "createdAt", "updatedAt", "avatarUrl", "biometricKeyId", "biometricPublicKey", "emailVerified", "faceTemplate", "isFaceVerified", "kycTier", "lastLoginAt", "otpCode", "otpExpiresAt", "phoneVerified", "pinHash", "trustedDevices", department, "otpUpdatedAt") FROM stdin;
8e462c3d-6243-4231-be2b-174db21b2dd6	ivarhanestad@gmail.com	09484099400	SSO_MANAGED	Tony	Stark	USER	NONE	\N	2026-02-28 15:44:24.926	2026-02-28 16:42:45.771	\N	\N	\N	f	\N	f	BASIC	\N	\N	\N	f	$2b$10$GfBF41nOxp3iFmPdPtVjN.KDHtdLrzZ2Wob/UoATYHQQ8XyZ2cGlK	[{"deviceId":"dev_1772322414109_1980","addedAt":"2026-02-28T15:47:39.240Z","lastUsed":"2026-02-28T16:00:56.302Z","isVerified":true},{"deviceId":"dev_1772324049275_3474","addedAt":"2026-02-28T16:42:37.258Z","lastUsed":"2026-02-28T16:42:45.770Z","isVerified":true}]	\N	2026-02-28 16:42:22.035
b361327f-00ed-4214-9387-0668b77ecd0f	reynaldomgalvez@gmail.com	09484099388	SSO_MANAGED	Reynaldo	Galvez	ADMIN	VERIFIED	\N	2026-02-22 14:56:44.992	2026-03-07 13:49:30.671	\N	\N	\N	f	\N	f	BASIC	\N	\N	\N	f	$2b$10$yCCBeuLtbFOocnA20aakbeVEWBjr70E3ORuWUEFTZwNOi7mS4.EfC	[{"deviceId":"dev_1772319636074_1665","addedAt":"2026-02-28T15:16:24.718Z","lastUsed":"2026-02-28T15:16:24.718Z","isVerified":true},{"deviceId":"dev_1772322414109_1980","addedAt":"2026-02-28T16:01:49.019Z","lastUsed":"2026-02-28T16:01:55.780Z","isVerified":true},{"deviceId":"dev_1772324049275_3474","addedAt":"2026-02-28T16:14:52.538Z","lastUsed":"2026-02-28T16:41:20.263Z","isVerified":true}]	IT-Research & Development	2026-02-28 16:14:41.026
5a51abde-bb3d-49b5-9bb5-0b0fc71fad8b	forensic-test@budolpay.com	+639179998888	hashed_password	Forensic	Test	STAFF	NONE	\N	2026-04-07 22:52:52.752	2026-04-07 22:52:52.752	\N	\N	\N	f	\N	f	BASIC	\N	\N	\N	f	\N	\N	\N	\N
\.


--
-- Data for Name: VerificationDocument; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VerificationDocument" (id, "userId", type, "documentType", "faceTemplate", status, "blobData", "remoteUrl", "ocrData", rotation, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Wallet" (id, "userId", balance, currency, "updatedAt") FROM stdin;
6f59c3d9-87ad-4d7f-899f-686b540960d5	8e462c3d-6243-4231-be2b-174db21b2dd6	5000.00	PHP	2026-02-28 15:49:14.302
ed1b61c8-8739-4134-a2a8-dd1172c57d66	b361327f-00ed-4214-9387-0668b77ecd0f	4874.00	PHP	2026-02-28 16:24:15.509
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0cbd7e82-1ec7-47cc-b46b-d8b28135a451	0b0c3d67569838ddc2494983abc81166e36894bb947203aae3092c1ef7694986	2026-02-15 15:55:18.204151+08	20251230132858_init	\N	\N	2026-02-15 15:55:18.162041+08	1
85b98693-99d3-4654-bf10-a3f33db47a1f	906c2eba3aff1d5779b53af81428268a017698db28b1ac0441f04d635e5ad866	2026-02-15 15:55:18.215246+08	20251230135458_add_sso_models	\N	\N	2026-02-15 15:55:18.204789+08	1
b1915cb1-5091-4b82-9c16-daa99907e9d2	81860df58b01795b1867ae71d3837d32406ed6f5044ecf9738383e2032f45d88	2026-02-15 15:55:18.226505+08	20251230142429_add_accounting_models	\N	\N	2026-02-15 15:55:18.21588+08	1
e38a3e4a-4f44-4af2-8cf7-5f2e8859c9fa	4a2952e41ebf3eb45adf869fecbeb7bcaee89f4606c47c51b64d4b8c37d33190	2026-02-15 15:55:18.241842+08	20251230165630_budolpay_db_migration	\N	\N	2026-02-15 15:55:18.227406+08	1
92f14a39-1d2b-4e82-9b26-9c4fc1fab51d	a47ebc0970f0b446d79fa15307ff8e627f17dfb0a0ac3aa21c8dd6d7374e480c	2026-02-15 15:55:18.280534+08	20260202113105_add_rate_limit	\N	\N	2026-02-15 15:55:18.242547+08	1
eb1fb7b7-6f65-49dc-b938-335bcd4cb185	c51ac0f28a1e1064ca68268d634141b6713cf428be4f9243e68272a32576af04	2026-02-15 15:55:19.476031+08	20260215075519_add_otp_updated_at	\N	\N	2026-02-15 15:55:19.473325+08	1
17a4d57f-83f7-4d23-aa39-3e9e983140f4	e44620131dd9eba72921b833b75ef360051a91aeb2d14af2fbfe6e6e95188ad1	2026-03-01 01:12:29.44648+08	20260228171229_add_change_request	\N	\N	2026-03-01 01:12:29.320891+08	1
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: ChangeRequest ChangeRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY (id);


--
-- Name: ChartOfAccount ChartOfAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChartOfAccount"
    ADD CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY (id);


--
-- Name: Dispute Dispute_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Dispute"
    ADD CONSTRAINT "Dispute_pkey" PRIMARY KEY (id);


--
-- Name: EcosystemApp EcosystemApp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EcosystemApp"
    ADD CONSTRAINT "EcosystemApp_pkey" PRIMARY KEY (id);


--
-- Name: FavoriteRecipient FavoriteRecipient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FavoriteRecipient"
    ADD CONSTRAINT "FavoriteRecipient_pkey" PRIMARY KEY (id);


--
-- Name: LedgerEntry LedgerEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY (id);


--
-- Name: RateLimit RateLimit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RateLimit"
    ADD CONSTRAINT "RateLimit_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Settlement Settlement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Settlement"
    ADD CONSTRAINT "Settlement_pkey" PRIMARY KEY (id);


--
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VerificationDocument VerificationDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationDocument"
    ADD CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY (id);


--
-- Name: Wallet Wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AuditLog_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entity_idx" ON public."AuditLog" USING btree (entity);


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: ChangeRequest_checkerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChangeRequest_checkerId_idx" ON public."ChangeRequest" USING btree ("checkerId");


--
-- Name: ChangeRequest_entity_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChangeRequest_entity_entityId_idx" ON public."ChangeRequest" USING btree (entity, "entityId");


--
-- Name: ChangeRequest_makerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChangeRequest_makerId_idx" ON public."ChangeRequest" USING btree ("makerId");


--
-- Name: ChangeRequest_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChangeRequest_status_idx" ON public."ChangeRequest" USING btree (status);


--
-- Name: ChartOfAccount_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ChartOfAccount_code_key" ON public."ChartOfAccount" USING btree (code);


--
-- Name: Dispute_transactionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Dispute_transactionId_key" ON public."Dispute" USING btree ("transactionId");


--
-- Name: EcosystemApp_apiKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EcosystemApp_apiKey_key" ON public."EcosystemApp" USING btree ("apiKey");


--
-- Name: EcosystemApp_apiSecret_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EcosystemApp_apiSecret_key" ON public."EcosystemApp" USING btree ("apiSecret");


--
-- Name: EcosystemApp_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EcosystemApp_name_key" ON public."EcosystemApp" USING btree (name);


--
-- Name: FavoriteRecipient_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FavoriteRecipient_userId_idx" ON public."FavoriteRecipient" USING btree ("userId");


--
-- Name: FavoriteRecipient_userId_recipientId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FavoriteRecipient_userId_recipientId_key" ON public."FavoriteRecipient" USING btree ("userId", "recipientId");


--
-- Name: LedgerEntry_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LedgerEntry_accountId_idx" ON public."LedgerEntry" USING btree ("accountId");


--
-- Name: LedgerEntry_referenceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LedgerEntry_referenceId_idx" ON public."LedgerEntry" USING btree ("referenceId");


--
-- Name: LedgerEntry_transactionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LedgerEntry_transactionId_idx" ON public."LedgerEntry" USING btree ("transactionId");


--
-- Name: RateLimit_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RateLimit_expiresAt_idx" ON public."RateLimit" USING btree ("expiresAt");


--
-- Name: RateLimit_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RateLimit_key_idx" ON public."RateLimit" USING btree (key);


--
-- Name: RateLimit_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RateLimit_key_key" ON public."RateLimit" USING btree (key);


--
-- Name: Session_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Session_token_key" ON public."Session" USING btree (token);


--
-- Name: Settlement_merchantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Settlement_merchantId_idx" ON public."Settlement" USING btree ("merchantId");


--
-- Name: SystemSetting_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SystemSetting_key_key" ON public."SystemSetting" USING btree (key);


--
-- Name: Transaction_receiverId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_receiverId_idx" ON public."Transaction" USING btree ("receiverId");


--
-- Name: Transaction_referenceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_referenceId_idx" ON public."Transaction" USING btree ("referenceId");


--
-- Name: Transaction_referenceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Transaction_referenceId_key" ON public."Transaction" USING btree ("referenceId");


--
-- Name: Transaction_senderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_senderId_idx" ON public."Transaction" USING btree ("senderId");


--
-- Name: Transaction_settlementId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_settlementId_idx" ON public."Transaction" USING btree ("settlementId");


--
-- Name: Transaction_storeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_storeId_idx" ON public."Transaction" USING btree ("storeId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_phoneNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_phoneNumber_key" ON public."User" USING btree ("phoneNumber");


--
-- Name: VerificationDocument_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VerificationDocument_userId_idx" ON public."VerificationDocument" USING btree ("userId");


--
-- Name: Wallet_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Wallet_userId_key" ON public."Wallet" USING btree ("userId");


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChangeRequest ChangeRequest_checkerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_checkerId_fkey" FOREIGN KEY ("checkerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChangeRequest ChangeRequest_makerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChangeRequest"
    ADD CONSTRAINT "ChangeRequest_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Dispute Dispute_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Dispute"
    ADD CONSTRAINT "Dispute_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public."Transaction"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FavoriteRecipient FavoriteRecipient_recipientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FavoriteRecipient"
    ADD CONSTRAINT "FavoriteRecipient_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FavoriteRecipient FavoriteRecipient_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FavoriteRecipient"
    ADD CONSTRAINT "FavoriteRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LedgerEntry LedgerEntry_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."ChartOfAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_appId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_appId_fkey" FOREIGN KEY ("appId") REFERENCES public."EcosystemApp"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_settlementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES public."Settlement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VerificationDocument VerificationDocument_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationDocument"
    ADD CONSTRAINT "VerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Wallet Wallet_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict CChKViO70ieNa3nneWXTscl1L0YFjUmMKgcd2hNZ7D1XJnSTNGjK8MbcdedyRWT

