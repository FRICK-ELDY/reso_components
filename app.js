(function () {
  "use strict";

  // フォールバック用の既定データ（components.json が読めない場合に使用）
  const DEFAULT_COMPONENT_DATA = {
    "Categorys": {
      "Assets": {
        "Summary": "マテリアル、プロシージャルコンポーネント、メッシュ",
        "Categorys": {
          "Export": {
            "Summary": "エクスポート可能なアセット。",
            "Components": {
              "AudioExportable": {
                "Description": "オーディオデータを外部形式としてエクスポート可能にするコンポーネント。"
              }
            }
          }
        },
        "Components": {
          "DesktopTextureProvider": {
            "Description": "デスクトップの画面をテクスチャとして提供します。"
          },
          "NullTextureProvider": {
            "Description": "常に無効なテクスチャを提供するプレースホルダー。"
          }
        }
      },
      "Audio": {
        "Summary": "オーディオ出力、リバーブゾーン",
        "Components": {}
      },
      "Cloud": {
        "Summary": "クラウドユーザー情報、サーバーステータス",
        "Components": {}
      },
      "UIX": {
        "Summary": "ResoniteのUIシステムであるUIX用のコンポーネントです。",
        "Components": {}
      },
      "Rendering": {
        "Summary": "レンダリングに関するコンポーネント。",
        "Components": {}
      },
      "Transform": {
        "Summary": "トランスフォーム（位置・回転・スケール）関連。",
        "Components": {}
      },
      "Physics": {
        "Summary": "物理演算に関連するコンポーネント。",
        "Components": {}
      },
      "Userspace": {
        "Summary": "ユーザースペース関連。",
        "Components": {}
      },
      "World": {
        "Summary": "ワールド関連。",
        "Components": {}
      }
    },
    "_meta": {
      "source": "https://wiki.resonite.com/Category:Components/ja",
      "note": "このファイルは手動でメンテナンスできます。キー名は\"Categorys\"/\"Components\"に合わせています。"
    }
  };

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
      showError("初期データの読み込みに失敗しました。フォールバックに切り替えます。", err);
      originalData = DEFAULT_COMPONENT_DATA;
      currentViewData = DEFAULT_COMPONENT_DATA;
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
      const file = e.target && e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        validateMinimumSchema(json);
        originalData = json;
        currentViewData = json;
        searchInput.value = "";
        renderTree(currentViewData);
      } catch (error) {
        showError("選択したJSONの読み込みに失敗しました。フォーマットをご確認ください。", error);
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
    // file:// で開いた場合、fetch は失敗する可能性が高いのでフォールバック
    if (location.protocol === "file:") {
      return DEFAULT_COMPONENT_DATA;
    }
    try {
      const res = await fetch("./components.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      validateMinimumSchema(json);
      return json;
    } catch (e) {
      return DEFAULT_COMPONENT_DATA;
    }
  }

  function validateMinimumSchema(json) {
    if (!json || typeof json !== "object" || !json.Categorys || typeof json.Categorys !== "object") {
      throw new Error("必須キー \"Categorys\" が存在しません。");
    }
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


