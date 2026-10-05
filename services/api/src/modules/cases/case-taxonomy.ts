export type CaseTaxonomyItem = {
  id: string;
  subcategory: string;
  title: string;
  procedure: 'civil' | 'administrative_public_law' | 'administrative_offense' | 'criminal' | 'enforcement' | 'special';
  description: string;
  criteria: string[];
  keywords: string[];
  negativeKeywords?: string[];
  highRisk?: boolean;
  officialSourceRefs: string[];
};

export type CaseClassification = {
  category: string;
  subcategory: string;
  confidence: number;
};

export type LegalCategory = {
  id: string;
  code: string;
  parentId?: string;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  descriptionRu: string;
  descriptionKk: string;
  descriptionEn: string;
  active: boolean;
  highRisk: boolean;
  sortOrder: number;
  requiredFactSchema: Record<string, unknown>;
  requiredDocumentRules: Record<string, unknown>;
  clarificationQuestionTemplates: {
    id: string;
    type: 'text' | 'date' | 'money' | 'select';
    questionRu: string;
    questionKk: string;
    questionEn: string;
  }[];
  defaultLegalRoute: 'civil' | 'administrative' | 'enforcement' | 'criminal_high_risk' | 'manual_review';
  version: number;
  keywords: string[];
};

export type StructuredClassification = {
  language: 'ru' | 'kk' | 'en';
  jurisdiction: 'KZ';
  complexity: 'low' | 'medium' | 'high';
  risk_level: 'low' | 'medium' | 'high';
  urgency: 'low' | 'normal' | 'high';
  category_code: string;
  subcategory_code: string;
  category_label: string;
  subcategory_label: string;
  confidence: number;
  reasons: string[];
  alternatives: { code: string; confidence: number; reason: string }[];
  facts: Record<string, unknown>;
  missing_facts: string[];
  clarification_questions: LegalCategory['clarificationQuestionTemplates'];
  risk_flags: string[];
  required_human_review: boolean;
};

