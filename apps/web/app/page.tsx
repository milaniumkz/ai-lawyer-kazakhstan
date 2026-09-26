"use client";

/* eslint-disable react-hooks/set-state-in-effect -- The app hydrates hash route and persisted client state after mount. */

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

type View =
  | "onboarding"
  | "login"
  | "register"
  | "otp"
  | "biometric"
  | "home"
  | "newCase"
  | "category"
  | "documentCheck"
  | "documentUpload"
  | "analysis"
  | "claim"
  | "claimDraft"
  | "claimSend"
  | "cases"
  | "case"
  | "chat"
  | "deadlines"
  | "legal"
  | "legalSearch"
  | "documents"
  | "profile"
  | "settings"
  | "subscription"
  | "help";
type CaseItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  date: string;
  progress: number;
};
type Message = { role: "user" | "assistant"; text: string };
type DocumentItem = {
  id?: string;
  name: string;
  status: string;
  sizeBytes?: number;
  source?: "file" | "camera";
  sha256?: string;
};
type TaskItem = { title: string; due: string; done: boolean };
type LegalNorm = {
  title: string;
  article: string;
  source: string;
  date: string;
  text: string;
  url: string;
};
type ApiLegalCase = {
  id: string;
  title: string;
  category: string;
  status: string;
  readinessPercent: number;
  createdAt: string;
};
type ApiDocument = {
  id: string;
  fileName: string;
  status: string;
  extractedFields?: Record<string, string>;
};
type ApiUploadSession = {
  id: string;
  uploadUrl: string;
  status: string;
};
type ApiGeneratedDocument = {
  id: string;
  title: string;
  body: string;
  status: string;
  expertReviewRequired: boolean;
};
type ApiLegalAnswer = {
  status: string;
  message: string;
  fragment?: {
    title: string;
    article?: string;
    sourceUrl: string;
    text: string;
    retrievedAt?: string;
  };
};
type ApiClassification = {
  id: string;
  result: {
    category_code: string;
    subcategory_code: string;
    category_label: string;
    subcategory_label: string;
    confidence: number;
    reasons: string[];
    alternatives: { code: string; confidence: number; reason: string }[];
    missing_facts: string[];
    clarification_questions: { id: string; questionRu: string }[];
    risk_level: "low" | "medium" | "high";
    risk_flags: string[];
    required_human_review: boolean;
  };
  userConfirmed: boolean;
};
type ApiOtpResponse = {
  otpId: string;
  deliveryMode: "stub" | "sms" | "email";
  testCode?: string;
};
type ApiAuthSession = {
  user: { id: string };
  isNewUser?: boolean;
  profileRequired?: boolean;
};
type TranscriptJob = {
  id: string;
  status: string;
  transcript: string;
  progress: string[];
  audioFileId?: string;
  audioSha256?: string;
};
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};
type SavedState = {
  view: View;
  theme: "dark" | "light";
  language: Language;
  cases: CaseItem[];
  activeCaseId: string;
  caseText: string;
  recording: boolean;
  paused: boolean;
  recordingSeconds: number;
  speechStatus: string;
  documents: DocumentItem[];
  messages: Message[];
  profileType: string;
  profileName: string;
  profileId: string;
  maskPii: boolean;
  budgetAlerts: boolean;
  tasks: TaskItem[];
  selectedCategory: string;
  classification: ApiClassification | null;
  authUserId: string;
  phone: string;
  otp: string;
  otpId: string;
  otpHint: string;
  draftCaseId: string;
  remoteCaseId: string;
  remoteCaseDraftId: string;
  remoteDocumentId: string;
  generatedClaimBody: string;
  claimReady: boolean;
  sent: boolean;
  claimSendMethod: string;
  claimSendContact: string;
  claimSendMessage: string;
  helpStatus: string;
  firstName: string;
  lastName: string;
  middleName: string;
  city: string;
  profileComplete: boolean;
  biometricEnabled: boolean;
};

type SubscriptionPlan = {
  plan: string;
  title: string;
  priceKzt: number;
  monthlyLimitKzt: number;
  documentLimit: number;
  voiceMinutes: number;
  expertReview: boolean;
};

type PaymentHistoryItem = {
  id: string;
  plan: string;
  provider: string;
  amountKzt: number;
  status: string;
  createdAt: string;
};

type Language = "RU" | "KZ" | "EN";

function normalizeKzPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "+7";
  const subscriberDigits =
    digits.length > 10 && (digits.startsWith("7") || digits.startsWith("8"))
      ? digits.slice(1)
      : digits;
  return `+7${subscriberDigits.slice(0, 10)}`;
}

function isValidKzIinBin(value: string) {
  if (!/^\d{12}$/.test(value)) return false;
  const digits = [...value].map(Number);
  const firstWeights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const secondWeights = [3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2];
  const checksum = (weights: number[]) =>
    weights.reduce((sum, weight, index) => sum + weight * digits[index], 0) %
    11;
  const first = checksum(firstWeights);
  const control = first === 10 ? checksum(secondWeights) : first;
  return control !== 10 && control === digits[11];
}

const AUTH_I18N: Record<
  Language,
  {
    brand: string;
    loginTitle: string;
    loginSubtitle: string;
    steps: [string, string, string];
    phoneLabel: string;
    phonePlaceholder: string;
    smsButton: string;
    sending: string;
    biometric: string;
    newAccountHint: string;
    languageStatus: string;
    registerTitle: string;
    registerSubtitle: string;
    lastName: string;
    firstName: string;
    middleName: string;
    city: string;
    iinBin: string;
    iinBinInvalid: string;
    consent: string;
    finishRegister: string;
    alreadyHaveAccount: string;
    otpTitle: string;
    otpSent: string;
    otpFallback: string;
    otpTestCode: string;
    otpPlaceholder: string;
    resend: string;
    confirm: string;
    changePhone: string;
    biometricTitle: string;
    biometricSubtitle: string;
    biometricEnable: string;
    biometricEnabled: string;
    later: string;
    biometricHint: string;
  }
> = {
  RU: {
    brand: "AI Юрист",
    loginTitle: "Вход в AI Юрист",
    loginSubtitle: "Введите номер телефона. Если профиль уже есть в базе, откроется главная. Если нет - регистрация.",
    steps: ["1. Номер", "2. SMS", "3. Профиль"],
    phoneLabel: "Номер телефона",
    phonePlaceholder: "+7 701 000 00 01",
    smsButton: "Получить SMS-код",
    sending: "Отправляю",
    biometric: "Войти по Face ID / Touch ID",
    newAccountHint: "Новый аккаунт создается только после подтверждения SMS-кода.",
    languageStatus: "Язык интерфейса",
    registerTitle: "Заполните анкету",
    registerSubtitle: "Создайте аккаунт и начните работу с юридическим помощником",
    lastName: "Фамилия",
    firstName: "Имя",
    middleName: "Отчество",
    city: "Город",
    iinBin: "ИИН/БИН, если нужно",
    iinBinInvalid: "ИИН/БИН должен состоять из 12 цифр и проходить проверку РК. Оставьте поле пустым, если он не нужен.",
    consent: "Я принимаю условия и согласен на обработку данных",
    finishRegister: "✧ Создать аккаунт",
    alreadyHaveAccount: "Уже есть аккаунт? Войти",
    otpTitle: "Введите код из SMS",
    otpSent: "Мы отправили код на номер",
    otpFallback: "Мы отправили код на номер +7 707 123 45 67",
    otpTestCode: "SMS-код для теста",
    otpPlaceholder: "Код из SMS",
    resend: "Отправить код повторно через",
    confirm: "✧ Подтвердить",
    changePhone: "Изменить номер",
    biometricTitle: "Включить биометрию",
    biometricSubtitle: "Входите в приложение быстрее и безопаснее с помощью Face ID / Touch ID",
    biometricEnable: "✧ Включить",
    biometricEnabled: "✓ Биометрия включена",
    later: "Позже",
    biometricHint: "▣ Биометрические данные хранятся только на устройстве",
  },
  KZ: {
    brand: "AI Заңгер",
    loginTitle: "AI Заңгерге кіру",
    loginSubtitle: "Телефон нөмірін енгізіңіз. Профиль базада болса, басты бет ашылады. Болмаса - тіркеу ашылады.",
    steps: ["1. Нөмір", "2. SMS", "3. Профиль"],
    phoneLabel: "Телефон нөмірі",
    phonePlaceholder: "+7 701 000 00 01",
    smsButton: "SMS-код алу",
    sending: "Жіберілуде",
    biometric: "Face ID / Touch ID арқылы кіру",
    newAccountHint: "Жаңа аккаунт SMS-код расталғаннан кейін ғана жасалады.",
    languageStatus: "Интерфейс тілі",
    registerTitle: "Анкетаны толтырыңыз",
    registerSubtitle: "Алғашқы кіру: деректер құжаттар мен істер үшін қажет",
    lastName: "Тегі",
    firstName: "Аты",
    middleName: "Әкесінің аты",
    city: "Қала",
    iinBin: "ЖСН/БСН, қажет болса",
    iinBinInvalid: "ЖСН/БСН 12 цифрдан тұрып, ҚР тексерісінен өтуі керек. Қажет болмаса, бос қалдырыңыз.",
    consent: "Шарттарды қабылдаймын және деректерді өңдеуге келісемін",
    finishRegister: "✧ Тіркеуді аяқтау",
    alreadyHaveAccount: "Аккаунт бар ма? Кіру",
    otpTitle: "SMS кодын енгізіңіз",
    otpSent: "Код жіберілген нөмір",
    otpFallback: "Код +7 707 123 45 67 нөміріне жіберілді",
    otpTestCode: "Тест SMS-коды",
    otpPlaceholder: "SMS коды",
    resend: "Кодты қайта жіберу",
    confirm: "✧ Растау",
    changePhone: "Нөмірді өзгерту",
    biometricTitle: "Биометрияны қосу",
    biometricSubtitle: "Face ID / Touch ID арқылы жылдам әрі қауіпсіз кіріңіз",
    biometricEnable: "✧ Қосу",
    biometricEnabled: "✓ Биометрия қосылды",
    later: "Кейін",
    biometricHint: "▣ Биометриялық деректер тек құрылғыда сақталады",
  },
  EN: {
    brand: "AI Lawyer",
    loginTitle: "Sign in to AI Lawyer",
    loginSubtitle: "Enter your phone number. If your profile exists in the database, the home screen opens. Otherwise, registration opens.",
    steps: ["1. Phone", "2. SMS", "3. Profile"],
    phoneLabel: "Phone number",
    phonePlaceholder: "+7 701 000 00 01",
    smsButton: "Get SMS code",
    sending: "Sending",
    biometric: "Sign in with Face ID / Touch ID",
    newAccountHint: "A new account is created only after SMS confirmation.",
    languageStatus: "Interface language",
    registerTitle: "Complete your profile",
    registerSubtitle: "First sign-in: these details are needed for documents and cases",
    lastName: "Last name",
    firstName: "First name",
    middleName: "Middle name",
    city: "City",
    iinBin: "IIN/BIN, if needed",
    iinBinInvalid: "IIN/BIN must have 12 digits and pass Kazakhstan checksum. Leave it empty if it is not needed.",
    consent: "I accept the terms and consent to data processing",
    finishRegister: "✧ Complete registration",
    alreadyHaveAccount: "Already have an account? Sign in",
    otpTitle: "Enter the SMS code",
    otpSent: "We sent the code to",
    otpFallback: "We sent the code to +7 707 123 45 67",
    otpTestCode: "Test SMS code",
    otpPlaceholder: "SMS code",
    resend: "Resend code in",
    confirm: "✧ Confirm",
    changePhone: "Change phone",
    biometricTitle: "Enable biometrics",
    biometricSubtitle: "Sign in faster and safer with Face ID / Touch ID",
    biometricEnable: "✧ Enable",
    biometricEnabled: "✓ Biometrics enabled",
    later: "Later",
    biometricHint: "▣ Biometric data stays only on this device",
  },
};

const CASE_CATEGORY_LABELS: Record<string, string> = {
  family: "Семейные споры",
  civil_contract: "Договоры и долги",
  labor: "Трудовые споры",
  housing: "Жилищные споры",
  property_real_estate: "Имущество и недвижимость",
  land: "Земельные споры",
  inheritance: "Наследство",
  consumer: "Защита потребителей",
  banking_credit: "Банки, кредиты и МФО",
  insurance: "Страховые споры",
  tort_damage: "Вред и компенсация",
  corporate_commercial: "Бизнес и корпоративные споры",
  bankruptcy_rehabilitation: "Банкротство и реабилитация",
  tax_customs: "Налоги и таможня",
  ip_copyright: "Интеллектуальная собственность",
  medical: "Медицинские споры",
  administrative_public_law: "Спор с госорганом",
  administrative_offense: "Административное правонарушение",
  criminal: "Уголовное дело",
  enforcement: "Исполнительное производство",
  migration: "Миграционные вопросы",
  special_proceeding: "Особое производство",
  order_proceeding: "Судебный приказ",
  mediation_settlement: "Медиация и мировое соглашение",
  clarification_required: "Требует уточнения",
};

const screens: { label: string; view: View }[] = [
  { label: "Онбординг", view: "onboarding" },
  { label: "Вход и регистрация", view: "login" },
  { label: "Регистрация пользователя", view: "register" },
  { label: "SMS подтверждение", view: "otp" },
  { label: "Биометрия", view: "biometric" },
  { label: "Главный экран", view: "home" },
  { label: "Новое дело", view: "newCase" },
  { label: "Категория спора", view: "category" },
  { label: "Проверка документов", view: "documentCheck" },
  { label: "Загрузка документа", view: "documentUpload" },
  { label: "Анализ документов", view: "analysis" },
  { label: "Формирование претензии", view: "claim" },
  { label: "Проект претензии", view: "claimDraft" },
  { label: "Отправка претензии", view: "claimSend" },
  { label: "Мои дела", view: "cases" },
  { label: "Карточка дела", view: "case" },
  { label: "Чат по делу", view: "chat" },
  { label: "Календарь и сроки", view: "deadlines" },
  { label: "Нормы права", view: "legal" },
  { label: "Поиск нормы права", view: "legalSearch" },
  { label: "Документы и доказательства", view: "documents" },
  { label: "Профиль", view: "profile" },
  { label: "Настройки", view: "settings" },
  { label: "Подписка", view: "subscription" },
  { label: "Помощь", view: "help" },
];

