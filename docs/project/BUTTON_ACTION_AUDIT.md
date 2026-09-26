# Button Action Audit

Source of truth for real button behavior. Allowed action types: API, route, persisted state, file/camera picker, microphone/STT, modal/blocker.

| Area | Buttons | Required action | Current evidence |
| --- | --- | --- | --- |
| Auth | phone login, OTP, registration, language tabs | API auth/OTP/profile, persisted language | `npm run test:web-ui`, Flutter auth widget coverage |
| New case and voice | voice, pause, finish, continue | microphone permission, audio upload/transcript, route/classification | `npm run test:web-ui`, Flutter intake tests |
| Category and AI interview | answer AI, repeat analysis, upload document, create case | local facts, API classification/confirm, file picker, API case create | `npm run test:web-ui` |
| Documents | add document, upload documents, choose file | file picker, API upload session, SHA-256, complete upload, OCR review | `openFilePicker`, `handleFileSelection`, `ensureRemoteCaseForDocumentUpload` static checks |
| Photo/scan | scan by camera, take photo | camera picker with `capture="environment"`, API document upload, explicit cancel/error status | `npm run test:web-ui`; browser mobile smoke required before deploy |
| OCR and analysis | confirm OCR, analyze documents, continue | API OCR confirm, gated analysis route/state | API smoke and web UI contract |
| Cases/chat | open case, new case, send message | route/API case list and messages | `npm run test:web-ui`, Flutter chat tests |
| Legal/RAG | search, filters, source, add norm | API RAG, local filter state, official-source route/blocker | `npm run test:web-ui` |
| Claim/send | generate, edit, save draft, assisted send | API document generation, persisted/manual assisted blocker | `npm run test:web-ui` |
| Profile/settings/subscription/help | save/export/delete/settings/payment/support | API profile/account/billing, persisted settings, provider blocker | `npm run test:web-ui`, security tests |
| Admin | queues, review, providers, budgets | API/admin RBAC; blockers for unavailable providers | `npm run test:admin-ui`, API smoke |

Regression rule: upload/photo buttons must not call hidden inputs directly; they must go through `openFilePicker` and `handleFileSelection`, then server-side upload metadata.
