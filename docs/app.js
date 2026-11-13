const main = document.querySelector("#main");
const nav = document.querySelector("#lessonNav");
const completedKey = "carnet-python-completed";
const checkedKey = "carnet-python-checklists";

let pages = [];
let homePage = null;
let lessons = [];
let currentPage = null;

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const completed = new Set(readStorage(completedKey, []));
const checkedItems = readStorage(checkedKey, {});

function makeElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeButton(label, className, onClick) {
  const button = makeElement("button", className, label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function navigateTo(path) {
  const match = path.match(/\/lecons\/([^/]+)/);
  location.hash = match ? "/lecons/" + match[1] : "/";
}

function updateProgress() {
  const percent = lessons.length ? Math.round(completed.size / lessons.length * 100) : 0;
  document.querySelector("#progressText").textContent = percent + " %";
  document.querySelector("#progressFill").style.width = percent + "%";
  document.querySelector("#headerProgress").textContent = completed.size + " / " + lessons.length + " étapes";
  nav.replaceChildren();

  lessons.forEach((lesson, index) => {
    const button = makeElement("button", "nav-lesson");
    button.type = "button";
    if (currentPage && currentPage.id === lesson.id) button.classList.add("active");
    button.append(
      makeElement("span", "nav-number", String(index + 1).padStart(2, "0")),
      makeElement("span", "nav-title", lesson.title),
      makeElement("span", "nav-check", completed.has(lesson.id) ? "✓" : "")
    );
    button.addEventListener("click", () => navigateTo("/lecons/" + lesson.slug));
    nav.append(button);
  });
}

function renderParagraph(block, parent) {
  parent.append(makeElement("p", "", block.text || ""));
}

function renderList(block, parent) {
  if (block.title) parent.append(makeElement("h3", "list-title", block.title));
  const list = makeElement("ul", "content-list");
  (block.items || []).forEach(item => {
    const row = makeElement("li");
    if (typeof item === "string") row.textContent = item;
    else {
      row.append(makeElement("strong", "", item.term || ""));
      row.append(document.createTextNode(" : " + (item.definition || "")));
    }
    list.append(row);
  });
  parent.append(list);
}

function renderChecklist(block, parent, page) {
  const card = makeElement("section", "checklist-card");
  card.append(makeElement("h2", "", block.title || "À faire"));
  const list = makeElement("div", "checklist-items");
  const storageKey = page.id + ":" + (block.id || block.title || "checklist");

  (block.items || []).forEach(item => {
    const label = makeElement("label", "checklist-item");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checkedItems[storageKey]?.includes(item.id) ?? Boolean(item.checked);
    const text = makeElement("span", "", item.text || "");
    input.addEventListener("change", () => {
      const selected = new Set(checkedItems[storageKey] || []);
      input.checked ? selected.add(item.id) : selected.delete(item.id);
      checkedItems[storageKey] = [...selected];
      localStorage.setItem(checkedKey, JSON.stringify(checkedItems));
    });
    label.append(input, text);
    list.append(label);
  });
  card.append(list);
  parent.append(card);
}

function renderQuestions(block, parent) {
  const card = makeElement("section", "questions-card");
  card.append(makeElement("h2", "", block.title || "Questions"));
  const list = makeElement("ol", "question-list");
  (block.items || []).forEach(question => list.append(makeElement("li", "", question)));
  card.append(list);
  parent.append(card);
}

function renderCode(block, parent) {
  const figure = makeElement("figure", "code-example");
  if (block.language) figure.append(makeElement("figcaption", "", block.language));
  const pre = makeElement("pre");
  pre.append(makeElement("code", "", block.code || ""));
  figure.append(pre);
  parent.append(figure);
}

function renderCallout(block, parent, page) {
  const aside = makeElement("aside", "callout " + (block.variant || "note"));
  if (block.title) aside.append(makeElement("h2", "", block.title));
  renderBlocks(block.children || [], aside, page);
  parent.append(aside);
}

function renderSection(block, parent, page) {
  const hasCards = (block.children || []).some(child => child.type === "lessonCard");
  const section = makeElement("section", hasCards ? "lesson-list-section" : "content-section");
  if (block.title) section.append(makeElement("h2", "", block.title));
  if (hasCards) {
    const grid = makeElement("div", "lesson-grid");
    renderBlocks(block.children, grid, page);
    section.append(grid);
  } else renderBlocks(block.children || [], section, page);
  parent.append(section);
}

function renderLessonCard(block, parent) {
  const card = makeElement("button", "lesson-card");
  card.type = "button";
  card.addEventListener("click", () => navigateTo(block.href || "/lecons/" + block.slug));
  const top = makeElement("span", "card-top");
  top.append(
    makeElement("span", "card-number", "ÉTAPE " + String(block.order || "").padStart(2, "0")),
    makeElement("span", "card-state", completed.has(block.lessonId) ? "Terminée" : "À découvrir")
  );
  card.append(top, makeElement("h3", "", block.title || "Leçon"));
  card.append(makeElement("p", "", block.description || block.text || ""));
  card.append(makeElement("span", "card-arrow", "↗"));
  parent.append(card);
}

function renderHero(block, parent) {
  const hero = makeElement("section", "hero");
  const copy = makeElement("div", "hero-copy");
  copy.append(makeElement("p", "eyebrow", block.eyebrow || ""));
  copy.append(makeElement("h1", "", block.title || ""));
  copy.append(makeElement("p", "hero-text", block.text || ""));
  const action = block.primaryAction || {};
  copy.append(makeButton((action.label || "Commencer") + "  →", "primary-btn", () => {
    if (action.href) navigateTo(action.href);
    else if (lessons[0]) navigateTo("/lecons/" + lessons[0].slug);
  }));

  const stamp = makeElement("div", "hero-stamp");
  const stampText = makeElement("div", "stamp-inner");
  stampText.append(document.createTextNode("Apprendre"));
  stampText.append(document.createElement("br"));
  stampText.append(document.createTextNode("en construisant"));
  stampText.append(makeElement("small", "", "Python · parcours"));
  stamp.append(stampText);
  hero.append(copy, stamp);
  parent.append(hero);
}

function renderBlock(block, parent, page) {
  switch (block.type) {
    case "hero": return renderHero(block, parent);
    case "section": return renderSection(block, parent, page);
    case "callout": return renderCallout(block, parent, page);
    case "paragraph": return renderParagraph(block, parent);
    case "list": return renderList(block, parent);
    case "code": return renderCode(block, parent);
    case "lessonCard": return renderLessonCard(block, parent);
    case "checklist": return renderChecklist(block, parent, page);
    case "questions": return renderQuestions(block, parent);
    default: console.warn("Type de bloc non reconnu :", block.type);
  }
}

function renderBlocks(blocks, parent, page) {
  (blocks || []).forEach(block => renderBlock(block, parent, page));
}

function renderHome() {
  currentPage = homePage;
  updateProgress();
  main.replaceChildren();
  main.append(makeElement("div", "breadcrumb", "Accueil  /  " + (homePage.course || "Parcours")));
  renderBlocks(homePage.blocks, main, homePage);

  const note = makeElement("div", "home-note");
  note.append(makeElement("span", "note-mark", "i"));
  const copy = makeElement("div");
  copy.append(makeElement("strong", "", "Un parcours construit autour d'un seul projet"));
  copy.append(makeElement("p", "", "Chaque nouvelle notion enrichit la même application de pizzeria. Tu vois ainsi pourquoi elle devient utile."));
  note.append(copy);
  main.append(note);

  const search = document.querySelector("#searchLessons");
  if (search) search.addEventListener("input", () => {
    const query = search.value.trim().toLocaleLowerCase("fr");
    document.querySelectorAll(".lesson-card").forEach(card => {
      card.hidden = !card.textContent.toLocaleLowerCase("fr").includes(query);
    });
  });
}

function renderLesson(page) {
  currentPage = page;
  updateProgress();
  main.replaceChildren();
  const index = lessons.findIndex(lesson => lesson.id === page.id);
  const breadcrumb = makeElement("div", "breadcrumb");
  breadcrumb.append(
    makeButton(homePage.course || "Parcours Python", "breadcrumb-link", () => navigateTo("/")),
    makeElement("span", "", "/"),
    makeElement("span", "", "Étape " + String(index + 1).padStart(2, "0"))
  );
  main.append(breadcrumb);

  const header = makeElement("header", "lesson-head");
  const heading = makeElement("div");
  heading.append(makeElement("p", "lesson-kicker", "ÉTAPE " + String(index + 1).padStart(2, "0") + " · PARCOURS PYTHON"));
  heading.append(makeElement("h1", "", page.title));
  header.append(heading);
  header.append(makeButton(
    completed.has(page.id) ? "✓ Étape terminée" : "Marquer comme terminée",
    "complete-btn" + (completed.has(page.id) ? " done" : ""),
    () => {
      completed.has(page.id) ? completed.delete(page.id) : completed.add(page.id);
      localStorage.setItem(completedKey, JSON.stringify([...completed]));
      renderLesson(page);
    }
  ));
  main.append(header);

  const content = makeElement("article", "lesson-content");
  renderBlocks(page.blocks, content, page);
  main.append(content);

  const footer = makeElement("footer", "lesson-footer");
  footer.append(makeElement("span", "", (index + 1) + " sur " + lessons.length + " étapes"));
  const next = lessons[index + 1];
  footer.append(next
    ? makeButton("Étape suivante  →", "next-btn", () => navigateTo("/lecons/" + next.slug))
    : makeButton("Retour au parcours", "next-btn", () => navigateTo("/")));
  main.append(footer);
}

function showRoute() {
  const route = location.hash.replace(/^#/, "") || "/";
  if (route === "/") return renderHome();
  const match = route.match(/^\/lecons\/([^/]+)$/);
  const page = match && pages.find(item => item.slug === match[1]);
  if (page) return renderLesson(page);
  main.replaceChildren();
  main.append(makeElement("h1", "not-found", "Cette page est introuvable."));
  main.append(makeButton("Revenir au parcours", "next-btn", () => navigateTo("/")));
}

async function start() {
  try {
    const response = await fetch("./data/manifest.json");
    if (!response.ok) throw new Error("Le manifeste des pages est introuvable.");
    const manifest = await response.json();
    const filenames = [manifest.home, ...manifest.lessons];
    pages = await Promise.all(filenames.map(async filename => {
      const pageResponse = await fetch("./data/" + encodeURIComponent(filename));
      if (!pageResponse.ok) throw new Error("Impossible de charger " + filename);
      return pageResponse.json();
    }));

    homePage = pages[0];
    lessons = pages.filter(page => page.pageType !== "home").sort((a, b) => a.order - b.order);
    document.title = (homePage.course || "Parcours") + " — Le Carnet du code";
    document.querySelector("#courseName").textContent = homePage.course || "Parcours";
    updateProgress();
    window.addEventListener("hashchange", showRoute);
    showRoute();
  } catch (error) {
    main.replaceChildren(
      makeElement("h1", "not-found", "Le parcours n'a pas pu être chargé."),
      makeElement("p", "load-error", error.message),
      makeElement("p", "load-error", "Vérifie que le serveur local est lancé et que les fichiers JSON sont dans le dossier data.")
    );
  }
}

start();
