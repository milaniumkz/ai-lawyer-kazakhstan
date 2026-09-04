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
type DocumentItem = { name: string; status: string };
type TaskItem = { title: string; due: string; done: boolean };
type ApiLegalCase = { id: string; title: string; category: string; status: string; readinessPercent: number; createdAt: string };
type ApiDocument = { id: string; fileName: string; status: string; extractedFields?: Record<string, string> };
type ApiGeneratedDocument = { id: string; title: string; body: string; status: string; expertReviewRequired: boolean };
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

const initialCases: CaseItem[] = [
  { id: "2024-0015", title: "Взыскание долга", type: "Гражданское право", status: "В работе", date: "15 мая 2024", progress: 65 },
  { id: "2024-0014", title: "Задержка зарплаты", type: "Трудовой спор", status: "Нужно проверить работодателя", date: "12 мая 2024", progress: 48 },
  { id: "2024-0012", title: "Алименты", type: "Семейное право", status: "Подготовка документов", date: "10 мая 2024", progress: 42 },
];

export default function WebHome() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>("home");
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [activeCaseId, setActiveCaseId] = useState(initialCases[0].id);
  const [caseText, setCaseText] = useState("Нужно взыскать долг по договору займа. Есть расписка и переписка.");
  const [documents, setDocuments] = useState<DocumentItem[]>([{ name: "Расписка.pdf", status: "OCR-review" }]);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [claimReady, setClaimReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Гражданское право");
  const [authUserId, setAuthUserId] = useState("");
  const [otpId, setOtpId] = useState("");
  const [remoteCaseId, setRemoteCaseId] = useState("");
  const [remoteDocumentId, setRemoteDocumentId] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("Расписка.pdf");
  const [generatedClaimBody, setGeneratedClaimBody] = useState("");
  const [deadlineStatus, setDeadlineStatus] = useState("Ближайший срок: досудебная претензия за 10 дней");
  const [subscriptionStatus, setSubscriptionStatus] = useState("Лимиты обновятся после входа");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [legalQuery, setLegalQuery] = useState("Как взыскать долг по расписке?");
  const [legalAnswer, setLegalAnswer] = useState("Введите вопрос и нажмите найти норму.");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Опишите ситуацию. Я проверю факты, документы и официальные источники РК." },
  ]);
  const [phone, setPhone] = useState("+77010000000");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("Дмитрий");
  const [email, setEmail] = useState("client@example.kz");
  const [otp, setOtp] = useState("111111");
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

  const activeCase = cases.find((item) => item.id === activeCaseId) ?? cases[0];
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

  function go(nextView: View) {
    setView(nextView);
  }

  async function ensureUser() {
    if (authUserId) return authUserId;
    const suffix = Date.now().toString().slice(-7).padStart(7, "0");
    const registered = await apiJson("/auth/register", {
      method: "POST",
      body: JSON.stringify({ channel: "phone", phone: `+7701${suffix}`, password: password || "Demo12345", consentVersion: "v1" }),
    });
    setOtpId(registered.otpId);
    const verified = await apiJson("/auth/otp/verify", { method: "POST", body: JSON.stringify({ otpId: registered.otpId, code: "111111" }) });
    setAuthUserId(verified.user.id);
    return verified.user.id as string;
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

  async function addDocument(name: string) {
    const localDoc = { name, status: "Загружен" };
    setSelectedDocument(name);
    setDocuments((items) => [localDoc, ...items]);
    updateActiveCase("Документы загружены", 76);
    if (!remoteCaseId) {
      setSyncState(`Документ добавлен локально: ${name}`);
      return;
    }
    try {
      const session = await apiJson("/files/upload-sessions", {
        method: "POST",
        body: JSON.stringify({ caseId: remoteCaseId, fileName: name, mimeType: mimeTypeFor(name), sizeBytes: 128000 }),
      });
      const document = await apiJson("/files/complete", {
        method: "POST",
        body: JSON.stringify({ uploadSessionId: session.id, sha256: `web-${Date.now()}-${name}` }),
      }) as ApiDocument;
      setRemoteDocumentId(document.id);
      setDocuments((items) => items.map((item, index) => index === 0 ? { name: document.fileName, status: "OCR-review" } : item));
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
    if (!response.ok) throw new Error(body.message ?? body.error ?? `${path} failed`);
    return body;
  }

  async function syncWithApi() {
    setSyncState("Синхронизация...");
    try {
      const suffix = Date.now().toString().slice(-7).padStart(7, "0");
      const registered = await apiJson("/auth/register", {
        method: "POST",
        body: JSON.stringify({ channel: "phone", phone: `+7701${suffix}`, password: "Demo12345", consentVersion: "v1" }),
      });
      const verified = await apiJson("/auth/otp/verify", { method: "POST", body: JSON.stringify({ otpId: registered.otpId, code: "111111" }) });
      const legalCase = await apiJson("/cases", {
        method: "POST",
        headers: { "idempotency-key": `web-app-${Date.now()}` },
        body: JSON.stringify({ ownerUserId: verified.user.id, problemText: caseText }),
      });
      const answer = await apiJson("/rag/answer", { method: "POST", body: JSON.stringify({ query: legalQuery }) });
      setSyncState(`Сохранено: дело ${legalCase.id.slice(0, 8)}, RAG ${answer.status}`);
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
      const answer = await apiJson("/rag/answer", { method: "POST", body: JSON.stringify({ query: legalQuery }) });
      setLegalAnswer(`${answer.message}${answer.fragment ? ` Источник: ${answer.fragment.sourceUrl}` : " Нужна ручная проверка юристом."}`);
      setSyncState(`RAG статус: ${answer.status}`);
    } catch (error) {
      setLegalAnswer("Нет подтвержденной нормы. Требуется ручная проверка.");
      setSyncState(error instanceof Error ? `RAG ошибка: ${error.message}` : "RAG ошибка");
    }
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

  function updateActiveCase(status: string, progress: number) {
    setCases((items) => items.map((item) => (item.id === activeCaseId ? { ...item, status, progress: Math.max(item.progress, progress) } : item)));
  }

  function startAuth(target: "login" | "register") {
    if (!phone.startsWith("+7") || phone.replace(/\D/g, "").length !== 11) {
      setSyncState("Введите корректный номер +7");
      return;
    }
    if (target === "register" && (!name.trim() || !email.includes("@") || !consent)) {
      setSyncState("Заполните имя, email и согласие");
      return;
    }
    setSyncState(target === "register" ? "Аккаунт подготовлен, код отправлен" : "Код отправлен");
    go("otp");
  }

  function verifyOtp() {
    if (otp.trim() !== "111111") {
      setSyncState("Неверный SMS код");
      return;
    }
    setProfileName(name.trim() || profileName);
    setSyncState("Вход подтвержден");
    go("biometric");
  }

  function saveProfile() {
    setName(profileName);
    setSyncState(`Профиль сохранен: ${profileType}`);
  }

  function finishRecording() {
    setRecording(false);
    setPaused(false);
    if (!caseText.trim()) setCaseText("Опишите проблему голосом или текстом.");
    setSyncState("Запись завершена, текст готов к проверке");
    go("category");
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
              <button className="primary wide" onClick={() => startAuth("login")}>Получить код</button>
              <button className="wide" onClick={() => go("register")}>Зарегистрироваться</button>
            </>
          )}
          {view === "register" && (
            <>
              <input placeholder="Ф.И.О." value={name} onChange={(event) => setName(event.target.value)} />
              <input placeholder="+7 номер телефона" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <input placeholder="E-mail" value={email} onChange={(event) => setEmail(event.target.value)} />
              <label className="toggle"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Согласие с обработкой данных v1</label>
              <button className="primary wide" onClick={() => startAuth("register")}>Создать аккаунт</button>
            </>
          )}
          {view === "otp" && (
            <>
              <div className="analysisBox"><strong>OTP</strong><p>{otpId ? `Код отправлен: ${otpId.slice(0, 8)}` : "Введите код из SMS"}</p></div>
              <input placeholder="Код из SMS" value={otp} onChange={(event) => setOtp(event.target.value)} />
              <button className="primary wide" onClick={verifyOtp}>Подтвердить</button>
              <button className="wide" onClick={() => setSyncState("Код повторно отправлен")}>Отправить код повторно</button>
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
          <button className={recording ? "mic small active" : "mic small"} onClick={() => { setRecording(true); setPaused(false); }} aria-label="Записать голос"><span>⌾</span></button>
          <div className="recordCard">
            <div className="recordLine"><span className={recording && !paused ? "dot live" : "dot"}></span><strong>{recording ? (paused ? "Пауза" : "Идет запись") : "Готов к записи"}</strong><em>{recording ? "00:47" : "00:00"}</em></div>
            <textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} />
            <div className="wave" aria-hidden="true"></div>
          </div>
          <button className="primary wide" onClick={recording ? finishRecording : () => go("category")}>{recording ? "■ Завершить запись" : "Продолжить"}</button>
          <button className="wide" onClick={() => { setRecording(true); setPaused(!paused); }}>{paused ? "▶ Продолжить" : "Ⅱ Пауза"}</button>
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
            <input ref={fileInputRef} className="fileInput" type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addDocument(file.name); go("documentUpload"); }} />
            <button className="primary" onClick={() => fileInputRef.current?.click()}>Загрузить файл</button>
            <button onClick={() => { void addDocument(`Скан документа ${documents.length + 1}.jpg`); go("documentUpload"); }}>Сканировать документ</button>
            <button onClick={confirmOcr}>{ocrConfirmed ? "Поля подтверждены" : "Подтвердить поля"}</button>
          </div>
          <div className="list">
            {documents.map((doc) => <button className={selectedDocument === doc.name ? "docRow active" : "docRow"} key={doc.name} onClick={() => { setSelectedDocument(doc.name); setSyncState(`Открыт документ: ${doc.name}`); }}><strong>{doc.name}</strong><span>{selectedDocument === doc.name && ocrConfirmed ? "Готов" : doc.status}</span></button>)}
          </div>
          <div className="analysisBox">
            <strong>Проверка документов</strong>
            <p>{analysisDone ? "Анализ завершен. Можно формировать претензию." : "Не хватает акта сверки. Подтвердите отсутствие или загрузите документ."}</p>
            <button className="primary" onClick={() => { setAnalysisDone(true); updateActiveCase("Анализ документов завершен", 84); go("analysis"); }}>Анализировать документы</button>
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
          <AppHeader title={view === "legalSearch" ? "Поиск нормы права" : "Нормы права"} subtitle="Поиск нормы права только по официальным источникам РК" />
          <div className="searchRow">
            <input value={legalQuery} onChange={(event) => setLegalQuery(event.target.value)} />
            <button className="primary" onClick={() => { go("legalSearch"); void runLegalSearch(); }}>Найти норму</button>
          </div>
          <div className="analysisBox"><strong>Citation Validator</strong><p>{legalAnswer}</p></div>
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
            <button disabled={!claimReady} onClick={() => { setSent(true); updateActiveCase("Отправка претензии зафиксирована", 100); go("claimSend"); }}>{sent ? "Отправка зафиксирована" : "Зафиксировать отправку"}</button>
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
            <button className="primary" onClick={saveProfile}>Сохранить профиль</button>
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
          <button className="primary wide" onClick={() => setSyncState("Настройки сохранены")}>Сохранить настройки</button>
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
          <button className="primary wide" onClick={() => { setHelpStatus(`Обращение создано: ${caseText.slice(0, 42)}`); setTasks((items) => [{ title: "Ответ поддержки", due: "24 часа", done: false }, ...items]); }}>Написать в поддержку</button>
        </section>
      );
    }

    return (
      <section className="homeScreen">
        <div className="topLine">
          <div><h1>Здравствуйте, Дмитрий</h1><p>Ваш умный юридический помощник</p></div>
          <div className="topActions"><button className="bell" onClick={() => setSyncState("Новых уведомлений нет")} aria-label="Уведомления">♧</button><button className="avatar" onClick={() => go("profile")}>{profileName.slice(0, 2).toUpperCase()}</button></div>
        </div>
        <button className={recording ? "mic active" : "mic"} onClick={() => { setRecording(true); go("newCase"); }} aria-label="Рассказать проблему"><span>⌾</span></button>
        <h2>Рассказать проблему</h2>
        <p className="hint">{recording ? "Запись активна. Открылся экран описания дела." : "Нажмите и говорите голосом"}</p>
        <div className="quickGrid">
          <button onClick={() => go("newCase")}><span className="quickIcon">▣</span>Новое дело<small>Создать новое дело</small></button>
          <button onClick={() => go("documents")}><span className="quickIcon">□</span>Мои документы<small>Просмотр и загрузка</small></button>
          <button onClick={() => go("deadlines")}><span className="quickIcon">▦</span>Сроки и календарь<small>Даты и напоминания</small></button>
          <button onClick={() => go("legal")}><span className="quickIcon">§</span>Нормы права<small>Официальные источники РК</small></button>
        </div>
        <div className="sectionTitle"><h3>Последние дела</h3><button onClick={() => go("cases")}>Все дела</button></div>
        <div className="list">
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
