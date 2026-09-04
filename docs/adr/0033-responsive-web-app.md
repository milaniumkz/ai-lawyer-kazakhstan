# ADR 0033: Responsive Web App

Дата: 2026-09-04.

## Статус

Accepted.

## Контекст

Для тестирования на ПК и телефоне нужна пользовательская веб-версия, отдельная от admin dashboard.

## Решение

- Добавлен workspace `apps/web` на Next.js.
- Web UI адаптирован для desktop/tablet/mobile.
- Используются те же premium Kazakhstan light/dark токены, что admin/mobile.
- Page показывает основные RC сценарии и явные production blockers.

## Последствия

- Web app builds together with other Node workspaces.
- Это тестовая RC web surface, не замена полной Flutter mobile реализации.
