INSERT INTO templates (id, code, title, language, status, version, required_fields, body)
VALUES (
  'tpl-pretrial-claim-ru-v1',
  'pretrial_claim',
  'Досудебная претензия',
  'ru',
  'expert_review',
  'v1',
  ARRAY['claimantName', 'respondentName', 'claimAmount', 'claimReason', 'deadlineDate'],
  'Проект документа. Требует проверки и подтверждения пользователем.'
)
ON CONFLICT (id) DO NOTHING;
