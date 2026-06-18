--
-- PostgreSQL database dump
--

\restrict nEP5XqYdRgrRT7erLoCUc610cyxyTcZ0Nj2oOBCJ4lOa05wuVWlcDN5zy7dsmqH

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

ALTER TABLE IF EXISTS ONLY public."Wallet" DROP CONSTRAINT IF EXISTS "Wallet_storeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_walletId_fkey";
ALTER TABLE IF EXISTS ONLY public."Store" DROP CONSTRAINT IF EXISTS "Store_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."StoreAddress" DROP CONSTRAINT IF EXISTS "StoreAddress_storeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Return" DROP CONSTRAINT IF EXISTS "Return_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Rating" DROP CONSTRAINT IF EXISTS "Rating_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Rating" DROP CONSTRAINT IF EXISTS "Rating_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_storeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."PayoutRequest" DROP CONSTRAINT IF EXISTS "PayoutRequest_storeId_fkey";
ALTER TABLE IF EXISTS ONLY public."PaymentProof" DROP CONSTRAINT IF EXISTS "PaymentProof_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_storeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_addressId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Message" DROP CONSTRAINT IF EXISTS "Message_senderId_fkey";
ALTER TABLE IF EXISTS ONLY public."Message" DROP CONSTRAINT IF EXISTS "Message_chatId_fkey";
ALTER TABLE IF EXISTS ONLY public."Chat" DROP CONSTRAINT IF EXISTS "Chat_storeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Chat" DROP CONSTRAINT IF EXISTS "Chat_sellerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Chat" DROP CONSTRAINT IF EXISTS "Chat_buyerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public."Cart" DROP CONSTRAINT IF EXISTS "Cart_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_userId_fkey";
DROP INDEX IF EXISTS public."WebhookEvent_provider_eventType_idx";
DROP INDEX IF EXISTS public."WebhookEvent_orderId_idx";
DROP INDEX IF EXISTS public."Wallet_storeId_key";
DROP INDEX IF EXISTS public."VerificationCode_identifier_key";
DROP INDEX IF EXISTS public."User_phoneNumber_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."Store_username_key";
DROP INDEX IF EXISTS public."Store_userId_key";
DROP INDEX IF EXISTS public."StoreAddress_storeId_idx";
DROP INDEX IF EXISTS public."Rating_userId_productId_orderId_key";
DROP INDEX IF EXISTS public."PaymentProof_orderId_key";
DROP INDEX IF EXISTS public."OrderItem_orderId_productId_variationId_key";
DROP INDEX IF EXISTS public."Checkout_sessionId_key";
DROP INDEX IF EXISTS public."Chat_buyerId_storeId_key";
DROP INDEX IF EXISTS public."Category_slug_key";
DROP INDEX IF EXISTS public."Cart_userId_key";
DROP INDEX IF EXISTS public."CartItem_cartId_productId_variationId_key";
DROP INDEX IF EXISTS public."AuditLog_userId_idx";
DROP INDEX IF EXISTS public."AuditLog_createdAt_idx";
ALTER TABLE IF EXISTS ONLY public."WebhookEvent" DROP CONSTRAINT IF EXISTS "WebhookEvent_pkey";
ALTER TABLE IF EXISTS ONLY public."Wallet" DROP CONSTRAINT IF EXISTS "Wallet_pkey";
ALTER TABLE IF EXISTS ONLY public."VerificationCode" DROP CONSTRAINT IF EXISTS "VerificationCode_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_pkey";
ALTER TABLE IF EXISTS ONLY public."SystemSettings" DROP CONSTRAINT IF EXISTS "SystemSettings_pkey";
ALTER TABLE IF EXISTS ONLY public."Store" DROP CONSTRAINT IF EXISTS "Store_pkey";
ALTER TABLE IF EXISTS ONLY public."StoreAddress" DROP CONSTRAINT IF EXISTS "StoreAddress_pkey";
ALTER TABLE IF EXISTS ONLY public."Return" DROP CONSTRAINT IF EXISTS "Return_pkey";
ALTER TABLE IF EXISTS ONLY public."Rating" DROP CONSTRAINT IF EXISTS "Rating_pkey";
ALTER TABLE IF EXISTS ONLY public."RateLimit" DROP CONSTRAINT IF EXISTS "RateLimit_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."PayoutRequest" DROP CONSTRAINT IF EXISTS "PayoutRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."PaymentProof" DROP CONSTRAINT IF EXISTS "PaymentProof_pkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Message" DROP CONSTRAINT IF EXISTS "Message_pkey";
ALTER TABLE IF EXISTS ONLY public."Coupon" DROP CONSTRAINT IF EXISTS "Coupon_pkey";
ALTER TABLE IF EXISTS ONLY public."Checkout" DROP CONSTRAINT IF EXISTS "Checkout_pkey";
ALTER TABLE IF EXISTS ONLY public."Chat" DROP CONSTRAINT IF EXISTS "Chat_pkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_pkey";
ALTER TABLE IF EXISTS ONLY public."Cart" DROP CONSTRAINT IF EXISTS "Cart_pkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Address" DROP CONSTRAINT IF EXISTS "Address_pkey";
DROP TABLE IF EXISTS public."WebhookEvent";
DROP TABLE IF EXISTS public."Wallet";
DROP TABLE IF EXISTS public."VerificationCode";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Transaction";
DROP TABLE IF EXISTS public."SystemSettings";
DROP TABLE IF EXISTS public."StoreAddress";
DROP TABLE IF EXISTS public."Store";
DROP TABLE IF EXISTS public."Return";
DROP TABLE IF EXISTS public."Rating";
DROP TABLE IF EXISTS public."RateLimit";
DROP TABLE IF EXISTS public."Product";
DROP TABLE IF EXISTS public."PayoutRequest";
DROP TABLE IF EXISTS public."PaymentProof";
DROP TABLE IF EXISTS public."OrderItem";
DROP TABLE IF EXISTS public."Order";
DROP TABLE IF EXISTS public."Message";
DROP TABLE IF EXISTS public."Coupon";
DROP TABLE IF EXISTS public."Checkout";
DROP TABLE IF EXISTS public."Chat";
DROP TABLE IF EXISTS public."Category";
DROP TABLE IF EXISTS public."CartItem";
DROP TABLE IF EXISTS public."Cart";
DROP TABLE IF EXISTS public."AuditLog";
DROP TABLE IF EXISTS public."Address";
DROP TYPE IF EXISTS public."VerificationStatus";
DROP TYPE IF EXISTS public."TransactionType";
DROP TYPE IF EXISTS public."ReturnType";
DROP TYPE IF EXISTS public."ReturnStatus";
DROP TYPE IF EXISTS public."ReturnSellerAction";
DROP TYPE IF EXISTS public."PayoutStatus";
DROP TYPE IF EXISTS public."PaymentMethod";
DROP TYPE IF EXISTS public."OrderStatus";
DROP TYPE IF EXISTS public."MembershipStatus";
DROP TYPE IF EXISTS public."AccountType";
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: AccountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccountType" AS ENUM (
    'BUYER',
    'SELLER',
    'ADMIN'
);


