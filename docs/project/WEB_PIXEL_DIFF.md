# Web Pixel Diff

Generated from dark PNG references and web `mobile-ref-390` baselines.

| Screen | View | MSE % |
|---|---|---:|
| 01 | `onboarding` | 8.35 |
| 02 | `login` | 3.20 |
| 03 | `register` | 5.88 |
| 04 | `otp` | 6.88 |
| 05 | `biometric` | 7.65 |
| 06 | `home` | 10.10 |
| 07 | `newCase` | 7.49 |
| 08 | `category` | 6.06 |
| 09 | `documentCheck` | 6.41 |
| 10 | `documentUpload` | 12.07 |
| 11 | `analysis` | 12.47 |
| 12 | `claim` | 6.29 |
| 13 | `claimDraft` | 3.89 |
| 14 | `claimSend` | 5.90 |
| 15 | `cases` | 7.02 |
| 16 | `case` | 5.30 |
| 17 | `chat` | 4.04 |
| 18 | `deadlines` | 8.73 |
| 19 | `legal` | 5.38 |
| 20 | `legalSearch` | 10.77 |
| 21 | `documents` | 8.33 |
| 22 | `profile` | 4.63 |
| 23 | `settings` | 4.05 |
| 24 | `subscription` | 6.03 |
| 25 | `help` | 5.06 |

## Closed Screens

- 13 `claimDraft`: 3.89%, meets the `<=4%` one-screen release rule.
- 02 `login`: 3.20%, remains within the release threshold.

## Next Screen Queue

- 11 `analysis`: 12.47%
- 10 `documentUpload`: 12.07%
- 20 `legalSearch`: 10.77%
- 06 `home`: 10.10%
- 18 `deadlines`: 8.73%
- 01 `onboarding`: 8.35%
- 21 `documents`: 8.33%
- 05 `biometric`: 7.65%

Note: screens above 4% stay open; each screen is closed only after adaptive visuals, functional actions, checks, docs, commit and deploy.
