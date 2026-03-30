Stop-Process -Name git -Force -ErrorAction SilentlyContinue
git fetch origin main
git checkout -B feature/auth-bridge-v32 origin/main
git checkout feature/android-vercel-clean-push -- budolpay-0.1.0/apps/admin/app/api/auth/
git checkout feature/android-vercel-clean-push -- documentation/budolecosystem_docs_2026-03-30_v32/
git checkout feature/android-vercel-clean-push -- knowledgebase.html
git checkout feature/android-vercel-clean-push -- budolpay-0.1.0/apps/admin/package.json
git checkout feature/android-vercel-clean-push -- budolpay-0.1.0/apps/admin/push_env.cjs
git commit -m "feat(auth): Vercel mobile API bridge and ecosystem documentation (v32)"
git push -u origin feature/auth-bridge-v32 --force