export const CASE_TAXONOMY: CaseTaxonomyItem[] = [
  {
    id: 'family',
    subcategory: 'alimony_children_divorce',
    title: 'Семейные споры',
    procedure: 'civil',
    description: 'Брак, развод, алименты, дети, раздел имущества супругов, родительские права.',
    criteria: ['Есть семейная связь сторон', 'Требование связано с детьми, алиментами, разводом или имуществом супругов'],
    keywords: ['алимент', 'развод', 'расторжение брака', 'ребенок', 'дети', 'опека', 'родительск', 'отцовств', 'материнств', 'раздел имущества супруг'],
    officialSourceRefs: ['ГПК РК', 'Кодекс РК О браке (супружестве) и семье'],
  },
  {
    id: 'civil_contract',
    subcategory: 'debt_contract_obligation',
    title: 'Договоры и взыскание долга',
    procedure: 'civil',
    description: 'Долги, займы, расписки, услуги, поставка, подряд, аренда и другие обязательства.',
    criteria: ['Есть договор, расписка, счет или фактическое обязательство', 'Требование о взыскании денег, исполнении договора или расторжении'],
    keywords: ['долг', 'задолж', 'заем', 'займ', 'расписк', 'договор', 'услуг', 'поставка', 'подряд', 'аренд', 'не оплатил', 'не вернул', 'пеня', 'неустойк'],
    officialSourceRefs: ['ГПК РК', 'ГК РК'],
  },
  {
    id: 'labor',
    subcategory: 'wage_dismissal_employment',
    title: 'Трудовые споры',
    procedure: 'civil',
    description: 'Зарплата, увольнение, трудовой договор, дисциплинарные взыскания, несчастный случай на работе.',
    criteria: ['Стороны связаны трудовым договором или фактической работой', 'Спор о зарплате, увольнении, условиях труда или компенсации'],
    keywords: ['работодатель', 'работник', 'зарплат', 'увольн', 'трудовой договор', 'отпуск', 'больничн', 'дисциплинар', 'несчастный случай', 'сокращен'],
    officialSourceRefs: ['ГПК РК', 'Трудовой кодекс РК'],
  },
  {
    id: 'housing',
    subcategory: 'housing_utilities_eviction',
    title: 'Жилищные споры',
    procedure: 'civil',
    description: 'Квартира, жилье, выселение, коммунальные услуги, ОСИ/КСК, пользование жилым помещением.',
    criteria: ['Предмет связан с жилым помещением или коммунальными платежами', 'Есть требование о пользовании, выселении, оплате или управлении домом'],
    keywords: ['квартир', 'жиль', 'выселен', 'коммуналь', 'кск', 'оси', 'пиб', 'сосед', 'подъезд', 'пропис', 'регистрац по адресу'],
    officialSourceRefs: ['ГПК РК', 'Закон РК О жилищных отношениях'],
  },
  {
    id: 'property_real_estate',
    subcategory: 'ownership_registration_real_estate',
    title: 'Имущество и недвижимость',
    procedure: 'civil',
    description: 'Право собственности, доли, недвижимость, регистрация прав, истребование имущества.',
    criteria: ['Спор о принадлежности имущества или доле', 'Требуется признание, регистрация, возврат или защита права собственности'],
    keywords: ['собственност', 'недвижим', 'дом', 'помещен', 'доля', 'имущество', 'регистрация права', 'истребовать', 'сделка', 'купля продажа'],
    officialSourceRefs: ['ГПК РК', 'ГК РК', 'Закон РК О государственной регистрации прав на недвижимое имущество'],
  },
  {
    id: 'land',
    subcategory: 'land_plot_cadastre_boundaries',
    title: 'Земельные споры',
    procedure: 'civil',
    description: 'Земельный участок, границы, кадастр, аренда земли, изъятие, целевое назначение.',
    criteria: ['Предмет спора - земельный участок или право землепользования', 'Есть вопрос границ, кадастра, аренды, изъятия или назначения участка'],
    keywords: ['земельн', 'участок', 'кадастр', 'границ', 'землепольз', 'целевое назначение', 'изъятие земли', 'аренда земли'],
    officialSourceRefs: ['ГПК РК', 'Земельный кодекс РК'],
  },
  {
    id: 'inheritance',
    subcategory: 'estate_will_heirs_notary',
    title: 'Наследство',
    procedure: 'civil',
    description: 'Наследники, завещание, принятие наследства, восстановление срока, нотариус.',
    criteria: ['Есть смерть наследодателя или наследственное имущество', 'Требуется оформить, разделить или оспорить наследство'],
    keywords: ['наслед', 'завещан', 'наследник', 'нотариус', 'умер', 'срок принятия наследства', 'наследственная масса'],
    officialSourceRefs: ['ГПК РК', 'ГК РК'],
  },
  {
    id: 'consumer',
    subcategory: 'goods_services_refund',
    title: 'Защита прав потребителей',
    procedure: 'civil',
    description: 'Некачественный товар или услуга, возврат денег, гарантия, продавец, исполнитель.',
    criteria: ['Покупатель или заказчик выступает как потребитель', 'Требование о возврате, ремонте, замене, компенсации или качестве услуги'],
    keywords: ['потребител', 'товар', 'возврат денег', 'гарант', 'некачествен', 'продавец', 'магазин', 'услуга оказана плохо', 'ремонт'],
    officialSourceRefs: ['ГПК РК', 'Закон РК О защите прав потребителей'],
  },
  {
    id: 'banking_credit',
    subcategory: 'loan_bank_microcredit_collateral',
    title: 'Банки, кредиты и МФО',
    procedure: 'civil',
    description: 'Кредит, микрозайм, банк, залог, коллекторы, график платежей, просрочка.',
    criteria: ['Сторона - банк, МФО, коллектор или заемщик', 'Спор о кредите, микрозайме, залоге, процентах, просрочке или взыскании'],
    keywords: ['кредит', 'банк', 'микрокредит', 'мфо', 'залог', 'коллектор', 'просрочк', 'ипотек', 'график платеж', 'вознагражден'],
    officialSourceRefs: ['ГПК РК', 'ГК РК', 'Закон РК О банках и банковской деятельности'],
  },
  {
    id: 'insurance',
    subcategory: 'insurance_payout_dispute',
    title: 'Страховые споры',
    procedure: 'civil',
    description: 'Страховая выплата, отказ страховщика, ОС ГПО, оценка ущерба.',
    criteria: ['Есть договор или обязательное страхование', 'Спор о выплате, отказе, размере ущерба или страховом случае'],
    keywords: ['страхов', 'страховая', 'страховщик', 'выплата', 'страховой случай', 'гпо', 'полис'],
    officialSourceRefs: ['ГПК РК', 'Закон РК О страховой деятельности'],
  },
  {
    id: 'tort_damage',
    subcategory: 'damage_compensation_moral_harm',
    title: 'Вред и компенсация ущерба',
    procedure: 'civil',
    description: 'Материальный ущерб, моральный вред, ДТП, вред здоровью или имуществу.',
    criteria: ['Есть вред имуществу, здоровью, репутации или моральный вред', 'Требуется компенсация ущерба или восстановление нарушенного права'],
    keywords: ['ущерб', 'вред', 'компенсац', 'моральн', 'дтп', 'авария', 'залив', 'повредил', 'травм', 'клевет'],
    officialSourceRefs: ['ГПК РК', 'ГК РК'],
  },
  {
    id: 'corporate_commercial',
    subcategory: 'llp_founders_commercial_dispute',
    title: 'Бизнес и корпоративные споры',
    procedure: 'civil',
    description: 'ТОО, учредители, доли в бизнесе, корпоративные решения, коммерческие сделки.',
    criteria: ['Участники спора - бизнес, ТОО, ИП, учредители или участники компании', 'Требование связано с долей, управлением, сделкой или корпоративным решением'],
    keywords: ['тоо', 'ип', 'учредител', 'участник', 'директор', 'доля в бизнесе', 'корпоратив', 'протокол собрания', 'коммерческ'],
    officialSourceRefs: ['ГПК РК', 'Предпринимательский кодекс РК', 'ГК РК'],
  },
  {
    id: 'bankruptcy_rehabilitation',
    subcategory: 'insolvency_bankruptcy_rehabilitation',
    title: 'Банкротство и реабилитация',
    procedure: 'civil',
    description: 'Неплатежеспособность, банкротство, реабилитация, реструктуризация долгов.',
    criteria: ['Есть признаки неплатежеспособности', 'Требуется банкротство, реабилитация, реструктуризация или включение в реестр требований'],
    keywords: ['банкрот', 'реабилитац', 'неплатежеспособ', 'несостоятельн', 'реестр требований', 'финансовый управляющий'],
    officialSourceRefs: ['ГПК РК', 'Закон РК О реабилитации и банкротстве'],
  },
  {
    id: 'tax_customs',
    subcategory: 'tax_notification_customs_duties',
    title: 'Налоги и таможня',
    procedure: 'administrative_public_law',
    description: 'Налоговое уведомление, проверка, начисления, таможенные платежи и споры с органами госдоходов.',
    criteria: ['Участвует налоговый, таможенный орган или орган госдоходов', 'Оспариваются начисления, уведомления, проверка, штраф или платеж'],
    keywords: ['налог', 'тамож', 'уведомление', 'камеральн', 'проверка', 'госдоход', 'кгд', 'ндс', 'кпн', 'пошлин'],
    officialSourceRefs: ['АППК РК', 'Налоговый кодекс РК', 'КоАП РК'],
  },
  {
    id: 'ip_copyright',
    subcategory: 'copyright_trademark_patent',
    title: 'Интеллектуальная собственность',
    procedure: 'civil',
    description: 'Авторские права, товарный знак, патент, лицензия, незаконное использование.',
    criteria: ['Предмет - результат интеллектуальной деятельности или средство индивидуализации', 'Требуется защита, запрет использования, компенсация или регистрация'],
    keywords: ['авторск', 'товарный знак', 'бренд', 'патент', 'лицензи', 'интеллектуальн', 'контрафакт', 'плагиат'],
    officialSourceRefs: ['ГПК РК', 'ГК РК', 'Закон РК Об авторском праве и смежных правах'],
  },
  {
    id: 'medical',
    subcategory: 'medical_service_harm',
    title: 'Медицинские споры',
    procedure: 'civil',
    description: 'Качество медицинской помощи, вред здоровью, платные медицинские услуги, врачебная ошибка.',
    criteria: ['Спор связан с медицинской услугой или вредом здоровью при лечении', 'Требуется компенсация, экспертиза, жалоба или исправление меддокументов'],
    keywords: ['врач', 'клиник', 'больниц', 'лечение', 'медицинск', 'диагноз', 'операц', 'вред здоровью', 'медуслуг'],
    officialSourceRefs: ['ГПК РК', 'Кодекс РК О здоровье народа и системе здравоохранения'],
  },
  {
    id: 'administrative_public_law',
    subcategory: 'state_body_act_action_inaction',
    title: 'Спор с госорганом',
    procedure: 'administrative_public_law',
    description: 'Оспаривание административного акта, отказа, действия или бездействия госоргана.',
    criteria: ['Ответчик или адресат требования - госорган, акимат, должностное лицо или организация с публичными полномочиями', 'Оспаривается акт, отказ, действие, бездействие или публичная услуга'],
    keywords: ['госорган', 'акимат', 'министерств', 'отказал', 'бездейств', 'административный акт', 'аппк', 'госуслуг', 'жалоба на орган', 'должностное лицо'],
    negativeKeywords: ['коап', 'протокол об административном правонарушении'],
    officialSourceRefs: ['АППК РК', 'ГПК РК'],
  },
  {
    id: 'administrative_offense',
    subcategory: 'fine_protocol_offense',
    title: 'Административное правонарушение',
    procedure: 'administrative_offense',
    description: 'Штраф, протокол, постановление по делу об административном правонарушении, КоАП.',
    criteria: ['Есть протокол, постановление или штраф по КоАП', 'Требуется обжаловать привлечение к административной ответственности'],
    keywords: ['коап', 'административное правонаруш', 'протокол', 'постановление', 'штраф', 'камера', 'пдд', 'нарушение', 'лишение прав'],
    officialSourceRefs: ['КоАП РК'],
  },
  {
    id: 'criminal',
    subcategory: 'criminal_case_victim_suspect',
    title: 'Уголовное дело',
    procedure: 'criminal',
    description: 'Заявление о преступлении, потерпевший, подозреваемый, следователь, полиция, мера пресечения.',
    criteria: ['Есть признаки преступления или уголовного преследования', 'Участвуют полиция, следователь, прокурор, потерпевший, подозреваемый или обвиняемый'],
    keywords: ['уголовн', 'преступлен', 'полиция', 'следователь', 'прокурор', 'потерпевш', 'подозреваем', 'обвиняем', 'задержал', 'арест', 'ердр'],
    highRisk: true,
    officialSourceRefs: ['УПК РК', 'УК РК'],
  },
  {
    id: 'enforcement',
    subcategory: 'bailiff_enforcement_writ',
    title: 'Исполнительное производство',
    procedure: 'enforcement',
    description: 'Судебный исполнитель, исполнительный лист, арест счетов, взыскание по решению суда.',
    criteria: ['Уже есть исполнительный документ или решение суда', 'Проблема связана с действиями судебного исполнителя, арестом, удержанием или исполнением'],
    keywords: ['судебный исполнитель', 'частный судебный исполнитель', 'чси', 'исполнительный лист', 'исполнительное производство', 'арест счета', 'удержание', 'реестр должников'],
    officialSourceRefs: ['Закон РК Об исполнительном производстве и статусе судебных исполнителей'],
  },
  {
    id: 'migration',
    subcategory: 'residence_citizenship_deportation',
    title: 'Миграционные вопросы',
    procedure: 'administrative_public_law',
    description: 'ВНЖ, гражданство, регистрация иностранца, депортация, разрешение на работу.',
    criteria: ['Вопрос связан с иностранцем, гражданством, ВНЖ или миграционной службой', 'Требуется получить, восстановить или оспорить миграционное решение'],
    keywords: ['внж', 'гражданство', 'миграц', 'иностранец', 'депортац', 'разрешение на работу', 'регистрация иностранца'],
    officialSourceRefs: ['АППК РК', 'Закон РК О миграции населения'],
  },
  {
    id: 'special_proceeding',
    subcategory: 'legal_fact_status',
    title: 'Особое производство',
    procedure: 'special',
    description: 'Установление юридического факта, признание безвестно отсутствующим, ограничение дееспособности и другие дела без классического спора.',
    criteria: ['Нет обычного спора истец-ответчик', 'Нужно установить юридический факт, статус или правовое состояние через суд'],
    keywords: ['установить факт', 'юридический факт', 'безвестно отсутств', 'недееспособн', 'дееспособн', 'усыновлен', 'удочерен'],
    officialSourceRefs: ['ГПК РК'],
  },
  {
    id: 'order_proceeding',
    subcategory: 'court_order_uncontested_claim',
    title: 'Судебный приказ',
    procedure: 'civil',
    description: 'Бесспорное денежное требование, судебный приказ, отмена судебного приказа.',
    criteria: ['Заявлено бесспорное требование или уже вынесен судебный приказ', 'Нужно получить или отменить судебный приказ'],
    keywords: ['судебный приказ', 'отмена судебного приказа', 'приказное производство', 'бесспорн', 'возражение на приказ'],
    officialSourceRefs: ['ГПК РК'],
  },
  {
    id: 'mediation_settlement',
    subcategory: 'mediation_settlement_agreement',
    title: 'Медиация и мировое соглашение',
    procedure: 'civil',
    description: 'Медиация, переговоры, мировое соглашение, примирение сторон.',
    criteria: ['Стороны готовы урегулировать спор без полного судебного разбирательства', 'Требуется подготовить медиативное или мировое соглашение'],
    keywords: ['медиац', 'медиатор', 'мировое соглашение', 'примирен', 'переговор', 'урегулировать'],
    officialSourceRefs: ['ГПК РК', 'Закон РК О медиации'],
  },
  {
    id: 'clarification_required',
    subcategory: 'unknown',
    title: 'Требует уточнения',
    procedure: 'special',
    description: 'Недостаточно признаков для надежного определения категории.',
    criteria: ['Описание слишком короткое, общее или содержит конфликтующие признаки', 'Нужно уточнить стороны, документ, требование и стадию дела'],
    keywords: [],
    officialSourceRefs: ['ГПК РК'],
  },
];

