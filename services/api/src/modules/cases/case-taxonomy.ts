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

function normalizeForClassification(text: string) {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
