<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **budolEcosystem** (26266 symbols, 35895 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/budolEcosystem/context` | Codebase overview, check index freshness |
| `gitnexus://repo/budolEcosystem/clusters` | All functional areas |
| `gitnexus://repo/budolEcosystem/processes` | All execution flows |
| `gitnexus://repo/budolEcosystem/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Test_scripts_2 area (460 symbols) | `.claude/skills/generated/test-scripts-2/SKILL.md` |
| Work in the Services area (247 symbols) | `.claude/skills/generated/services/SKILL.md` |
| Work in the Components area (214 symbols) | `.claude/skills/generated/components/SKILL.md` |
| Work in the Screens area (172 symbols) | `.claude/skills/generated/screens/SKILL.md` |
| Work in the V2 area (120 symbols) | `.claude/skills/generated/v2/SKILL.md` |
| Work in the Test_scripts area (107 symbols) | `.claude/skills/generated/test-scripts/SKILL.md` |
| Work in the Categories area (51 symbols) | `.claude/skills/generated/categories/SKILL.md` |
| Work in the Admin area (36 symbols) | `.claude/skills/generated/admin/SKILL.md` |
| Work in the Orders area (32 symbols) | `.claude/skills/generated/orders/SKILL.md` |
| Work in the Coupons area (28 symbols) | `.claude/skills/generated/coupons/SKILL.md` |
| Work in the Users area (28 symbols) | `.claude/skills/generated/users/SKILL.md` |
| Work in the Scripts area (27 symbols) | `.claude/skills/generated/scripts/SKILL.md` |
| Work in the Resend-otp area (26 symbols) | `.claude/skills/generated/resend-otp/SKILL.md` |
| Work in the Auth area (26 symbols) | `.claude/skills/generated/auth/SKILL.md` |
| Work in the Address area (24 symbols) | `.claude/skills/generated/address/SKILL.md` |
| Work in the Add-product area (23 symbols) | `.claude/skills/generated/add-product/SKILL.md` |
| Work in the Shipping area (20 symbols) | `.claude/skills/generated/shipping/SKILL.md` |
| Work in the Settings area (20 symbols) | `.claude/skills/generated/settings/SKILL.md` |
| Work in the Legacy area (20 symbols) | `.claude/skills/generated/legacy/SKILL.md` |
| Work in the V3.4.6 area (17 symbols) | `.claude/skills/generated/v3-4-6/SKILL.md` |

<!-- gitnexus:end -->