const ROOT_GROUPS: Omit<LegalCategory, 'keywords'>[] = [
  root('family', 'Семейные споры', 'Отбасы даулары', 'Family disputes', 10, 'civil'),
  root('labor', 'Трудовые споры', 'Еңбек даулары', 'Labor disputes', 20, 'civil'),
  root('civil.debt', 'Взыскание задолженности', 'Берешекті өндіру', 'Debt recovery', 30, 'civil'),
  root('civil.contract', 'Договорные споры', 'Шарттық даулар', 'Contract disputes', 40, 'civil'),
  root('consumer', 'Защита прав потребителей', 'Тұтынушы құқығын қорғау', 'Consumer protection', 50, 'civil'),
  root('housing', 'Жилищные споры', 'Тұрғын үй даулары', 'Housing disputes', 60, 'civil'),
  root('inheritance', 'Наследственные споры', 'Мұрагерлік даулар', 'Inheritance disputes', 70, 'civil'),
  root('administrative', 'Административные обращения', 'Әкімшілік өтініштер', 'Administrative matters', 80, 'administrative'),
  root('enforcement', 'Исполнительное производство', 'Атқарушылық іс жүргізу', 'Enforcement proceedings', 90, 'enforcement'),
  root('banking', 'Банковские и финансовые споры', 'Банк және қаржы даулары', 'Banking and finance', 100, 'civil'),
  root('business', 'Предпринимательские споры', 'Кәсіпкерлік даулар', 'Business disputes', 110, 'civil'),
  root('personal_data', 'Персональные данные', 'Дербес деректер', 'Personal data', 120, 'administrative'),
  root('criminal_high_risk', 'Высокорисковые ситуации', 'Жоғары тәуекел жағдайлары', 'High-risk matters', 130, 'criminal_high_risk', true),
  root('clarification_required', 'Требуется уточнение', 'Нақтылау қажет', 'Clarification required', 999, 'manual_review'),
];

