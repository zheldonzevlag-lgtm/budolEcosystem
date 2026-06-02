--
-- PostgreSQL database dump
--

\restrict uDIb6IYJ0ae313DuklHuQAZQLascecXiUg024qW1ih5dLv7LS2hHFIuHGdY1bbC

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

ALTER TABLE IF EXISTS ONLY public."LedgerEntry" DROP CONSTRAINT IF EXISTS "LedgerEntry_accountId_fkey";
DROP INDEX IF EXISTS public."LedgerEntry_transactionId_idx";
DROP INDEX IF EXISTS public."LedgerEntry_referenceId_key";
DROP INDEX IF EXISTS public."LedgerEntry_appId_idx";
DROP INDEX IF EXISTS public."LedgerEntry_accountId_idx";
DROP INDEX IF EXISTS public."ChartOfAccount_code_key";
ALTER TABLE IF EXISTS ONLY public."LedgerEntry" DROP CONSTRAINT IF EXISTS "LedgerEntry_pkey";
ALTER TABLE IF EXISTS ONLY public."ChartOfAccount" DROP CONSTRAINT IF EXISTS "ChartOfAccount_pkey";
DROP TABLE IF EXISTS public."LedgerEntry";
DROP TABLE IF EXISTS public."ChartOfAccount";
DROP TYPE IF EXISTS public."AccountType";
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


SET default_tablespace = '';

SET default_table_access_method = heap;

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
-- Name: LedgerEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LedgerEntry" (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "transactionId" text,
    "appId" text NOT NULL,
    "referenceId" text NOT NULL,
    description text NOT NULL,
    debit numeric(18,2) DEFAULT 0.0 NOT NULL,
    credit numeric(18,2) DEFAULT 0.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: ChartOfAccount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChartOfAccount" (id, code, name, type, description, "isActive", "createdAt") FROM stdin;
ddc56535-f6a7-4290-a698-4de692334010	1000-CASH	Cash on Hand	ASSET	\N	t	2026-01-04 11:23:01.286
166371b0-d151-4d31-bddb-635baa5937b5	1100-BANK	Bank Balance	ASSET	\N	t	2026-01-04 11:23:01.372
5cf1e999-4d7e-408f-8a89-219c632ce36a	2000-LIABILITY-BUYER	Buyer Wallet Balance	LIABILITY	\N	t	2026-01-04 11:23:01.374
3adaedae-bc17-4e8c-ada8-65dc895b0385	2100-LIABILITY-MERCHANT	Merchant Wallet Balance	LIABILITY	\N	t	2026-01-04 11:23:01.378
6463de0a-3b68-4c5f-b0d9-313e7f1df6f9	3000-EQUITY	Owner Equity	EQUITY	\N	t	2026-01-04 11:23:01.38
2223bd53-9149-46a7-8b62-de1acfdea46a	4000-REVENUE-FEES	Transaction Fee Revenue	REVENUE	\N	t	2026-01-04 11:23:01.381
c427f2be-a913-4126-84d0-fcddccde2914	5000-EXPENSE-GATEWAY	Payment Gateway Expenses	EXPENSE	\N	t	2026-01-04 11:23:01.383
\.


--
-- Data for Name: LedgerEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LedgerEntry" (id, "accountId", "transactionId", "appId", "referenceId", description, debit, credit, "createdAt") FROM stdin;
\.


--
-- Name: ChartOfAccount ChartOfAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChartOfAccount"
    ADD CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY (id);


--
-- Name: LedgerEntry LedgerEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY (id);


--
-- Name: ChartOfAccount_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ChartOfAccount_code_key" ON public."ChartOfAccount" USING btree (code);


--
-- Name: LedgerEntry_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LedgerEntry_accountId_idx" ON public."LedgerEntry" USING btree ("accountId");


--
-- Name: LedgerEntry_appId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LedgerEntry_appId_idx" ON public."LedgerEntry" USING btree ("appId");


--
-- Name: LedgerEntry_referenceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LedgerEntry_referenceId_key" ON public."LedgerEntry" USING btree ("referenceId");


--
-- Name: LedgerEntry_transactionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LedgerEntry_transactionId_idx" ON public."LedgerEntry" USING btree ("transactionId");


--
-- Name: LedgerEntry LedgerEntry_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LedgerEntry"
    ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."ChartOfAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict uDIb6IYJ0ae313DuklHuQAZQLascecXiUg024qW1ih5dLv7LS2hHFIuHGdY1bbC

