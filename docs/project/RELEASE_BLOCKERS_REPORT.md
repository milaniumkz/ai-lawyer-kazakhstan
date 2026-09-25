# Release Blockers Report

Generated: 2026-09-26.

Overall status: blocked.

| Check | Status | Blockers |
|---|---|---|
| androidSigning | blocked | Android AAB is signed with Android Debug certificate |
| appStoreReadiness | blocked | reviewContact: missing contact phone |
| appStoreReviewPlan | blocked | review contact phone is missing |
| productionEnv | blocked | API_PUBLIC_URL is missing or placeholder<br>ADMIN_PUBLIC_URL is missing or placeholder<br>DATABASE_URL is missing or placeholder<br>JWT_ACCESS_SECRET is missing or placeholder<br>JWT_REFRESH_SECRET is missing or placeholder<br>FIELD_ENCRYPTION_KEY is missing or placeholder<br>SIGNED_URL_SECRET is missing or placeholder<br>AI_PROVIDER is missing or placeholder<br>AI_API_KEY is missing or placeholder<br>STT_PROVIDER is missing or placeholder<br>STT_API_KEY is missing or placeholder<br>S3_ENDPOINT is missing or placeholder<br>S3_BUCKET is missing or placeholder<br>S3_ACCESS_KEY_ID is missing or placeholder<br>S3_SECRET_ACCESS_KEY is missing or placeholder<br>PERSISTENCE_MODE must be postgres<br>MESSAGING_INTEGRATION_MODE must not be stub<br>PAYMENT_INTEGRATION_MODE must not be stub<br>LEGAL_SOURCE_MODE must not be stub |
| dockerConfigAvailable | blocked | sh: docker: command not found |

Notes:

- This report is generated from `node scripts/release/check-release-blockers.mjs`.
- External integrations must not be faked; unresolved provider/store/Docker items remain blockers.
- Secret values and runtime env-file paths are intentionally not printed.