const CLARIFICATION_QUESTIONS: Record<string, [string, string, string]> = {
  "child_birth_date": ["Когда родился ребёнок?", "Бала қашан дүниеге келді?", "When was the child born?"],
  "debtor_identity": ["Кто должен выплатить деньги? Укажите имя или название организации.", "Ақшаны кім төлеуі керек? Атын немесе ұйым атауын көрсетіңіз.", "Who owes the money? Give a name or organization."],
  "income_info": ["Что известно о доходах и месте работы плательщика? Если не знаете, так и напишите.", "Төлеушінің табысы мен жұмыс орны туралы не білесіз? Білмесеңіз, соны жазыңыз.", "What do you know about the payer’s income and employer? Say if unknown."],
  "employment_period": ["За какой период не выплачена зарплата?", "Қай кезең үшін жалақы төленбеді?", "For what period were wages unpaid?"],
  "amount": ["Какова сумма требования в тенге? Если сумма пока неизвестна, укажите это.", "Талап сомасы теңгемен қанша? Белгісіз болса, соны көрсетіңіз.", "What is the amount claimed in tenge? Say if unknown."],
  "loan_date": ["Когда передали деньги или заключили договор займа?", "Ақшаны қашан бердіңіз немесе қарыз шартын қашан жасадыңыз?", "When did you lend the money or sign the loan agreement?"],
  "employer": ["Как называется работодатель?", "Жұмыс берушінің атауы қандай?", "What is the employer’s name?"],
  "dismissal_date": ["Когда вас уволили и получили ли вы приказ?", "Сізді қашан жұмыстан шығарды және бұйрықты алдыңыз ба?", "When were you dismissed, and did you receive the order?"],
  "parties": ["Кто участвует в споре и что произошло?", "Даудың тараптары кім және не болды?", "Who is involved in the dispute, and what happened?"],
  "goal": ["Какого результата вы хотите добиться?", "Қандай нәтижеге қол жеткізгіңіз келеді?", "What outcome do you want?"],
  "documents": ["Какие подтверждающие документы у вас есть? Можно ответить, что документов нет.", "Қандай растайтын құжаттарыңыз бар? Құжаттар жоқ болса, соны жазыңыз.", "What supporting documents do you have? Say if none."],
  "children": ["Есть ли общие несовершеннолетние дети?", "Ортақ кәмелетке толмаған балаларыңыз бар ма?", "Do you have minor children together?"],
  "marriage_date": ["Когда заключён брак?", "Неке қашан қиылды?", "When did you marry?"],
  "marriage_status": ["Вы сейчас в браке или брак расторгнут?", "Қазір некедесіз бе, әлде неке бұзылды ма?", "Are you currently married or divorced?"],
  "need_basis": ["На каких обстоятельствах основано требование о содержании?", "Асырау талабы қандай жағдайларға негізделген?", "What circumstances support the maintenance request?"],
  "basis": ["На каком основании возник долг: заём, договор или другое?", "Қарыздың негізі қандай: қарыз, шарт немесе басқа ма?", "What is the basis of the debt: loan, contract or something else?"],
  "immediate_safety": ["Вы сейчас в безопасности? При непосредственной опасности обратитесь в экстренные службы.", "Қазір қауіпсіз жердесіз бе? Тікелей қауіп болса, шұғыл қызметке хабарласыңыз.", "Are you safe now? Contact emergency services if in immediate danger."],
  "police_report": ["Обращались ли вы в полицию? Когда и что ответили?", "Полицияға жүгіндіңіз бе? Қашан және қандай жауап болды?", "Have you contacted police? When and what was the response?"],
  "education_document": ["Какой документ подтверждает обучение?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "property_list": ["Какое имущество требуется разделить?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "child_age": ["Сколько лет ребёнку?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "dispute_details": ["В чём состоит спор?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "family_relation": ["Какие семейные отношения связывают стороны?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "injury_date": ["Когда произошла травма?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "medical_docs": ["Какие медицинские документы имеются?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "order_date": ["Когда издан приказ?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "contract_date": ["Когда заключён договор?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "transfer_date": ["Когда перечислены деньги?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "contract_or_receipt": ["Есть ли договор, расписка или переписка с подрядчиком?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "paid_amount": ["Сколько тенге вы заплатили?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "service_terms": ["Какие услуги и сроки были согласованы?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "purchase_date": ["Когда куплен товар?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "receipt": ["Есть ли чек или другое подтверждение покупки?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "service_date": ["Когда оказана услуга?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "payment_proof": ["Как подтверждается оплата?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "warranty_card": ["Есть ли гарантийный талон и какой срок гарантии?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "seller": ["Кто продавец или исполнитель?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "housing_basis": ["На каком основании вы проживаете в жилье?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "notice_date": ["Когда получено уведомление?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "death_date": ["Когда умер наследодатель?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "reason_for_delay": ["Почему пропущен срок?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "application_date": ["Когда подано обращение?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "state_body": ["В какой государственный орган вы обращались?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "fine_date": ["Когда вынесено постановление о штрафе?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "application_number": ["Какой номер обращения?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "enforcement_case_number": ["Какой номер исполнительного производства?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "seizure_date": ["Когда наложен арест?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "collector_name": ["Как называется коллекторская организация?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "publication_source": ["Где опубликованы ваши персональные данные?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "detention_time": ["Когда произошло задержание?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "location": ["Где это произошло?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "case_stage": ["На какой стадии находится дело?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "incident_date": ["Когда произошло событие?", "Осы жағдай туралы толығырақ жазыңыз.", "Please describe this circumstance in more detail."],
  "acquisition_date": ["Когда приобретено имущество?", "Мүлік қашан сатып алынды?", "When was the property acquired?"],
  "alleged_parent": ["Кто предполагаемый родитель?", "Болжамды ата-ана кім?", "Who is the alleged parent?"],
  "child_data": ["Укажите возраст ребёнка и его связь со сторонами спора.", "Баланың жасын және дау тараптарымен байланысын көрсетіңіз.", "Give the child’s age and relationship to the parties."],
  "current_contact": ["Как сейчас организовано общение с ребёнком?", "Қазір баламен қарым-қатынас қалай ұйымдастырылған?", "How is contact with the child currently arranged?"],
  "current_residence": ["С кем и где сейчас проживает ребёнок?", "Бала қазір кіммен және қайда тұрады?", "Who does the child live with, and where?"],
  "risk_to_child": ["Есть ли риск для безопасности ребёнка?", "Баланың қауіпсіздігіне қауіп бар ма?", "Is there a risk to the child’s safety?"],
};

export function clarificationQuestion(field: string, language: 'ru' | 'kk' | 'en' = 'ru') {
  const index = language === 'kk' ? 1 : language === 'en' ? 2 : 0;
  return CLARIFICATION_QUESTIONS[field]?.[index] ?? ['Опишите это обстоятельство подробнее.', 'Осы жағдайды толығырақ сипаттаңыз.', 'Describe this circumstance in more detail.'][index];
}

export const LEGAL_CATEGORIES: LegalCategory[] = [
  ...ROOT_GROUPS.map((item) => ({ ...item, keywords: [] })),
  cat('family.alimony.child', 'family', 'Взыскание алиментов на ребёнка', 'Балаға алимент өндіру', 'Child support', ['алимент', 'ребенок', 'ребёнок', 'дети', 'бала', 'балама', 'асырау'], ['child_birth_date', 'debtor_identity', 'income_info'], 11),
  cat('family.alimony.spouse', 'family', 'Содержание супруга', 'Жұбайын асырау', 'Spousal support', ['содержание супруг', 'бывш', 'жұбай', 'супруг', 'супруга'], ['marriage_status', 'need_basis'], 12),
  cat('family.alimony.adult_student', 'family', 'Алименты совершеннолетнему учащемуся', 'Кәмелетке толған студентке алимент', 'Adult student support', ['совершеннолетн', 'студент', 'учится', 'оқиды'], ['education_document'], 13),
  cat('family.divorce', 'family', 'Расторжение брака', 'Некені бұзу', 'Divorce', ['развестись', 'развод', 'расторжение брака', 'ажырас'], ['marriage_date', 'children'], 14),
  cat('family.property_division', 'family', 'Раздел имущества супругов', 'Ерлі-зайыптылар мүлкін бөлу', 'Marital property division', ['разделить квартир', 'раздел имущества', 'после развода', 'ортақ мүлік'], ['property_list', 'acquisition_date'], 15),
  cat('family.paternity', 'family', 'Установление отцовства', 'Әкелікті анықтау', 'Paternity', ['отцовств', 'әкелік'], ['child_data', 'alleged_parent'], 16),
  cat('family.child_residence', 'family', 'Место жительства ребёнка', 'Баланың тұрғылықты жері', 'Child residence', ['место жительства ребенка', 'с кем будет жить ребенок'], ['child_age', 'current_residence'], 17),
  cat('family.child_communication', 'family', 'Порядок общения с ребёнком', 'Баламен араласу тәртібі', 'Child contact', ['общение с ребенком', 'видеться с ребенком'], ['current_contact'], 18),
  cat('family.parental_rights', 'family', 'Родительские права', 'Ата-ана құқықтары', 'Parental rights', ['лишить родительских', 'ограничить родительские'], ['risk_to_child'], 19, true),
  cat('family.other', 'family', 'Иной семейный спор', 'Өзге отбасылық дау', 'Other family dispute', ['семейн', 'брак'], ['family_relation'], 20),
  cat('labor.dismissal_reinstatement', 'labor', 'Незаконное увольнение', 'Заңсыз жұмыстан шығару', 'Wrongful dismissal', ['незаконно увол', 'уволили', 'восстановить на работе', 'жұмыстан шығар'], ['dismissal_date', 'employer'], 21),
  cat('labor.wage_arrears', 'labor', 'Невыплата зарплаты', 'Жалақы төлемеу', 'Wage arrears', ['не выплатил зарплат', 'зарплата', 'жалақы', 'айлық төлемеді'], ['employment_period', 'amount'], 22),
  cat('labor.leave_compensation', 'labor', 'Компенсация отпуска', 'Демалыс өтемақысы', 'Leave compensation', ['отпуск', 'компенсация за отпуск'], ['employment_period'], 23),
  cat('labor.workplace_injury', 'labor', 'Травма на работе', 'Өндірістік жарақат', 'Workplace injury', ['травма на работе', 'несчастный случай'], ['injury_date', 'medical_docs'], 24, true),
  cat('labor.disciplinary_action', 'labor', 'Дисциплинарное взыскание', 'Тәртіптік жаза', 'Disciplinary action', ['выговор', 'дисциплинар'], ['order_date'], 25),
  cat('labor.other', 'labor', 'Иной трудовой спор', 'Өзге еңбек дауы', 'Other labor dispute', ['работодатель', 'работник', 'еңбек'], ['employer'], 26),
  cat('civil.debt.loan', 'civil.debt', 'Долг по расписке или займу', 'Қарызхат немесе қарыз бойынша берешек', 'Loan debt', ['расписк', 'займ', 'қарыз', 'не возвращает деньги'], ['loan_date', 'amount', 'debtor_identity'], 31),
  cat('civil.debt.contract', 'civil.debt', 'Долг по договору', 'Шарт бойынша берешек', 'Contract debt', ['долг по договор', 'задолженность по договор'], ['contract_date', 'amount'], 32),
  cat('civil.debt.unjust_enrichment', 'civil.debt', 'Неосновательное обогащение', 'Негізсіз баю', 'Unjust enrichment', ['ошибочно перевел', 'неосновательное'], ['transfer_date', 'amount'], 33),
  cat('civil.debt.other', 'civil.debt', 'Иная задолженность', 'Өзге берешек', 'Other debt', ['должны деньги', 'мне должны деньги', 'берешек'], ['basis', 'amount', 'debtor_identity'], 34),
  cat('civil.contract.work', 'civil.contract', 'Подряд и ремонт', 'Мердігерлік және жөндеу', 'Work contract', ['подрядчик', 'ремонт', 'не выполнил ремонт', 'работы'], ['contract_or_receipt', 'paid_amount'], 43),
  cat('civil.contract.services', 'civil.contract', 'Услуги', 'Қызметтер', 'Services', ['услуг', 'исполнитель'], ['service_terms'], 42),
  cat('consumer.goods', 'consumer', 'Бракованный товар', 'Ақаулы тауар', 'Defective goods', ['бракованный товар', 'магазин', 'товар', 'не принимает', 'ақаулы'], ['purchase_date', 'receipt'], 51),
  cat('consumer.services', 'consumer', 'Некачественная услуга', 'Сапасыз қызмет', 'Poor service', ['некачественная услуга', 'услуга плохо'], ['service_date'], 52),
  cat('consumer.refund', 'consumer', 'Возврат денег', 'Ақшаны қайтару', 'Refund', ['возврат денег', 'вернуть деньги'], ['payment_proof'], 53),
  cat('consumer.warranty', 'consumer', 'Гарантия', 'Кепілдік', 'Warranty', ['гарант'], ['warranty_card'], 54),
  cat('consumer.other', 'consumer', 'Иной потребительский спор', 'Өзге тұтынушылық дау', 'Other consumer matter', ['потребител'], ['seller'], 55),
  cat('housing.eviction', 'housing', 'Выселение', 'Үйден шығару', 'Eviction', ['выселяют', 'выселен', 'шығарып жатыр'], ['housing_basis', 'notice_date'], 61, true),
  cat('inheritance.acceptance_deadline', 'inheritance', 'Восстановление срока наследства', 'Мұраны қабылдау мерзімін қалпына келтіру', 'Inheritance deadline', ['пропустил срок принятия наследства', 'срок наследства'], ['death_date', 'reason_for_delay'], 71),
  cat('administrative.state_body_inaction', 'administrative', 'Бездействие госоргана', 'Меморган әрекетсіздігі', 'State body inaction', ['госорган не отвечает', 'бездейств', 'өтінішке жауап жоқ'], ['application_date', 'state_body'], 82),
  cat('administrative.fine', 'administrative', 'Административный штраф', 'Әкімшілік айыппұл', 'Administrative fine', ['штраф', 'коап', 'постановление'], ['fine_date'], 83),
  cat('administrative.e_otinish', 'administrative', 'e-Otinish обращение', 'e-Otinish өтініші', 'e-Otinish', ['е-өтініш', 'e-otinish', 'еотиниш'], ['application_number'], 84),
  cat('enforcement.bailiff_inaction', 'enforcement', 'Бездействие ЧСИ', 'ЖСО әрекетсіздігі', 'Bailiff inaction', ['чси не предпринимает', 'частный судебный исполнитель', 'судебный исполнитель'], ['enforcement_case_number'], 91),
  cat('enforcement.seizure', 'enforcement', 'Арест имущества или счета', 'Мүлікке немесе шотқа тыйым', 'Seizure', ['арест счета', 'арест имущества'], ['seizure_date'], 92),
  cat('banking.microfinance', 'banking', 'Спор с МФО', 'МҚҰ дауы', 'MFI dispute', ['мфо', 'микрофинанс', 'микрозайм', 'огромную задолженность'], ['loan_date', 'amount'], 102),
  cat('banking.collection', 'banking', 'Коллекторы', 'Коллекторлар', 'Collections', ['коллектор'], ['collector_name'], 103, true),
  cat('personal_data.disclosure', 'personal_data', 'Раскрытие персональных данных', 'Дербес деректерді жариялау', 'Personal data disclosure', ['персональные данные опубликовали', 'без согласия', 'деректерімді жариялады'], ['publication_source'], 122, true),
  cat('criminal_high_risk.detention', 'criminal_high_risk', 'Задержание', 'Ұстау', 'Detention', ['меня задержали', 'задержали', 'ұстады'], ['detention_time', 'location'], 131, true),
  cat('criminal_high_risk.suspect_accused', 'criminal_high_risk', 'Подозреваемый или обвиняемый', 'Күдікті немесе айыпталушы', 'Suspect or accused', ['подозреваем', 'обвиняем'], ['case_stage'], 132, true),
  cat('criminal_high_risk.victim', 'criminal_high_risk', 'Потерпевший', 'Жәбірленуші', 'Victim', ['потерпевш', 'жәбірленуші'], ['incident_date'], 133, true),
  cat('criminal_high_risk.fraud', 'criminal_high_risk', 'Мошенничество', 'Алаяқтық', 'Fraud', ['мошеннич', 'алаяқ'], ['incident_date', 'amount'], 134, true),
  cat('criminal_high_risk.domestic_violence', 'criminal_high_risk', 'Домашнее насилие', 'Тұрмыстық зорлық-зомбылық', 'Domestic violence', ['муж угрожает', 'избивает', 'домашнее насилие', 'ұрады', 'қорқытады'], ['immediate_safety', 'police_report'], 135, true),
  cat('clarification_required.other', 'clarification_required', 'Нужны уточнения', 'Нақтылау керек', 'Needs clarification', ['непонятно'], ['parties', 'goal', 'documents'], 1000),
];

export function classifyByTaxonomy(text: string): CaseClassification {
  const normalized = normalizeForClassification(text);
  const scores = CASE_TAXONOMY.filter((item) => item.id !== 'clarification_required')
    .map((item) => ({ item, score: scoreTaxonomyItem(normalized, item) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scores[0];
  const second = scores[1];
  if (!best || best.score < 2 || (second && best.score - second.score < 0.65)) {
    return { category: 'clarification_required', subcategory: 'unknown', confidence: 0.44 };
  }

  return {
    category: best.item.id,
    subcategory: best.item.subcategory,
    confidence: Number(Math.min(0.97, 0.54 + best.score / 16).toFixed(2)),
  };
}

export function classifyStructuredDispute(text: string): StructuredClassification {
  const normalized = normalizeForClassification(text);
  const language = detectLanguage(text);
  const candidates = LEGAL_CATEGORIES.filter((item) => item.active && item.parentId && item.code !== 'clarification_required.other')
    .map((item) => ({ item, score: scoreLegalCategory(normalized, item) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const second = candidates[1];
  const hasWeakSignal = !best || best.score < 1 || Boolean(second && best.score - second.score < 0.2);
  const item = hasWeakSignal ? LEGAL_CATEGORIES.find((category) => category.code === 'clarification_required.other')! : best.item;
  const parent = LEGAL_CATEGORIES.find((category) => category.code === item.parentId) ?? item;
  const facts = extractClassificationFacts(normalized);
  const riskFlags = detectRiskFlags(normalized, item);
  const confidence = hasWeakSignal ? 0.52 : Number(Math.min(0.96, 0.58 + (best.score / 10)).toFixed(2));
  const severeRisk = riskFlags.some((flag) => flag !== 'minor_involved');
  const urgency = severeRisk || /сегодня|срочно|завтра|задержал|избивает|выселяют/.test(normalized) ? 'high' : 'normal';
  const riskLevel = item.highRisk || severeRisk ? 'high' : confidence < 0.75 || riskFlags.includes('minor_involved') ? 'medium' : 'low';
  const complexity = item.highRisk || confidence < 0.65 ? 'high' : confidence < 0.85 ? 'medium' : 'low';
  const missing = item.requiredFactSchema.fields as string[];

  return {
    language,
    jurisdiction: 'KZ',
    complexity,
    risk_level: riskLevel,
    urgency,
    category_code: parent.code,
    subcategory_code: item.code,
    category_label: parent.nameRu,
    subcategory_label: item.nameRu,
    confidence,
    reasons: makeReasons(item, facts, hasWeakSignal),
    alternatives: candidates
      .filter((candidate) => candidate.item.code !== item.code)
      .slice(0, Number(process.env.CATEGORY_MAX_ALTERNATIVES ?? 3))
      .map((candidate) => ({
        code: candidate.item.code,
        confidence: Number(Math.min(0.88, 0.45 + candidate.score / 10).toFixed(2)),
        reason: 'secondary_candidate_from_allowed_kz_tree',
      })),
    facts,
    missing_facts: missing,
    clarification_questions: item.clarificationQuestionTemplates.filter((question) => missing.includes(question.id)),
    risk_flags: riskFlags,
    required_human_review: item.highRisk || item.defaultLegalRoute === 'criminal_high_risk',
  };
}

export function getLegalCategory(code: string) {
  return LEGAL_CATEGORIES.find((item) => item.code === code && item.active);
}

export function validateStructuredClassification(result: StructuredClassification) {
  if (result.jurisdiction !== 'KZ') throw new Error('INVALID_JURISDICTION');
  if (result.confidence < 0 || result.confidence > 1) throw new Error('INVALID_CONFIDENCE');
  if (!getLegalCategory(result.category_code)) throw new Error('UNKNOWN_CATEGORY_CODE');
  if (!getLegalCategory(result.subcategory_code)) throw new Error('UNKNOWN_SUBCATEGORY_CODE');
  if (result.alternatives.some((item) => item.code === result.subcategory_code)) throw new Error('DUPLICATE_ALTERNATIVE');
  const serialized = JSON.stringify(result).toLowerCase();
  if (/\bрф\b|российск|рубл|инн|огрн/.test(serialized)) throw new Error('FORBIDDEN_FOREIGN_LEGAL_REFERENCE');
  return result;
}

function scoreTaxonomyItem(text: string, item: CaseTaxonomyItem) {
  let score = 0;
  for (const keyword of item.keywords) {
    const normalizedKeyword = normalizeForClassification(keyword);
    if (!normalizedKeyword) continue;
    if (text.includes(normalizedKeyword)) {
      score += normalizedKeyword.includes(' ') ? 2.4 : 1;
    }
  }
  for (const keyword of item.negativeKeywords ?? []) {
    if (text.includes(normalizeForClassification(keyword))) score -= 2;
  }
  if (item.highRisk && score > 0) score += 0.8;
  return score;
}

function scoreLegalCategory(text: string, item: LegalCategory) {
  let score = 0;
  for (const keyword of item.keywords) {
    const normalizedKeyword = normalizeForClassification(keyword);
    if (normalizedKeyword && text.includes(normalizedKeyword)) score += normalizedKeyword.includes(' ') ? 2.2 : 1;
  }
  if (item.code === 'family.alimony.child' && /ребен|ребён|бала/.test(text) && /алимент|асырау/.test(text)) score += 2;
  if (item.code === 'civil.debt.other' && /^мне должны деньги$|должны деньги/.test(text)) score += 1.2;
  if (item.highRisk && score > 0) score += 1;
  return score;
}

function detectLanguage(text: string): 'ru' | 'kk' | 'en' {
  const lower = text.toLowerCase();
  if (/[әғқңөұүһі]/.test(lower) || /\b(жалақы|бала|қарыз|өтініш|жұмыстан)\b/.test(lower)) return 'kk';
  if (/\b(the|and|court|debt|worker)\b/.test(lower)) return 'en';
  return 'ru';
}

function extractClassificationFacts(text: string) {
  return {
    minor_child: /ребен|ребён|дети|бала/.test(text),
    money_claim: /деньг|долг|задолж|зарплат|жалақы|алимент|мфо|қарыз/.test(text),
    state_body: /госорган|акимат|өтініш|меморган/.test(text),
    violence_or_detention: /задержал|избивает|угрожает|ұстады|ұрады|қорқытады/.test(text),
    document_goal: /иск|заявлен|жалоб|претенз|өтініш/.test(text) ? 'legal_document' : 'consultation',
  };
}

function detectRiskFlags(text: string, item: LegalCategory) {
  const flags: string[] = [];
  if (/задержал|ұстады/.test(text)) flags.push('detention_or_criminal_process');
  if (/избивает|угрожает|ұрады|қорқытады/.test(text)) flags.push('violence_or_immediate_safety');
  if (/выселяют|выселен/.test(text)) flags.push('housing_loss_risk');
  if (/ребен|ребён|бала/.test(text)) flags.push('minor_involved');
  if (item.highRisk && !flags.includes('high_risk_category')) flags.push('high_risk_category');
  return flags;
}

function makeReasons(item: LegalCategory, facts: Record<string, unknown>, weak: boolean) {
  if (weak) return ['insufficient_or_ambiguous_facts', 'manual_or_clarification_required'];
  const reasons = ['matched_allowed_kazakhstan_category_tree'];
  if (facts.money_claim) reasons.push('money_or_support_claim_detected');
  if (facts.minor_child) reasons.push('minor_child_detected');
  if (facts.state_body) reasons.push('state_body_signal_detected');
  if (facts.violence_or_detention) reasons.push('high_risk_signal_detected');
  return reasons;
}

function root(
  code: string,
  nameRu: string,
  nameKk: string,
  nameEn: string,
  sortOrder: number,
  defaultLegalRoute: LegalCategory['defaultLegalRoute'],
  highRisk = false,
): Omit<LegalCategory, 'keywords'> {
  return {
    id: code,
    code,
    nameRu,
    nameKk,
    nameEn,
    descriptionRu: nameRu,
    descriptionKk: nameKk,
    descriptionEn: nameEn,
    active: true,
    highRisk,
    sortOrder,
    requiredFactSchema: { fields: [] },
    requiredDocumentRules: { documents: [] },
    clarificationQuestionTemplates: [],
    defaultLegalRoute,
    version: 1,
  };
}

function cat(
  code: string,
  parentId: string,
  nameRu: string,
  nameKk: string,
  nameEn: string,
  keywords: string[],
  fields: string[],
  sortOrder: number,
  highRisk = false,
): LegalCategory {
  const route = parentId === 'criminal_high_risk' ? 'criminal_high_risk' : parentId === 'administrative' || parentId === 'personal_data' ? 'administrative' : parentId === 'enforcement' ? 'enforcement' : parentId === 'clarification_required' ? 'manual_review' : 'civil';
  return {
    id: code,
    code,
    parentId,
    nameRu,
    nameKk,
    nameEn,
    descriptionRu: nameRu,
    descriptionKk: nameKk,
    descriptionEn: nameEn,
    active: true,
    highRisk,
    sortOrder,
    requiredFactSchema: { fields },
    requiredDocumentRules: { documents: [] },
    clarificationQuestionTemplates: fields.map((field) => ({
      id: field,
      type: field.includes('date') ? 'date' : field.includes('amount') ? 'money' : 'text',
      questionRu: clarificationQuestion(field, 'ru'),
      questionKk: clarificationQuestion(field, 'kk'),
      questionEn: clarificationQuestion(field, 'en'),
    })),
    defaultLegalRoute: route,
    version: 1,
    keywords,
  };
}

function normalizeForClassification(text: string) {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