--
-- Name: MembershipStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MembershipStatus" AS ENUM (
    'NONE',
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'ORDER_PLACED',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'RETURN_DISPUTED',
    'REFUNDED',
    'COMPLETED',
    'CANCELLED',
    'IN_TRANSIT',
    'PENDING_VERIFICATION'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'COD',
    'STRIPE',
    'GCASH',
    'BUDOL_PAY',
    'MAYA',
    'GRAB_PAY',
    'QRPH'
);


--
-- Name: PayoutStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PayoutStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: ReturnSellerAction; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReturnSellerAction" AS ENUM (
    'ACCEPT',
    'REJECT',
    'OFFER_PARTIAL',
    'REQUEST_RETURN'
);


--
-- Name: ReturnStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReturnStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'BOOKING_REQUESTED',
    'BOOKED',
    'SHIPPED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'RECEIVED',
    'REFUNDED',
    'CANCELLED',
    'DISPUTED',
    'TO_PICKUP'
);


--
-- Name: ReturnType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReturnType" AS ENUM (
    'REFUND_ONLY',
    'RETURN_AND_REFUND'
);


--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionType" AS ENUM (
    'CREDIT',
    'DEBIT'
);


--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Address; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Address" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "houseNumber" text,
    street text NOT NULL,
    barangay text NOT NULL,
    subdivision text,
    landmark text,
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    country text DEFAULT 'Philippines'::text NOT NULL,
    phone text NOT NULL,
    latitude double precision,
    longitude double precision,
    "buildingName" text,
    "floorUnit" text,
    notes text,
    label text DEFAULT ''::text,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    entity text,
    "entityId" text,
    details text,
    status text DEFAULT 'SUCCESS'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    "ipAddress" text,
    latitude text,
    longitude text,
    country text,
    city text,
    device text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    "variationId" text,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "parentId" text,
    level integer DEFAULT 0 NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    image text,
    icon text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Chat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Chat" (
    id text NOT NULL,
    "buyerId" text NOT NULL,
    "sellerId" text NOT NULL,
    "storeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Checkout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Checkout" (
    id text NOT NULL,
    "userId" text NOT NULL,
    total double precision NOT NULL,
    currency text DEFAULT 'PHP'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "sessionId" text,
    metadata text,
    "attemptCount" integer DEFAULT 0 NOT NULL,
    "paymentId" text,
    "paymentProvider" text,
    "expiredAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Coupon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Coupon" (
    code text NOT NULL,
    description text NOT NULL,
    discount double precision NOT NULL,
    "forNewUser" boolean NOT NULL,
    "forMember" boolean DEFAULT false NOT NULL,
    "forCoopMember" boolean DEFAULT false NOT NULL,
    "isPublic" boolean NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "storeId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "chatId" text NOT NULL,
    "senderId" text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    total double precision NOT NULL,
    "shippingCost" double precision DEFAULT 0 NOT NULL,
    status public."OrderStatus" DEFAULT 'ORDER_PLACED'::public."OrderStatus" NOT NULL,
    "userId" text NOT NULL,
    "storeId" text NOT NULL,
    "addressId" text NOT NULL,
    "isPaid" boolean DEFAULT false NOT NULL,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    "paymentSourceId" text,
    "paymentId" text,
    "paymentStatus" text,
    "paidAt" timestamp(3) without time zone,
    "shippedAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "autoCompleteAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isCouponUsed" boolean DEFAULT false NOT NULL,
    coupon jsonb DEFAULT '{}'::jsonb NOT NULL,
    shipping jsonb,
    "isGuaranteeExtended" boolean DEFAULT false NOT NULL,
    "checkoutId" text
);


--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "variationId" text,
    quantity integer NOT NULL,
    price double precision NOT NULL
);


