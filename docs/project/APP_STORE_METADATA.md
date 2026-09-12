# App Store Metadata

## Build

- App name: `AI Юрист`
- Bundle ID: `kz.milanium.lawyer`
- SKU/application domain: Kazakhstan legal assistant
- Uploaded build: `1.0.1 (3)`
- Delivery UUID: `22621fff-471e-4689-9fcf-51a2684d5563`
- Apple processing status: `VALID`

## RU Listing Draft

- Subtitle: `Юридический помощник для Казахстана`
- Promotional text: `Создавайте дела, загружайте документы, проверяйте нормы права РК и готовьте черновики обращений с контролем источников.`
- Description: `AI Юрист помогает пользователю структурировать правовой вопрос по законодательству Республики Казахстан: пройти телефонную авторизацию, создать дело голосом или текстом, загрузить документы, проверить распознанный текст, получить ответ с источниками и подготовить черновик досудебной претензии. Внешние государственные сервисы и платежи работают только через официальные адаптеры или честный assisted/manual режим. Приложение не заменяет юриста и направляет высокорисковые вопросы на экспертную проверку.`
- Keywords: `юрист,Казахстан,право,документы,суд,претензия,закон,консультация`
- What's new: `Release candidate для внутреннего тестирования: авторизация по телефону, профиль, дела, чат, документы, OCR-review, поиск норм права РК, досудебная претензия и подписка в local/adapter режиме.`

## KK Listing Draft

- Subtitle: `Қазақстанға арналған заң көмекшісі`
- Promotional text: `Істерді жасаңыз, құжаттарды жүктеңіз, ҚР құқық нормаларын дереккөздермен тексеріңіз.`
- Description: `AI Юрист пайдаланушыға Қазақстан Республикасының құқықтық сұрағын құрылымдауға көмектеседі: телефон арқылы кіру, дау санатын анықтау, құжаттарды жүктеу, OCR мәтінін тексеру, ресми дереккөздерге сүйенген жауап алу және сотқа дейінгі талап жобасын дайындау. Мемлекеттік сервистер мен төлемдер тек ресми адаптерлер немесе assisted/manual режим арқылы қолданылады. Қосымша заңгерді алмастырмайды және жоғары тәуекелді сұрақтарды сарапшыға жібереді.`
- Keywords: `заңгер,Қазақстан,құқық,құжаттар,сот,талап,заң,кеңес`

## EN Listing Draft

- Subtitle: `Legal assistant for Kazakhstan`
- Promotional text: `Create cases, upload documents, verify Kazakhstan legal sources and prepare draft claims with source guardrails.`
- Description: `AI Lawyer helps users structure legal questions under the laws of the Republic of Kazakhstan: phone authentication, voice or text case intake, document upload, OCR review, source-backed legal answers and pretrial claim drafts. Government and payment integrations are not simulated; they use official adapters or assisted/manual fallback until credentials are provided. The app does not replace a lawyer and escalates high-risk matters for expert review.`
- Keywords: `lawyer,Kazakhstan,law,documents,court,claim,legal,assistant`

## Review Notes Draft

`This is a Kazakhstan-focused legal assistant release candidate. Use phone login with the on-screen local RC SMS code. First-time users must complete profile fields before home access. Voice intake uses real microphone permission and records audio before transcript/classification flow. Government/payment/SMS production integrations are intentionally adapter/manual fallback until official credentials are provided. The app includes source guardrails and high-risk escalation and does not claim to replace licensed legal advice.`

## Required URLs

- Support URL: `https://89-207-250-217.sslip.io/support`
- Privacy Policy URL: `https://89-207-250-217.sslip.io/privacy`
- Terms URL: `https://89-207-250-217.sslip.io/terms`
- Account deletion/data export URL: `https://89-207-250-217.sslip.io/delete-account`
- Replace these RC URLs with the custom production domain when DNS is provided.

## Screenshot Set

- Prepared iPhone 6.7" dark set: `docs/project/app-store-screenshots/iphone-67-dark`, 8 PNG files at `1290x2796`.
- iPhone 6.7": login, home voice, case intake, category, chat, documents, legal search, subscription.
- iPhone 6.5": same set if App Store Connect requires fallback size.
- iPad: not required unless iPad support is enabled.
- Final public submission should use native iOS simulator/device screenshots after TestFlight smoke.

## Submission Blockers

- App Store Connect build selection is still manual/external.
- Metadata fields, screenshots, privacy questionnaire and reviewer contact must be completed in App Store Connect.
- Production SMS/payment/government credentials are not provided; app review notes must explicitly describe local/adapter behavior.
