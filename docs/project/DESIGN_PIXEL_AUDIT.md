# Design Pixel Audit

Дата: 2026-09-07.

Аудит построен по 45 PNG references:

- Dark compact: 941x1672, screens 01-20.
- Dark full: 1080x1920, screens 21-25.
- Light: 941x1672, 20 references.
- UI должен быть нативным; PNG используются только как reference.

## Reference Samples

| Group | Count | Size | background samples | center samples |
|---|---:|---|---|---|
| Dark 01-20 | 20 | 941x1672 | `#01040a`-`#060e1a` | mostly `#050e1b`-`#121213`, with gold/paper content zones |
| Dark 21-25 | 5 | 1080x1920 | `#000007`, `#030c15`, `#0b1927` | `#020b14`, `#0b1927` |
| Light | 20 | 941x1672 | `#fbfaf7`-`#fefdfd` | `#f7f3ed`-`#ffffff`, gold accents `#d29f4b`-`#eabe6c` |

## Screen Coverage

| # | Dark reference | Size | Current parity target |
|---|---|---|---|
| 01 | Онбординг | 941x1672 | emblem centered, gold title, divider, primary CTA, login link |
| 02 | Вход и регистрация | 941x1672 | back, language tabs, auth tabs, icon action rows |
| 03 | Регистрация пользователя | 941x1672 | emblem, bordered form card, profile chips, consent, gold CTA |
| 04 | SMS подтверждение | 941x1672 | emblem, large title, six OTP boxes, resend/change actions |
| 05 | Биометрия | 941x1672 | face/fingerprint emblem, gold CTA, outline later, device-only notice |
| 06 | Главный экран | 941x1672 | top greeting, profile/actions, central mic, quick cards, bottom nav |
| 07 | Новое дело | 941x1672 | voice-first recording panel, transcript, pause/finish controls |
| 08 | Категория спора | 941x1672 | selectable dispute cards/chips, create-case CTA |
| 09 | Проверка документов | 941x1672 | document checklist, OCR status, upload path |
| 10 | Загрузка документа | 941x1672 | upload/drop/scan card, progress/status |
| 11 | Анализ документов | 941x1672 | analysis summary, facts/missing docs, next claim CTA |
| 12 | Формирование претензии | 941x1672 | builder fields, official-source warning, generate CTA |
| 13 | Проект претензии | 941x1672 | paper preview zone, edit/review controls |
| 14 | Отправка претензии | 941x1672 | assisted submission state, receipt/manual blocker |
| 15 | Мои дела | 941x1672 | search/filter, case list rows, real saved data only |
| 16 | Карточка дела | 941x1672 | case status, progress, actions, documents |
| 17 | Чат по делу | 941x1672 | message bubbles, input composer, progress states |
| 18 | Календарь и сроки | 941x1672 | timeline/tasks, date status, toggles |
| 19 | Нормы права | 941x1672 | official source cards, active/archive filter |
| 20 | Поиск нормы права | 941x1672 | search input, RAG answer, citation actions |
| 21 | Документы и доказательства | 1080x1920 | larger full-screen document/evidence layout |
| 22 | Профиль | 1080x1920 | profile card, switcher, save/settings routes |
| 23 | Настройки | 1080x1920 | settings toggles, export/delete account |
| 24 | Подписка | 1080x1920 | plan/limits/budget, payment blocker |
| 25 | Помощь | 1080x1920 | support actions, privacy/safety notices |

## Visual Baselines

Обязательные web screenshots для следующих срезов (`WEB_BASE_URL=<url> npm run test:web-screenshots:strict`):

- Mobile compact: 390x844.
- Mobile large: 430x932.
- Desktop: 1440x900.
- Dark: all screens 01-25.
- Light: screens 01-20 where light PNG references exist.

Acceptance для mobile/web center frame:

- layout offset: <= 4px for controls and text blocks;
- border/radius: <= 2px;
- emblem/mic/card size: <= 5%;
- no overlapped text/buttons;
- desktop side panels must not distort the central mobile frame.
- `npm run test:web-pixel-diff` writes `docs/project/WEB_PIXEL_DIFF.md` from dark PNG references and `mobile-ref-390` web baselines.

## Priority gaps

1. Screens 06-08: central mic/home/category need exact size/spacing parity.
2. Screens 09-11: document upload/OCR cards need reference-style progress and cards.
3. Screens 12-14: claim preview must match paper/gold layout from reference.
4. Screens 15-18: list/chat/deadline density and bottom nav need pixel pass.
5. Screens 19-25: full-height 1080x1920 dark references need separate spacing pass.