--
-- Name: PaymentProof; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PaymentProof" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "imageUrl" text NOT NULL,
    "refNumber" text,
    notes text,
    status public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PayoutRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PayoutRequest" (
    id text NOT NULL,
    "storeId" text NOT NULL,
    amount double precision NOT NULL,
    status public."PayoutStatus" DEFAULT 'PENDING'::public."PayoutStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    mrp double precision NOT NULL,
    price double precision NOT NULL,
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    videos jsonb DEFAULT '[]'::jsonb,
    category text,
    "categoryId" text,
    "inStock" boolean DEFAULT true NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    weight double precision DEFAULT 0.0 NOT NULL,
    length double precision DEFAULT 0.0 NOT NULL,
    width double precision DEFAULT 0.0 NOT NULL,
    height double precision DEFAULT 0.0 NOT NULL,
    condition text DEFAULT 'New'::text NOT NULL,
    "preOrder" boolean DEFAULT false NOT NULL,
    parent_sku text,
    tier_variations jsonb DEFAULT '[]'::jsonb,
    variation_matrix jsonb DEFAULT '[]'::jsonb,
    hidden_combos jsonb DEFAULT '[]'::jsonb,
    "storeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RateLimit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RateLimit" (
    key text NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    "expireAt" bigint NOT NULL
);


