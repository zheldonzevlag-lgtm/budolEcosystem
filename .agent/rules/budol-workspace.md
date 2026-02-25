---
trigger: always_on
---

You write high level application code.
You do not skip steps.
You create task list in html format and mark what is completed
You include the task list in the documentation
You interlink with the index, previous and next version of  the documentation
You do not allow undocumented or untested changes.
You backup first all the databases if there will be changes in the schema or need to wipe out the databases records. Save the database backup in \backup-db\db-date (date is the system date)

add comments explaining:
- why the code exist 
- what the code does
- TODO items


Your job is to enforce the Budol Implementation & Documentation Standard.

PRIMARY OBJECTIVE:
Transform every request into:
Phase-based implementation → Tested code → Versioned HTML documentation → Compliance-verified release

COMPLIANCE:
Code must be PCI DSS, BSP, BIR, NPC, DTI, Cybersecurity Law

PHASE FLOW:
Phase 0 – Baseline & Risk Analysis
Phase 1 – Architecture & Data Contracts
Phase 2 – Backend & API Implementation
Phase 3 – Frontend / App Implementation
Phase 4 – Integration & Security
Phase 5 – End-to-End Testing
Phase 6 – Documentation & Audit
Phase 7 – Release & Monitoring
Phase 8 - Discuss the Dependencies and Software use and why it is chosen
Phade 9 - Ensure that new documentation are added in the version history and documentation archive in the knowledgebase.html
Phase 10 - Test the code, use Jest for testing
Phase 11 - Push, Commit, Create new branch in budolEcosystem repositories 
Phase 12 - Mention in the documentation if there are next steps to be done and list it.


TESTING:
All non-app tests must be stored in \budolEcosystem\scripts\test_scripts

DOCUMENTATION:
All versions must be stored in /documentation/budolecosystem_docs_YYYY-MM-DD_vX
Each must include:
index.html
developer_manual.html
system_admin_manual.html
user_manual.html
risk_register.html
Mitigation.html
issues & fixes.html
test_results.html
future_recommendations.html

Each document must contain:
Purpose, Rationale, Technical Explanation, Changes, Issues, Fixes, Risks, Mitigations, Dependencies, Code References, Tests, Compliance, Future Enhancements and Recommendation. Consolidate all future enhancements and recommendation in one html document and show it in the knowledgebase html

Include the code details with explanation what it is for and must have link to the code file in the developer_manual.html and when link is click it opens the code file. Ensure the the styling of the code background color will make the code readable in the manual.

MOBILE APP:
Stored in \budolEcosystem\android-installer
Follow the naming convention (budolPay N.N.N) where N.N.N is a number
Version must increment and be shown in splash screen.
Ask user before building.
If possible do an upgrde build
before build run flutter analyze and fix the errors.

Design\review a Confluence-style layout with sidebar, main content, and metadata
Update knowledgebase.html with professional styling (Atlassian-inspired) and structured sections
Integrate Sidebar navigation and Table of Contents for improved accessibility

SYSTEM START:
npm start

FINAL GATE:
No release unless tests pass, docs created, version incremented, compliance verified, and risk register updated.







