(function () {
  "use strict";

  /** @type {HTMLElement} */
  const treeContainer = document.getElementById("treeContainer");
  /** @type {HTMLInputElement} */
  const searchInput = document.getElementById("searchInput");
  /** @type {HTMLInputElement} */
  const fileInput = document.getElementById("fileInput");
  /** @type {HTMLButtonElement} */
  const clearBtn = document.getElementById("clearBtn");
  /** @type {HTMLElement} */
  const tagBar = document.getElementById("tagBar");

  // 分割JSONのベースディレクトリとファイル命名規則
  const SPLIT_BASE_DIR = "./Assets/components/";
  function fileNameForTag(tagName) {
    const safe = String(tagName || "").replace(/\s+/g, "");
    return `components_${safe}.json`;
  }

  const CATEGORY_TAGS = [
    "all",
    "Assets",
    "Audio",
    "Cloud",
    "Common UI",
    "Data",
    "Generators",
    "Interaction",
    "Locomotion",
    "Metadata",
    "Misc",
    "Physics",
    "Radiant UI",
    "Rendering",
    "Transform",
    "UIX",
    "Uncategorized",
    "Userspace",
    "Wizards"
  ];

  /** @type {any} */
  let originalData = null;
  /** @type {any} */
  let currentViewData = null;
  /** @type {string} */
  let selectedTag = "all";

  init();

  function init() {
    wireEvents();
    setupTagBar();
    loadInitialData().then((data) => {
      originalData = data;
      currentViewData = data;
      renderTree(currentViewData);
    }).catch((err) => {
      showError("初期データの読み込みに失敗しました。空のデータで起動します。", err);
      const empty = { Categorys: {} };
      originalData = empty;
      currentViewData = empty;
      renderTree(currentViewData);
    });
  }

  function wireEvents() {
    searchInput.addEventListener("input", () => {
      const query = (searchInput.value || "").trim().toLowerCase();
      if (!query) {
        currentViewData = originalData;
      } else {
        currentViewData = filterData(originalData, query);
      }
      renderTree(currentViewData);
    });

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      currentViewData = originalData;
      renderTree(currentViewData);
    });

    fileInput.addEventListener("change", async (e) => {
      const files = (e.target && e.target.files) ? Array.from(e.target.files) : [];
      if (!files.length) return;
      try {
        const merged = await mergeLocalJsonFiles(files);
        originalData = merged;
        currentViewData = merged;
        searchInput.value = "";
        renderTree(currentViewData);
      } catch (error) {
        showError("選択したJSONの読み込み/マージに失敗しました。ファイル内容と形式をご確認ください。", error);
      } finally {
        fileInput.value = "";
      }
    });
  }

  function setupTagBar() {
    if (!tagBar) return;
    tagBar.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const tagName of CATEGORY_TAGS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag";
      btn.textContent = tagName;
      btn.setAttribute("aria-pressed", String(tagName.toLowerCase() === selectedTag.toLowerCase()));
      btn.addEventListener("click", () => {
        if (selectedTag.toLowerCase() === tagName.toLowerCase()) return;
        selectedTag = tagName;
        updateTagActiveStates();
        renderTree(currentViewData);
      });
      frag.appendChild(btn);
    }
    tagBar.appendChild(frag);
  }

  function updateTagActiveStates() {
    if (!tagBar) return;
    const buttons = tagBar.querySelectorAll(".tag");
    buttons.forEach((btn) => {
      const isActive = String(btn.textContent || "").toLowerCase() === selectedTag.toLowerCase();
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  async function loadInitialData() {
    // 分割JSONのみを読み込み（存在する分だけマージ）。見つからなければ空データを返す。
    const split = await tryLoadSplitCategoryData();
    if (split) return split;
    return { Categorys: {} };
  }

  function validateMinimumSchema(json) {
    if (!json || typeof json !== "object" || !json.Categorys || typeof json.Categorys !== "object") {
      throw new Error("必須キー \"Categorys\" が存在しません。");
    }
  }

  async function mergeLocalJsonFiles(files) {
    // CATEGORY_TAGS からファイル名→カテゴリ名を推定
    const entries = await Promise.all(files.map(async (file) => {
      const text = await file.text();
      const json = JSON.parse(text);
      const tag = resolveTagFromFileName(file.name);
      return { file, json, tag };
    }));
    const merged = { Categorys: {} };
    for (const { json, tag } of entries) {
      // 形式A: 単一カテゴリオブジェクト
      const looksLikeCategory =
        json && typeof json === "object" &&
        (typeof json.Summary === "string" ||
          (json.Components && typeof json.Components === "object") ||
          (json.Categorys && typeof json.Categorys === "object"));
      if (looksLikeCategory) {
        const catName = tag || "Unknown";
        merged.Categorys[catName] = {
          Summary: json.Summary,
          Categorys: json.Categorys,
          Components: json.Components
        };
        continue;
      }
      // 形式B: { Categorys: { ... } }
      if (json && typeof json === "object" && json.Categorys && typeof json.Categorys === "object") {
        const keys = Object.keys(json.Categorys);
        if (keys.length === 1 && tag && json.Categorys[tag]) {
          merged.Categorys[tag] = json.Categorys[tag];
        } else {
          for (const k of keys) {
            merged.Categorys[k] = json.Categorys[k];
          }
        }
        continue;
      }
      // 不明形式は無視
    }
    return merged;
  }

  function resolveTagFromFileName(fileName) {
    const lower = String(fileName || "").toLowerCase();
    // CATEGORY_TAGS から逆引き
    for (const tag of CATEGORY_TAGS) {
      if (tag.toLowerCase() === "all") continue;
      const expected = fileNameForTag(tag).toLowerCase();
      if (lower === expected) return tag;
    }
    // "components_<name>.json" から抽出（スペース無し）
    const m = lower.match(/^components_(.+)\.json$/i);
    if (m && m[1]) {
      const safe = m[1];
      // CATEGORY_TAGS からスペース除去一致を探す
      for (const tag of CATEGORY_TAGS) {
        if (tag.toLowerCase() === "all") continue;
        const safeTag = String(tag).replace(/\s+/g, "").toLowerCase();
        if (safeTag === safe) return tag;
      }
      // 見つからなければそのまま復元（先頭を大文字化の簡易処理）
      return m[1];
    }
    return null;
  }
  async function tryLoadSplitCategoryData() {
    // file:// で開いた場合も、ローカルファイルをHTTPで配れないため fetch は失敗しがち
    if (location.protocol === "file:") return null;

    // "all" 以外のタグを対象に試行
    const targets = CATEGORY_TAGS.filter(t => t.toLowerCase() !== "all");
    const requests = targets.map(async (tag) => {
      const url = SPLIT_BASE_DIR + fileNameForTag(tag);
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // それぞれのJSONをカテゴリオブジェクトに正規化する
        const categoryObj = normalizeSplitCategoryJson(json, tag);
        if (categoryObj) {
          return { tag, obj: categoryObj, url };
        }
      } catch (e) {
        // 見つからない/不正などはスキップ
      }
      return null;
    });

    const results = await Promise.allSettled(requests);
    const merged = {};
    const sources = [];
    for (const r of results) {
      if (r.status === "fulfilled" && r.value && r.value.obj) {
        const catName = r.value.tag;
        merged[catName] = r.value.obj;
        if (r.value.url) sources.push(r.value.url);
      }
    }
    if (Object.keys(merged).length === 0) return null;
    return {
      Categorys: merged,
      _meta: {
        source: sources
      }
    };
  }

  function normalizeSplitCategoryJson(json, categoryName) {
    if (!json || typeof json !== "object") return null;
    // パターンA: そのままカテゴリオブジェクト（Summary/Categorys/Components を持つ）
    const looksLikeCategory =
      typeof json.Summary === "string" ||
      (json.Components && typeof json.Components === "object") ||
      (json.Categorys && typeof json.Categorys === "object");
    if (looksLikeCategory) {
      return {
        Summary: json.Summary,
        Categorys: json.Categorys,
        Components: json.Components
      };
    }
    // パターンB: { Categorys: { <name>: {...} } } 形式
    if (json.Categorys && typeof json.Categorys === "object") {
      if (json.Categorys[categoryName]) {
        return json.Categorys[categoryName];
      }
      const keys = Object.keys(json.Categorys);
      if (keys.length === 1) {
        return json.Categorys[keys[0]];
      }
    }
    return null;
  }

  function renderTree(data) {
    treeContainer.innerHTML = "";
    if (!data || !data.Categorys || Object.keys(data.Categorys).length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "表示できるカテゴリがありません。検索条件を見直すか、JSONを読み込んでください。";
      treeContainer.appendChild(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    let categories = Object.keys(data.Categorys).sort((a, b) => a.localeCompare(b));
    if (selectedTag && selectedTag.toLowerCase() !== "all") {
      categories = categories.filter((name) => normalizeName(name) === normalizeName(selectedTag));
    }
    for (const catName of categories) {
      const catObj = data.Categorys[catName] || {};
      fragment.appendChild(renderCategory(catName, catObj, true));
    }
    treeContainer.appendChild(fragment);
  }

  function normalizeName(s) {
    return String(s || "").trim().toLowerCase();
  }

  function renderCategory(categoryName, categoryObj, openByDefault) {
    const details = document.createElement("details");
    details.className = "category";
    if (openByDefault) details.setAttribute("open", "");

    const summary = document.createElement("summary");
    summary.textContent = categoryName;
    // Summary テキストをツールチップに
    details.appendChild(summary);

    const summaryText = (categoryObj && categoryObj.Summary) ? String(categoryObj.Summary) : "";
    if (summaryText) {
      summary.setAttribute("title", summaryText);
    }

    // 子カテゴリ
    const childCats = (categoryObj && categoryObj.Categorys) ? categoryObj.Categorys : {};
    const childCatNames = Object.keys(childCats || {}).sort((a, b) => a.localeCompare(b));
    for (const childName of childCatNames) {
      const childObj = childCats[childName] || {};
      details.appendChild(renderCategory(childName, childObj, false));
    }

    // コンポーネント一覧
    const comps = (categoryObj && categoryObj.Components) ? categoryObj.Components : {};
    const compNames = Object.keys(comps || {}).sort((a, b) => a.localeCompare(b));
    if (compNames.length > 0) {
      const ul = document.createElement("ul");
      ul.className = "components-list";
      for (const compName of compNames) {
        const compObj = comps[compName] || {};
        ul.appendChild(renderComponent(compName, compObj));
      }
      details.appendChild(ul);
    }

    return details;
  }

  function renderComponent(componentName, componentObj) {
    const li = document.createElement("li");
    li.className = "component-item";
    const name = document.createElement("div");
    name.className = "component-name";
    name.textContent = componentName;
    const descriptionText = componentObj && componentObj.Description ? String(componentObj.Description) : "";
    // Description をツールチップに（行全体・名前・説明いずれでも表示されるように）
    if (descriptionText) {
      li.setAttribute("title", descriptionText);
      name.setAttribute("title", descriptionText);
    }
    li.appendChild(name);
    return li;
  }

  function filterData(data, query) {
    if (!data || !data.Categorys) return { Categorys: {} };
    const filtered = { Categorys: {} };
    const names = Object.keys(data.Categorys);
    for (const catName of names) {
      const catObj = data.Categorys[catName] || {};
      const pruned = pruneCategory(catName, catObj, query);
      if (pruned) {
        filtered.Categorys[catName] = pruned;
      }
    }
    return filtered;
  }

  function pruneCategory(catName, catObj, query) {
    const summaryText = (catObj && catObj.Summary) ? String(catObj.Summary).toLowerCase() : "";
    const catMatches = catName.toLowerCase().includes(query) || summaryText.includes(query);

    // 子カテゴリを再帰的にフィルタ
    const resultChildCats = {};
    const childCats = (catObj && catObj.Categorys) ? catObj.Categorys : {};
    for (const childName of Object.keys(childCats || {})) {
      const childObj = childCats[childName] || {};
      const prunedChild = pruneCategory(childName, childObj, query);
      if (prunedChild) {
        resultChildCats[childName] = prunedChild;
      }
    }

    // コンポーネントをフィルタ
    const resultComponents = {};
    const comps = (catObj && catObj.Components) ? catObj.Components : {};
    for (const compName of Object.keys(comps || {})) {
      const compObj = comps[compName] || {};
      const desc = compObj && compObj.Description ? String(compObj.Description).toLowerCase() : "";
      if (compName.toLowerCase().includes(query) || desc.includes(query)) {
        resultComponents[compName] = compObj;
      }
    }

    const hasChildCats = Object.keys(resultChildCats).length > 0;
    const hasComponents = Object.keys(resultComponents).length > 0;

    if (catMatches || hasChildCats || hasComponents) {
      const pruned = {
        Summary: catObj.Summary
      };
      if (hasChildCats) pruned.Categorys = resultChildCats;
      if (hasComponents) pruned.Components = resultComponents;
      return pruned;
    }
    return null;
  }

  function showError(message, err) {
    const box = document.createElement("div");
    box.className = "empty-message error";
    box.textContent = `${message}`;
    if (err) {
      // 画面には詳細は出さないが、開発者コンソールには出す
      console.error(message, err);
    }
    treeContainer.innerHTML = "";
    treeContainer.appendChild(box);
  }
})();