--
-- Name: Rating; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Rating" (
    id text NOT NULL,
    rating integer NOT NULL,
    review text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    "orderId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Return; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Return" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    reason text NOT NULL,
    type public."ReturnType" DEFAULT 'REFUND_ONLY'::public."ReturnType" NOT NULL,
    "refundAmount" double precision DEFAULT 0 NOT NULL,
    images jsonb DEFAULT '[]'::jsonb NOT NULL,
    status public."ReturnStatus" DEFAULT 'PENDING'::public."ReturnStatus" NOT NULL,
    "sellerAction" public."ReturnSellerAction",
    "sellerReason" text,
    "trackingNumber" text,
    deadline timestamp(3) without time zone,
    "arbitrationNotes" text,
    "adminId" text,
    "adminNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isEscrowLocked" boolean DEFAULT false NOT NULL,
    "returnShipping" jsonb
);


--
-- Name: Store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Store" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    username text NOT NULL,
    address text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    logo text NOT NULL,
    email text NOT NULL,
    contact text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    latitude double precision,
    longitude double precision,
    "shippingProfile" jsonb,
    "kycDocuments" jsonb DEFAULT '[]'::jsonb,
    "verificationStatus" public."VerificationStatus" DEFAULT 'PENDING'::public."VerificationStatus" NOT NULL,
    "verificationNotes" text,
    "nonFulfilmentRate" double precision DEFAULT 0.0,
    "penaltyPoints" integer DEFAULT 0
);


--
-- Name: StoreAddress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StoreAddress" (
    id text NOT NULL,
    "storeId" text NOT NULL,
    phone text NOT NULL,
    district text NOT NULL,
    province text,
    city text NOT NULL,
    barangay text NOT NULL,
    "detailedAddress" text NOT NULL,
    zip text NOT NULL,
    country text DEFAULT 'Philippines'::text NOT NULL,
    notes text,
    label text DEFAULT ''::text,
    latitude double precision,
    longitude double precision,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SystemSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SystemSettings" (
    id text DEFAULT 'default'::text NOT NULL,
    "realtimeProvider" text DEFAULT 'POLLING'::text NOT NULL,
    "pusherKey" text,
    "pusherCluster" text,
    "pusherAppId" text,
    "pusherSecret" text,
    "socketUrl" text,
    "swrPollingInterval" integer DEFAULT 10000 NOT NULL,
    "sessionTimeout" integer DEFAULT 15 NOT NULL,
    "sessionWarning" integer DEFAULT 1 NOT NULL,
    "loginLimit" integer DEFAULT 10 NOT NULL,
    "registerLimit" integer DEFAULT 5 NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "cacheProvider" text DEFAULT 'MEMORY'::text NOT NULL,
    "redisPassword" text,
    "redisUrl" text,
    "marketingAdsEnabled" boolean DEFAULT false NOT NULL,
    "quickInstallerEnabled" boolean DEFAULT true NOT NULL,
    "adDisplayMode" text DEFAULT 'SEQUENCE'::text NOT NULL,
    "selectedMarketingAds" text[] DEFAULT ARRAY[]::text[],
    "marketingAdConfigs" jsonb DEFAULT '[]'::jsonb,
    "errorTrackingEnabled" boolean DEFAULT false NOT NULL,
    "sentryDsn" text,
    "sentryEnvironment" text DEFAULT 'production'::text,
    "sentryTracesSampleRate" double precision DEFAULT 0.1,
    "orderCancellationHours" integer DEFAULT 48 NOT NULL,
    "orderCancellationEnabled" boolean DEFAULT true NOT NULL,
    "protectionWindowDays" integer DEFAULT 3 NOT NULL,
    "budolShapShippingEnabled" boolean DEFAULT false NOT NULL,
    "budolShapShippingSLADays" integer DEFAULT 3 NOT NULL,
    "budolShapWaybillGeneration" boolean DEFAULT false NOT NULL,
    "enabledMapProviders" text[] DEFAULT ARRAY['OSM'::text],
    "geoapifyApiKey" text,
    "googleMapsApiKey" text,
    "mapProvider" text DEFAULT 'OSM'::text NOT NULL,
    "radarApiKey" text,
    "maxProductImages" integer DEFAULT 12 NOT NULL,
    "maxProductVideos" integer DEFAULT 0 NOT NULL,
    "emailProvider" text DEFAULT 'CONSOLE'::text,
    "smtpHost" text,
    "smtpPort" integer,
    "smtpUser" text,
    "smtpPass" text,
    "smtpFrom" text,
    "brevoApiKey" text,
    "gmassApiKey" text,
    "smsProvider" text DEFAULT 'CONSOLE'::text,
    "zerixApiKey" text,
    "itextmoApiKey" text,
    "itextmoClientCode" text,
    "viberApiKey" text,
    "brevoSmsApiKey" text
);


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "walletId" text NOT NULL,
    amount double precision NOT NULL,
    type public."TransactionType" NOT NULL,
    description text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "phoneNumber" text,
    image text NOT NULL,
    cart jsonb DEFAULT '{}'::jsonb NOT NULL,
    "accountType" public."AccountType" DEFAULT 'BUYER'::public."AccountType" NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "isMember" boolean DEFAULT false NOT NULL,
    "isCoopMember" boolean DEFAULT false NOT NULL,
    "membershipStatus" public."MembershipStatus" DEFAULT 'NONE'::public."MembershipStatus" NOT NULL,
    "coopMembershipStatus" public."MembershipStatus" DEFAULT 'NONE'::public."MembershipStatus" NOT NULL,
    "emailVerifyToken" text,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    role text DEFAULT 'USER'::text NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "buyerReturnRate" double precision DEFAULT 0.0,
    "codUnpaidCount" integer DEFAULT 0
);


