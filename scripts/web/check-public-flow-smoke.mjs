import { chromium } from 'playwright';

const baseUrl = process.env.PUBLIC_SERVER_URL ?? 'https://89-207-250-217.sslip.io';

const seededState = {
  view: 'profile',
  theme: 'dark',
  language: 'RU',
  cases: [
    {
      id: 'case-ref',
      title: 'Тестовое дело из API',
      type: 'Гражданское право',
      status: 'В работе',
      date: '25.09.2026',
      progress: 72,
    },
  ],
  activeCaseId: 'case-ref',
  caseText: '',
  recording: false,
  paused: false,
  recordingSeconds: 0,
  speechStatus: '',
  documents: [],
  messages: [
    {
      role: 'assistant',
      text: 'Я изучил материалы тестового дела. Ниже будут только подтвержденные выводы.',
    },
  ],
  profileType: 'Физлицо',
  profileName: '',
  profileId: '',
  maskPii: true,
  budgetAlerts: true,
  tasks: [],
  selectedCategory: 'Гражданское право',
  classification: null,
  authUserId: '00000000-0000-4000-8000-000000000001',
  phone: '+7',
  otp: '',
  otpId: '',
  otpHint: '',
  draftCaseId: 'draft-smoke',
  remoteCaseId: '00000000-0000-4000-8000-000000000017',
  remoteCaseDraftId: 'draft-smoke',
  remoteDocumentId: '',
  generatedClaimBody: '',
  claimReady: true,
  sent: false,
  claimSendMethod: 'WhatsApp',
  claimSendContact: '',
  claimSendMessage: '',
  helpStatus: 'Нет активных обращений',
  firstName: '',
  lastName: '',
  middleName: '',
  city: '',
  profileComplete: true,
  biometricEnabled: false,
};

function assertIncludes(text, needle, context) {
  if (!text.includes(needle)) {
    throw new Error(`${context}: missing "${needle}"`);
  }
}

function assertExcludes(text, needle, context) {
  if (text.includes(needle)) {
    throw new Error(`${context}: unexpected "${needle}"`);
  }
}

async function pageText(page, hash) {
  await page.goto(`${baseUrl.replace(/\/$/, '')}${hash}`, {
    waitUntil: 'networkidle',
  });
  await page.locator('.appShell').waitFor({ state: 'visible', timeout: 10000 });
  return page.locator('body').innerText();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript((state) => {
    window.localStorage.setItem('ai-lawyer-web-state', JSON.stringify(state));
  }, seededState);

  try {
    const profile = await pageText(page, '#profile');
    assertIncludes(profile, 'Профиль не заполнен', 'profile');
    assertExcludes(profile, 'Асем', 'profile');

    const caseText = await pageText(page, '#case');
    assertIncludes(caseText, 'Нет загруженных документов', 'case');
    assertExcludes(caseText, '1 250 000', 'case');
    assertExcludes(caseText, 'Претензия 18 мая', 'case');

    const documents = await pageText(page, '#documents');
    assertIncludes(documents, 'Файлы не загружены', 'documents');
    assertExcludes(documents, 'Свидетельство_о_браке', 'documents');
    assertExcludes(documents, 'Переписка WhatsApp.zip', 'documents');

    const subscription = await pageText(page, '#subscription');
    assertIncludes(subscription, 'Не загружен', 'subscription');
    assertExcludes(subscription, '34 из 100', 'subscription');
    assertExcludes(subscription, '15 сентября', 'subscription');

    const claimSend = await pageText(page, '#claimSend');
    assertIncludes(claimSend, 'Контакт еще не указан', 'claimSend');
    assertExcludes(claimSend, '+7 905 123-45-67', 'claimSend');
    assertExcludes(claimSend, 'Иванов Иван', 'claimSend');

    const help = await pageText(page, '#help');
    assertIncludes(help, 'Служба поддержки', 'help');
    assertExcludes(help, 'до 15 минут', 'help');

    console.log(`public web flow smoke ok: ${baseUrl}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
