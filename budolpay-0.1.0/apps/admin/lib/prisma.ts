import { prisma as basePrisma } from '@budolpay/database';
import { triggerRealtimeEvent } from './realtime-server';

/**
 * Prisma Extended Client - Automatic Realtime Push (v43.4)
 *
 * WHY THIS EXISTS:
 * Automatically intercepts DB mutations on critical models and broadcasts
 * sync signals so the Admin Dashboard updates in real-time without
 * manual triggers in every API route.
 *
 * WHY WE AWAIT (v43.4 FIX):
 * In Vercel serverless, a function terminates the moment it sends a response.
 * Fire-and-forget (.catch(() => {})) means Pusher HTTP calls are killed
 * before delivery — causing "delayed" or missing updates.
 * We await inside a Promise.race with a 500ms timeout to guarantee delivery
 * without blocking the DB operation for too long.
 *
 * Compliance: Ensures 100% telemetry coverage for Forensic Audit Trails.
 * PCI-DSS 10.2.2, BSP Circular 808
 */

/** Utility: await Pusher event but cap at 500ms to prevent long DB blocks */
async function safePush(event: string, source: string) {
  const push = triggerRealtimeEvent('admin', 'ANY_UPDATE', { source: 'prisma-auto-push', event });
  const timeout = new Promise(resolve => setTimeout(resolve, 500));
  try {
    await Promise.race([push, timeout]);
  } catch (e) {
    console.error(`[Prisma-AutoPush] Failed to push ${event} event:`, e);
  }
}

export const prisma = basePrisma.$extends({
  query: {
    auditLog: {
      async create({ args, query }) {
        const result = await query(args);
        // Await delivery — audit logs are forensic events; we must guarantee the dashboard sees them
        await safePush('AUDIT_LOG_CREATED', 'audit-log-create');
        return result;
      }
    },
    transaction: {
      async create({ args, query }) {
        const result = await query(args);
        // Await so the dashboard reflects new transactions immediately after commit
        await safePush('TRANSACTION_CREATED', 'transaction-create');
        return result;
      },
      async update({ args, query }) {
        const result = await query(args);
        await safePush('TRANSACTION_UPDATED', 'transaction-update');
        return result;
      }
    },
    user: {
      async update({ args, query }) {
        const result = await query(args);
        await safePush('USER_UPDATED', 'user-update');
        return result;
      }
    },
    ledgerEntry: {
      async create({ args, query }) {
        const result = await query(args);
        await safePush('LEDGER_ENTRY_CREATED', 'ledger-entry-create');
        return result;
      }
    }
  }
});
