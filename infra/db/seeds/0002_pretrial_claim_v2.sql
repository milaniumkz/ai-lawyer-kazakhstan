-- Add a complete draft version without changing reviewed or edited v1 templates.
INSERT INTO templates (id, code, title, language, status, version, required_fields, body)
VALUES (
  'tpl-pretrial-claim-ru-v2', 'pretrial_claim', 'Досудебная претензия', 'ru', 'expert_review', 'v2',
  ARRAY['claimantName', 'respondentName', 'claimAmount', 'claimReason', 'deadlineDate'],
  $draft$Проект документа. Требует проверки и подтверждения пользователем.

От: {{claimantName}}
Кому: {{respondentName}}

Досудебная претензия

Основание требования: {{claimReason}}.
Сумма требования: {{claimAmount}}.
Просим исполнить требование до {{deadlineDate}}.

Применимые нормы должны быть подтверждены официальными источниками РК перед отправкой.$draft$
)
ON CONFLICT (id) DO NOTHING;
