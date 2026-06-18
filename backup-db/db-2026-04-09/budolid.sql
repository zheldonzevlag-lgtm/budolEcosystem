--
-- PostgreSQL database dump
--

\restrict zljFhA4oPWGRfh0voLJJ8kcdkSd1hs8chykP11G6dj23z4Ye4KTyNQhnz3DYj8R

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

ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_appId_fkey";
DROP INDEX IF EXISTS public."User_phoneNumber_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."Session_token_key";
DROP INDEX IF EXISTS public."EcosystemApp_name_key";
DROP INDEX IF EXISTS public."EcosystemApp_apiSecret_key";
DROP INDEX IF EXISTS public."EcosystemApp_apiKey_key";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."EcosystemApp" DROP CONSTRAINT IF EXISTS "EcosystemApp_pkey";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Session";
DROP TABLE IF EXISTS public."EcosystemApp";
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."KYCTier";
DROP TYPE IF EXISTS public."KYCStatus";
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
-- Name: KYCStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KYCStatus" AS ENUM (
    'NONE',
    'PENDING',
    'VERIFIED',
    'REJECTED'
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
-- Name: EcosystemApp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EcosystemApp" (
    id text NOT NULL,
    name text NOT NULL,
    "apiKey" text NOT NULL,
    "apiSecret" text NOT NULL,
    "redirectUri" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "appId" text,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "phoneNumber" text NOT NULL,
    "firstName" text,
    "lastName" text,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    department text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isFaceVerified" boolean DEFAULT false NOT NULL,
    "kycData" jsonb,
    "kycStatus" public."KYCStatus" DEFAULT 'NONE'::public."KYCStatus" NOT NULL,
    "kycTier" public."KYCTier" DEFAULT 'BASIC'::public."KYCTier" NOT NULL,
    "otpCode" text,
    "otpExpiresAt" timestamp(3) without time zone,
    "otpUpdatedAt" timestamp(3) without time zone,
    "emailVerified" boolean DEFAULT false NOT NULL,
    "phoneVerified" boolean DEFAULT false NOT NULL,
    "avatarUrl" text,
    "faceTemplate" text,
    "lastLoginAt" timestamp(3) without time zone,
    "pinHash" text,
    "biometricKeyId" text,
    "biometricPublicKey" bytea,
    "trustedDevices" text
);


--
-- Data for Name: EcosystemApp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EcosystemApp" (id, name, "apiKey", "apiSecret", "redirectUri", "createdAt") FROM stdin;
f80f79b8-7e7d-44b3-8451-dd563b2efce6	budolPay	bp_key_2025	2bae5207b5cb66385e396e620146b27013e24fc669286aa9ce8f08c60e45fa6e	http://192.168.1.2:3000/api/auth/callback	2026-04-09 05:57:04.947
95e20511-240f-4a6f-8fb3-eb7882224ba9	budolShap	bs_key_2025	cc3391162c8347abe81d6d6a0448b4bb589c6e5d2ac14e197b7866df6befb20e	http://192.168.1.2:3001/auth/callback	2026-04-09 05:57:04.994
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, "userId", "appId", token, "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "passwordHash", "phoneNumber", "firstName", "lastName", role, department, "createdAt", "updatedAt", "isFaceVerified", "kycData", "kycStatus", "kycTier", "otpCode", "otpExpiresAt", "otpUpdatedAt", "emailVerified", "phoneVerified", "avatarUrl", "faceTemplate", "lastLoginAt", "pinHash", "biometricKeyId", "biometricPublicKey", "trustedDevices") FROM stdin;
\.


--
-- Name: EcosystemApp EcosystemApp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EcosystemApp"
    ADD CONSTRAINT "EcosystemApp_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


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
-- Name: Session_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Session_token_key" ON public."Session" USING btree (token);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_phoneNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_phoneNumber_key" ON public."User" USING btree ("phoneNumber");


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
-- PostgreSQL database dump complete
--

\unrestrict zljFhA4oPWGRfh0voLJJ8kcdkSd1hs8chykP11G6dj23z4Ye4KTyNQhnz3DYj8R

