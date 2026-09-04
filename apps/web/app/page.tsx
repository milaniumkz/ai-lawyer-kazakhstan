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
type SavedState = {
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
  { id: "2024-0012", title: "Алименты", type: "Семейное право", status: "Подготовка документов", date: "10 мая 2024", progress: 42 },
];

export default function WebHome() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>("home");
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [activeCaseId, setActiveCaseId] = useState(initialCases[0].id);
  const [caseText, setCaseText] = useState("Нужно взыскать долг по договору займа. Есть расписка и переписка.");
  const [documents, setDocuments] = useState<DocumentItem[]>([{ name: "Расписка.pdf", status: "OCR-review" }]);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [claimReady, setClaimReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [recording, setRecording] = useState(false);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  useEffect(() => {
    const raw = window.localStorage.getItem("ai-lawyer-web-state");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Partial<SavedState>;
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
      setSyncState("Локальные данные восстановлены");
    } catch {
      setSyncState("Не удалось восстановить локальные данные");
    }
  }, []);

  useEffect(() => {
    const saved: SavedState = { cases, activeCaseId, caseText, documents, messages, profileType, profileName, profileId, maskPii, budgetAlerts, tasks };
    window.localStorage.setItem("ai-lawyer-web-state", JSON.stringify(saved));
  }, [cases, activeCaseId, caseText, documents, messages, profileType, profileName, profileId, maskPii, budgetAlerts, tasks]);

  function go(nextView: View) {
    setView(nextView);
  }

  function addCase() {
    if (caseText.trim().length < 12) {
      setSyncState("Опишите ситуацию подробнее");
      return;
    }
    const normalizedText = caseText.toLowerCase();
    const isLabor = ["труд", "работодател", "зарплат", "увольнен"].some((needle) => normalizedText.includes(needle));
    const isFamily = ["алимент", "развод", "ребен"].some((needle) => normalizedText.includes(needle));
    const next: CaseItem = {
      id: `2026-${String(cases.length + 21).padStart(4, "0")}`,
      title: isFamily ? "Алименты" : isLabor ? "Задержка зарплаты" : "Новое дело",
      type: isFamily ? "Семейное право" : isLabor ? "Трудовой спор" : "Гражданское право",
      status: "Категория определена",
      date: "04 сентября 2026",
      progress: 18,
    };
    setCases([next, ...cases]);
    setActiveCaseId(next.id);
    setSyncState(`Дело создано: №${next.id}`);
    go("case");
  }

  function sendMessage() {
    if (!chatInput.trim()) return;
    setMessages((items) => [
      ...items,
      { role: "user", text: chatInput },
      { role: "assistant", text: "Для ответа потребуется договор, расписка, переписка и подтвержденная норма из официального источника РК." },
    ]);
    setChatInput("");
  }

  function addDocument(name: string) {
    setDocuments((items) => [{ name, status: "Загружен" }, ...items]);
    setSyncState(`Документ добавлен: ${name}`);
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

  function toggleTask(title: string) {
    setTasks((items) => items.map((item) => (item.title === title ? { ...item, done: !item.done } : item)));
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
          <Header
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
              <input placeholder="Код из SMS" value={otp} onChange={(event) => setOtp(event.target.value)} />
              <button className="primary wide" onClick={verifyOtp}>Подтвердить</button>
              <button className="wide" onClick={() => setSyncState("Код повторно отправлен")}>Отправить код повторно</button>
            </>
          )}
          {view === "biometric" && (
            <>
              <div className="brandMark">◎</div>
              <button className="primary wide" onClick={() => setSyncState("Биометрия включена")}>Включить биометрию</button>
              <button className="wide" onClick={() => go("profile")}>Продолжить</button>
            </>
          )}
        </section>
      );
    }

    if (view === "newCase") {
      return (
        <section className="contentPanel">
          <Header title="Новое дело" subtitle="Голосовое или текстовое описание проблемы" />
          <button className={recording ? "mic small active" : "mic small"} onClick={() => setRecording(!recording)} aria-label="Записать голос"><span>⌾</span></button>
          <p className="hint">{recording ? "Запись активна" : "Нажмите и говорите голосом"}</p>
          <textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} />
          <button className="primary wide" onClick={() => go("category")}>Продолжить</button>
        </section>
      );
    }

    if (view === "category") {
      return (
        <section className="contentPanel">
          <Header title="Категория спора" subtitle="AI определил категорию по описанию" />
          <div className="chips">{["Гражданское право", "Трудовой спор", "Семейное право"].map((type) => <button className="chip" key={type} onClick={() => { setCaseText(`${caseText} ${type}`); }}>{type}</button>)}</div>
          <button className="primary wide" onClick={addCase}>Подтвердить и создать дело</button>
        </section>
      );
    }

    if (view === "cases") {
      return (
        <section className="contentPanel">
          <Header title="Мои дела" subtitle="Фильтр, поиск и карточки дел" />
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
          <Header title="Карточка дела" subtitle={`Дело №${activeCase.id} · ${activeCase.type}`} />
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
          <Header title="Чат по делу" subtitle={activeCase.title} />
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
          <Header
            title={view === "analysis" ? "Анализ документов" : view === "documentUpload" ? "Загрузка документа" : view === "documentCheck" ? "Проверка документов" : "Документы и доказательства"}
            subtitle="Загрузка документа, OCR и проверка фактов"
          />
          <div className="actionBar">
            <input ref={fileInputRef} className="fileInput" type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) addDocument(file.name); go("documentUpload"); }} />
            <button className="primary" onClick={() => fileInputRef.current?.click()}>Загрузить файл</button>
            <button onClick={() => { addDocument(`Скан документа ${documents.length + 1}.jpg`); go("documentUpload"); }}>Сканировать документ</button>
            <button onClick={() => setOcrConfirmed(true)}>{ocrConfirmed ? "Поля подтверждены" : "Подтвердить поля"}</button>
          </div>
          <div className="list">
            {documents.map((doc) => <div className="docRow" key={doc.name}><strong>{doc.name}</strong><span>{ocrConfirmed ? "Готов" : doc.status}</span></div>)}
          </div>
          <div className="analysisBox">
            <strong>Проверка документов</strong>
            <p>{analysisDone ? "Анализ завершен. Можно формировать претензию." : "Не хватает акта сверки. Подтвердите отсутствие или загрузите документ."}</p>
            <button className="primary" onClick={() => { setAnalysisDone(true); go("analysis"); }}>Анализировать документы</button>
            <button disabled={!analysisDone} onClick={() => go("claim")}>Сформировать претензию</button>
          </div>
        </section>
      );
    }

    if (view === "deadlines") {
      return (
        <section className="contentPanel">
          <Header title="Календарь и сроки" subtitle="Контроль процессуальных дат" />
          <div className="calendar"><strong>04</strong><span>Сентябрь 2026</span></div>
          <div className="list"><div className="docRow"><strong>Досудебная претензия</strong><span>10 дней</span></div><div className="docRow"><strong>Исковое заявление</strong><span>22 мая</span></div></div>
        </section>
      );
    }

    if (view === "legal" || view === "legalSearch") {
      return (
        <section className="contentPanel">
          <Header title={view === "legalSearch" ? "Поиск нормы права" : "Нормы права"} subtitle="Поиск нормы права только по официальным источникам РК" />
          <div className="searchRow">
            <input value={legalQuery} onChange={(event) => setLegalQuery(event.target.value)} />
            <button className="primary" onClick={() => { setLegalAnswer(legalQuery.length > 8 ? "Нужна проверка юристом: ответ будет показан только при подтвержденной норме из официального источника РК." : "Введите вопрос подробнее."); go("legalSearch"); }}>Найти норму</button>
          </div>
          <div className="analysisBox"><strong>Citation Validator</strong><p>{legalAnswer}</p></div>
        </section>
      );
    }

    if (view === "claim" || view === "claimDraft" || view === "claimSend") {
      return (
        <section className="contentPanel">
          <Header title={view === "claimSend" || sent ? "Отправка претензии" : view === "claimDraft" || claimReady ? "Проект претензии" : "Формирование претензии"} subtitle="Досудебная претензия с ручным подтверждением" />
          <textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} />
          <div className="claimPreview">Прошу погасить задолженность по договору займа. Сумма требования: 1 250 000 ₸. Перед отправкой нужна проверка пользователя.</div>
          <div className="actionBar">
            <button className="primary" onClick={() => { setClaimReady(true); go("claimDraft"); }}>{claimReady ? "Проект сформирован" : "Сформировать проект"}</button>
            <button disabled={!claimReady} onClick={() => { setSent(true); go("claimSend"); }}>{sent ? "Отправка зафиксирована" : "Зафиксировать отправку"}</button>
          </div>
        </section>
      );
    }

    if (view === "profile") {
      return (
        <section className="contentPanel">
          <Header title="Профиль" subtitle="Профиль пользователя и тип клиента" />
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
          <Header title="Настройки" subtitle="Безопасность, уведомления и приватность" />
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
          <Header title="Подписка" subtitle="Лимиты, история и контроль расходов" />
          <div className="tileGrid">
            <Info label="Тариф" value="RC Internal" />
            <Info label="AI бюджет" value="70%" />
            <Info label="Запросы" value="148 / 250" />
          </div>
          <div className="analysisBox"><strong>Payment provider</strong><p>Оплата доступна только после подключения production credentials.</p></div>
          <button className="primary wide" onClick={() => setSyncState("Оплата заблокирована: нет payment credentials")}>Управление оплатой</button>
        </section>
      );
    }

    if (view === "help") {
      return (
        <section className="contentPanel">
          <Header title="Помощь" subtitle="Поддержка и ручная проверка юристом" />
          <div className="analysisBox"><strong>Статус обращения</strong><p>{helpStatus}</p></div>
          <textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} />
          <button className="primary wide" onClick={() => setHelpStatus(`Обращение создано: ${caseText.slice(0, 42)}`)}>Написать в поддержку</button>
        </section>
      );
    }

    return (
      <section className="homeScreen">
        <div className="topLine">
          <div><h1>Здравствуйте, Дмитрий</h1><p>Ваш умный юридический помощник</p></div>
          <button className="avatar" onClick={() => go("profile")}>{profileName.slice(0, 2).toUpperCase()}</button>
        </div>
        <button className={recording ? "mic active" : "mic"} onClick={() => { setRecording(true); go("newCase"); }} aria-label="Рассказать проблему"><span>⌾</span></button>
        <h2>Рассказать проблему</h2>
        <p className="hint">{recording ? "Запись активна. Нажмите еще раз, чтобы остановить." : "Нажмите и говорите голосом"}</p>
        <div className="quickGrid">
          <button onClick={() => go("newCase")}>Новое дело<small>Создать новое дело</small></button>
          <button onClick={() => go("documents")}>Мои документы<small>Просмотр и загрузка</small></button>
          <button onClick={() => go("deadlines")}>Сроки и календарь<small>Даты и напоминания</small></button>
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
    <main className="appShell" data-design-screen-count={screens.length}>
      <aside className="sidebar">
        <strong>AI Юрист</strong>
        <nav>
          <Nav label="Главная" current={view === "home"} onClick={() => go("home")} />
          <Nav label="Дела" current={["cases", "case", "chat", "newCase", "category"].includes(view)} onClick={() => go("cases")} />
          <Nav label="Документы" current={["documents", "analysis", "documentCheck", "documentUpload"].includes(view)} onClick={() => go("documents")} />
          <Nav label="Сроки" current={view === "deadlines"} onClick={() => go("deadlines")} />
          <Nav label="Нормы права" current={["legal", "legalSearch"].includes(view)} onClick={() => go("legal")} />
          <Nav label="Профиль" current={["profile", "settings", "subscription", "help", "login", "register", "otp", "biometric"].includes(view)} onClick={() => go("profile")} />
        </nav>
        <button className="sync" onClick={syncWithApi}>Синхронизировать</button>
        <small>{syncState}</small>
      </aside>
      <section className="deviceFrame">
        <div className="appStatus">{syncState}</div>
        {renderView()}
        <nav className="bottomNav">
          <button className={view === "home" ? "active" : ""} onClick={() => go("home")}>Главная</button>
          <button className={["cases", "case", "chat", "newCase", "category"].includes(view) ? "active" : ""} onClick={() => go("cases")}>Дела</button>
          <button className={["documents", "analysis", "documentCheck", "documentUpload"].includes(view) ? "active" : ""} onClick={() => go("documents")}>Документы</button>
          <button className={view === "deadlines" ? "active" : ""} onClick={() => go("deadlines")}>Сроки</button>
          <button className={["profile", "settings", "subscription", "help"].includes(view) ? "active" : ""} onClick={() => go("profile")}>Профиль</button>
        </nav>
      </section>
      <aside className="rightPanel">
        <Header title={activeCase.title} subtitle={`Дело №${activeCase.id} · ${activeCase.status}`} />
        <div className="caseHero compact">
          <span className="largeIcon">⚖</span>
          <div><h2>{activeCase.progress}%</h2><p>готовность дела</p></div>
        </div>
        <progress value={activeCase.progress} max="100" />
        <div className="sideSection">
          <h3>Ближайшие задачи</h3>
          <div className="taskList">
            {tasks.map((task) => (
              <button className={task.done ? "taskRow done" : "taskRow"} key={task.title} onClick={() => toggleTask(task.title)}>
                <span>{task.done ? "✓" : ""}</span>
                <strong>{task.title}</strong>
                <small>{task.due}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="sideSection">
          <h3>Действия</h3>
          <div className="sideActions">
            <button className="primary" onClick={() => go("newCase")}>Новое дело</button>
            <button onClick={() => go("chat")}>Чат по делу</button>
            <button onClick={() => go("documents")}>Документы</button>
            <button onClick={() => go("claim")}>Претензия</button>
          </div>
        </div>
        <div className="sideSection">
          <h3>Документы</h3>
          <div className="miniDocs">
            {documents.slice(0, 3).map((doc) => <button key={doc.name} onClick={() => go("documents")}><strong>{doc.name}</strong><small>{doc.status}</small></button>)}
          </div>
        </div>
      </aside>
    </main>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className="panelHeader"><h2>{title}</h2><p>{subtitle}</p></header>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="info"><small>{label}</small><strong>{value}</strong></div>;
}

function Nav({ label, current, onClick }: { label: string; current: boolean; onClick: () => void }) {
  return <button className={current ? "active" : ""} onClick={onClick}>{label}</button>;
}