export default function WebHome() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const speechDraftRef = useRef("");
  const clientSequenceRef = useRef(0);
  const [view, setView] = useState<View>("login");
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState<"RU" | "KZ" | "EN">("RU");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [activeCaseId, setActiveCaseId] = useState("");
  const [caseText, setCaseText] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [claimReady, setClaimReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [speechStatus, setSpeechStatus] = useState(
    "Распознавание речи еще не запускалось",
  );
  const [transcriptJobId, setTranscriptJobId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Семейные споры");
  const [classification, setClassification] = useState<ApiClassification | null>(null);
  const [classificationBusy, setClassificationBusy] = useState(false);
  const [aiInterviewInput, setAiInterviewInput] = useState("");
  const [authUserId, setAuthUserId] = useState("");
  const [otpId, setOtpId] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  const [draftCaseId, setDraftCaseId] = useState("draft-initial");
  const [remoteCaseId, setRemoteCaseId] = useState("");
  const [remoteCaseDraftId, setRemoteCaseDraftId] = useState("");
  const [remoteDocumentId, setRemoteDocumentId] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");
  const [generatedClaimBody, setGeneratedClaimBody] = useState("");
  const [claimSendMethod, setClaimSendMethod] = useState("WhatsApp");
  const [claimSendContact, setClaimSendContact] = useState("");
  const [claimSendMessage, setClaimSendMessage] = useState(
    "Здравствуйте!\nНаправляю Вам претензию по делу. Прошу ознакомиться с документом во вложении.\nС уважением.",
  );
  const [deadlineStatus, setDeadlineStatus] = useState(
    "Ближайший срок: досудебная претензия за 10 дней",
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    "Лимиты обновятся после входа",
  );
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [legalQuery, setLegalQuery] = useState("");
  const [legalAnswer, setLegalAnswer] = useState(
    "Введите вопрос и нажмите найти норму.",
  );
  const [legalTab, setLegalTab] = useState("Кодексы");
  const [legalActiveOnly, setLegalActiveOnly] = useState(true);
  const [legalNorms, setLegalNorms] = useState<LegalNorm[]>([]);
  const [selectedNorm, setSelectedNorm] = useState<LegalNorm | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Опишите ситуацию. Я проверю факты, документы и официальные источники РК.",
    },
  ]);
  const [phone, setPhone] = useState("+7");
  const [otp, setOtp] = useState("");
  const [consent, setConsent] = useState(true);
  const [profileType, setProfileType] = useState("Физлицо");
  const [profileName, setProfileName] = useState("");
  const [profileId, setProfileId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [city, setCity] = useState("");
  const [profileComplete, setProfileComplete] = useState(false);
  const [syncState, setSyncState] = useState("Не синхронизировано");
  const [maskPii, setMaskPii] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [documentTab, setDocumentTab] = useState<"documents" | "evidence" | "recent">("documents");
  const [documentFolder, setDocumentFolder] = useState("Все документы");
  const [textSize, setTextSize] = useState("Средний");
  const [voiceSpeed, setVoiceSpeed] = useState("1.0x");
  const [autoPlayback, setAutoPlayback] = useState(false);
  const [saveVoiceRecords, setSaveVoiceRecords] = useState(false);
  const [usageAnalytics, setUsageAnalytics] = useState(false);
  const [helpStatus, setHelpStatus] = useState("Нет активных обращений");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([
    { title: "Проверить расписку", due: "Сегодня", done: false },
    { title: "Подготовить претензию", due: "10 дней", done: false },
    { title: "Сверить срок исковой давности", due: "До подачи", done: true },
  ]);

  const activeCase =
    cases.find((item) => item.id === activeCaseId) ?? cases[0] ?? null;
  const currentDraftCaseCreated = Boolean(
    remoteCaseId && remoteCaseDraftId === draftCaseId,
  );
  const draftContextViews: View[] = [
    "newCase",
    "category",
    "documentCheck",
    "documentUpload",
    "analysis",
  ];
  const showDraftContext =
    draftContextViews.includes(view) && !currentDraftCaseCreated;
  const authText = AUTH_I18N[language];
  const cleanProfileId = profileId.replace(/\D/g, "");
  const profileIdInvalid = Boolean(cleanProfileId) && !isValidKzIinBin(cleanProfileId);
  const filteredCases = useMemo(
    () =>
      cases.filter(
        (item) =>
          item.title.toLowerCase().includes(caseSearch.toLowerCase()) ||
          caseSearch.length < 3,
      ),
    [cases, caseSearch],
  );
  const visibleDocuments = useMemo(() => {
    const query = caseSearch.toLowerCase();
    return documents.filter((item) => {
      const name = item.name.toLowerCase();
      const matchesSearch = query.length < 3 || name.includes(query);
      const matchesFolder =
        documentFolder === "Все документы" ||
        (documentFolder === "Личные документы" && (name.includes("паспорт") || name.includes("иин"))) ||
        (documentFolder === "Договоры и переписка" && (name.includes("договор") || name.includes("переписк"))) ||
        (documentFolder === "Судебные документы" && (name.includes("иск") || name.includes("суд")));
      const matchesTab =
        documentTab === "recent" ||
        documentTab === "documents" ||
        (documentTab === "evidence" && item.status !== "Ошибка API upload");
      return matchesSearch && matchesFolder && matchesTab;
    });
  }, [caseSearch, documentFolder, documentTab, documents]);

  useEffect(() => {
    if (!hydrated) return;
    const publicViews: View[] = ["onboarding", "login", "otp", "register", "biometric"];
    if (!authUserId && !publicViews.includes(view)) {
      setView("login");
      return;
    }
    if (authUserId && !profileComplete && !publicViews.includes(view)) {
      setView("register");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash !== `#${view}`)
      window.history.replaceState(null, "", `#${view}`);
  }, [authUserId, hydrated, profileComplete, view]);

  useEffect(() => {
    const hashView = window.location.hash.replace("#", "") as View;
    const hasHashView = screens.some((screen) => screen.view === hashView);
    if (hasHashView) setView(hashView);
    const raw = window.localStorage.getItem("ai-lawyer-web-state");
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const saved = JSON.parse(raw) as Partial<SavedState>;
      if (hasHashView) setView(hashView);
      else if (saved.authUserId && saved.profileComplete && saved.view)
        setView(saved.view);
      else setView("login");
      if (saved.theme === "light" || saved.theme === "dark")
        setTheme(saved.theme);
      if (saved.language === "RU" || saved.language === "KZ" || saved.language === "EN")
        setLanguage(saved.language);
      if (saved.cases?.length) setCases(saved.cases);
      if (saved.activeCaseId) setActiveCaseId(saved.activeCaseId);
      if (saved.caseText) setCaseText(saved.caseText);
      if (typeof saved.recording === "boolean") setRecording(saved.recording);
      if (typeof saved.paused === "boolean") setPaused(saved.paused);
      if (typeof saved.recordingSeconds === "number")
        setRecordingSeconds(saved.recordingSeconds);
      if (saved.speechStatus) setSpeechStatus(saved.speechStatus);
      if (saved.documents?.length) setDocuments(saved.documents);
      if (saved.messages?.length) setMessages(saved.messages);
      if (saved.profileType) setProfileType(saved.profileType);
      if (saved.profileName) {
        setProfileName(saved.profileName);
      }
      if (saved.profileId) setProfileId(saved.profileId);
      if (saved.firstName) setFirstName(saved.firstName);
      if (saved.lastName) setLastName(saved.lastName);
      if (saved.middleName) setMiddleName(saved.middleName);
      if (saved.city) setCity(saved.city);
      if (typeof saved.profileComplete === "boolean")
        setProfileComplete(saved.profileComplete);
      if (typeof saved.biometricEnabled === "boolean")
        setBiometricEnabled(saved.biometricEnabled);
      if (typeof saved.maskPii === "boolean") setMaskPii(saved.maskPii);
      if (typeof saved.budgetAlerts === "boolean")
        setBudgetAlerts(saved.budgetAlerts);
      if (saved.tasks?.length) setTasks(saved.tasks);
      if (saved.selectedCategory) setSelectedCategory(saved.selectedCategory);
      if (saved.classification) setClassification(saved.classification);
      if (saved.authUserId) setAuthUserId(saved.authUserId);
      if (saved.phone) setPhone(saved.phone);
      if (saved.otp) setOtp(saved.otp);
      if (saved.otpId) setOtpId(saved.otpId);
      if (saved.otpHint) setOtpHint(saved.otpHint);
      if (saved.draftCaseId) setDraftCaseId(saved.draftCaseId);
      if (saved.remoteCaseId) setRemoteCaseId(saved.remoteCaseId);
      if (saved.remoteCaseDraftId) setRemoteCaseDraftId(saved.remoteCaseDraftId);
      if (saved.remoteDocumentId) setRemoteDocumentId(saved.remoteDocumentId);
      if (saved.generatedClaimBody)
        setGeneratedClaimBody(saved.generatedClaimBody);
      if (typeof saved.claimReady === "boolean") setClaimReady(saved.claimReady);
      if (typeof saved.sent === "boolean") setSent(saved.sent);
      if (saved.claimSendContact) setClaimSendContact(saved.claimSendContact);
      if (saved.claimSendMethod) setClaimSendMethod(saved.claimSendMethod);
      if (saved.claimSendMessage) setClaimSendMessage(saved.claimSendMessage);
      if (saved.helpStatus) setHelpStatus(saved.helpStatus);
      setSyncState("Локальные данные восстановлены");
    } catch {
      setSyncState("Не удалось восстановить локальные данные");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    function applyHashView() {
      const hashView = window.location.hash.replace("#", "") as View;
      if (screens.some((screen) => screen.view === hashView)) setView(hashView);
    }
    window.addEventListener("hashchange", applyHashView);
    return () => window.removeEventListener("hashchange", applyHashView);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const saved: SavedState = {
      view,
      theme,
      language,
      cases,
      activeCaseId,
      caseText,
      recording,
      paused,
      recordingSeconds,
      speechStatus,
      documents,
      messages,
      profileType,
      profileName,
      profileId,
      maskPii,
      budgetAlerts,
      tasks,
      selectedCategory,
      classification,
      authUserId,
      phone,
      otp,
      otpId,
      otpHint,
      draftCaseId,
      remoteCaseId,
      remoteCaseDraftId,
      remoteDocumentId,
      generatedClaimBody,
      claimReady,
      sent,
      claimSendContact,
      claimSendMethod,
      claimSendMessage,
      helpStatus,
      firstName,
      lastName,
      middleName,
      city,
      profileComplete,
      biometricEnabled,
    };
    window.localStorage.setItem("ai-lawyer-web-state", JSON.stringify(saved));
  }, [
    hydrated,
    view,
    theme,
    language,
    cases,
    activeCaseId,
    caseText,
    recording,
    paused,
    recordingSeconds,
    speechStatus,
    documents,
    messages,
    profileType,
    profileName,
    profileId,
    maskPii,
    budgetAlerts,
    tasks,
    selectedCategory,
    classification,
    authUserId,
    phone,
    otp,
    otpId,
    otpHint,
    draftCaseId,
    remoteCaseId,
    remoteCaseDraftId,
    remoteDocumentId,
    generatedClaimBody,
    claimReady,
    sent,
    claimSendContact,
    claimSendMethod,
    claimSendMessage,
    helpStatus,
    firstName,
    lastName,
    middleName,
    city,
    profileComplete,
    biometricEnabled,
  ]);

  useEffect(() => {
    if (!recording || paused) return undefined;
    const timer = window.setInterval(
      () => setRecordingSeconds((seconds) => seconds + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [paused, recording]);

  useEffect(
    () => () => {
      speechRecognitionRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  function go(nextView: View) {
    const publicViews: View[] = ["onboarding", "login", "otp", "register", "biometric"];
    if (!authUserId && !publicViews.includes(nextView)) {
      setView("login");
      return;
    }
    if (authUserId && !profileComplete && !publicViews.includes(nextView)) {
      setView("register");
      return;
    }
    setView(nextView);
  }

  function nextClientId(prefix: string) {
    clientSequenceRef.current += 1;
    return `${prefix}-${clientSequenceRef.current}`;
  }

  function startNewCaseDraft(options: { startVoice?: boolean } = {}) {
    const nextDraftId = nextClientId("draft");
    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioChunksRef.current = [];
    audioBlobRef.current = null;
    speechDraftRef.current = "";
    setDraftCaseId(nextDraftId);
    setRemoteCaseId("");
    setRemoteCaseDraftId("");
    setRemoteDocumentId("");
    setClassification(null);
    setDocuments([]);
    setSelectedDocument("");
    setMessages([
      {
        role: "assistant",
        text: "Опишите ситуацию. Я проверю факты, документы и официальные источники РК.",
      },
    ]);
    setCaseText("");
    setAiInterviewInput("");
    setTranscriptJobId("");
    setAudioUrl("");
    setRecording(false);
    setPaused(false);
    setRecordingSeconds(0);
    setOcrConfirmed(false);
    setAnalysisDone(false);
    setGeneratedClaimBody("");
    setClaimReady(false);
    setSent(false);
    setSyncState("Начато новое дело: черновик очищен");
    go("newCase");
    if (options.startVoice) window.setTimeout(() => void startRecording(), 0);
  }

  async function ensureUser() {
    if (authUserId) return authUserId;
    go("login");
    throw new Error("Сначала войдите или зарегистрируйтесь");
  }

  function mapCase(record: ApiLegalCase): CaseItem {
    return {
      id: record.id.slice(0, 8),
      title: record.title,
      type: CASE_CATEGORY_LABELS[record.category] ?? selectedCategory,
      status:
        record.status === "consultation"
          ? "Консультация открыта"
          : "Требует уточнения",
      date: new Date(record.createdAt).toLocaleDateString("ru-KZ", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      progress: record.readinessPercent,
    };
  }

  async function addCase() {
    if (caseText.trim().length < 12) {
      setSyncState("Опишите ситуацию подробнее");
      return;
    }
    setSyncState("Создаю дело в API...");
    try {
      const ownerUserId = await ensureUser();
      const legalCase = (await apiJson("/cases", {
        method: "POST",
        headers: {
          "idempotency-key": nextClientId("web-case"),
          "x-user-id": ownerUserId,
        },
        body: JSON.stringify({
          ownerUserId,
          problemText: `${caseText}\nКатегория: ${classification?.result.subcategory_code ?? selectedCategory}`,
        }),
      })) as ApiLegalCase;
      const next = mapCase(legalCase);
      setRemoteCaseId(legalCase.id);
      setRemoteCaseDraftId(draftCaseId);
      setCases((items) => [next, ...items.filter((item) => item.id !== next.id)]);
      setActiveCaseId(next.id);
      setTasks((items) =>
        items.map((item) =>
          item.title === "Проверить расписку" ? { ...item, done: true } : item,
        ),
      );
      setSyncState(
        documents.length
          ? `Дело сохранено в API: №${next.id}. Загрузите pending документы в это дело.`
          : `Дело сохранено в API: №${next.id}`,
      );
      go("case");
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `API ошибка: ${error.message}`
          : "Не удалось создать дело",
      );
    }
  }

  async function ensureRemoteCaseForDocumentUpload(fileName: string) {
    if (remoteCaseId && remoteCaseDraftId === draftCaseId) return remoteCaseId;
    const ownerUserId = await ensureUser();
    const problemText =
      caseText.trim().length >= 12
        ? caseText.trim()
        : `Черновик дела: пользователь загрузил документ ${fileName} для юридической проверки по законодательству Республики Казахстан.`;
    const legalCase = (await apiJson("/cases", {
      method: "POST",
      headers: {
        "idempotency-key": `web-upload-${draftCaseId}`,
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({
        ownerUserId,
        problemText,
      }),
    })) as ApiLegalCase;
    const next = mapCase(legalCase);
    setRemoteCaseId(legalCase.id);
    setRemoteCaseDraftId(draftCaseId);
    setCases((items) => [next, ...items.filter((item) => item.id !== next.id)]);
    setActiveCaseId(next.id);
    if (!caseText.trim()) setCaseText(problemText);
    return legalCase.id;
  }

  async function classifyCurrentText() {
    if (caseText.trim().length < 12) {
      setSyncState("Опишите ситуацию подробнее");
      return;
    }
    setClassificationBusy(true);
    setSyncState("Определяю категорию через API...");
    try {
      const ownerUserId = await ensureUser();
      const result = (await apiJson("/ai/classifications", {
        method: "POST",
        headers: { "x-user-id": ownerUserId },
        body: JSON.stringify({ text: caseText }),
      })) as ApiClassification;
      setClassification(result);
      setSelectedCategory(result.result.subcategory_label);
      setSyncState(`Категория API: ${result.result.subcategory_label}`);
      go("category");
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Ошибка классификации: ${error.message}`
          : "Не удалось определить категорию",
      );
    } finally {
      setClassificationBusy(false);
    }
  }

  async function confirmCategoryAndCreateCase() {
    if (!classification) {
      await classifyCurrentText();
      return;
    }
    if (classification.result.missing_facts.length) {
      setSyncState("Сначала ответьте на вопросы AI и повторите анализ");
      return;
    }
    setClassificationBusy(true);
    try {
      const ownerUserId = await ensureUser();
      await apiJson(`/ai/classifications/${classification.id}/confirm`, {
        method: "POST",
        headers: {
          "idempotency-key": nextClientId("web-category-confirm"),
          "x-user-id": ownerUserId,
        },
      });
      setSyncState("Категория подтверждена");
      await addCase();
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Ошибка подтверждения категории: ${error.message}`
          : "Не удалось подтвердить категорию",
      );
    } finally {
      setClassificationBusy(false);
    }
  }

  async function overrideCategory(code: string) {
    if (!classification) return;
    setClassificationBusy(true);
    try {
      const ownerUserId = await ensureUser();
      const result = (await apiJson(`/ai/classifications/${classification.id}/override`, {
        method: "POST",
        headers: { "x-user-id": ownerUserId },
        body: JSON.stringify({ subcategoryCode: code, reason: "manual web selection" }),
      })) as ApiClassification;
      setClassification(result);
      setSelectedCategory(result.result.subcategory_label);
      setSyncState(`Категория изменена: ${result.result.subcategory_label}`);
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Ошибка ручного выбора: ${error.message}`
          : "Не удалось изменить категорию",
      );
    } finally {
      setClassificationBusy(false);
    }
  }

  function categoryStageProgress() {
    if (currentDraftCaseCreated) return 100;
    if (documents.length > 0) return classification ? 88 : 80;
    if (classification)
      return classification.result.missing_facts.length ? 64 : 72;
    if (classificationBusy) return 45;
    if (caseText.trim().length >= 12 || audioUrl || transcriptJobId) return 25;
    return 10;
  }

  function appendInterviewFact() {
    const value = aiInterviewInput.trim();
    if (!value) {
      setSyncState("Введите ответ для AI");
      return;
    }
    setCaseText((text) => `${text.trim()}\nУточнение: ${value}`.trim());
    setClassification(null);
    setMessages((items) => [
      ...items,
      { role: "user", text: value },
      { role: "assistant", text: nextAiQuestion() },
    ]);
    setAiInterviewInput("");
    setSyncState("Ответ добавлен к делу. Повторите анализ AI.");
  }

  function nextAiQuestion() {
    const question = classification?.result.clarification_questions[0]?.questionRu;
    if (question) return question;
    const missing = classification?.result.missing_facts[0];
    if (missing === "employer") return "Укажите работодателя, должность и период, за который возник спор.";
    if (missing) return `Уточните недостающий факт: ${missing}.`;
    if (!documents.length) return "Загрузите договор, расписку, переписку или иной документ. После этого я проверю доказательства.";
    return "Подтвердите категорию, и я создам дело с текущими фактами и документами.";
  }

  function categoryTimeline() {
    return [
      { title: "1. Описание", done: caseText.trim().length >= 12 },
      { title: "2. Уточнения AI", done: Boolean(classification && !classification.result.missing_facts.length) },
      { title: "3. Документы", done: documents.length > 0 },
      { title: "4. Категория", done: Boolean(classification) },
      { title: "5. Дело", done: currentDraftCaseCreated },
    ];
  }

  async function sendMessage() {
    if (!chatInput.trim()) return;
    const outgoing = chatInput;
    setMessages((items) => [
      ...items,
      { role: "user", text: outgoing },
      {
        role: "assistant",
        text: "Для ответа потребуется договор, расписка, переписка и подтвержденная норма из официального источника РК.",
      },
    ]);
    setChatInput("");
    updateActiveCase("AI уточняет факты", 72);
    if (!remoteCaseId) {
      setSyncState("Сообщение добавлено локально: сначала создайте дело в API");
      return;
    }
    try {
      const userId = await ensureUser();
      await apiJson(`/cases/${remoteCaseId}/messages`, {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify({ role: "user", text: outgoing }),
      });
      const serverMessages = (await apiJson(`/cases/${remoteCaseId}/messages`, {
        headers: { "x-user-id": userId },
      })) as { role: "system" | "user" | "assistant"; text: string }[];
      setMessages(
        serverMessages
          .filter((item) => item.role !== "system")
          .map((item) => ({
            role: item.role as "user" | "assistant",
            text: item.text,
          })),
      );
      setSyncState("Чат сохранен в API");
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Чат локально, API ошибка: ${error.message}`
          : "Чат локально",
      );
    }
  }

  async function fileSha256(file: File) {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function handleFileSelection(file: File | undefined, source: "file" | "camera") {
    if (!file) {
      setSyncState(source === "camera" ? "Фото не выбрано или доступ к камере отменен" : "Файл не выбран");
      return;
    }
    void addDocument(file, source);
    go("documentUpload");
  }

  function UploadControl({
    source,
    className = "",
    children,
  }: {
    source: "file" | "camera";
    className?: string;
    children: ReactNode;
  }) {
    return (
      <label className={`nativeUploadControl ${className}`.trim()}>
        {children}
        <input
          type="file"
          accept={
            source === "camera"
              ? "image/*"
              : ".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,.xlsx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          }
          capture={source === "camera" ? "environment" : undefined}
          onChange={(event) => {
            handleFileSelection(event.target.files?.[0], source);
            event.currentTarget.value = "";
          }}
        />
      </label>
    );
  }

  async function addDocument(file: File, source: "file" | "camera" = "file") {
    if (!file.size) {
      setSyncState("Файл пустой или недоступен для загрузки");
      return;
    }
    const sha256 = await fileSha256(file);
    const localDoc: DocumentItem = {
      name: file.name,
      status: "Загрузка в API...",
      sizeBytes: file.size,
      source,
      sha256,
    };
    setSelectedDocument(file.name);
    setDocuments((items) => [localDoc, ...items]);
    updateActiveCase("Документы загружены", 76);
    try {
      const userId = await ensureUser();
      const caseId = await ensureRemoteCaseForDocumentUpload(file.name);
      const session = (await apiJson("/files/upload-sessions", {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify({
          caseId,
          fileName: file.name,
          mimeType: file.type || mimeTypeFor(file.name),
          sizeBytes: file.size,
        }),
      })) as ApiUploadSession;
      const document = (await apiJson("/files/complete", {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify({
          uploadSessionId: session.id,
          sha256,
        }),
      })) as ApiDocument;
      setRemoteDocumentId(document.id);
      setDocuments((items) =>
        items.map((item, index) =>
          index === 0
            ? { ...item, id: document.id, name: document.fileName, status: "OCR-review" }
            : item,
        ),
      );
      setOcrConfirmed(false);
      setSyncState(`Документ сохранен в API: ${document.fileName}. Проверьте OCR.`);
      go("documentCheck");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const duplicate = message.includes("DUPLICATE_FILE");
      setDocuments((items) =>
        items.map((item, index) =>
          index === 0
            ? { ...item, status: duplicate ? "Уже загружен ранее" : "Ошибка API upload" }
            : item,
        ),
      );
      setSyncState(
        duplicate
          ? "Такой файл уже есть в деле. Выберите другой файл или откройте документы."
          : error instanceof Error
          ? `Ошибка загрузки документа: ${message}`
          : "Ошибка загрузки документа",
      );
    }
  }

  async function apiJson(path: string, init?: RequestInit) {
    const response = await fetch(`/api/v1${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-correlation-id": "web-app-sync",
        ...(init?.headers ?? {}),
      },
    });
    const body = await response.json();
    if (!response.ok) {
      const message = body.message ?? body.error ?? `${path} failed`;
      throw new Error(
        typeof message === "string" ? message : JSON.stringify(message),
      );
    }
    return body;
  }

  async function apiForm(path: string, formData: FormData, userId?: string) {
    const response = await fetch(`/api/v1${path}`, {
      method: "POST",
      headers: {
        "x-correlation-id": "web-voice-upload",
        ...(userId ? { "x-user-id": userId } : {}),
      },
      body: formData,
    });
    const body = await response.json();
    if (!response.ok) {
      const message = body.message ?? body.error ?? `${path} failed`;
      throw new Error(
        typeof message === "string" ? message : JSON.stringify(message),
      );
    }
    return body;
  }

  async function syncWithApi() {
    setSyncState("Синхронизация...");
    try {
      await apiJson("/health");
      if (!authUserId) {
        setSyncState("API доступен. Для загрузки данных войдите в аккаунт.");
        go("login");
        return;
      }
      const remoteCases = (await apiJson("/cases", {
        headers: { "x-user-id": authUserId },
      })) as ApiLegalCase[];
      setCases(remoteCases.map(mapCase));
      const budget = await apiJson("/subscriptions/current", {
        headers: { "x-user-id": authUserId },
      });
      setSubscriptionStatus(`Тариф ${budget.plan}, расход ${budget.percent}%`);
      setSyncState(`Синхронизировано: ${remoteCases.length} дел`);
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Ошибка: ${error.message}`
          : "Ошибка синхронизации",
      );
    }
  }

  function mimeTypeFor(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "doc") return "application/msword";
    if (ext === "docx")
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (ext === "xlsx")
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    return "application/pdf";
  }

  async function confirmOcr() {
    if (!selectedDocument) {
      setSyncState("Сначала загрузите или отсканируйте документ");
      return;
    }
    setOcrConfirmed(true);
    if (!remoteDocumentId) {
      setSyncState("OCR подтвержден локально");
      return;
    }
    try {
      const userId = await ensureUser();
      await apiJson(`/documents/${remoteDocumentId}/ocr-confirm`, {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify({
          fields: { documentTitle: selectedDocument, confirmedBy: profileName },
        }),
      });
      setDocuments((items) =>
        items.map((item) =>
          item.name === selectedDocument ? { ...item, status: "Готов" } : item,
        ),
      );
      setSyncState("OCR поля подтверждены в API");
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `OCR локально, API ошибка: ${error.message}`
          : "OCR подтвержден локально",
      );
    }
  }

  async function runLegalSearch() {
    const query =
      `${legalQuery.trim()} ${legalTab} ${legalActiveOnly ? "действующая редакция" : "архив редакций"}`.trim();
    if (legalQuery.trim().length < 8) {
      setLegalAnswer("Введите вопрос подробнее.");
      return;
    }
    setLegalAnswer("Идет поиск по официальным источникам РК...");
    try {
      const answer = (await apiJson("/rag/answer", {
        method: "POST",
        body: JSON.stringify({ query }),
      })) as ApiLegalAnswer;
      if (answer.fragment) {
        const norm: LegalNorm = {
          title: answer.fragment.title,
          article: answer.fragment.article ?? "Официальный фрагмент",
          source: new URL(answer.fragment.sourceUrl).hostname,
          date: answer.fragment.retrievedAt
            ? new Date(answer.fragment.retrievedAt).toLocaleDateString("ru-KZ")
            : "проверено API",
          text: answer.fragment.text,
          url: answer.fragment.sourceUrl,
        };
        setLegalNorms([norm]);
        setSelectedNorm(norm);
        setLegalAnswer(
          `${answer.message} Источник: ${answer.fragment.sourceUrl}`,
        );
      } else {
        setLegalNorms([]);
        setSelectedNorm(null);
        setLegalAnswer(
          `${answer.message} Нет подтвержденной нормы из официального источника. Нужна ручная проверка.`,
        );
      }
      setSyncState(`RAG статус: ${answer.status}`);
    } catch (error) {
      setLegalNorms([]);
      setSelectedNorm(null);
      setLegalAnswer("Нет подтвержденной нормы. Требуется ручная проверка.");
      setSyncState(
        error instanceof Error ? `RAG ошибка: ${error.message}` : "RAG ошибка",
      );
    }
  }

  function addNormToDocument() {
    if (!selectedNorm) {
      setSyncState("Нет подтвержденной нормы для добавления");
      return;
    }
    const citation = `${selectedNorm.title}, ${selectedNorm.article}, источник: ${selectedNorm.source}`;
    setGeneratedClaimBody(
      (body) =>
        `${body || "Проект документа"}\n\nПодтвержденная норма: ${citation}`,
    );
    setSyncState(`Норма добавлена в документ: ${selectedNorm.article}`);
    go("claimDraft");
  }

  function openOfficialSource() {
    if (!selectedNorm) {
      setSyncState("Нет подтвержденного источника для открытия");
      return;
    }
    const url = selectedNorm.url;
    window.open(url, "_blank", "noopener,noreferrer");
    setLegalAnswer(
      `Официальный источник открыт: ${url}. Если браузер заблокировал новую вкладку, используйте этот адрес вручную.`,
    );
    setSyncState(`Источник выбран: ${selectedNorm.source}`);
  }

  async function generateClaim() {
    if (!remoteCaseId) {
      setSyncState("Сначала создайте дело в API");
      return;
    }
    if (!profileName.trim()) {
      setSyncState("Заполните профиль перед формированием претензии");
      go("profile");
      return;
    }
    setSyncState("Формирую претензию...");
    try {
      const userId = await ensureUser();
      const templates = (await apiJson("/templates")) as { id: string }[];
      const generated = (await apiJson("/documents/generate", {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify({
          templateId: templates[0]?.id ?? "tpl-pretrial-claim-ru-v1",
          caseId: remoteCaseId,
          fields: {
            claimantName: profileName,
            respondentName: "Ответчик уточняется пользователем",
            claimAmount: "Сумма уточняется пользователем",
            claimReason: caseText || "Основание уточняется пользователем",
            deadlineDate: "Срок рассчитывается после проверки",
          },
          confirmedCitationIds: [],
        }),
      })) as ApiGeneratedDocument;
      setGeneratedClaimBody(generated.body);
      setClaimReady(true);
      updateActiveCase("Проект претензии готов", 91);
      setSyncState(`Проект создан в API: ${generated.id.slice(0, 8)}`);
      go("claimDraft");
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Ошибка генерации: ${error.message}`
          : "Не удалось сформировать претензию",
      );
    }
  }

  async function analyzeDocuments() {
    if (!documents.length) {
      setSyncState("Сначала загрузите документ");
      go("documentUpload");
      return;
    }
    if (!ocrConfirmed) {
      setSyncState("Сначала подтвердите OCR поля");
      go("documentCheck");
      return;
    }
    setAnalysisDone(true);
    updateActiveCase("Анализ документов завершен", 84);
    if (remoteCaseId) {
      try {
        const userId = await ensureUser();
        const remoteDocs = (await apiJson(`/cases/${remoteCaseId}/documents`, {
          headers: { "x-user-id": userId },
        })) as ApiDocument[];
        setSyncState(`Анализ API завершен: документов ${remoteDocs.length}`);
      } catch (error) {
        setSyncState(
          error instanceof Error
            ? `Анализ локально, API ошибка: ${error.message}`
            : "Анализ завершен локально",
        );
      }
    } else {
      setSyncState(
        "Анализ локальных файлов завершен. Для серверной обработки создайте дело.",
      );
    }
    go("analysis");
  }

  function confirmClaimSent() {
    if (!claimReady) {
      setSyncState("Сначала сформируйте проект претензии");
      return;
    }
    if (!claimSendContact.trim()) {
      setSyncState("Укажите контакт получателя перед фиксацией отправки");
      go("claimSend");
      return;
    }
    const sentAt = new Date().toLocaleString("ru-KZ");
    setSent(true);
    updateActiveCase("Assisted отправка претензии зафиксирована", 100);
    setTasks((items) => [
      {
        title: `Assisted отправка (${claimSendMethod}) ${sentAt}`,
        due: "Manual status",
        done: true,
      },
      ...items,
    ]);
    setSyncState(
      `Manual status зафиксирован: ${claimSendMethod}, ${claimSendContact.trim()}, ${sentAt}`,
    );
    go("claimSend");
  }

  function saveSettings() {
    window.localStorage.setItem(
      "ai-lawyer-web-settings",
      JSON.stringify({
        maskPii,
        budgetAlerts,
        language,
        textSize,
        voiceSpeed,
        autoPlayback,
        saveVoiceRecords,
        usageAnalytics,
        savedAt: new Date().toISOString(),
      }),
    );
    setSyncState("Настройки сохранены в браузере");
  }

  function toggleNotifications() {
    setNotificationOpen((open) => !open);
    setSyncState(
      notificationOpen
        ? "Уведомления скрыты"
        : `Уведомления открыты: ${tasks.filter((task) => !task.done).length} активных`,
    );
  }

  function continueCaseIntake() {
    if (caseText.trim().length < 12) {
      setSyncState("Опишите ситуацию подробнее");
      return;
    }
    void classifyCurrentText();
  }

  function selectLegalTab(tab: string) {
    setLegalTab(tab);
    setLegalNorms([]);
    setSelectedNorm(null);
    setLegalAnswer(
      `Раздел выбран: ${tab}. Запустите поиск по официальным источникам РК.`,
    );
    setSyncState(`Раздел норм права: ${tab}`);
  }

  function toggleLegalFilter() {
    setLegalActiveOnly((active) => !active);
    setLegalNorms([]);
    setSelectedNorm(null);
    setLegalAnswer(
      legalActiveOnly
        ? "Фильтр: включая архивные редакции."
        : "Фильтр: только действующие редакции.",
    );
    setSyncState(
      legalActiveOnly
        ? "Фильтр норм: включая архивные редакции"
        : "Фильтр норм: только действующие редакции",
    );
  }

  async function createSupportRequest() {
    const supportText = caseText.trim() || "Запрос в службу поддержки";
    if (supportText.length < 8) {
      setSyncState("Опишите обращение подробнее");
      return;
    }
    const ticketId = nextClientId("SUP");
    if (remoteCaseId) {
      try {
        const userId = await ensureUser();
        await apiJson(`/cases/${remoteCaseId}/messages`, {
          method: "POST",
          headers: { "x-user-id": userId },
          body: JSON.stringify({
            role: "user",
            text: `Поддержка: ${supportText}`,
          }),
        });
      } catch {
        // Support request still remains in local case history when API message sync is unavailable.
      }
    }
    setHelpStatus(`Обращение ${ticketId} создано`);
    setMessages((items) => [
      ...items,
      { role: "user", text: `Поддержка: ${supportText}` },
      {
        role: "assistant",
        text: `Обращение ${ticketId} принято в ручную проверку.`,
      },
    ]);
    setTasks((items) => [
      { title: `Ответ поддержки ${ticketId}`, due: "24 часа", done: false },
      ...items,
    ]);
    setSyncState(`Поддержка создана: ${ticketId}`);
  }

  async function loadSubscription() {
    try {
      const userId = await ensureUser();
      const [budget, plans, payments] = await Promise.all([
        apiJson("/subscriptions/current", { headers: { "x-user-id": userId } }),
        apiJson("/subscriptions/plans", { headers: { "x-user-id": userId } }),
        apiJson("/subscriptions/payment-history", { headers: { "x-user-id": userId } }),
      ]);
      setSubscriptionPlans(plans);
      setPaymentHistory(payments);
      setSubscriptionStatus(
        `Тариф ${budget.plan}, расход ${budget.percent}%, платежей: ${payments.length}, TTS ${budget.ttsDisabled ? "выключен" : "доступен"}`,
      );
      setSyncState("Подписка обновлена из API");
    } catch (error) {
      setSubscriptionStatus("Не удалось загрузить подписку");
      setSyncState(
        error instanceof Error
          ? `Подписка: ${error.message}`
          : "Ошибка подписки",
      );
    }
  }

  async function startSubscriptionPayment(plan: string) {
    try {
      const userId = await ensureUser();
      const result = await apiJson("/subscriptions/payment-intent", {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify({ plan }),
      });
      setSubscriptionStatus(
        `${result.blocker}: ${result.plan}, ${result.amountKzt} ₸. Подключите payment provider env для реальной оплаты.`,
      );
      setSyncState("Оплата остановлена честным provider blocker");
    } catch (error) {
      setSubscriptionStatus("Не удалось создать платеж");
      setSyncState(
        error instanceof Error ? `Оплата: ${error.message}` : "Ошибка оплаты",
      );
    }
  }

  function toggleTask(title: string) {
    setTasks((items) =>
      items.map((item) =>
        item.title === title ? { ...item, done: !item.done } : item,
      ),
    );
    setDeadlineStatus(`Срок обновлен: ${title}`);
  }

  function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  }

  function getSpeechRecognitionConstructor() {
    const speechWindow = window as SpeechWindow;
    return (
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    );
  }

  function getSupportedAudioMimeType() {
    const options = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/aac",
    ];
    return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
  }

  function startSpeechRecognition() {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setSpeechStatus("Live распознавание не поддерживается этим браузером");
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = "ru-RU";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        const text = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? "")
          .join(" ")
          .trim();
        if (text) {
          speechDraftRef.current = text;
          setCaseText(text);
          setSpeechStatus("Речь распознана браузером");
        }
      };
      recognition.onerror = () =>
        setSpeechStatus("Live распознавание недоступно, аудио сохранено");
      recognition.start();
      speechRecognitionRef.current = recognition;
      setSpeechStatus("Live распознавание включено");
    } catch {
      setSpeechStatus("Live распознавание не запустилось, аудио сохранено");
    }
  }

  async function startRecording() {
    if (recording || voiceBusy) return;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setSyncState("Браузер не поддерживает запись голоса");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      audioBlobRef.current = null;
      speechDraftRef.current = "";
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl("");
      }
      mediaStreamRef.current = stream;
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioBlobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };
      setRecordingSeconds(0);
      setPaused(false);
      setRecording(true);
      recorder.start();
      startSpeechRecognition();
      setSyncState("Идет реальная запись с микрофона");
    } catch {
      setSyncState("Микрофон недоступен: разрешите доступ в браузере");
    }
  }

  function pauseRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      if (recording) {
        setPaused((value) => {
          const next = !value;
          setSpeechStatus(
            next ? "Live распознавание на паузе" : "Live распознавание включено",
          );
          setSyncState(next ? "Запись на паузе" : "Запись продолжена");
          return next;
        });
        return;
      }
      void startRecording();
      return;
    }
    if (recorder.state === "recording") {
      recorder.pause();
      speechRecognitionRef.current?.stop();
      speechRecognitionRef.current = null;
      setPaused(true);
      setSpeechStatus("Live распознавание на паузе");
      setSyncState("Запись на паузе");
      return;
    }
    if (recorder.state === "paused") {
      recorder.resume();
      startSpeechRecognition();
      setPaused(false);
      setSyncState("Запись продолжена");
    }
  }

  function stopRecordingAndGetBlob() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive")
      return Promise.resolve(audioBlobRef.current);
    return new Promise<Blob | null>((resolve) => {
      const previousStop = recorder.onstop;
      recorder.onstop = (event) => {
        previousStop?.call(recorder, event);
        window.setTimeout(() => resolve(audioBlobRef.current), 0);
      };
      recorder.requestData();
      recorder.stop();
    });
  }

  async function finishRecording() {
    if (voiceBusy) return;
    setVoiceBusy(true);
    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;
    setRecording(false);
    setPaused(false);
    setSyncState("Запись завершена, сохраняю аудио...");
    try {
      const blob = await stopRecordingAndGetBlob();
      if ((!blob || blob.size === 0) && caseText.trim()) {
        setSyncState("Текст сохранен без аудиофайла");
        go("category");
        return;
      }
      if (!blob || blob.size === 0)
        throw new Error("Пустая запись: попробуйте еще раз");
      const extension =
        blob.type.includes("mp4") || blob.type.includes("aac") ? "m4a" : "webm";
      const recognizedText = speechDraftRef.current.trim() || caseText.trim();
      if (recognizedText) setCaseText(recognizedText);
      if (!authUserId) {
        setSyncState(
          recognizedText
            ? "Текст распознан локально. Войдите для синхронизации аудио"
            : "Аудио записано локально. Войдите для синхронизации",
        );
        go("category");
        return;
      }
      const formData = new FormData();
      formData.append("audio", blob, `${nextClientId("voice")}.${extension}`);
      formData.append("language", "ru");
      if (remoteCaseId) formData.append("caseId", remoteCaseId);
      if (recognizedText) formData.append("text", recognizedText);
      const job = (await apiForm(
        "/voice/transcripts/audio",
        formData,
        authUserId,
      )) as TranscriptJob;
      setTranscriptJobId(job.id);
      if (job.transcript) setCaseText(job.transcript);
      setSyncState(
        job.audioFileId
          ? `Аудио сохранено: ${job.audioFileId.slice(0, 8)}`
          : `Transcript job готов: ${job.id.slice(0, 8)}`,
      );
      go("category");
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Ошибка записи: ${error.message}`
          : "Ошибка записи",
      );
    } finally {
      setVoiceBusy(false);
    }
  }

  function updateActiveCase(status: string, progress: number) {
    setCases((items) =>
      items.map((item) =>
        item.id === activeCaseId
          ? { ...item, status, progress: Math.max(item.progress, progress) }
          : item,
      ),
    );
  }

  async function startAuth() {
    if (!phone.startsWith("+7") || phone.replace(/\D/g, "").length !== 11) {
      setSyncState("Введите корректный номер +7");
      return;
    }
    setSyncState("Отправляю OTP через API...");
    try {
      const registered = (await apiJson("/auth/register", {
        method: "POST",
        body: JSON.stringify({ channel: "phone", phone, consentVersion: "v1" }),
      })) as ApiOtpResponse;
      setOtpId(registered.otpId);
      setOtpHint(
        registered.deliveryMode === "stub" && registered.testCode
          ? `${authText.otpTestCode}: ${registered.testCode}`
          : "Код отправлен через подключенный канал",
      );
      setSyncState(`OTP создан в API: ${registered.otpId.slice(0, 8)}`);
      go("otp");
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Auth API ошибка: ${error.message}`
          : "Auth API ошибка",
      );
    }
  }

  async function verifyOtp() {
    if (!otp.trim()) {
      setSyncState("Введите код из SMS");
      return;
    }
    if (!otpId) {
      setSyncState("Сначала запросите OTP");
      return;
    }
    try {
      const verified = (await apiJson("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ otpId, code: otp }),
      })) as ApiAuthSession;
      setAuthUserId(verified.user.id);
      setSyncState(`Вход подтвержден API: ${verified.user.id.slice(0, 8)}`);
      if (verified.isNewUser || verified.profileRequired) setView("register");
      else {
        setProfileComplete(true);
        setView("home");
      }
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `OTP API ошибка: ${error.message}`
          : "OTP API ошибка",
      );
    }
  }

  async function saveProfile() {
    const fullName =
      [lastName, firstName, middleName]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ") || profileName.trim();
    if (
      view === "register" &&
      (!lastName.trim() || !firstName.trim() || !city.trim())
    ) {
      setSyncState("Заполните фамилию, имя и город");
      return;
    }
    if (!fullName) {
      setSyncState("Введите имя профиля");
      return;
    }
    if (profileIdInvalid) {
      setSyncState(authText.iinBinInvalid);
      return;
    }
    setProfileName(fullName);
    try {
      const userId = await ensureUser();
      const profileTypeMap: Record<string, string> = {
        Физлицо: "person",
        ИП: "individual_entrepreneur",
        Юрлицо: "legal_entity",
      };
      await apiJson("/profiles", {
        method: "POST",
        headers: { "x-user-id": userId },
        body: JSON.stringify({
          userId,
          type: profileTypeMap[profileType] ?? "person",
          displayName: fullName,
          iinBin: cleanProfileId.length === 12 ? cleanProfileId : undefined,
          address: city.trim(),
        }),
      });
      setProfileComplete(true);
      setSyncState(`Профиль сохранен в API: ${profileType}`);
      setView("home");
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Профиль API ошибка: ${error.message}`
          : `Профиль API ошибка`,
      );
    }
  }

  async function exportAccount() {
    try {
      const userId = await ensureUser();
      const exported = (await apiJson("/account/export", {
        headers: { "x-user-id": userId },
      })) as {
        profiles?: unknown[];
        sessions?: unknown[];
        exportedAt?: string;
      };
      const profileCount = exported.profiles?.length ?? 0;
      const sessionCount = exported.sessions?.length ?? 0;
      setSyncState(
        `Экспорт готов: ${profileCount} профилей, ${sessionCount} сессий`,
      );
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Экспорт API ошибка: ${error.message}`
          : "Экспорт API ошибка",
      );
    }
  }

  async function deleteAccount() {
    if (!window.confirm("Удалить аккаунт и отозвать все сессии?")) return;
    try {
      const userId = await ensureUser();
      await apiJson("/account", {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      setAuthUserId("");
      setOtpId("");
      setOtp("");
      setRemoteCaseId("");
      setRemoteDocumentId("");
      setProfileComplete(false);
      setSyncState("Аккаунт удален, сессии отозваны");
      go("login");
    } catch (error) {
      setSyncState(
        error instanceof Error
          ? `Удаление API ошибка: ${error.message}`
          : "Удаление API ошибка",
      );
    }
  }

  function AppHeader({
    title,
    subtitle,
    back = "home",
  }: {
    title: string;
    subtitle: string;
    back?: View;
  }) {
    return (
      <header className="screenHeader">
        <button aria-label="Назад" onClick={() => go(back)}>
          ‹
        </button>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
    );
  }

  function AuthMark({ icon = "⚖" }: { icon?: string }) {
    return (
      <div className="authMark">
        <span>{icon}</span>
      </div>
    );
  }

  function BiometricMark() {
    return (
      <div className="authMark biometricMark" aria-hidden="true">
        <span>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <b></b>
          <b></b>
          <em></em>
        </span>
      </div>
    );
  }

  function AuthDivider() {
    return (
      <div className="goldDivider">
        <span></span>
        <i>◇</i>
        <span></span>
      </div>
    );
  }

  function AuthActionRow({
    icon,
    label,
    onClick,
  }: {
    icon: string;
    label: string;
    onClick: () => void;
  }) {
    return (
      <button className="authActionRow" onClick={onClick}>
        <span>{icon}</span>
        <strong>{label}</strong>
        <em>›</em>
      </button>
    );
  }

  function renderView() {
    if (view === "onboarding") {
      return (
        <section className="contentPanel centerPanel">
          <AuthMark />
          <Header title="AI Юрист" subtitle="Ваш умный юридический помощник" />
          <AuthDivider />
          <button className="primary wide heroCta" onClick={() => go("login")}>
            ✧ Начать работу
          </button>
          <button className="linkAction" onClick={() => go("login")}>
            ♙ Войти в аккаунт
          </button>
        </section>
      );
    }

    if (
      view === "login" ||
      view === "register" ||
      view === "otp" ||
      view === "biometric"
    ) {
      return (
        <section
          className={
            view === "login"
              ? "contentPanel authPanel loginPanel"
              : "contentPanel authPanel"
          }
        >
          {view === "login" && (
            <>
              <div className="loginTopBar">
                <button className="loginBackButton" onClick={() => go("onboarding")} aria-label="Назад">
                  ‹
                </button>
                <div className="languageTabs">
                  {(["RU", "KZ", "EN"] as const).map((item) => (
                    <button
                      key={item}
                      className={language === item ? "active" : ""}
                      onClick={() => {
                        setLanguage(item);
                        setSyncState(`${AUTH_I18N[item].languageStatus}: ${item}`);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <Header
                title="Добро пожаловать"
                subtitle="Войдите или создайте аккаунт, чтобы сохранить дела, документы и сроки"
              />
              <AuthDivider />
              <div className="authTabs">
                <button className="active" onClick={() => setSyncState("Режим входа по номеру телефона")}>
                  Вход
                </button>
                <button onClick={() => go("register")}>Регистрация</button>
              </div>
              <div className="authActionRow loginPhoneRow">
                <span>☏</span>
                <label className="phoneField">
                  <small>{authText.phoneLabel}</small>
                  <input
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder={authText.phonePlaceholder}
                    value={phone}
                    onFocus={() => {
                      if (!phone) setPhone("+7");
                    }}
                    onChange={(event) =>
                      setPhone(normalizeKzPhoneInput(event.target.value))
                    }
                  />
                </label>
                <button
                  aria-label={authText.smsButton}
                  onClick={() => {
                    void startAuth();
                  }}
                >
                  ›
                </button>
              </div>
              <AuthActionRow
                icon="✉"
                label="Войти по e-mail"
                onClick={() => setSyncState("E-mail вход подключается через auth adapter")}
              />
              <div className="loginOr"><span></span><em>или</em><span></span></div>
              <AuthActionRow icon="⌗" label={authText.biometric} onClick={() => go("biometric")} />
              <AuthDivider />
              <p className="loginRegisterHint">
                Нет аккаунта? <button onClick={() => go("register")}>Зарегистрироваться</button>
              </p>
            </>
          )}
          {view === "register" && (
            <>
              <div className="screenHeader registerTop">
                <button onClick={() => go("login")} aria-label="Назад">
                  ‹
                </button>
                <h2>Регистрация</h2>
                <span />
              </div>
              <Header
                title={authText.registerTitle}
                subtitle={authText.registerSubtitle}
              />
              <AuthMark />
              <div className="authFormCard">
                <label className="registerInputRow">
                  <span>♙</span>
                  <input
                    placeholder={authText.firstName}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </label>
                <label className="registerInputRow">
                  <span>♙</span>
                  <input
                    placeholder={authText.lastName}
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </label>
                <label className="registerInputRow">
                  <span>✦</span>
                  <input
                    placeholder={authText.middleName}
                    value={middleName}
                    onChange={(event) => setMiddleName(event.target.value)}
                  />
                </label>
                <label className="registerInputRow">
                  <span>⌂</span>
                  <input
                    placeholder={authText.city}
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                </label>
                <label className="registerInputRow">
                  <span>№</span>
                  <input
                    placeholder={authText.iinBin}
                    value={profileId}
                    inputMode="numeric"
                    maxLength={12}
                    onChange={(event) =>
                      setProfileId(
                        event.target.value.replace(/\D/g, "").slice(0, 12),
                      )
                    }
                  />
                </label>
                {profileIdInvalid && (
                  <small className="fieldError">{authText.iinBinInvalid}</small>
                )}
                <div className="chips profileChips">
                  {["Физлицо", "ИП", "Юрлицо"].map((type) => (
                    <button
                      className={profileType === type ? "chip active" : "chip"}
                      key={type}
                      onClick={() => setProfileType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />{" "}
                  {authText.consent}
                </label>
                <button
                  className="primary wide heroCta"
                  disabled={!consent || profileIdInvalid}
                  onClick={() => {
                    void saveProfile();
                  }}
                >
                  {authText.finishRegister}
                </button>
                <AuthDivider />
                <button className="linkAction" onClick={() => go("login")}>
                  {authText.alreadyHaveAccount}
                </button>
              </div>
            </>
          )}
          {view === "otp" && (
            <>
              <div className="screenHeader otpTop">
                <button
                  onClick={() => {
                    setOtp("");
                    setOtpId("");
                    go("login");
                  }}
                  aria-label="Назад"
                >
                  ‹
                </button>
                <h2>Подтверждение</h2>
                <span />
              </div>
              <AuthMark />
              <Header
                title={authText.otpTitle}
                subtitle={
                  phone
                    ? (
                        <>
                          <span>{authText.otpSent}</span>
                          <strong>{phone}</strong>
                        </>
                      )
                    : authText.otpFallback
                }
              />
              {otpHint && <small className="recordMeta otpHint">{otpHint}</small>}
              <input
                ref={otpInputRef}
                className="otpInput"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder={authText.otpPlaceholder}
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              <button
                type="button"
                className="otpBoxes"
                aria-label={authText.otpPlaceholder}
                onClick={() => otpInputRef.current?.focus()}
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <span key={index}>{otp[index] ?? ""}</span>
                ))}
              </button>
              <p className="hint">
                {authText.resend} <strong>00:42</strong>
              </p>
              <button
                className="primary wide heroCta"
                onClick={() => {
                  void verifyOtp();
                }}
              >
                {authText.confirm}
              </button>
              <AuthDivider />
              <button
                className="linkAction"
                onClick={() => {
                  setOtp("");
                  setOtpId("");
                  go("login");
                }}
              >
                {authText.changePhone}
              </button>
            </>
          )}
          {view === "biometric" && (
            <>
              <div className="screenHeader biometricTop">
                <button onClick={() => go("login")} aria-label="Назад">
                  ‹
                </button>
                <h2>Быстрый вход</h2>
                <span />
              </div>
              <BiometricMark />
              <Header
                title={authText.biometricTitle}
                subtitle={authText.biometricSubtitle}
              />
              <AuthDivider />
              <button
                className="primary wide heroCta"
                onClick={() => {
                  setBiometricEnabled(true);
                  setSyncState("Биометрия включена локально");
                }}
              >
                {biometricEnabled ? authText.biometricEnabled : authText.biometricEnable}
              </button>
              <button
                className="wide outlineGold"
                onClick={() => go("home")}
              >
                {authText.later}
              </button>
              <p className="hint secureHint">
                {authText.biometricHint}
              </p>
            </>
          )}
        </section>
      );
    }

    if (view === "newCase") {
      return (
        <section className="contentPanel">
          <AppHeader
            title="Новое дело"
            subtitle="Голосовое или текстовое описание проблемы"
          />
          <h1 className="heroTitle">Опишите проблему</h1>
          <p className="hint">
            Расскажите о ситуации голосом, а мы поможем с решением
          </p>
          <button
            className={recording ? "mic small active" : "mic small"}
            disabled={voiceBusy}
            onClick={() => {
              void startRecording();
            }}
            aria-label="Записать голос"
          >
            <span>⌾</span>
          </button>
          <div className="recordCard">
            <div className="recordLine">
              <span
                className={recording && !paused ? "dot live" : "dot"}
              ></span>
              <strong>
                {voiceBusy
                  ? "Сохраняю аудио"
                  : recording
                    ? paused
                      ? "Пауза"
                      : "Идет запись"
                    : audioUrl
                      ? "Запись готова"
                      : "Готов к записи"}
              </strong>
              <em>{formatDuration(recordingSeconds)}</em>
            </div>
            <textarea
              value={caseText}
              onChange={(event) => setCaseText(event.target.value)}
              placeholder="Я хочу подать на алименты и подготовить иск в суд..."
            />
            {audioUrl && (
              <audio className="voicePlayback" controls src={audioUrl}>
                Запись голоса
              </audio>
            )}
            <small className="recordMeta">{speechStatus}</small>
            {transcriptJobId && (
              <small className="recordMeta">
                Transcript job: {transcriptJobId.slice(0, 8)}
              </small>
            )}
            <div className="wave" aria-hidden="true"></div>
          </div>
          <button
            className="primary wide"
            disabled={voiceBusy}
            onClick={recording ? finishRecording : continueCaseIntake}
          >
            {voiceBusy
              ? "Сохраняю..."
              : recording
                ? "■ Завершить запись"
                : "Продолжить"}
          </button>
          <button
            className="wide"
            disabled={voiceBusy}
            onClick={pauseRecording}
          >
            {recording
              ? paused
                ? "▶ Продолжить"
                : "Ⅱ Пауза"
              : "Начать запись"}
          </button>
        </section>
      );
    }

    if (view === "category") {
      const currentClassification = classification?.result;
      const progress = categoryStageProgress();
      const timeline = categoryTimeline();
      return (
        <section className="contentPanel aiInterviewPanel">
          <AppHeader
            title="AI интервью"
            subtitle={
              currentClassification
                ? "Уточняю факты, документы и категорию дела"
                : "Иду по этапам, пока данных достаточно для дела"
            }
            back="newCase"
          />
          <div className="aiProgressTop" aria-label="Прогресс AI интервью">
            <div>
              <span>Этап {Math.min(5, Math.max(1, Math.ceil(progress / 20)))} из 5</span>
              <strong>{progress}%</strong>
            </div>
            <progress value={progress} max="100" />
            <small>
              {currentClassification
                ? `${currentClassification.category_label} · ${currentClassification.subcategory_label}`
                : "AI ждет факты для первичного анализа"}
            </small>
          </div>
          <div className="aiStageRail">
            {timeline.map((item) => (
              <button
                key={item.title}
                className={item.done ? "done" : ""}
                onClick={() => setSyncState(item.done ? `${item.title}: готово` : `${item.title}: нужно пройти`)}
              >
                {item.done ? "✓" : "○"} {item.title}
              </button>
            ))}
          </div>
          <div className="aiChatFlow" aria-label="AI чат по делу">
            <div className="aiBubble assistant">
              <strong>AI Юрист</strong>
              <p>
                Я веду дело по шагам: сначала уточняю факты, затем прошу документы,
                определяю категорию и только после подтверждения создаю дело в базе.
              </p>
            </div>
            <div className="aiBubble user">
              <strong>Вы</strong>
              <p>{caseText.trim() || "Описание еще не заполнено."}</p>
            </div>
            <div className="aiBubble assistant">
              <strong>AI Юрист</strong>
              <p>{nextAiQuestion()}</p>
              {currentClassification?.missing_facts.length ? (
                <em>Не хватает: {currentClassification.missing_facts.join(", ")}</em>
              ) : null}
            </div>
            {currentClassification ? (
              <div className="aiDecisionCard categoryHero">
                <span>Предварительная категория</span>
                <h3>{currentClassification.category_label}</h3>
                <button
                  className="categoryPill"
                  onClick={() => setSyncState(`Подкатегория: ${currentClassification.subcategory_code}`)}
                >
                  {currentClassification.subcategory_label}
                </button>
                <p>
                  Уверенность: {Math.round(currentClassification.confidence * 100)}%
                  {currentClassification.risk_level === "high" ? " · высокий риск" : ""}
                </p>
              </div>
            ) : null}
            {documents.length ? (
              <div className="aiBubble assistant">
                <strong>Документы приняты</strong>
                <p>
                  Загружено: {documents[0].name}. Я учту документ на следующих этапах:
                  OCR, анализ и подготовка претензии.
                </p>
              </div>
            ) : null}
          </div>
          <div className="aiComposer">
            <input
              value={aiInterviewInput}
              onChange={(event) => setAiInterviewInput(event.target.value)}
              placeholder="Ответьте AI: работодатель, сумма, даты, что произошло..."
            />
            <button onClick={appendInterviewFact}>Ответить</button>
          </div>
          <div className="aiActionGrid">
            <button onClick={() => void classifyCurrentText()} disabled={classificationBusy || caseText.trim().length < 12}>
              {classificationBusy ? "Анализирую..." : "Анализировать факты"}
            </button>
            <UploadControl source="file" className="inlineUploadLink">
              Запросить / загрузить документы
            </UploadControl>
            <button
              className="primary"
              disabled={
                classificationBusy ||
                !currentClassification ||
                currentClassification.missing_facts.length > 0
              }
              onClick={confirmCategoryAndCreateCase}
              title={
                currentClassification?.missing_facts.length
                  ? "Сначала ответьте на вопросы AI и повторите анализ"
                  : "Создать дело в базе данных"
              }
            >
              {currentClassification?.missing_facts.length
                ? "Ответьте AI и повторите анализ"
                : "Подтвердить и создать дело"}
            </button>
          </div>
          {currentClassification?.alternatives.length ? (
            <div className="categoryAlternatives aiAlternatives">
              <p className="hint">Возможные альтернативы</p>
              {currentClassification.alternatives.map((item) => (
                <button key={item.code} onClick={() => void overrideCategory(item.code)}>
                  ◴ {item.code} · {Math.round(item.confidence * 100)}%
                </button>
              ))}
            </div>
          ) : null}
        </section>
      );
    }

    if (view === "cases") {
      return (
        <section className="contentPanel">
          <AppHeader title="Мои дела" subtitle="Фильтр, поиск и карточки дел" />
          <div className="caseFilters">
            {["Все", "В работе", "Суд", "Претензии"].map((filter) => (
              <button
                className={filter === "Все" ? "active" : ""}
                key={filter}
                onClick={() => setCaseSearch(filter === "Все" ? "" : filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="searchRow caseSearchRow">
            <input
              value={caseSearch}
              onChange={(event) => setCaseSearch(event.target.value)}
              placeholder="Поиск дела"
            />
            <button onClick={() => setCaseSearch("")}>Очистить</button>
          </div>
          <div className="list">
            {!filteredCases.length && (
              <button className="caseRow" onClick={() => startNewCaseDraft()}>
                <span className="roundIcon">+</span>
                <span>
                  <strong>Нет дел</strong>
                  <small>Создайте первое дело через голос или текст</small>
                  <small className="goldDot">
                    ● Данные появятся после сохранения в API
                  </small>
                </span>
                <em>Сейчас</em>
              </button>
            )}
            {filteredCases.map((item, index) => (
              <button
                className="caseRow"
                key={item.id}
                onClick={() => {
                  setActiveCaseId(item.id);
                  go("case");
                }}
              >
                <span className="roundIcon">
                  {["⚖", "👪", "▤", "▥", "♢"][index] ?? "⚖"}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    Дело №{item.id} · {item.type}
                  </small>
                  <small className="goldDot">● {item.status}</small>
                </span>
                <em>
                  Обновлено
                  <br />
                  {item.date}
                </em>
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (view === "case") {
      if (!activeCase) {
        return (
          <section className="contentPanel">
            <AppHeader
              title="Карточка дела"
              subtitle="Нет выбранного дела из базы данных"
              back="cases"
            />
            <div className="analysisBox">
              <strong>Нет реального дела</strong>
              <p>
                Создайте первое дело, чтобы карточка заполнилась данными из
                API/БД.
              </p>
            </div>
            <button className="primary wide" onClick={() => startNewCaseDraft()}>
              Создать дело
            </button>
          </section>
        );
      }
      return (
        <section className="contentPanel">
          <AppHeader
            title="Карточка дела"
            subtitle={`Дело №${activeCase.id} · ${activeCase.type}`}
            back="cases"
          />
          <div className="caseHero caseDetailHero">
            <span className="largeIcon">⚖</span>
            <div>
              <h2>{activeCase.title}</h2>
              <p>{activeCase.status}</p>
            </div>
            <strong>{activeCase.progress}%</strong>
          </div>
          <div className="caseMetricGrid">
            <Info label="Категория" value={activeCase.type} />
            <Info label="Стадия" value="Досудебная подготовка" />
            <Info label="Суд / Маршрут" value="Assisted mode" />
            <Info label="Срок" value={activeCase.date} />
            <Info label="Готовность" value={`${activeCase.progress}%`} />
          </div>
          <h3 className="goldSection">Прогресс дела</h3>
          <div className="caseProgressRail">
            {[
              "Консультация",
              "Документы",
              "Претензия",
              "Подписание",
              "Отправка",
            ].map((step, index) => (
              <button
                className={index <= 1 ? "done" : ""}
                key={step}
                onClick={() =>
                  index === 1
                    ? go("documents")
                    : index === 2
                      ? go("claim")
                      : setSyncState(`${step}: ожидает предыдущий шаг`)
                }
              >
                <span>
                  {index === 0
                    ? "👥"
                    : index === 1
                      ? "▤"
                      : index === 2
                        ? "▧"
                        : index === 3
                          ? "✎"
                          : "➤"}
                </span>
                <strong>{step}</strong>
                <small>{index <= 1 ? "В работе" : "Ожидает"}</small>
              </button>
            ))}
          </div>
          <div className="caseInfoGrid">
            <Info
              label="Участники дела"
              value={profileName ? `Заявитель: ${profileName}` : "Профиль не заполнен"}
            />
            <Info
              label="Сумма и требования"
              value={caseText ? "Из описания дела" : "Не указаны"}
            />
            <Info
              label="Документы"
              value={
                documents.length
                  ? `${documents.length} из API/upload`
                  : "Нет загруженных документов"
              }
            />
            <Info
              label="Ключевые даты"
              value={tasks.length ? `${tasks.length} задач` : "Сроки не рассчитаны"}
            />
          </div>
          <div className="actionBar">
            <button className="primary" onClick={() => go("chat")}>
              Продолжить работу
            </button>
            <button onClick={() => go("documents")}>Открыть документы</button>
            <button onClick={() => go("claim")}>Сформировать претензию</button>
          </div>
        </section>
      );
    }

    if (view === "chat") {
      if (!activeCase) {
        return (
          <section className="contentPanel chatPanel">
            <AppHeader
              title="Чат по делу"
              subtitle="Нет выбранного дела из базы данных"
              back="cases"
            />
            <div className="analysisBox">
              <strong>Чат недоступен</strong>
              <p>Сначала создайте или выберите реальное дело из API/БД.</p>
            </div>
            <button className="primary wide" onClick={() => startNewCaseDraft()}>
              Создать дело
            </button>
          </section>
        );
      }
      return (
        <section className="contentPanel chatPanel">
          <AppHeader
            title="Чат по делу"
            subtitle={activeCase.title}
            back="case"
          />
          <div className="chatCaseCard">
            <span className="roundIcon">⚖</span>
            <p>
              <b>{activeCase.title}</b>
              <br />
              Дело №{activeCase.id} · {activeCase.type}
            </p>
            <em>● {activeCase.status}</em>
          </div>
          <div className="messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`messageRow ${message.role}`}>
                {message.role === "assistant" && <span className="messageAvatar">⚖</span>}
                <div className="messageBubble">
                  <span className="messageTime">
                    {message.role === "user" ? "10:31" : index === 0 ? "10:28" : "10:34"}
                  </span>
                  {message.text}
                  {message.role === "assistant" && index === 0 && (
                    <div className="citationCard">
                      <b>❝ Статья 272 ГК РК</b>
                      <p>Обязательства должны исполняться надлежащим образом в соответствии с условиями обязательства.</p>
                      <button onClick={() => go("legalSearch")}>Источник ↗</button>
                    </div>
                  )}
                  {message.role === "assistant" && index === 2 && generatedClaimBody && (
                    <button className="attachmentCard" onClick={() => go("claimDraft")}>
                      <span>▤</span>
                      <b>Претензия.pdf</b>
                      <em>Создано через documents API</em>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="primary wide heroCta" onClick={() => go("claim")}>
            ✧ Сформировать документ
          </button>
          <div className="composer">
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Сообщение юристу AI"
            />
            <button className="primary" onClick={sendMessage}>
              Отправить
            </button>
          </div>
        </section>
      );
    }

    if (
      view === "documents" ||
      view === "analysis" ||
      view === "documentCheck" ||
      view === "documentUpload"
    ) {
      const recentDocs = documents;
      return (
        <section
          className={
            view === "documents"
              ? "contentPanel documentsOverview"
              : "contentPanel"
          }
        >
          <AppHeader
            title={
              view === "analysis"
                ? "Анализ документов"
                : view === "documentUpload"
                  ? "Загрузка документа"
                  : view === "documentCheck"
                    ? "Проверка документов"
                    : "Документы и доказательства"
            }
            subtitle="Загрузка документа, OCR и проверка фактов"
          />
          {view === "documents" && (
            <>
              <div className="docSearch">
                <span>⌕</span>
                <input
                  value={caseSearch}
                  onChange={(event) => setCaseSearch(event.target.value)}
                  placeholder="Поиск по документам и делам"
                />
              </div>
              <div className="docTabs">
                <button
                  className={documentTab === "documents" ? "active" : ""}
                  onClick={() => {
                    setDocumentTab("documents");
                    setDocumentFolder("Все документы");
                    setSyncState(`Документы: ${documents.length} файлов из API/upload`);
                  }}
                >
                  Документы
                </button>
                <button
                  className={documentTab === "evidence" ? "active" : ""}
                  onClick={() => {
                    setDocumentTab("evidence");
                    setSyncState(`Доказательства: ${documents.filter((item) => item.status !== "Ошибка API upload").length} файлов`);
                  }}
                >
                  Доказательства
                </button>
                <button
                  className={documentTab === "recent" ? "active" : ""}
                  onClick={() => {
                    setDocumentTab("recent");
                    setDocumentFolder("Все документы");
                    setSyncState(`Недавние файлы: ${documents.slice(0, 5).length}`);
                  }}
                >
                  Недавние
                </button>
              </div>
              <h3 className="goldSection">Папки</h3>
              <div className="folderList">
                {[
                  [
                    "Личные документы",
                    "Паспорт, ИИН, доверенности",
                    `${documents.filter((item) => item.name.toLowerCase().includes("паспорт") || item.name.toLowerCase().includes("иин")).length} файлов`,
                  ],
                  [
                    "Договоры и переписка",
                    "Договоры, письма, сообщения",
                    `${documents.filter((item) => item.name.toLowerCase().includes("договор") || item.name.toLowerCase().includes("переписк")).length} файлов`,
                  ],
                  [
                    "Судебные документы",
                    "Иски, определения, решения",
                    `${documents.filter((item) => item.name.toLowerCase().includes("иск") || item.name.toLowerCase().includes("суд")).length} файлов`,
                  ],
                ].map(([title, sub, count]) => (
                  <button
                    key={title}
                    onClick={() => {
                      setDocumentFolder(title);
                      setDocumentTab("documents");
                      setSyncState(`Папка выбрана: ${title}`);
                    }}
                  >
                    <span className="folderIcon"></span>
                    <p>
                      <strong>{title}</strong>
                      <small>{sub}</small>
                    </p>
                    <em>{count}</em>
                    <b>›</b>
                  </button>
                ))}
              </div>
              <h3 className="goldSection">Последние файлы</h3>
              <div className="recentFileList">
                {!visibleDocuments.length && (
                  <div className="analysisBox">
                    <strong>Файлы не найдены</strong>
                    <p>Загрузите документ или смените фильтр папки.</p>
                  </div>
                )}
                {visibleDocuments.map((doc) => (
                  <button
                    key={`${doc.name}-${doc.sha256 ?? doc.id ?? ""}`}
                    onClick={() => {
                      setSelectedDocument(doc.name);
                      setDocumentTab("recent");
                      setSyncState(`Файл выбран для OCR: ${doc.name}`);
                    }}
                  >
                    <span className="fileBadge">DOC</span>
                    <p>
                      <strong>{doc.name}</strong>
                      <small>{doc.status}</small>
                    </p>
                    <em>Из API/upload</em>
                    <b>›</b>
                  </button>
                ))}
              </div>
              <UploadControl source="file" className="primary wide heroCta fixedDocCta">
                Добавить документ
              </UploadControl>
            </>
          )}
          {view === "documentCheck" && (
            <>
              <div className="docReadinessCard">
                <span className="largeIcon">⚖</span>
                <div>
                  <h3>
                    Готовность дела: <b>{documents.length ? "68%" : "0%"}</b>
                  </h3>
                  <progress value={documents.length ? 68 : 0} max="100" />
                  <p>
                    Чем выше готовность, тем больше шансов на успешный исход
                    дела.
                  </p>
                </div>
              </div>
              <h3 className="goldSection">▤ Не хватает документов</h3>
              <div className="docChecklist">
                {[
                  "Удостоверение личности",
                  "Договор или основание требования",
                  "Подтверждение оплаты/переписки",
                  "Данные ответчика",
                ].map((name, index) => (
                  <button
                    key={name}
                    onClick={
                      index < 2 ? confirmOcr : () => go("documentUpload")
                    }
                  >
                    <span className={index < 2 ? "ok" : "miss"}>
                      {index < 2 ? "✓" : "−"}
                    </span>
                    <strong>{name}</strong>
                    <em>{index < 2 ? "Есть" : "Отсутствует"}</em>
                  </button>
                ))}
              </div>
              <div className="docHint">
                <span className="largeIcon">▧</span>
                <p>
                  Для подготовки иска желательно добавить недостающие документы.
                </p>
              </div>
              <UploadControl source="file" className="primary wide heroCta">
                ⇧ Загрузить документы
              </UploadControl>
              <button
                className="wide outlineGold"
                onClick={() => go("analysis")}
              >
                Продолжить без них
              </button>
            </>
          )}
          {view === "documentUpload" && (
            <>
              <div className="uploadHero">
                <AuthMark icon="⇧" />
                <h1>Добавьте документ</h1>
                <p>
                  Загрузите файл любым удобным способом для анализа и
                  консультации
                </p>
              </div>
              <div className="uploadActions">
                <UploadControl source="camera">
                  <span>▣</span>Сканировать камерой
                </UploadControl>
                <UploadControl source="file">
                  <span>▰</span>Выбрать из файлов
                </UploadControl>
                <UploadControl source="camera">
                  <span>▣</span>Сделать фото
                </UploadControl>
              </div>
              <div className="sectionTitle">
                <h3>Недавние загрузки</h3>
                <button onClick={() => go("documents")}>Все ›</button>
              </div>
              <div className="list">
                {recentDocs.map((doc) => (
                  <button
                    className="docRow uploadDocRow"
                    key={doc.name}
                    onClick={() => {
                      setSelectedDocument(doc.name);
                      setSyncState(`Открыт документ: ${doc.name}`);
                    }}
                  >
                    <span
                      className={`fileBadge ${doc.name.endsWith(".jpg") ? "imageBadge" : ""}`}
                    >
                      {doc.name.endsWith(".jpg") ? "IMG" : "PDF"}
                    </span>
                    <p>
                      <strong>{doc.name}</strong>
                      <small>{doc.status}</small>
                    </p>
                    <em>⋮</em>
                  </button>
                ))}
              </div>
              <p className="hint">▣ Поддерживаются PDF, DOCX, JPG, PNG</p>
              <button
                className="primary wide heroCta"
                onClick={() => go("documentCheck")}
              >
                ✧ Продолжить
              </button>
            </>
          )}
          {view === "analysis" && (
            <>
              {(() => {
                const analysisProgressLabel = analysisDone ? "100%" : "82%";
                return (
                  <>
                    <div className="analysisHero">
                      <span className="largeIcon">▧</span>
                      <div>
                        <h1>Документы анализируются</h1>
                        <p>
                          Извлекаем сведения из ваших файлов с помощью
                          искусственного интеллекта
                        </p>
                      </div>
                    </div>
                    <div className="analysisTags">
                      <span>♙ ФИО</span>
                      <span>▣ Даты</span>
                      <span>◎ Суммы</span>
                      <span>▤ ИИН</span>
                      <span>⚖ Статьи</span>
                      <span>⌘ Приложения</span>
                    </div>
                    <div className="analysisTimeline">
                      {[
                        ["OCR завершен", "Текст распознан и извлечен"],
                        ["Тип документа определен", "Договор займа"],
                        [
                          "Проверка реквизитов",
                          "Проверяем реквизиты и подписи",
                        ],
                        ["Поиск норм права", "Подбираем применимые нормы"],
                      ].map(([step, detail], index) => (
                        <button
                          key={step}
                          onClick={index < 2 ? confirmOcr : analyzeDocuments}
                        >
                          <span>
                            {index < 2 ? "✓" : index === 2 ? "●" : ""}
                          </span>
                          <p>
                            <strong>{step}</strong>
                            <small>{detail}</small>
                          </p>
                          <em>
                            {index < 2
                              ? "Завершено"
                              : index === 2
                                ? "В процессе"
                                : "Ожидает"}
                          </em>
                        </button>
                      ))}
                    </div>
                    <div className="docHint">
                      <span>✦</span>
                      <p>
                        {analysisDone
                          ? "Анализ завершен. Можно формировать претензию."
                          : documents.length
                            ? `Система нашла ${documents.length} документа и выделяет ключевые сведения`
                            : "Загрузите документы, чтобы запустить OCR и анализ"}
                      </p>
                      <b>{analysisProgressLabel}</b>
                    </div>
                    <div className="sectionTitle analysisFoundTitle">
                      <h3>Что найдено</h3>
                    </div>
                    <div className="analysisFoundGrid">
                      {[
                        ["▤", `${documents.length} документов`, "Из upload/API"],
                        [
                          "▣",
                          analysisDone ? "Даты найдены" : "Даты не извлечены",
                          "После OCR",
                        ],
                        ["◎", "Суммы не подтверждены", "Требуется документ"],
                        [
                          "⚖",
                          legalNorms.length ? `${legalNorms.length} норм` : "Нормы не найдены",
                          "После RAG",
                        ],
                      ].map(([icon, title, detail]) => (
                        <button key={title} onClick={analyzeDocuments}>
                          <span>{icon}</span>
                          <p>
                            <strong>{title}</strong>
                            <small>{detail}</small>
                          </p>
                          <em>›</em>
                        </button>
                      ))}
                    </div>
                    <button
                      className="primary wide heroCta"
                      onClick={
                        analysisDone ? () => go("claim") : analyzeDocuments
                      }
                    >
                      {analysisDone ? "Сформировать претензию" : "✧ Продолжить"}
                    </button>
                    <button
                      className="wide outlineGold"
                      onClick={() => go("documentCheck")}
                    >
                      Посмотреть детали
                    </button>
                  </>
                );
              })()}
            </>
          )}
        </section>
      );
    }

    if (view === "deadlines") {
      const calendarLabel = new Date().toLocaleDateString("ru-KZ", {
        month: "long",
        year: "numeric",
      });
      return (
        <section className="contentPanel">
          <AppHeader
            title="Календарь и сроки"
            subtitle="Контроль процессуальных дат"
          />
          <div className="calendar caseCalendar">
            <div className="calendarTop">
              <button
                onClick={() =>
                  setDeadlineStatus(
                    "Предыдущий месяц недоступен в локальном календаре",
                  )
                }
              >
                ‹
              </button>
              <strong>{calendarLabel}</strong>
              <button
                onClick={() =>
                  setDeadlineStatus(
                    "Следующий месяц недоступен в локальном календаре",
                  )
                }
              >
                ›
              </button>
            </div>
            <div className="calendarGrid">
              {[
                "Пн",
                "Вт",
                "Ср",
                "Чт",
                "Пт",
                "Сб",
                "Вс",
                "29",
                "30",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12",
                "13",
                "14",
                "15",
                "16",
                "17",
                "18",
                "19",
                "20",
                "21",
                "22",
                "23",
                "24",
                "25",
                "26",
                "27",
                "28",
                "29",
                "30",
                "31",
                "1",
                "2",
              ].map((day, index) => (
                <button
                  className={["9", "16", "22"].includes(day) ? "marked" : ""}
                  key={`${day}-${index}`}
                  onClick={() => setDeadlineStatus(`Выбрана дата: ${day} мая`)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="caseFilters deadlineFilters">
            {["Все", "Срочно", "Суд", "Напоминания"].map((filter) => (
              <button
                className={filter === "Все" ? "active" : ""}
                key={filter}
                onClick={() => setDeadlineStatus(`Фильтр сроков: ${filter}`)}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="deadlineList">
            {tasks.map((task, index) => (
              <button
                className={task.done ? "deadlineRow done" : "deadlineRow"}
                key={task.title}
                onClick={() => toggleTask(task.title)}
              >
                <span className="roundIcon">
                  {index === 0 ? "⚖" : index === 1 ? "▤" : "🔔"}
                </span>
                <p>
                  <strong>{task.title}</strong>
                  <small>
                    {activeCase
                      ? `Дело №${activeCase.id} · ${activeCase.title}`
                      : "Нет выбранного дела из БД"}
                  </small>
                  <small>{task.done ? "Готово" : task.due}</small>
                </p>
                <em>{index === 0 ? "Срочно" : "Важно"} ›</em>
              </button>
            ))}
          </div>
          <div className="docHint">
            <span>✦</span>
            <p>
              Сроки рассчитываются автоматически по календарю дела и
              подтвержденным правилам РК.
            </p>
          </div>
          <div className="docHint">
            <span>✦</span>
            <p>{deadlineStatus}</p>
          </div>
        </section>
      );
    }

    if (view === "legal" || view === "legalSearch") {
      const legalSearchTabs =
        view === "legalSearch"
          ? ["Все", "Статьи", "Пункты", "Разъяснения"]
          : ["Кодексы", "Законы", "Судебная практика"];
      const legalFallback =
        legalQuery.trim().length >= 8
          ? "Нажмите “Найти норму”, чтобы получить ответ только из официальных источников РК."
          : "Введите запрос и запустите поиск. Без подтвержденного источника норма не добавляется в документ.";
      return (
        <section className="contentPanel">
          <AppHeader
            title={view === "legalSearch" ? "Поиск нормы" : "Нормы права"}
            subtitle="Официальные источники РК"
          />
          <div className="legalSearch">
            <span>⌕</span>
            <input
              aria-label="Поиск нормы"
              value={legalQuery}
              onChange={(event) => setLegalQuery(event.target.value)}
              placeholder="взыскание алиментов"
            />
            <button
              aria-label="Фильтр"
              className={legalActiveOnly ? "activeIcon" : ""}
              onClick={toggleLegalFilter}
            >
              ☷
            </button>
          </div>
          {view === "legalSearch" && (
            <div className="popularQueries">
              <span>Популярные запросы</span>
              {[
                "взыскание алиментов",
                "алименты на ребенка",
                "размер алиментов",
                "индексация алиментов",
                "неустойка по алиментам",
              ].map((query) => (
                <button key={query} onClick={() => setLegalQuery(query)}>
                  ⌕ {query}
                </button>
              ))}
              <button onClick={() => setLegalQuery("")}>Очистить</button>
            </div>
          )}
          <div className="chips legalTabs">
            {legalSearchTabs.map((tab) => (
              <button
                className={legalTab === tab ? "chip active" : "chip"}
                key={tab}
                onClick={() => selectLegalTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {view === "legalSearch" && (
            <div className="legalResultMeta">
              <span>
                {legalNorms.length
                  ? `Найдено ${legalNorms.length} подтверждений`
                  : "Ожидает поиска"}
              </span>
              <button onClick={toggleLegalFilter}>По релевантности⌄</button>
            </div>
          )}
          <div className="list">
            {!legalNorms.length && (
              <div className="normCard legalFallbackCard">
                <em>Официальная проверка</em>
                <strong>Нет подтвержденной нормы РК</strong>
                <span>Источник не выбран</span>
                <small>zan.gov.kz · Әділет · суды РК</small>
                <p>{legalFallback}</p>
                <div className="normAiBox">
                  <b>Пояснение AI</b>
                  <p>
                    Ответ появится после проверки citation validator. Фиктивные
                    нормы не отображаются.
                  </p>
                </div>
              </div>
            )}
            {legalNorms.map((norm, index) => (
              <button
                className={
                  selectedNorm?.article === norm.article
                    ? "normCard active"
                    : "normCard"
                }
                key={`${norm.title}-${norm.article}`}
                onClick={() => {
                  setSelectedNorm(norm);
                  setLegalAnswer(norm.text);
                }}
              >
                {index === 0 && <em>Рекомендованная норма</em>}
                <strong>{norm.title}</strong>
                <span>{norm.article}</span>
                <small>
                  Источник: {norm.source} · Актуально на {norm.date}
                </small>
                <p>{norm.text}</p>
                {index === 0 && (
                  <div className="normAiBox">
                    <b>AI пояснение</b>
                    <p>{norm.text}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="analysisBox">
            <strong>Citation Validator</strong>
            <p>{legalAnswer}</p>
          </div>
          <div className="actionBar stickyActions">
            <button
              className="primary"
              onClick={() => {
                go("legalSearch");
                void runLegalSearch();
              }}
            >
              Найти норму
            </button>
            <button
              className="primary"
              disabled={!selectedNorm}
              onClick={addNormToDocument}
            >
              Добавить в документ
            </button>
            <button disabled={!selectedNorm} onClick={openOfficialSource}>
              Открыть источник
            </button>
          </div>
        </section>
      );
    }

    if (view === "claim" || view === "claimDraft" || view === "claimSend") {
      const claimBody =
        generatedClaimBody ||
        "Прошу урегулировать спор в досудебном порядке, исполнить обязательства и предоставить письменный ответ в установленный срок. Перед отправкой документ требует проверки пользователя.";
      return (
        <section className="contentPanel">
          <AppHeader
            title={
              view === "claimSend" || sent
                ? "Отправка претензии"
                : view === "claimDraft" || claimReady
                  ? "Проект претензии"
                  : "Формирование претензии"
            }
            subtitle="Досудебная претензия с ручным подтверждением"
            back="case"
          />
          {view === "claim" && (
            <>
              <div className="claimBuildHero">
                <AuthMark icon="▤" />
                <div>
                  <h1>Подготовка досудебной претензии</h1>
                  <p>
                    AI юрист анализирует данные дела и формирует текст претензии
                    по подтвержденным источникам РК.
                  </p>
                </div>
                <div className="claimSteps">
                  {[
                    "Категория спора определена",
                    "Нормы права подобраны",
                    "Недостающие документы проверены",
                    "Текст претензии формируется",
                  ].map((step, index) => (
                    <button
                      key={step}
                      onClick={
                        index === 3 ? generateClaim : () => setSyncState(step)
                      }
                    >
                      <span>{index < 3 ? "✓" : "●"}</span>
                      <strong>{step}</strong>
                    </button>
                  ))}
                </div>
              </div>
              <div className="claimBasis">
                <strong>Основания</strong>
                <ul>
                  <li>zan.gov.kz: официальная редакция.</li>
                  <li>Әділет: сверка статуса нормы.</li>
                  <li>Ручная проверка при отсутствии источника.</li>
                </ul>
              </div>
              <div className="claimProgress">
                <span>Прогресс подготовки</span>
                <b>{claimReady ? "100%" : "74%"}</b>
                <progress value={claimReady ? 100 : 74} max="100" />
              </div>
              <div className="docHint">
                <span>ⓘ</span>
                <p>
                  В документ будут включены: фактические обстоятельства, ваши
                  требования, сроки исполнения и правовое обоснование.
                </p>
              </div>
              <textarea
                value={caseText}
                onChange={(event) => setCaseText(event.target.value)}
              />
              <button className="primary wide heroCta" onClick={generateClaim}>
                {claimReady ? "Открыть проект" : "✧ Открыть проект"}
              </button>
              <button className="wide outlineGold" onClick={() => go("case")}>
                Отменить
              </button>
            </>
          )}
          {view === "claimDraft" && (
            <>
              <div className="claimStatusRow">
                <span>✎ Черновик</span>
                <span>🛡 Проверено AI</span>
                <span>⚠ Требует подтверждения</span>
              </div>
              <article className="claimPaper">
                <div className="paperMark">⚖</div>
                <h1>Досудебная претензия</h1>
                <section>
                  <span>◎</span>
                  <div>
                    <b>От кого</b>
                    <p>{profileName || "Заявитель"} · контакты из профиля</p>
                  </div>
                </section>
                <section>
                  <span>▦</span>
                  <div>
                    <b>Кому</b>
                    <p>Ответчик · реквизиты уточняются пользователем</p>
                  </div>
                </section>
                <section>
                  <span>▤</span>
                  <div>
                    <b>Суть требования</b>
                    <p>
                      {generatedClaimBody
                        ? claimBody
                        : "Прошу урегулировать спор в досудебном порядке, исполнить обязательства и предоставить письменный ответ."}
                    </p>
                  </div>
                </section>
                <section>
                  <span>⚖</span>
                  <div>
                    <b>Норма права</b>
                    <p>
                      {selectedNorm
                        ? `${selectedNorm.title}, ${selectedNorm.article}, ${selectedNorm.source}`
                        : "Нет подтвержденной нормы РК. Требуется ручная проверка."}
                    </p>
                  </div>
                </section>
                <aside>
                  <b>Правовое обоснование</b>
                  <p>
                    Добавляется только после подтверждения официального
                    источника РК.
                  </p>
                </aside>
              </article>
              <div className="claimDraftActions">
                <button onClick={() => go("claim")}>✎ Редактировать</button>
                <button
                  onClick={() =>
                    setSyncState(
                      "PDF будет сформирован через documents adapter после подтверждения",
                    )
                  }
                >
                  ▣ Скачать PDF
                </button>
              </div>
              <button
                className="primary wide heroCta"
                onClick={confirmClaimSent}
              >
                ✧ Перейти к отправке
              </button>
              <p className="claimSecure">
                🛡 Документ защищён и хранится безопасно
              </p>
            </>
          )}
          {view === "claimSend" && (
            <>
              <h3 className="goldSection">Выберите способ отправки</h3>
              <div className="sendMethods">
                {["E-mail", "WhatsApp", "SMS", "Почтовая отправка"].map(
                  (method) => (
                    <button
                      className={method === claimSendMethod ? "active" : ""}
                      key={method}
                      onClick={() => {
                        setClaimSendMethod(method);
                        setSent(false);
                        setSyncState(
                          `${method}: внешний канал, требуется ручная отправка или provider adapter`,
                        );
                      }}
                    >
                      <span>
                        {method === "E-mail"
                          ? "✉"
                          : method === "WhatsApp"
                            ? "☎"
                            : method === "SMS"
                              ? "…"
                              : "▤"}
                      </span>
                      <strong>{method}</strong>
                    </button>
                  ),
                )}
              </div>
              <div className="recipientCard">
                <span>☎</span>
                <p>
                  <small>Получатель</small>
                  <br />
                  <b>{claimSendContact || "Контакт еще не указан"}</b>
                  <br />
                  Assisted/manual отправка через adapter
                </p>
              </div>
              <p className="fieldLabel">Вложенные файлы</p>
              <div className="attachmentRow">
                <span>PDF</span>
                <p>
                  <b>Претензия.pdf</b>
                  <br />
                  Будет сформирован через documents adapter
                </p>
                <button
                  onClick={() =>
                    setSyncState("Файл доступен после генерации PDF adapter")
                  }
                >
                  ⇩
                </button>
              </div>
              <p className="fieldLabel">Контакт получателя</p>
              <input
                value={claimSendContact}
                onChange={(event) => {
                  setClaimSendContact(event.currentTarget.value);
                  setSyncState("Контакт получателя обновлен локально");
                }}
              />
              <p className="fieldLabel">Текст сообщения</p>
              <textarea
                value={claimSendMessage}
                onChange={(event) => {
                  setClaimSendMessage(event.currentTarget.value);
                  setSyncState(
                    `Текст сообщения обновлен: ${event.currentTarget.value.length} символов`,
                  );
                }}
              />
              <div className="docHint">
                <span>◇</span>
                <p>
                  Доставка сообщения зависит от внешнего сервиса. Статус
                  отправки и доставки может быть недоступен или отображаться с
                  задержкой.
                </p>
              </div>
              <button
                className="primary wide heroCta"
                onClick={confirmClaimSent}
              >
                {sent ? "Manual status зафиксирован" : "✧ Зафиксировать assisted отправку"}
              </button>
              <button
                className="wide outlineGold"
                onClick={() => {
                  setClaimReady(true);
                  setSyncState("Черновик отправки сохранен локально");
                }}
              >
                ▤ Сохранить как черновик
              </button>
            </>
          )}
        </section>
      );
    }

    if (view === "profile") {
      const profileProgressItems = [
        profileName.trim(),
        city.trim(),
        profileId.trim(),
        authUserId,
      ];
      const profileProgress = Math.round(
        (profileProgressItems.filter(Boolean).length /
          profileProgressItems.length) *
          100,
      );
      return (
        <section className="contentPanel">
          <AppHeader
            title="Профиль"
            subtitle={
              profileComplete
                ? `${profileType} · данные из профиля`
                : "Заполните профиль для доступа к делам"
            }
          />
          <div className="profileHero">
            <div className="profileAvatar">
              {(profileName || "П").slice(0, 2).toUpperCase()}
            </div>
            <h2>{profileName || "Профиль не заполнен"}</h2>
            <p>
              {profileComplete
                ? `${profileType} · сохранен в API`
                : "Нет сохраненного профиля"}
            </p>
          </div>
          <div className="claimProgress">
            <span>Заполненность профиля</span>
            <b>{profileProgress}%</b>
            <progress value={profileProgress} max="100" />
          </div>
          <h3 className="goldSection">Мои профили</h3>
          <div className="profileCards">
            {[
              `Физическое лицо|${profileType === "Физлицо" ? "Текущий профиль" : "Выбрать профиль"}|Основной`,
              "Индивидуальный предприниматель|Выбрать ИП|›",
              "Юридическое лицо|Добавить организацию|›",
            ].map((row) => {
              const [title, sub, tail] = row.split("|");
              return (
                <button
                  key={title}
                  onClick={() =>
                    setProfileType(
                      title.includes("предприниматель")
                        ? "ИП"
                        : title.includes("Юридическое")
                          ? "Юрлицо"
                          : "Физлицо",
                    )
                  }
                >
                  <span>
                    {title === "Юридическое лицо"
                      ? "+"
                      : title.slice(0, 2).toUpperCase()}
                  </span>
                  <p>
                    <b>{title}</b>
                    <small>{sub}</small>
                  </p>
                  <em>{tail}</em>
                </button>
              );
            })}
          </div>
          <h3 className="goldSection">Данные и безопасность</h3>
          <div className="profileCards profileDataCards">
            {[
              "Личные данные|Ф.И.О., ИИН, дата рождения|save",
              "Контактные данные|Телефон, e-mail, адреса|save",
              "Банковские реквизиты|Счета и платежные данные|bank",
              "Доверенные лица|Представители и контакты|trusted",
              "Безопасность|PIN-код, биометрия, устройства|settings",
            ].map((row) => {
              const [title, sub, action] = row.split("|");
              return (
                <button
                  key={title}
                  onClick={() => {
                    if (action === "settings") {
                      go("settings");
                      return;
                    }
                    if (action === "save") {
                      void saveProfile();
                      return;
                    }
                    setSyncState(`${title}: раздел открыт`);
                  }}
                >
                  <p>
                    <b>{title}</b>
                    <small>{sub}</small>
                  </p>
                  <em>›</em>
                </button>
              );
            })}
          </div>
          <button
            className="profileSaveContract"
            onClick={() => {
              void saveProfile();
            }}
          >
            Сохранить профиль
          </button>
        </section>
      );
    }

    if (view === "settings") {
      return (
        <section className="contentPanel">
          <AppHeader
            title="Настройки"
            subtitle="Безопасность, уведомления и приватность"
            back="profile"
          />
          <h3 className="goldSection">Основные</h3>
          <div className="settingsGroup">
            <button
              onClick={() => {
                setLanguage(language === "RU" ? "KZ" : language === "KZ" ? "EN" : "RU");
                setSyncState("Язык переключен и будет сохранен в настройках");
              }}
            >
              Язык приложения <em>{language} ›</em>
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              Тема приложения{" "}
              <em>{theme === "dark" ? "Тёмная" : "Светлая"} ›</em>
            </button>
            <button
              onClick={() => {
                const next = textSize === "Средний" ? "Крупный" : textSize === "Крупный" ? "Мелкий" : "Средний";
                setTextSize(next);
                setSyncState(`Размер текста выбран: ${next}`);
              }}
            >
              Размер текста <em>{textSize} ›</em>
            </button>
          </div>
          <h3 className="goldSection">Голосовой помощник</h3>
          <div className="settingsGroup">
            <label className="toggle">
              <input
                type="checkbox"
                checked={budgetAlerts}
                onChange={(event) => setBudgetAlerts(event.target.checked)}
              />{" "}
              Голосовые ответы
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={autoPlayback}
                onChange={(event) => setAutoPlayback(event.target.checked)}
              />{" "}
              Автовоспроизведение
            </label>
            <button
              onClick={() => {
                const next = voiceSpeed === "1.0x" ? "1.25x" : voiceSpeed === "1.25x" ? "0.75x" : "1.0x";
                setVoiceSpeed(next);
                setSyncState(`Скорость речи выбрана: ${next}`);
              }}
            >
              Скорость речи <em>{voiceSpeed} ›</em>
            </button>
          </div>
          <h3 className="goldSection">Конфиденциальность</h3>
          <div className="settingsGroup">
            <label className="toggle">
              <input
                type="checkbox"
                checked={maskPii}
                onChange={(event) => setMaskPii(event.target.checked)}
              />{" "}
              Обезличивать данные перед AI
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={saveVoiceRecords}
                onChange={(event) => setSaveVoiceRecords(event.target.checked)}
              />{" "}
              Сохранять голосовые записи
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={usageAnalytics}
                onChange={(event) => setUsageAnalytics(event.target.checked)}
              />{" "}
              Аналитика использования
            </label>
          </div>
          <button className="primary wide" onClick={saveSettings}>
            Сохранить настройки
          </button>
          <button
            className="wide"
            onClick={() => {
              void exportAccount();
            }}
          >
            Экспортировать данные
          </button>
          <button
            className="wide dangerAction"
            onClick={() => {
              void deleteAccount();
            }}
          >
            Удалить аккаунт
          </button>
        </section>
      );
    }

    if (view === "subscription") {
      const loadedPlans = subscriptionPlans.length > 0;
      return (
        <section className="contentPanel">
          <AppHeader
            title="Подписка"
            subtitle="Лимиты, история и контроль расходов"
            back="profile"
          />
          <div className="subscriptionHero">
            <p>Текущий план</p>
            <h2>{loadedPlans ? "Данные из Billing API" : "Не загружен"}</h2>
            <span>{authUserId ? "API" : "Требуется вход"}</span>
            <small>{subscriptionStatus}</small>
          </div>
          <h3 className="goldSection">Использование</h3>
          <div className="usageBars">
            {[
              `Планы|${subscriptionPlans.length} из API|${loadedPlans ? 100 : 0}`,
              `Платежи|${paymentHistory.length} записей|${paymentHistory.length ? 100 : 0}`,
              `Статус|${authUserId ? "пользователь авторизован" : "нет входа"}|${authUserId ? 100 : 0}`,
            ].map((row) => {
              const [label, value, progress] = row.split("|");
              return (
                <div key={label}>
                  <b>{label}</b>
                  <em>{value}</em>
                  <progress value={Number(progress)} max="100" />
                </div>
              );
            })}
          </div>
          <h3 className="goldSection">Выберите план</h3>
          <div className="planCards">
            {(subscriptionPlans.length
              ? subscriptionPlans
              : [
                  { plan: "free", title: "Базовый", priceKzt: 0, monthlyLimitKzt: 0, documentLimit: 2, voiceMinutes: 15, expertReview: false },
                  { plan: "standard", title: "Профессиональный", priceKzt: 7990, monthlyLimitKzt: 10000, documentLimit: 30, voiceMinutes: 180, expertReview: true },
                  { plan: "expert", title: "Эксперт", priceKzt: 24900, monthlyLimitKzt: 35000, documentLimit: 100, voiceMinutes: 600, expertReview: true },
                ]).map((plan) => {
              const desc = [
                `${plan.documentLimit} документов`,
                `${plan.voiceMinutes} минут голоса`,
                plan.expertReview ? "доступ к эксперту" : "самостоятельный режим",
              ];
              return (
                <button
                  className={plan.plan === "standard" ? "active" : ""}
                  key={plan.plan}
                  onClick={() => {
                    void startSubscriptionPayment(plan.plan);
                  }}
                >
                  <b>{plan.title}</b>
                  <em>{plan.priceKzt ? `${plan.priceKzt.toLocaleString("ru-KZ")} ₸ / мес` : "0 ₸"}</em>
                  <small>
                    {desc.map((item) => (
                      <span key={item}>✓ {item}</span>
                    ))}
                  </small>
                  {plan.plan === "standard" && <i>Рекомендуем</i>}
                </button>
              );
            })}
          </div>
          <div className="analysisBox">
            <strong>Подписка</strong>
            <p>{subscriptionStatus}</p>
            <small>
              {paymentHistory.length
                ? paymentHistory.map((item) => `${item.plan}: ${item.amountKzt} ₸ (${item.status})`).join(" · ")
                : "История платежей пуста или provider еще не подключен"}
            </small>
          </div>
          <button className="primary wide" onClick={loadSubscription}>
            Управление подпиской
          </button>
        </section>
      );
    }

    if (view === "help") {
      return (
        <section className="contentPanel">
          <AppHeader
            title="Помощь и поддержка"
            subtitle="Поддержка и ручная проверка юристом"
            back="profile"
          />
          <div className="legalSearch">
            <span>⌕</span>
            <input
              value={caseText}
              onChange={(event) => setCaseText(event.target.value)}
              placeholder="Найдите ответ на вопрос"
            />
            <button onClick={() => setCaseText("")}>×</button>
          </div>
          <h3 className="goldSection">Быстрые действия</h3>
          <div className="helpGrid">
            {[
              "Частые вопросы|Ответы на популярные темы",
              "Инструкции|Пошаговые руководства",
              "WhatsApp adapter|Внешний канал без fake-доставки",
              "Сообщить о проблеме|Ошибка или предложение",
            ].map((row, index) => {
              const [title, sub] = row.split("|");
              return (
                <button
                  key={title}
                  onClick={() =>
                    setHelpStatus(`${title}: создан локальный запрос`)
                  }
                >
                  <span>{index + 1}</span>
                  <b>{title}</b>
                  <small>{sub}</small>
                </button>
              );
            })}
          </div>
          <div className="supportOnline">
            <strong>Служба поддержки</strong>
            <span>Manual</span>
            <p>Обращение фиксируется локально и, при наличии дела, отправляется в API-сообщения.</p>
            <button
              className="primary"
              onClick={() => {
                void createSupportRequest();
              }}
            >
              Открыть чат
            </button>
          </div>
          <h3 className="goldSection">Разделы помощи</h3>
          <div className="profileCards">
            {[
              "Аккаунт и вход|Регистрация, SMS, биометрия|›",
              "Дела и документы|Загрузка, анализ, шаблоны|›",
              "Судебный кабинет и eGov|Подписание и отправка|›",
              "Оплата и подписка|Тарифы, платежи, возвраты|›",
              "Безопасность данных|Конфиденциальность и доступы|›",
              "О приложении|AI Юрист v1.0.0 · лицензии и документы|›",
            ].map((row) => {
              const [title, sub, tail] = row.split("|");
              return (
                <button
                  key={title}
                  onClick={() =>
                    setHelpStatus(`${title}: открыт раздел помощи`)
                  }
                >
                  <p>
                    <b>{title}</b>
                    <small>{sub}</small>
                  </p>
                  <em>{tail}</em>
                </button>
              );
            })}
          </div>
          <div className="analysisBox">
            <strong>Статус обращения</strong>
            <p>{helpStatus}</p>
          </div>
          <textarea
            value={caseText}
            onChange={(event) => setCaseText(event.target.value)}
          />
          <button
            className="primary wide"
            onClick={() => {
              void createSupportRequest();
            }}
          >
            Написать в поддержку
          </button>
        </section>
      );
    }

    return (
      <section className="homeScreen">
        <div className="topLine">
          <div>
            <h1>Здравствуйте, {profileName || phone || "пользователь"}</h1>
            <p>Ваш умный юридический помощник</p>
          </div>
          <div className="topActions">
            <button
              className={notificationOpen ? "bell activeIcon" : "bell"}
              onClick={toggleNotifications}
              aria-label="Уведомления"
            >
              ♧
            </button>
            <button className="avatar" onClick={() => go("profile")}>
              {profileName.slice(0, 2).toUpperCase()}
            </button>
          </div>
        </div>
        {notificationOpen && (
          <div className="analysisBox">
            <strong>Уведомления</strong>
            <p>
              {tasks
                .filter((task) => !task.done)
                .map((task) => `${task.title}: ${task.due}`)
                .join("; ") || "Активных уведомлений нет"}
            </p>
          </div>
        )}
        <button
          className={recording ? "mic active" : "mic"}
          onClick={() => {
            startNewCaseDraft({ startVoice: true });
          }}
          aria-label="Рассказать проблему"
        >
          <span>⌾</span>
        </button>
        <h2>Рассказать проблему</h2>
        <p className="hint">
          {recording
            ? "Запись активна. Открылся экран описания дела."
            : "Нажмите и говорите голосом"}
        </p>
        <div className="quickGrid">
          <button onClick={() => startNewCaseDraft()}>
            <span className="quickIcon">▣</span>Новое дело
            <small>Создать новое дело</small>
          </button>
          <button onClick={() => go("documents")}>
            <span className="quickIcon">□</span>Мои документы
            <small>Просмотр и загрузка</small>
          </button>
          <button onClick={() => go("deadlines")}>
            <span className="quickIcon">▦</span>Сроки и календарь
            <small>Даты и напоминания</small>
          </button>
        </div>
        <div className="sectionTitle">
          <h3>Последние дела</h3>
          <button onClick={() => go("cases")}>Все дела</button>
        </div>
        <div className="list">
          {!cases.length && (
            <button className="caseRow" onClick={() => startNewCaseDraft()}>
              <span className="roundIcon">+</span>
              <span>
                <strong>Нет дел</strong>
                <small>Создайте первое дело</small>
                <small className="goldDot">
                  ● Только реальные сохраненные данные
                </small>
              </span>
              <em>Сейчас</em>
            </button>
          )}
          {cases.slice(0, 2).map((item) => (
            <button
              className="caseRow"
              key={item.id}
              onClick={() => {
                setActiveCaseId(item.id);
                go("case");
              }}
            >
              <span className="roundIcon">⚖</span>
              <span>
                <strong>{item.title}</strong>
                <small>
                  Дело №{item.id} · {item.type}
                </small>
                <small className="goldDot">● {item.status}</small>
              </span>
              <em>{item.date}</em>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <main
      className="appShell"
      data-theme={theme}
      data-view={view}
      data-design-screen-count={screens.length}
    >
      <aside className="sidebar" aria-label="Навигация ПК">
        <strong>AI Юрист</strong>
        <small>Казахстан · RC</small>
        <nav>
          {[
            ["home", "Главная"],
            ["newCase", "Новое дело"],
            ["cases", "Дела"],
            ["documents", "Документы"],
            ["legal", "Нормы права"],
            ["deadlines", "Сроки"],
            ["subscription", "Подписка"],
            ["profile", "Профиль"],
          ].map(([target, label]) => (
            <button
              key={target}
              className={view === target ? "active" : ""}
              onClick={() =>
                target === "newCase"
                  ? startNewCaseDraft()
                  : go(target as View)
              }
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="deviceFrame">
        <div className="appStatus">
          <span>{syncState}</span>
          <button aria-label="Синхронизировать" onClick={syncWithApi}>
            ↻
          </button>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
        {renderView()}
        <nav className="bottomNav">
          <button
            className={
              view === "home" || view === "analysis" || view === "legalSearch"
                ? "active"
                : ""
            }
            onClick={() => go("home")}
          >
            Главная
          </button>
          <button
            className={
              ["cases", "case", "chat", "newCase", "category"].includes(view)
                ? "active"
                : ""
            }
            onClick={() => go("cases")}
          >
            Дела
          </button>
          <button
            className={
              ["documents", "documentCheck", "documentUpload"].includes(view)
                ? "active"
                : ""
            }
            onClick={() => go("documents")}
          >
            Документы
          </button>
          <button
            className={view === "deadlines" ? "active" : ""}
            onClick={() => go("deadlines")}
          >
            Сроки
          </button>
          <button
            className={
              ["profile", "settings", "subscription", "help"].includes(view)
                ? "active"
                : ""
            }
            onClick={() => go("profile")}
          >
            Профиль
          </button>
        </nav>
      </section>
      <aside className="rightPanel" aria-label="Контекст дела">
        {showDraftContext ? (
          <div className="analysisBox">
            <strong>Новое дело не создано</strong>
            <p>
              Это черновик. Данные попадут в БД только после подтверждения
              категории и создания дела.
            </p>
          </div>
        ) : activeCase ? (
          <div className="caseHero compact">
            <span className="roundIcon">⚖</span>
            <div>
              <h2>{activeCase.title}</h2>
              <p>{activeCase.status}</p>
            </div>
          </div>
        ) : (
          <div className="analysisBox">
            <strong>Нет дела</strong>
            <p>Данные появятся после загрузки из БД или создания дела.</p>
          </div>
        )}
        <div className="tileGrid compactTiles">
          <Info
            label="Готовность"
            value={
              showDraftContext
                ? `${categoryStageProgress()}%`
                : activeCase
                  ? `${activeCase.progress}%`
                  : "0%"
            }
          />
          <Info label="Документы" value={`${documents.length}`} />
        </div>
        <div className="sideSection">
          <h3>Быстрые действия</h3>
          <div className="sideActions">
            <button onClick={() => startNewCaseDraft({ startVoice: true })}>Голос</button>
            <button onClick={() => go("chat")}>Чат</button>
            <button onClick={() => go("documents")}>Файлы</button>
            <button onClick={() => go("legal")}>RAG</button>
          </div>
        </div>
        <div className="sideSection">
          <h3>Сроки</h3>
          <div className="taskList">
            {tasks.slice(0, 3).map((task) => (
              <button
                className={task.done ? "taskRow done" : "taskRow"}
                key={task.title}
                onClick={() => toggleTask(task.title)}
              >
                <span>{task.done ? "✓" : ""}</span>
                <strong>{task.title}</strong>
                <small>{task.due}</small>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: ReactNode }) {
  return (
    <header className="panelHeader">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
