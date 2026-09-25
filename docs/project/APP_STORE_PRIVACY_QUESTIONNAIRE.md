# App Store Privacy Questionnaire

Source of truth for App Store Connect App Privacy. This file reflects the current RC behavior and must be updated when real SMS, payment, analytics, crash reporting or government integrations are enabled.

## URLs

- Privacy Policy URL: `https://89-207-250-217.sslip.io/privacy`
- User Privacy Choices / account deletion URL: `https://89-207-250-217.sslip.io/delete-account`

## Tracking

- Tracks users across apps/websites owned by other companies: `No`.
- Uses IDFA or App Tracking Transparency: `No`.
- Third-party advertising or data broker sharing: `No`.

## Data Linked To The User

| Apple data type | Collected | Purpose | Notes |
|---|---:|---|---|
| Phone Number | Yes | App Functionality, Account Management | Phone OTP login; RC SMS code is local/on-screen until real SMS provider credentials are configured. |
| Email Address | Optional | App Functionality, Account Management, Support | Email auth path exists in API; not required for phone-first flow. |
| Name | Yes | App Functionality | Registration/profile fields for legal document drafts. |
| Physical Address | Optional | App Functionality | Profile/address field is user-entered and used only for documents/cases. |
| Other User Contact Info | Optional | App Functionality, Support | User-entered city/contact details and support requests. |
| Customer Support | Yes | App Functionality, Support | Support request text is stored only when the user sends it. |
| Other User Content | Yes | App Functionality | Case descriptions, chat messages, document OCR text, generated drafts and legal-search queries. |
| Audio Data | Yes | App Functionality | Voice intake records audio for transcript/classification flow after microphone permission. |
| Photos or Videos | Optional | App Functionality | Document/evidence upload from photo library/files. |
| User ID | Yes | App Functionality, Account Management | Internal user/session identifiers; tokens/passwords are not disclosed in export. |
| Purchases | No for RC | App Functionality | Subscription/payment history is local/manual adapter in RC; no production payment provider is configured. |

## Data Not Collected In Current RC

- Precise Location / Coarse Location.
- Contacts.
- Health and Fitness.
- Browsing History.
- Search History outside the app.
- Advertising Data.
- Product Interaction analytics.
- Crash Data or Performance Data from a third-party crash/analytics SDK.
- Sensitive Info as an App Store data type, except user-entered legal facts/documents may contain sensitive content and are handled as user content.

## Retention And Controls

- Account export: `/api/v1/account/export`.
- Account deletion: `DELETE /api/v1/account` and public help page `/delete-account`.
- Logs must not include IIN/BIN/password/token/raw document contents.
- Production SMS/payment/government integrations are blocked until official credentials/adapters are configured; no fake production behavior.

## App Review Notes

Use this exact reviewer note draft unless the implementation changes:

`This is a Kazakhstan-focused legal assistant release candidate. Use phone login with the on-screen local RC SMS code. First-time users must complete profile fields before home access. Voice intake uses real microphone permission and records audio before transcript/classification flow. Government/payment/SMS production integrations are intentionally adapter/manual fallback until official credentials are provided. The app includes source guardrails and high-risk escalation and does not claim to replace licensed legal advice.`