--
-- Name: VerificationCode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VerificationCode" (
    id text NOT NULL,
    identifier text NOT NULL,
    code text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    type text DEFAULT 'LOGIN'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Wallet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wallet" (
    id text NOT NULL,
    "storeId" text NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    "pendingBalance" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lockedBalance" double precision DEFAULT 0 NOT NULL
);


--
-- Name: WebhookEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WebhookEvent" (
    id text NOT NULL,
    provider text NOT NULL,
    "eventType" text NOT NULL,
    payload jsonb NOT NULL,
    status text NOT NULL,
    error text,
    "orderId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "processedAt" timestamp(3) without time zone
);


--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Address" (id, "userId", name, email, "houseNumber", street, barangay, subdivision, landmark, city, state, zip, country, phone, latitude, longitude, "buildingName", "floorUnit", notes, label, "isDefault", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "userId", action, entity, "entityId", details, status, metadata, "ipAddress", latitude, longitude, country, city, device, "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Cart" (id, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CartItem" (id, "cartId", "productId", "variationId", quantity, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Category" (id, name, slug, "parentId", level, "sortOrder", image, icon, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Chat; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Chat" (id, "buyerId", "sellerId", "storeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Checkout; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Checkout" (id, "userId", total, currency, status, "expiresAt", "sessionId", metadata, "attemptCount", "paymentId", "paymentProvider", "expiredAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Coupon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Coupon" (code, description, discount, "forNewUser", "forMember", "forCoopMember", "isPublic", "expiresAt", "storeId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Message" (id, "chatId", "senderId", content, "createdAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, total, "shippingCost", status, "userId", "storeId", "addressId", "isPaid", "paymentMethod", "paymentSourceId", "paymentId", "paymentStatus", "paidAt", "shippedAt", "deliveredAt", "completedAt", "autoCompleteAt", "createdAt", "updatedAt", "isCouponUsed", coupon, shipping, "isGuaranteeExtended", "checkoutId") FROM stdin;
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderItem" (id, "orderId", "productId", "variationId", quantity, price) FROM stdin;
\.


--
-- Data for Name: PaymentProof; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentProof" (id, "orderId", "imageUrl", "refNumber", notes, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayoutRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayoutRequest" (id, "storeId", amount, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, name, description, mrp, price, images, videos, category, "categoryId", "inStock", stock, weight, length, width, height, condition, "preOrder", parent_sku, tier_variations, variation_matrix, hidden_combos, "storeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RateLimit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RateLimit" (key, points, "expireAt") FROM stdin;
\.


--
-- Data for Name: Rating; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Rating" (id, rating, review, "userId", "productId", "orderId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Return; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Return" (id, "orderId", reason, type, "refundAmount", images, status, "sellerAction", "sellerReason", "trackingNumber", deadline, "arbitrationNotes", "adminId", "adminNotes", "createdAt", "updatedAt", "isEscrowLocked", "returnShipping") FROM stdin;
\.


--
-- Data for Name: Store; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Store" (id, "userId", name, description, username, address, status, "isActive", logo, email, contact, "createdAt", "updatedAt", latitude, longitude, "shippingProfile", "kycDocuments", "verificationStatus", "verificationNotes", "nonFulfilmentRate", "penaltyPoints") FROM stdin;
\.


--
-- Data for Name: StoreAddress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StoreAddress" (id, "storeId", phone, district, province, city, barangay, "detailedAddress", zip, country, notes, label, latitude, longitude, "isDefault", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SystemSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SystemSettings" (id, "realtimeProvider", "pusherKey", "pusherCluster", "pusherAppId", "pusherSecret", "socketUrl", "swrPollingInterval", "sessionTimeout", "sessionWarning", "loginLimit", "registerLimit", "updatedAt", "cacheProvider", "redisPassword", "redisUrl", "marketingAdsEnabled", "quickInstallerEnabled", "adDisplayMode", "selectedMarketingAds", "marketingAdConfigs", "errorTrackingEnabled", "sentryDsn", "sentryEnvironment", "sentryTracesSampleRate", "orderCancellationHours", "orderCancellationEnabled", "protectionWindowDays", "budolShapShippingEnabled", "budolShapShippingSLADays", "budolShapWaybillGeneration", "enabledMapProviders", "geoapifyApiKey", "googleMapsApiKey", "mapProvider", "radarApiKey", "maxProductImages", "maxProductVideos", "emailProvider", "smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFrom", "brevoApiKey", "gmassApiKey", "smsProvider", "zerixApiKey", "itextmoApiKey", "itextmoClientCode", "viberApiKey", "brevoSmsApiKey") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, "walletId", amount, type, description, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, password, "phoneNumber", image, cart, "accountType", "emailVerified", "isAdmin", "isMember", "isCoopMember", "membershipStatus", "coopMembershipStatus", "emailVerifyToken", "resetToken", "resetTokenExpiry", role, permissions, metadata, "createdAt", "updatedAt", "deletedAt", "buyerReturnRate", "codUnpaidCount") FROM stdin;
\.


--
-- Data for Name: VerificationCode; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VerificationCode" (id, identifier, code, "expiresAt", type, "createdAt") FROM stdin;
\.


--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Wallet" (id, "storeId", balance, "pendingBalance", "createdAt", "updatedAt", "lockedBalance") FROM stdin;
\.


--
-- Data for Name: WebhookEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WebhookEvent" (id, provider, "eventType", payload, status, error, "orderId", "createdAt", "processedAt") FROM stdin;
\.


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Chat Chat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chat"
    ADD CONSTRAINT "Chat_pkey" PRIMARY KEY (id);


--
-- Name: Checkout Checkout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Checkout"
    ADD CONSTRAINT "Checkout_pkey" PRIMARY KEY (id);


--
-- Name: Coupon Coupon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Coupon"
    ADD CONSTRAINT "Coupon_pkey" PRIMARY KEY (code);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: PaymentProof PaymentProof_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentProof"
    ADD CONSTRAINT "PaymentProof_pkey" PRIMARY KEY (id);


--
-- Name: PayoutRequest PayoutRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayoutRequest"
    ADD CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: RateLimit RateLimit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RateLimit"
    ADD CONSTRAINT "RateLimit_pkey" PRIMARY KEY (key);


--
-- Name: Rating Rating_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rating"
    ADD CONSTRAINT "Rating_pkey" PRIMARY KEY (id);


--
-- Name: Return Return_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Return"
    ADD CONSTRAINT "Return_pkey" PRIMARY KEY (id);


--
-- Name: StoreAddress StoreAddress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StoreAddress"
    ADD CONSTRAINT "StoreAddress_pkey" PRIMARY KEY (id);


--
-- Name: Store Store_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Store"
    ADD CONSTRAINT "Store_pkey" PRIMARY KEY (id);


--
-- Name: SystemSettings SystemSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SystemSettings"
    ADD CONSTRAINT "SystemSettings_pkey" PRIMARY KEY (id);


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
-- Name: VerificationCode VerificationCode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VerificationCode"
    ADD CONSTRAINT "VerificationCode_pkey" PRIMARY KEY (id);


--
-- Name: Wallet Wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_pkey" PRIMARY KEY (id);


--
-- Name: WebhookEvent WebhookEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WebhookEvent"
    ADD CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: CartItem_cartId_productId_variationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CartItem_cartId_productId_variationId_key" ON public."CartItem" USING btree ("cartId", "productId", "variationId");


--
-- Name: Cart_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Cart_userId_key" ON public."Cart" USING btree ("userId");


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: Chat_buyerId_storeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Chat_buyerId_storeId_key" ON public."Chat" USING btree ("buyerId", "storeId");


--
-- Name: Checkout_sessionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Checkout_sessionId_key" ON public."Checkout" USING btree ("sessionId");


--
-- Name: OrderItem_orderId_productId_variationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OrderItem_orderId_productId_variationId_key" ON public."OrderItem" USING btree ("orderId", "productId", "variationId");


--
-- Name: PaymentProof_orderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PaymentProof_orderId_key" ON public."PaymentProof" USING btree ("orderId");


--
-- Name: Rating_userId_productId_orderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Rating_userId_productId_orderId_key" ON public."Rating" USING btree ("userId", "productId", "orderId");


--
-- Name: StoreAddress_storeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StoreAddress_storeId_idx" ON public."StoreAddress" USING btree ("storeId");


--
-- Name: Store_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Store_userId_key" ON public."Store" USING btree ("userId");


--
-- Name: Store_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Store_username_key" ON public."Store" USING btree (username);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_phoneNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_phoneNumber_key" ON public."User" USING btree ("phoneNumber");


--
-- Name: VerificationCode_identifier_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VerificationCode_identifier_key" ON public."VerificationCode" USING btree (identifier);


--
-- Name: Wallet_storeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Wallet_storeId_key" ON public."Wallet" USING btree ("storeId");


--
-- Name: WebhookEvent_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WebhookEvent_orderId_idx" ON public."WebhookEvent" USING btree ("orderId");


--
-- Name: WebhookEvent_provider_eventType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WebhookEvent_provider_eventType_idx" ON public."WebhookEvent" USING btree (provider, "eventType");


--
-- Name: Address Address_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public."Cart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cart Cart_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Category Category_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Chat Chat_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chat"
    ADD CONSTRAINT "Chat_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Chat Chat_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chat"
    ADD CONSTRAINT "Chat_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Chat Chat_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chat"
    ADD CONSTRAINT "Chat_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_chatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES public."Chat"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_addressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES public."Address"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PaymentProof PaymentProof_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentProof"
    ADD CONSTRAINT "PaymentProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayoutRequest PayoutRequest_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayoutRequest"
    ADD CONSTRAINT "PayoutRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rating Rating_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rating"
    ADD CONSTRAINT "Rating_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rating Rating_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rating"
    ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Return Return_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Return"
    ADD CONSTRAINT "Return_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StoreAddress StoreAddress_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StoreAddress"
    ADD CONSTRAINT "StoreAddress_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Store Store_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Store"
    ADD CONSTRAINT "Store_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."Wallet"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wallet Wallet_storeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES public."Store"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nEP5XqYdRgrRT7erLoCUc610cyxyTcZ0Nj2oOBCJ4lOa05wuVWlcDN5zy7dsmqH

