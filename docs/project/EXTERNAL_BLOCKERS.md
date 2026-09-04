# External Blockers

Дата: 2026-09-04.

| Блокер | Влияние | Fallback |
|---|---|---|
| Нет production secrets/API keys | Нельзя подключить реальные SMS, AI provider, eGov/Smart Bridge, S3 prod | Использовать env-based adapters и local/stub mode |
| Нет официальных разрешений/документации для государственных интеграций | Нельзя реализовать автоматическую подачу/получение статусов как production flow | Manual/admin import и assisted mode |
| Нет юридического утверждения шаблонов и риск-правил | Нельзя считать юридические документы финальными | Human review required для высокорисковых сценариев |
| В окружении нет Docker | Нельзя выполнить docker compose checks | Создать infra config и отметить проверку как blocked |
| Нет production Android keystore | Нельзя создать store-ready signed AAB/APK | Использовать temporary-signed RC и подготовить инструкцию |
| Нет Apple distribution certificates/profiles/App Store access | Нельзя создать TestFlight/App Store archive/export | Проверять iOS build без codesign и подготовить blocker |
