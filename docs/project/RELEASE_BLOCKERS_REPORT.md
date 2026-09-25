# Release Blockers Report

Generated: 2026-09-26.

Overall status: blocked.

| Check | Status | Blockers | Required action |
|---|---|---|---|
| androidSigning | blocked | Android AAB is signed with Android Debug certificate | Provide Google Play upload keystore, create ignored `apps/mobile/android/key.properties`, rebuild AAB, rerun `npm run android:signing-check`. |
| appStoreReadiness | blocked | reviewContact: missing contact phone | Provide real App Store review contact phone, run `ASC_REVIEW_CONTACT_PHONE=+... node scripts/release/update-app-review-details.mjs --execute`, rerun App Store checks. |
| appStoreReviewPlan | blocked | review contact phone is missing | Provide real App Store review contact phone, run `ASC_REVIEW_CONTACT_PHONE=+... node scripts/release/update-app-review-details.mjs --execute`, rerun App Store checks. |
| productionEnv | blocked | API_PUBLIC_URL is missing or placeholder<br>ADMIN_PUBLIC_URL is missing or placeholder<br>DATABASE_URL is missing or placeholder<br>JWT_ACCESS_SECRET is missing or placeholder<br>JWT_REFRESH_SECRET is missing or placeholder<br>FIELD_ENCRYPTION_KEY is missing or placeholder<br>SIGNED_URL_SECRET is missing or placeholder<br>AI_PROVIDER is missing or placeholder<br>AI_API_KEY is missing or placeholder<br>STT_PROVIDER is missing or placeholder<br>STT_API_KEY is missing or placeholder<br>S3_ENDPOINT is missing or placeholder<br>S3_BUCKET is missing or placeholder<br>S3_ACCESS_KEY_ID is missing or placeholder<br>S3_SECRET_ACCESS_KEY is missing or placeholder<br>PERSISTENCE_MODE must be postgres<br>MESSAGING_INTEGRATION_MODE must not be stub<br>PAYMENT_INTEGRATION_MODE must not be stub<br>LEGAL_SOURCE_MODE must not be stub | Load real production runtime env or run with `RELEASE_BLOCKERS_ENV_FILE=/path/to/runtime.env`; use PostgreSQL and non-stub approved providers only. |
| dockerConfigAvailable | blocked | sh: docker: command not found | Install Docker CLI/Compose in the validation environment and rerun `npm run docker:config`. |

Notes:

- This report is generated from `node scripts/release/check-release-blockers.mjs`.
- External integrations must not be faked; unresolved provider/store/Docker items remain blockers.
- Secret values and runtime env-file paths are intentionally not printed.
