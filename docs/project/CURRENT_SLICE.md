# Current Slice

## Срез

Documents/evidence admin review queue.

## Статус

DONE -> deployed to public server; public smoke passed.

## Scope

- `/api/v1/admin/documents/review-queue` lists documents requiring OCR/manual admin review.
- `/api/v1/admin/documents/:documentId/ocr-confirm` confirms OCR fields and marks the document ready.
- `/api/v1/admin/documents/:documentId/reject` rejects invalid/quarantined documents with a reason.
- Admin UI loads the real document queue and can confirm/reject the first queued document through API.
- API smoke covers RBAC, queue listing, admin OCR confirm and admin reject.
- Public release smoke script now covers the same deployed endpoints.

## Следующий шаг

Next vertical slice: subscription/budget hardening or continue remaining web pixel screens above the 4% threshold.
