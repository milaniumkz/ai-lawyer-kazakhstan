"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
type CaseItem = { id: string; title: string; type: string; status: string; date: string; progress: number };
type Message = { role: "user" | "assistant"; text: string };
type DocumentItem = { name: string; status: string; sizeBytes?: number; source?: "file" | "camera" };
type TaskItem = { title: string; due: string; done: boolean };
type LegalNorm = { title: string; article: string; source: string; date: string; text: string; url: string };
type ApiLegalCase = { id: string; title: string; category: string; status: string; readinessPercent: number; createdAt: string };
type ApiDocument = { id: string; fileName: string; status: string; extractedFields?: Record<string, string> };
type ApiGeneratedDocument = { id: string; title: string; body: string; status: string; expertReviewRequired: boolean };
type ApiLegalAnswer = { status: string; message: string; fragment?: { title: string; article?: string; sourceUrl: string; text: string; retrievedAt?: string } };
type ApiOtpResponse = { otpId: string; deliveryMode: "stub" | "sms" | "email"; testCode?: string };
type TranscriptJob = { id: string; status: string; transcript: string; progress: string[] };
type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> };
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
  cases: CaseItem[];
  activeCaseId: string;
  caseText: string;
  documents: DocumentItem[];
  messages: Message[];
  profileType: string;
  profileName: string;
  profileId: string;
  maskPii: boolean;
  budgetAlerts: boolean;
  tasks: TaskItem[];
  selectedCategory: string;
  authUserId: string;
  remoteCaseId: string;
  remoteDocumentId: string;
  generatedClaimBody: string;
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

const emptyCase: CaseItem = { id: "new", title: "Новое дело", type: "Не выбрано", status: "Создайте дело", date: "Сегодня", progress: 0 };

