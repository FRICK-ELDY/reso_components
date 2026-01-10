import { COMPONENT_TAGS, FLUX_TAGS, COMPONENTS_BASE_DIR, FLUX_BASE_DIR } from "./constants.js";
import { loadInitialData } from "./loader.js";
import { renderTree } from "./render.js";
import { filterData } from "./filter.js";
import { setupTagBar, updateTagActiveStates } from "./tags.js";
import { showError } from "./utils.js";

(function () {
  "use strict";

  const treeContainer = document.getElementById("treeContainer");
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");
  const tagBar = document.getElementById("tagBar");
  const openDepthRange = document.getElementById("openDepthRange");
  const openDepthValue = document.getElementById("openDepthValue");
  const modeBtnComponents = document.getElementById("modeToggleComponents");
  const modeBtnFlux = document.getElementById("modeToggleFlux");
  const dataSourceLink = document.querySelector(".subtitle a#dataSourceLink");

  let originalData = null;
  let currentViewData = null;
  let selectedTag = "all";
  let openDepth = 2; // 0=全て閉、1=カテゴリのみ、2=カテゴリ+子
  let currentMode = "components"; // "components" | "flux"
  let categoryTags = COMPONENT_TAGS.slice();
  let baseDir = COMPONENTS_BASE_DIR;

  init();

  function init() {
    wireEvents();
    setupTags();
    // 初期表示時の開く階層を入力値から反映
    if (openDepthRange) {
      const val = parseInt(openDepthRange.value, 10);
      if (!isNaN(val)) {
        openDepth = Math.max(0, Math.min(10, val));
        if (openDepthValue) openDepthValue.textContent = String(openDepth);
      }
    }
    loadAndRender();
  }

  function setupTags() {
    setupTagBar(tagBar, categoryTags, selectedTag, (tagName) => {
      if (selectedTag.toLowerCase() === String(tagName).toLowerCase()) return;
      selectedTag = tagName;
      updateTagActiveStates(tagBar, selectedTag);
      renderTree(treeContainer, currentViewData, selectedTag, openDepth);
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
      renderTree(treeContainer, currentViewData, selectedTag, openDepth);
    });

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      currentViewData = originalData;
      renderTree(treeContainer, currentViewData, selectedTag, openDepth);
    });

    if (openDepthRange) {
      const updateDepth = () => {
        const val = parseInt(openDepthRange.value, 10);
        if (!isNaN(val)) {
          const clamped = Math.max(0, Math.min(10, val));
          openDepth = clamped;
          if (openDepthValue) openDepthValue.textContent = String(clamped);
          renderTree(treeContainer, currentViewData, selectedTag, openDepth);
        }
      };
      openDepthRange.addEventListener("change", updateDepth);
      openDepthRange.addEventListener("input", updateDepth);
    }

    if (modeBtnComponents) {
      modeBtnComponents.addEventListener("click", () => applyMode("components"));
    }
    if (modeBtnFlux) {
      modeBtnFlux.addEventListener("click", () => applyMode("flux"));
    }
  }

  function applyMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;
    if (currentMode === "components") {
      baseDir = COMPONENTS_BASE_DIR;
      categoryTags = COMPONENT_TAGS.slice();
      if (dataSourceLink) {
        dataSourceLink.href = "https://wiki.resonite.com/Category:Components";
        dataSourceLink.textContent = "Resonite Wiki - Category: Components";
      }
    } else {
      baseDir = FLUX_BASE_DIR;
      categoryTags = FLUX_TAGS.slice();
      if (dataSourceLink) {
        dataSourceLink.href = "https://wiki.resonite.com/Category:ProtoFlux";
        dataSourceLink.textContent = "Resonite Wiki - Category: ProtoFlux";
      }
    }
    updateModeUI();
    selectedTag = "all";
    setupTags();
    searchInput.value = "";
    loadAndRender();
  }

  function updateModeUI() {
    if (modeBtnComponents) {
      modeBtnComponents.setAttribute("aria-pressed", String(currentMode === "components"));
    }
    if (modeBtnFlux) {
      modeBtnFlux.setAttribute("aria-pressed", String(currentMode === "flux"));
    }
  }

  function loadAndRender() {
    loadInitialData(baseDir, categoryTags).then((data) => {
      originalData = data;
      currentViewData = data;
      renderTree(treeContainer, currentViewData, selectedTag, openDepth);
    }).catch((err) => {
      showError(treeContainer, "初期データの読み込みに失敗しました。空のデータで起動します。", err);
      const empty = { Category: {} };
      originalData = empty;
      currentViewData = empty;
      renderTree(treeContainer, currentViewData, selectedTag, openDepth);
    });
  }
})();


