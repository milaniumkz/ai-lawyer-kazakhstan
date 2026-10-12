const baseUrl = process.env.WEB_BASE_URL;

if (!baseUrl) {
  console.log("web responsive runtime skipped: WEB_BASE_URL is not set");
  process.exit(0);
}

const viewports = [
  { name: "mobile-360", width: 360, height: 780 },
  { name: "iphone-small", width: 320, height: 568 },
  { name: "mobile", width: 390, height: 844 },
  { name: "mobile-large", width: 430, height: 932 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1024, height: 900 },
  { name: "desktop-wide", width: 1440, height: 900 },
  { name: "desktop-full-hd", width: 1920, height: 1080 },
];

const screens = [
  "onboarding",
  "login",
  "register",
  "otp",
  "biometric",
  "home",
  "newCase",
  "category",
  "documentCheck",
  "documentUpload",
  "analysis",
  "claim",
  "claimDraft",
  "claimSend",
  "cases",
  "case",
  "chat",
  "deadlines",
  "legal",
  "legalSearch",
  "documents",
  "profile",
  "settings",
  "subscription",
  "help",
];

const publicViews = new Set(["onboarding", "login", "otp", "register", "biometric"]);

function seededState(view) {
  const isPublic = publicViews.has(view);
  return {
    theme: "dark",
    view,
    language: "RU",
    authUserId: isPublic ? "" : "00000000-0000-4000-8000-000000000001",
    profileComplete: !isPublic,
    firstName: isPublic ? "" : "Тест",
    lastName: isPublic ? "" : "Пользователь",
    city: isPublic ? "" : "Алматы",
    profileName: isPublic ? "" : "Тест Пользователь",
    phone: view === "otp" ? "+7 707 123 45 67" : "",
    otp: view === "otp" ? "481259" : "",
    otpId: view === "otp" ? "00000000-0000-4000-8000-000000000004" : "",
    otpHint: view === "otp" ? "Тестовый код: 481259" : "",
    cases: isPublic
      ? []
      : [
          {
            id: "case-ref",
            title: "Тестовое дело",
            type: "Гражданское право",
            status: "В работе",
            date: "30.09.2026",
            progress: 42,
          },
        ],
    activeCaseId: isPublic ? "" : "case-ref",
    remoteCaseId: isPublic ? "" : "00000000-0000-4000-8000-000000000017",
    remoteCaseDraftId: "draft-initial",
    draftCaseId: "draft-initial",
    caseText:
      view === "newCase" || view === "category"
        ? "Заказчик не оплачивает по договору"
        : "",
    selectedCategory: "Договоры и долги",
    classification:
      view === "category"
        ? {
            id: "00000000-0000-4000-8000-000000000008",
            result: {
              category_code: "contract",
              subcategory_code: "contract.debt",
              category_label: "Договоры и долги",
              subcategory_label: "Взыскание долга",
              confidence: 0.86,
              reasons: ["Описание содержит договор и неоплату."],
              alternatives: [],
              missing_facts: [],
              clarification_questions: [],
              risk_level: "medium",
              risk_flags: [],
              required_human_review: false,
            },
            userConfirmed: false,
          }
        : null,
    messages: isPublic
      ? []
      : [
          { role: "assistant", text: "Опишите ситуацию. Я помогу пройти этапы." },
          { role: "user", text: "Заказчик не оплачивает по договору." },
        ],
  };
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("web responsive runtime skipped: playwright is not installed");
    return;
  }

  const browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: ["--no-sandbox"]} : {});
  try {
    for (const viewport of viewports) {
      for (const view of screens) {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.width <= 430,
        });
        await page.addInitScript(
          ({ state }) => {
            window.localStorage.clear();
            window.localStorage.setItem("ai-lawyer-web-state", JSON.stringify(state));
          },
          { state: seededState(view) },
        );
        // Layout fixtures run offline. Functional/API checks use separate real sessions.
        await page.route('**/api/v1/**', route => route.abort('failed'));
        await page.goto(`${baseUrl.replace(/\/$/, "")}#${view}`, {
          waitUntil: "domcontentloaded",
        });
        await page.locator(".appShell").waitFor({ state: "visible", timeout: 10000 });
        await page.waitForTimeout(150);
        const result = await page.evaluate(() => {
          const app = document.querySelector(".appShell")?.getBoundingClientRect();
          const device = document.querySelector(".deviceFrame")?.getBoundingClientRect();
          const panel = document.querySelector(".contentPanel")?.getBoundingClientRect();
          const bottomNav = document.querySelector(".bottomNav");
          return {
            design: document.querySelector(".appShell")?.getAttribute("data-design"),
            view: document.querySelector(".appShell")?.getAttribute("data-view"),
            bodyScrollWidth: document.body.scrollWidth,
            docScrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            appWidth: app?.width ?? 0,
            deviceWidth: device?.width ?? 0,
            panelWidth: panel?.width ?? 0,
            bottomNavDisplay: bottomNav ? getComputedStyle(bottomNav).display : "missing",
            brokenButtons: Array.from(document.querySelectorAll('.appShell button')).filter(button => {
              const style = getComputedStyle(button);
              const bounds = button.getBoundingClientRect();
              return bounds.width > 0 && bounds.height > 0 && style.visibility !== 'hidden' &&
                Number(style.opacity) > 0 &&
                (style.backgroundColor === 'rgb(239, 239, 239)' || button.scrollWidth > button.clientWidth + 5);
            }).map(button => button.textContent?.trim().slice(0, 80)),
          };
        });
        const maxScroll = Math.max(result.bodyScrollWidth, result.docScrollWidth);
        if (result.view !== view) fail(`${viewport.name}/${view}: rendered ${result.view} instead of the requested screen`);
        if (maxScroll > viewport.width + 2) {
          fail(`${viewport.name}/${view}: horizontal overflow ${maxScroll}px > ${viewport.width}px`);
        }
        if (result.brokenButtons.length) {
          fail(`${viewport.name}/${view}: unreadable or overflowing controls: ${result.brokenButtons.join(', ')}`);
        }
        if (viewport.width <= 980 && result.deviceWidth < (result.design === "aizan" ? Math.min(viewport.width, 480) : viewport.width) - 2) {
          fail(`${viewport.name}/${view}: device width ${result.deviceWidth}px < viewport ${viewport.width}px`);
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (process.exitCode) process.exit(process.exitCode);
  console.log(`web responsive runtime ok: ${screens.length} screens x ${viewports.length} viewports`);
}

await main();