export default function WebHome() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [view, setView] = useState<View>("home");
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
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
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [speechStatus, setSpeechStatus] = useState("Распознавание речи еще не запускалось");
  const [transcriptJobId, setTranscriptJobId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Гражданское право");
  const [authUserId, setAuthUserId] = useState("");
  const [otpId, setOtpId] = useState("");
  const [otpHint, setOtpHint] = useState("");
  const [remoteCaseId, setRemoteCaseId] = useState("");
  const [remoteDocumentId, setRemoteDocumentId] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");
  const [generatedClaimBody, setGeneratedClaimBody] = useState("");
  const [deadlineStatus, setDeadlineStatus] = useState("Ближайший срок: досудебная претензия за 10 дней");
  const [subscriptionStatus, setSubscriptionStatus] = useState("Лимиты обновятся после входа");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [legalQuery, setLegalQuery] = useState("");
  const [legalAnswer, setLegalAnswer] = useState("Введите вопрос и нажмите найти норму.");
  const [legalTab, setLegalTab] = useState("Кодексы");
  const [legalNorms, setLegalNorms] = useState<LegalNorm[]>([]);
  const [selectedNorm, setSelectedNorm] = useState<LegalNorm | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Опишите ситуацию. Я проверю факты, документы и официальные источники РК." },
  ]);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("Дмитрий");
  const [email, setEmail] = useState("client@example.kz");
  const [otp, setOtp] = useState("");
  const [consent, setConsent] = useState(true);
  const [profileType, setProfileType] = useState("Физлицо");
  const [profileName, setProfileName] = useState("Дмитрий");
  const [profileId, setProfileId] = useState("********1234");
  const [syncState, setSyncState] = useState("Не синхронизировано");
  const [maskPii, setMaskPii] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [helpStatus, setHelpStatus] = useState("Нет активных обращений");
  const [tasks, setTasks] = useState<TaskItem[]>([
    { title: "Проверить расписку", due: "Сегодня", done: false },
    { title: "Подготовить претензию", due: "10 дней", done: false },
    { title: "Сверить срок исковой давности", due: "До подачи", done: true },
  ]);

  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0] ?? emptyCase;
  const filteredCases = useMemo(
    () => cases.filter((item) => item.title.toLowerCase().includes(caseSearch.toLowerCase()) || caseSearch.length < 3),
    [cases, caseSearch],
  );

  useEffect(() => {
    if (!hydrated) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash !== `#${view}`) window.history.replaceState(null, "", `#${view}`);
  }, [hydrated, view]);

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
      else if (saved.view) setView(saved.view);
      if (saved.theme === "light" || saved.theme === "dark") setTheme(saved.theme);
      if (saved.cases?.length) setCases(saved.cases);
      if (saved.activeCaseId) setActiveCaseId(saved.activeCaseId);
      if (saved.caseText) setCaseText(saved.caseText);
      if (saved.documents?.length) setDocuments(saved.documents);
      if (saved.messages?.length) setMessages(saved.messages);
      if (saved.profileType) setProfileType(saved.profileType);
      if (saved.profileName) {
        setProfileName(saved.profileName);
        setName(saved.profileName);
      }
      if (saved.profileId) setProfileId(saved.profileId);
      if (typeof saved.maskPii === "boolean") setMaskPii(saved.maskPii);
      if (typeof saved.budgetAlerts === "boolean") setBudgetAlerts(saved.budgetAlerts);
      if (saved.tasks?.length) setTasks(saved.tasks);
      if (saved.selectedCategory) setSelectedCategory(saved.selectedCategory);
      if (saved.authUserId) setAuthUserId(saved.authUserId);
      if (saved.remoteCaseId) setRemoteCaseId(saved.remoteCaseId);
      if (saved.remoteDocumentId) setRemoteDocumentId(saved.remoteDocumentId);
      if (saved.generatedClaimBody) setGeneratedClaimBody(saved.generatedClaimBody);
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
    const saved: SavedState = { view, theme, cases, activeCaseId, caseText, documents, messages, profileType, profileName, profileId, maskPii, budgetAlerts, tasks, selectedCategory, authUserId, remoteCaseId, remoteDocumentId, generatedClaimBody };
    window.localStorage.setItem("ai-lawyer-web-state", JSON.stringify(saved));
  }, [hydrated, view, theme, cases, activeCaseId, caseText, documents, messages, profileType, profileName, profileId, maskPii, budgetAlerts, tasks, selectedCategory, authUserId, remoteCaseId, remoteDocumentId, generatedClaimBody]);

  useEffect(() => {
    if (!recording || paused) return undefined;
    const timer = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused, recording]);

  useEffect(() => () => {
    speechRecognitionRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  function go(nextView: View) {
    setView(nextView);
  }

  async function ensureUser() {
    if (authUserId) return authUserId;
    go("login");
    throw new Error("Сначала войдите или зарегистрируйтесь");
  }

  function mapCase(record: ApiLegalCase): CaseItem {
    const categoryMap: Record<string, string> = {
      civil_contract: "Гражданское право",
      labor: "Трудовой спор",
      family: "Семейное право",
      administrative: "Административное право",
      clarification_required: "Требует уточнения",
    };
    return {
      id: record.id.slice(0, 8),
      title: record.title,
      type: categoryMap[record.category] ?? selectedCategory,
      status: record.status === "consultation" ? "Консультация открыта" : "Требует уточнения",
      date: new Date(record.createdAt).toLocaleDateString("ru-KZ", { day: "2-digit", month: "long", year: "numeric" }),
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
      const legalCase = await apiJson("/cases", {
        method: "POST",
        headers: { "idempotency-key": `web-case-${Date.now()}` },
        body: JSON.stringify({ ownerUserId, problemText: `${caseText}\nКатегория пользователя: ${selectedCategory}` }),
      }) as ApiLegalCase;
      const next = mapCase(legalCase);
      setRemoteCaseId(legalCase.id);
      setCases([next, ...cases]);
      setActiveCaseId(next.id);
      setTasks((items) => items.map((item) => item.title === "Проверить расписку" ? { ...item, done: true } : item));
      setSyncState(`Дело сохранено в API: №${next.id}`);
      go("case");
    } catch (error) {
      setSyncState(error instanceof Error ? `API ошибка: ${error.message}` : "Не удалось создать дело");
    }
  }

  async function sendMessage() {
    if (!chatInput.trim()) return;
    const outgoing = chatInput;
    setMessages((items) => [
      ...items,
      { role: "user", text: outgoing },
      { role: "assistant", text: "Для ответа потребуется договор, расписка, переписка и подтвержденная норма из официального источника РК." },
    ]);
    setChatInput("");
    updateActiveCase("AI уточняет факты", 72);
    if (!remoteCaseId) {
      setSyncState("Сообщение добавлено локально: сначала создайте дело в API");
      return;
    }
    try {
      await apiJson(`/cases/${remoteCaseId}/messages`, { method: "POST", body: JSON.stringify({ role: "user", text: outgoing }) });
      const serverMessages = await apiJson(`/cases/${remoteCaseId}/messages`) as { role: "system" | "user" | "assistant"; text: string }[];
      setMessages(serverMessages.filter((item) => item.role !== "system").map((item) => ({ role: item.role as "user" | "assistant", text: item.text })));
      setSyncState("Чат сохранен в API");
    } catch (error) {
      setSyncState(error instanceof Error ? `Чат локально, API ошибка: ${error.message}` : "Чат локально");
    }
  }

  async function fileSha256(file: File) {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function addDocument(file: File, source: "file" | "camera" = "file") {
    const localDoc: DocumentItem = { name: file.name, status: "Загружен", sizeBytes: file.size, source };
    setSelectedDocument(file.name);
    setDocuments((items) => [localDoc, ...items]);
    updateActiveCase("Документы загружены", 76);
    if (!remoteCaseId) {
      setSyncState(`Файл добавлен из браузера: ${file.name}. Для API сохранения сначала создайте дело.`);
      return;
    }
    try {
      const session = await apiJson("/files/upload-sessions", {
        method: "POST",
        body: JSON.stringify({ caseId: remoteCaseId, fileName: file.name, mimeType: file.type || mimeTypeFor(file.name), sizeBytes: file.size }),
      });
      const document = await apiJson("/files/complete", {
        method: "POST",
        body: JSON.stringify({ uploadSessionId: session.id, sha256: await fileSha256(file) }),
      }) as ApiDocument;
      setRemoteDocumentId(document.id);
      setDocuments((items) => items.map((item, index) => index === 0 ? { ...item, name: document.fileName, status: "OCR-review" } : item));
      setSyncState(`Документ сохранен в API: ${document.fileName}`);
    } catch (error) {
      setSyncState(error instanceof Error ? `Документ локально, API ошибка: ${error.message}` : "Документ добавлен локально");
    }
  }

  async function apiJson(path: string, init?: RequestInit) {
    const response = await fetch(`/api/v1${path}`, {
      ...init,
      headers: { "content-type": "application/json", "x-correlation-id": "web-app-sync", ...(init?.headers ?? {}) },
    });
    const body = await response.json();
    if (!response.ok) {
      const message = body.message ?? body.error ?? `${path} failed`;
      throw new Error(typeof message === "string" ? message : JSON.stringify(message));
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
      const remoteCases = await apiJson("/cases", { headers: { "x-user-id": authUserId } }) as ApiLegalCase[];
      setCases(remoteCases.map(mapCase));
      const budget = await apiJson("/subscriptions/current", { headers: { "x-user-id": authUserId } });
      setSubscriptionStatus(`Тариф ${budget.plan}, расход ${budget.percent}%`);
      setSyncState(`Синхронизировано: ${remoteCases.length} дел`);
    } catch (error) {
      setSyncState(error instanceof Error ? `Ошибка: ${error.message}` : "Ошибка синхронизации");
    }
  }

  function mimeTypeFor(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "doc") return "application/msword";
    if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
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
      await apiJson(`/documents/${remoteDocumentId}/ocr-confirm`, {
        method: "POST",
        body: JSON.stringify({ fields: { documentTitle: selectedDocument, confirmedBy: profileName } }),
      });
      setDocuments((items) => items.map((item) => item.name === selectedDocument ? { ...item, status: "Готов" } : item));
      setSyncState("OCR поля подтверждены в API");
    } catch (error) {
      setSyncState(error instanceof Error ? `OCR локально, API ошибка: ${error.message}` : "OCR подтвержден локально");
    }
  }

  async function runLegalSearch() {
    if (legalQuery.trim().length < 8) {
      setLegalAnswer("Введите вопрос подробнее.");
      return;
    }
    setLegalAnswer("Идет поиск по официальным источникам РК...");
    try {
      const answer = await apiJson("/rag/answer", { method: "POST", body: JSON.stringify({ query: legalQuery }) }) as ApiLegalAnswer;
      if (answer.fragment) {
        const norm: LegalNorm = {
          title: answer.fragment.title,
          article: answer.fragment.article ?? "Официальный фрагмент",
          source: new URL(answer.fragment.sourceUrl).hostname,
          date: answer.fragment.retrievedAt ? new Date(answer.fragment.retrievedAt).toLocaleDateString("ru-KZ") : "проверено API",
          text: answer.fragment.text,
          url: answer.fragment.sourceUrl,
        };
        setLegalNorms([norm]);
        setSelectedNorm(norm);
        setLegalAnswer(`${answer.message} Источник: ${answer.fragment.sourceUrl}`);
      } else {
        setLegalNorms([]);
        setSelectedNorm(null);
        setLegalAnswer(`${answer.message} Нет подтвержденной нормы из официального источника. Нужна ручная проверка.`);
      }
      setSyncState(`RAG статус: ${answer.status}`);
    } catch (error) {
      setLegalNorms([]);
      setSelectedNorm(null);
      setLegalAnswer("Нет подтвержденной нормы. Требуется ручная проверка.");
      setSyncState(error instanceof Error ? `RAG ошибка: ${error.message}` : "RAG ошибка");
    }
  }

  function addNormToDocument() {
    if (!selectedNorm) {
      setSyncState("Нет подтвержденной нормы для добавления");
      return;
    }
    const citation = `${selectedNorm.title}, ${selectedNorm.article}, источник: ${selectedNorm.source}`;
    setGeneratedClaimBody((body) => `${body || "Проект документа"}\n\nПодтвержденная норма: ${citation}`);
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
    setLegalAnswer(`Официальный источник открыт: ${url}. Если браузер заблокировал новую вкладку, используйте этот адрес вручную.`);
    setSyncState(`Источник выбран: ${selectedNorm.source}`);
  }

  async function generateClaim() {
    if (!remoteCaseId) {
      setSyncState("Сначала создайте дело в API");
      return;
    }
    setSyncState("Формирую претензию...");
    try {
      const templates = await apiJson("/templates") as { id: string }[];
      const generated = await apiJson("/documents/generate", {
        method: "POST",
        body: JSON.stringify({
          templateId: templates[0]?.id ?? "tpl-pretrial-claim-ru-v1",
          caseId: remoteCaseId,
          fields: {
            claimantName: profileName || "Заявитель",
            respondentName: "Ответчик",
            claimAmount: "1250000",
            claimReason: caseText,
            deadlineDate: "14 сентября 2026",
          },
          confirmedCitationIds: [],
        }),
      }) as ApiGeneratedDocument;
      setGeneratedClaimBody(generated.body);
      setClaimReady(true);
      updateActiveCase("Проект претензии готов", 91);
      setSyncState(`Проект создан в API: ${generated.id.slice(0, 8)}`);
      go("claimDraft");
    } catch (error) {
      setSyncState(error instanceof Error ? `Ошибка генерации: ${error.message}` : "Не удалось сформировать претензию");
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
        const remoteDocs = await apiJson(`/cases/${remoteCaseId}/documents`) as ApiDocument[];
        setSyncState(`Анализ API завершен: документов ${remoteDocs.length}`);
      } catch (error) {
        setSyncState(error instanceof Error ? `Анализ локально, API ошибка: ${error.message}` : "Анализ завершен локально");
      }
    } else {
      setSyncState("Анализ локальных файлов завершен. Для серверной обработки создайте дело.");
    }
    go("analysis");
  }

  function confirmClaimSent() {
    if (!claimReady) {
      setSyncState("Сначала сформируйте проект претензии");
      return;
    }
    const sentAt = new Date().toLocaleString("ru-KZ");
    setSent(true);
    updateActiveCase("Отправка претензии зафиксирована", 100);
    setTasks((items) => [{ title: `Отправка претензии подтверждена ${sentAt}`, due: "Зафиксировано", done: true }, ...items]);
    setSyncState(`Отправка зафиксирована пользователем: ${sentAt}`);
    go("claimSend");
  }

  function saveSettings() {
    window.localStorage.setItem("ai-lawyer-web-settings", JSON.stringify({ maskPii, budgetAlerts, savedAt: new Date().toISOString() }));
    setSyncState("Настройки сохранены в браузере");
  }

  async function createSupportRequest() {
    if (caseText.trim().length < 8) {
      setSyncState("Опишите обращение подробнее");
      return;
    }
    const ticketId = `SUP-${Date.now().toString().slice(-6)}`;
    if (remoteCaseId) {
      try {
        await apiJson(`/cases/${remoteCaseId}/messages`, { method: "POST", body: JSON.stringify({ role: "user", text: `Поддержка: ${caseText}` }) });
      } catch {
        // Support request still remains in local case history when API message sync is unavailable.
      }
    }
    setHelpStatus(`Обращение ${ticketId} создано`);
    setMessages((items) => [...items, { role: "user", text: `Поддержка: ${caseText}` }, { role: "assistant", text: `Обращение ${ticketId} принято в ручную проверку.` }]);
    setTasks((items) => [{ title: `Ответ поддержки ${ticketId}`, due: "24 часа", done: false }, ...items]);
    setSyncState(`Поддержка создана: ${ticketId}`);
  }

  async function loadSubscription() {
    try {
      const userId = await ensureUser();
      const budget = await apiJson("/subscriptions/current", { headers: { "x-user-id": userId } });
      setSubscriptionStatus(`Тариф ${budget.plan}, расход ${budget.percent}%, TTS ${budget.ttsDisabled ? "выключен" : "доступен"}`);
      setSyncState("Подписка обновлена из API");
    } catch (error) {
      setSubscriptionStatus("Не удалось загрузить подписку");
      setSyncState(error instanceof Error ? `Подписка: ${error.message}` : "Ошибка подписки");
    }
  }

  function toggleTask(title: string) {
    setTasks((items) => items.map((item) => item.title === title ? { ...item, done: !item.done } : item));
    setDeadlineStatus(`Срок обновлен: ${title}`);
  }

  function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  }

  function getSpeechRecognitionConstructor() {
    const speechWindow = window as SpeechWindow;
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
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
          setCaseText(text);
          setSpeechStatus("Речь распознана браузером");
        }
      };
      recognition.onerror = () => setSpeechStatus("Live распознавание недоступно, аудио сохранено");
      recognition.start();
      speechRecognitionRef.current = recognition;
      setSpeechStatus("Live распознавание включено");
    } catch {
      setSpeechStatus("Live распознавание не запустилось, аудио сохранено");
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setSyncState("Браузер не поддерживает запись голоса");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
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

  async function finishRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;
    setRecording(false);
    setPaused(false);
    setSyncState("Запись завершена, отправляю transcript job...");
    try {
      const job = await apiJson("/voice/transcripts", {
        method: "POST",
        body: JSON.stringify({ caseId: remoteCaseId || undefined, language: "ru", audioRef: audioUrl || "browser-mediarecorder", text: caseText }),
      }) as TranscriptJob;
      setTranscriptJobId(job.id);
      if (job.transcript) setCaseText(job.transcript);
      setSyncState(`Transcript job готов: ${job.id.slice(0, 8)}`);
      go("category");
    } catch (error) {
      setSyncState(error instanceof Error ? `Запись сохранена, API transcript ошибка: ${error.message}` : "Запись сохранена локально");
      go("category");
    }
  }

  function updateActiveCase(status: string, progress: number) {
    setCases((items) => items.map((item) => (item.id === activeCaseId ? { ...item, status, progress: Math.max(item.progress, progress) } : item)));
  }

  async function startAuth(target: "login" | "register") {
    if (!phone.startsWith("+7") || phone.replace(/\D/g, "").length !== 11) {
      setSyncState("Введите корректный номер +7");
      return;
    }
    if (target === "register" && (!name.trim() || !email.includes("@") || !consent)) {
      setSyncState("Заполните имя, email и согласие");
      return;
    }
    setSyncState("Отправляю OTP через API...");
    try {
      const registered = await apiJson("/auth/register", {
        method: "POST",
        body: JSON.stringify({ channel: "phone", phone, email: target === "register" ? email : undefined, password: password || undefined, consentVersion: "v1" }),
      }) as ApiOtpResponse;
      setOtpId(registered.otpId);
      setOtpHint(registered.deliveryMode === "stub" && registered.testCode ? `RC local SMS: ${registered.testCode}` : "Код отправлен через подключенный канал");
      setSyncState(`OTP создан в API: ${registered.otpId.slice(0, 8)}`);
      go("otp");
    } catch (error) {
      setSyncState(error instanceof Error ? `Auth API ошибка: ${error.message}` : "Auth API ошибка");
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
      const verified = await apiJson("/auth/otp/verify", { method: "POST", body: JSON.stringify({ otpId, code: otp }) });
      setAuthUserId(verified.user.id);
      setProfileName(name.trim() || profileName);
      setSyncState(`Вход подтвержден API: ${verified.user.id.slice(0, 8)}`);
      go("biometric");
    } catch (error) {
      setSyncState(error instanceof Error ? `OTP API ошибка: ${error.message}` : "OTP API ошибка");
    }
  }

  async function saveProfile() {
    if (!profileName.trim()) {
      setSyncState("Введите имя профиля");
      return;
    }
    setName(profileName);
    try {
      const userId = await ensureUser();
      const profileTypeMap: Record<string, string> = {
        "Физлицо": "person",
        "ИП": "individual_entrepreneur",
        "Юрлицо": "legal_entity",
      };
      const cleanIinBin = profileId.replace(/\D/g, "");
      await apiJson("/profiles", {
        method: "POST",
        body: JSON.stringify({ userId, type: profileTypeMap[profileType] ?? "person", displayName: profileName, iinBin: cleanIinBin.length === 12 ? cleanIinBin : undefined }),
      });
      setSyncState(`Профиль сохранен в API: ${profileType}`);
    } catch (error) {
      setSyncState(error instanceof Error ? `Профиль локально: ${error.message}` : `Профиль сохранен локально: ${profileType}`);
    }
  }

  function AppHeader({ title, subtitle, back = "home" }: { title: string; subtitle: string; back?: View }) {
    return (
      <header className="screenHeader">
        <button aria-label="Назад" onClick={() => go(back)}>‹</button>
        <div><h2>{title}</h2><p>{subtitle}</p></div>
      </header>
    );
  }

  function renderView() {
    if (view === "onboarding") {
      return (
        <section className="contentPanel centerPanel">
          <div className="brandMark">⚖</div>
          <Header title="AI Юрист Казахстан" subtitle="Юридический помощник с проверкой официальных источников РК" />
          <button className="primary wide" onClick={() => go("login")}>Начать</button>
          <button className="wide" onClick={() => go("home")}>Уже есть аккаунт</button>
        </section>
      );
    }

    if (view === "login" || view === "register" || view === "otp" || view === "biometric") {
      return (
        <section className="contentPanel authPanel">
          <AppHeader
            title={view === "login" ? "Вход и регистрация" : view === "register" ? "Регистрация пользователя" : view === "otp" ? "SMS подтверждение" : "Биометрия"}
            subtitle="Безопасный вход, согласие v1 и локальная биометрия"
          />
          {view === "login" && (
            <>
              <input placeholder="+7 номер телефона" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <input placeholder="Пароль или PIN" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button className="primary wide" onClick={() => { void startAuth("login"); }}>Получить код</button>
              <button className="wide" onClick={() => go("register")}>Зарегистрироваться</button>
            </>
          )}
          {view === "register" && (
            <>
              <input placeholder="Ф.И.О." value={name} onChange={(event) => setName(event.target.value)} />
              <input placeholder="+7 номер телефона" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <input placeholder="E-mail" value={email} onChange={(event) => setEmail(event.target.value)} />
              <label className="toggle"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Согласие с обработкой данных v1</label>
              <button className="primary wide" onClick={() => { void startAuth("register"); }}>Создать аккаунт</button>
            </>
          )}
          {view === "otp" && (
            <>
              <div className="analysisBox"><strong>OTP</strong><p>{otpId ? `Код отправлен: ${otpId.slice(0, 8)}` : "Введите код из SMS"}</p></div>
              {otpHint && <small className="recordMeta">{otpHint}</small>}
              <input placeholder="Код из SMS" value={otp} onChange={(event) => setOtp(event.target.value)} />
              <button className="primary wide" onClick={() => { void verifyOtp(); }}>Подтвердить</button>
              <button className="wide" onClick={() => { void startAuth("login"); }}>Отправить код повторно</button>
            </>
          )}
          {view === "biometric" && (
            <>
              <div className="brandMark">◎</div>
              <button className="primary wide" onClick={() => { setBiometricEnabled(true); setSyncState("Биометрия включена локально"); }}>{biometricEnabled ? "Биометрия включена" : "Включить биометрию"}</button>
              <button className="wide" onClick={() => go("profile")}>Продолжить</button>
            </>
          )}
        </section>
      );
    }

    if (view === "newCase") {
      return (
        <section className="contentPanel">
          <AppHeader title="Новое дело" subtitle="Голосовое или текстовое описание проблемы" />
          <h1 className="heroTitle">Опишите проблему</h1>
          <p className="hint">Расскажите о ситуации голосом, а мы поможем с решением</p>
          <button className={recording ? "mic small active" : "mic small"} onClick={() => { void startRecording(); }} aria-label="Записать голос"><span>⌾</span></button>
          <div className="recordCard">
            <div className="recordLine"><span className={recording && !paused ? "dot live" : "dot"}></span><strong>{recording ? (paused ? "Пауза" : "Идет запись") : audioUrl ? "Запись готова" : "Готов к записи"}</strong><em>{formatDuration(recordingSeconds)}</em></div>
            <textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} />
            {audioUrl && <audio className="voicePlayback" controls src={audioUrl}>Запись голоса</audio>}
            <small className="recordMeta">{speechStatus}</small>
            {transcriptJobId && <small className="recordMeta">Transcript job: {transcriptJobId.slice(0, 8)}</small>}
            <div className="wave" aria-hidden="true"></div>
          </div>
          <button className="primary wide" onClick={recording ? finishRecording : () => go("category")}>{recording ? "■ Завершить запись" : "Продолжить"}</button>
          <button className="wide" onClick={pauseRecording}>{paused ? "▶ Продолжить" : "Ⅱ Пауза"}</button>
        </section>
      );
    }

    if (view === "category") {
      return (
        <section className="contentPanel">
          <AppHeader title="Категория обращения" subtitle="AI определил категорию по описанию" back="newCase" />
          <div className="chips">{["Гражданское право", "Трудовой спор", "Семейное право", "Административное право"].map((type) => <button className={selectedCategory === type ? "chip active" : "chip"} key={type} onClick={() => { setSelectedCategory(type); setSyncState(`Категория выбрана: ${type}`); }}>{type}</button>)}</div>
          <div className="analysisBox"><strong>{selectedCategory}</strong><p>Категория будет сохранена вместе с описанием дела и дополнительно проверена AI-классификатором.</p></div>
          <button className="primary wide" onClick={addCase}>Подтвердить и создать дело</button>
        </section>
      );
    }

    if (view === "cases") {
      return (
        <section className="contentPanel">
          <AppHeader title="Мои дела" subtitle="Фильтр, поиск и карточки дел" />
          <div className="searchRow">
            <input value={caseSearch} onChange={(event) => setCaseSearch(event.target.value)} placeholder="Поиск дела" />
            <button onClick={() => setCaseSearch("")}>Очистить</button>
          </div>
          <div className="list">
            {!filteredCases.length && <button className="caseRow" onClick={() => go("newCase")}><span className="roundIcon">+</span><span><strong>Нет дел</strong><small>Создайте первое дело через голос или текст</small><small className="goldDot">● Данные появятся после сохранения в API</small></span><em>Сейчас</em></button>}
            {filteredCases.map((item) => (
              <button className="caseRow" key={item.id} onClick={() => { setActiveCaseId(item.id); go("case"); }}>
                <span className="roundIcon">⚖</span>
                <span><strong>{item.title}</strong><small>Дело №{item.id} · {item.type}</small><small className="goldDot">● {item.status}</small></span>
                <em>{item.date}</em>
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (view === "case") {
      return (
        <section className="contentPanel">
          <AppHeader title="Карточка дела" subtitle={`Дело №${activeCase.id} · ${activeCase.type}`} back="cases" />
          <div className="caseHero">
            <span className="largeIcon">⚖</span>
            <div><h2>{activeCase.title}</h2><p>{activeCase.status}</p></div>
            <strong>{activeCase.progress}%</strong>
          </div>
          <progress value={activeCase.progress} max="100" />
          <div className="tileGrid">
            <Info label="Категория" value={activeCase.type} />
            <Info label="Срок" value={activeCase.date} />
            <Info label="Документы" value={`${documents.length} файла`} />
            <Info label="Маршрут" value="Досудебная подготовка" />
          </div>
          <div className="actionBar">
            <button className="primary" onClick={() => go("chat")}>Продолжить работу</button>
            <button onClick={() => go("documents")}>Открыть документы</button>
            <button onClick={() => go("claim")}>Сформировать претензию</button>
          </div>
        </section>
      );
    }

    if (view === "chat") {
      return (
        <section className="contentPanel chatPanel">
          <AppHeader title="Чат по делу" subtitle={activeCase.title} back="case" />
          <div className="messages">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role}>{message.text}</div>)}
          </div>
          <div className="composer">
            <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} placeholder="Сообщение юристу AI" />
            <button className="primary" onClick={sendMessage}>Отправить</button>
          </div>
        </section>
      );
    }

    if (view === "documents" || view === "analysis" || view === "documentCheck" || view === "documentUpload") {
      return (
        <section className="contentPanel">
          <AppHeader
            title={view === "analysis" ? "Анализ документов" : view === "documentUpload" ? "Загрузка документа" : view === "documentCheck" ? "Проверка документов" : "Документы и доказательства"}
            subtitle="Загрузка документа, OCR и проверка фактов"
          />
          <div className="actionBar">
            <input ref={fileInputRef} className="fileInput" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic,.xlsx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addDocument(file, "file"); go("documentUpload"); }} />
            <input ref={scanInputRef} className="fileInput" type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addDocument(file, "camera"); go("documentUpload"); }} />
            <button className="primary" onClick={() => fileInputRef.current?.click()}>Загрузить файл</button>
            <button onClick={() => scanInputRef.current?.click()}>Сканировать документ</button>
            <button onClick={confirmOcr}>{ocrConfirmed ? "Поля подтверждены" : "Подтвердить поля"}</button>
          </div>
          <div className="list">
            {!documents.length && <button className="docRow" onClick={() => fileInputRef.current?.click()}><strong>Документов нет</strong><span>Загрузить файл</span></button>}
            {documents.map((doc) => <button className={selectedDocument === doc.name ? "docRow active" : "docRow"} key={`${doc.name}-${doc.sizeBytes ?? 0}`} onClick={() => { setSelectedDocument(doc.name); setSyncState(`Открыт документ: ${doc.name}`); }}><strong>{doc.name}</strong><span>{selectedDocument === doc.name && ocrConfirmed ? "Готов" : `${doc.status}${doc.sizeBytes ? ` · ${Math.ceil(doc.sizeBytes / 1024)} КБ` : ""}`}</span></button>)}
          </div>
          <div className="analysisBox">
            <strong>Проверка документов</strong>
            <p>{analysisDone ? "Анализ завершен. Можно формировать претензию." : "Не хватает акта сверки. Подтвердите отсутствие или загрузите документ."}</p>
            <button className="primary" onClick={analyzeDocuments}>Анализировать документы</button>
            <button disabled={!analysisDone} onClick={() => go("claim")}>Сформировать претензию</button>
          </div>
        </section>
      );
    }

    if (view === "deadlines") {
      return (
        <section className="contentPanel">
          <AppHeader title="Календарь и сроки" subtitle="Контроль процессуальных дат" />
          <div className="calendar"><strong>04</strong><span>Сентябрь 2026</span></div>
          <div className="analysisBox"><strong>Статус срока</strong><p>{deadlineStatus}</p></div>
          <div className="list">{tasks.map((task) => <button className={task.done ? "docRow active" : "docRow"} key={task.title} onClick={() => toggleTask(task.title)}><strong>{task.title}</strong><span>{task.done ? "Готово" : task.due}</span></button>)}</div>
        </section>
      );
    }

    if (view === "legal" || view === "legalSearch") {
      return (
        <section className="contentPanel">
          <AppHeader title={view === "legalSearch" ? "Поиск нормы права" : "Нормы права"} subtitle="Официальные источники РК" />
          <div className="legalSearch">
            <span>⌕</span>
            <input aria-label="Поиск нормы" value={legalQuery} onChange={(event) => setLegalQuery(event.target.value)} placeholder="Поиск по нормам права, статьям, законам..." />
            <button aria-label="Фильтр" onClick={() => setSyncState("Фильтр: действующие редакции")}>☷</button>
          </div>
          <div className="chips">{["Кодексы", "Законы", "Судебная практика"].map((tab) => <button className={legalTab === tab ? "chip active" : "chip"} key={tab} onClick={() => setLegalTab(tab)}>{tab}</button>)}</div>
          <div className="list">
            {!legalNorms.length && <div className="normCard"><strong>Нет подтвержденной нормы</strong><span>Запустите поиск</span><small>Будет показан только ответ API из официального источника или честный статус “недостаточно источников”.</small><p>Фиктивные нормы не отображаются.</p></div>}
            {legalNorms.map((norm, index) => (
              <button className={selectedNorm?.article === norm.article ? "normCard active" : "normCard"} key={`${norm.title}-${norm.article}`} onClick={() => { setSelectedNorm(norm); setLegalAnswer(norm.text); }}>
                {index === 0 && <em>Рекомендованная норма</em>}
                <strong>{norm.title}</strong>
                <span>{norm.article}</span>
                <small>Источник: {norm.source} · Актуально на {norm.date}</small>
                <p>{norm.text}</p>
              </button>
            ))}
          </div>
          <div className="analysisBox"><strong>Citation Validator</strong><p>{legalAnswer}</p></div>
          <div className="actionBar stickyActions">
            <button className="primary" onClick={() => { go("legalSearch"); void runLegalSearch(); }}>Найти норму</button>
            <button className="primary" disabled={!selectedNorm} onClick={addNormToDocument}>Добавить в документ</button>
            <button disabled={!selectedNorm} onClick={openOfficialSource}>Открыть источник</button>
          </div>
        </section>
      );
    }

    if (view === "claim" || view === "claimDraft" || view === "claimSend") {
      return (
        <section className="contentPanel">
          <AppHeader title={view === "claimSend" || sent ? "Отправка претензии" : view === "claimDraft" || claimReady ? "Проект претензии" : "Формирование претензии"} subtitle="Досудебная претензия с ручным подтверждением" back="case" />
          <textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} />
          <div className="claimPreview">{generatedClaimBody || "Прошу погасить задолженность по договору займа. Сумма требования: 1 250 000 ₸. Перед отправкой нужна проверка пользователя."}</div>
          <div className="actionBar">
            <button className="primary" onClick={generateClaim}>{claimReady ? "Пересформировать проект" : "Сформировать проект"}</button>
            <button disabled={!claimReady} onClick={confirmClaimSent}>{sent ? "Отправка зафиксирована" : "Зафиксировать отправку"}</button>
          </div>
        </section>
      );
    }

    if (view === "profile") {
      return (
        <section className="contentPanel">
          <AppHeader title="Профиль" subtitle="Профиль пользователя и тип клиента" />
          <div className="chips">{["Физлицо", "ИП", "Юрлицо"].map((type) => <button className={profileType === type ? "chip active" : "chip"} key={type} onClick={() => setProfileType(type)}>{type}</button>)}</div>
          <input placeholder="Ф.И.О. / название" value={profileName} onChange={(event) => setProfileName(event.target.value)} />
          <input placeholder="ИИН/БИН" value={profileId} onChange={(event) => setProfileId(event.target.value)} />
          <div className="actionBar">
            <button className="primary" onClick={() => { void saveProfile(); }}>Сохранить профиль</button>
            <button onClick={() => go("settings")}>Настройки</button>
            <button onClick={() => go("subscription")}>Подписка</button>
            <button onClick={() => go("help")}>Помощь и поддержка</button>
          </div>
        </section>
      );
    }

    if (view === "settings") {
      return (
        <section className="contentPanel">
          <AppHeader title="Настройки" subtitle="Безопасность, уведомления и приватность" back="profile" />
          <label className="toggle"><input type="checkbox" checked={maskPii} onChange={(event) => setMaskPii(event.target.checked)} /> Скрывать ИИН/БИН в логах</label>
          <label className="toggle"><input type="checkbox" checked={budgetAlerts} onChange={(event) => setBudgetAlerts(event.target.checked)} /> Предупреждать о бюджете AI</label>
          <div className="analysisBox"><strong>Статус</strong><p>{maskPii ? "PII masking включен" : "PII masking выключен"} · {budgetAlerts ? "Уведомления включены" : "Уведомления выключены"}</p></div>
          <button className="primary wide" onClick={saveSettings}>Сохранить настройки</button>
        </section>
      );
    }

    if (view === "subscription") {
      return (
        <section className="contentPanel">
          <AppHeader title="Подписка" subtitle="Лимиты, история и контроль расходов" back="profile" />
          <div className="tileGrid">
            <Info label="Тариф" value="RC Internal" />
            <Info label="AI бюджет" value="70%" />
            <Info label="Запросы" value="148 / 250" />
          </div>
          <div className="analysisBox"><strong>Подписка</strong><p>{subscriptionStatus}</p></div>
          <button className="primary wide" onClick={loadSubscription}>Обновить лимиты</button>
        </section>
      );
    }

    if (view === "help") {
      return (
        <section className="contentPanel">
          <AppHeader title="Помощь" subtitle="Поддержка и ручная проверка юристом" back="profile" />
          <div className="analysisBox"><strong>Статус обращения</strong><p>{helpStatus}</p></div>
          <textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} />
          <button className="primary wide" onClick={() => { void createSupportRequest(); }}>Написать в поддержку</button>
        </section>
      );
    }

    return (
      <section className="homeScreen">
        <div className="topLine">
          <div><h1>Здравствуйте, Дмитрий</h1><p>Ваш умный юридический помощник</p></div>
          <div className="topActions"><button className="bell" onClick={() => setSyncState("Новых уведомлений нет")} aria-label="Уведомления">♧</button><button className="avatar" onClick={() => go("profile")}>{profileName.slice(0, 2).toUpperCase()}</button></div>
        </div>
        <button className={recording ? "mic active" : "mic"} onClick={() => { go("newCase"); setTimeout(() => void startRecording(), 0); }} aria-label="Рассказать проблему"><span>⌾</span></button>
        <h2>Рассказать проблему</h2>
        <p className="hint">{recording ? "Запись активна. Открылся экран описания дела." : "Нажмите и говорите голосом"}</p>
        <div className="quickGrid">
          <button onClick={() => go("newCase")}><span className="quickIcon">▣</span>Новое дело<small>Создать новое дело</small></button>
          <button onClick={() => go("documents")}><span className="quickIcon">□</span>Мои документы<small>Просмотр и загрузка</small></button>
          <button onClick={() => go("deadlines")}><span className="quickIcon">▦</span>Сроки и календарь<small>Даты и напоминания</small></button>
        </div>
        <div className="sectionTitle"><h3>Последние дела</h3><button onClick={() => go("cases")}>Все дела</button></div>
        <div className="list">
          {!cases.length && <button className="caseRow" onClick={() => go("newCase")}><span className="roundIcon">+</span><span><strong>Нет дел</strong><small>Создайте первое дело</small><small className="goldDot">● Только реальные сохраненные данные</small></span><em>Сейчас</em></button>}
          {cases.slice(0, 2).map((item) => (
            <button className="caseRow" key={item.id} onClick={() => { setActiveCaseId(item.id); go("case"); }}>
              <span className="roundIcon">⚖</span><span><strong>{item.title}</strong><small>Дело №{item.id} · {item.type}</small><small className="goldDot">● {item.status}</small></span><em>{item.date}</em>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="appShell" data-theme={theme} data-design-screen-count={screens.length}>
      <section className="deviceFrame">
        <div className="appStatus"><span>{syncState}</span><button aria-label="Синхронизировать" onClick={syncWithApi}>↻</button><button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀" : "☾"}</button></div>
        {renderView()}
        <nav className="bottomNav">
          <button className={view === "home" ? "active" : ""} onClick={() => go("home")}>Главная</button>
          <button className={["cases", "case", "chat", "newCase", "category"].includes(view) ? "active" : ""} onClick={() => go("cases")}>Дела</button>
          <button className={["documents", "analysis", "documentCheck", "documentUpload"].includes(view) ? "active" : ""} onClick={() => go("documents")}>Документы</button>
          <button className={view === "deadlines" ? "active" : ""} onClick={() => go("deadlines")}>Сроки</button>
          <button className={["profile", "settings", "subscription", "help"].includes(view) ? "active" : ""} onClick={() => go("profile")}>Профиль</button>
        </nav>
      </section>
    </main>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="panelHeader"><h2>{title}</h2><p>{subtitle}</p></header>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="info"><small>{label}</small><strong>{value}</strong></div>;
}
