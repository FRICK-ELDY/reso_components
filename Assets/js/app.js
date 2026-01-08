import { CATEGORY_TAGS } from "./constants.js";
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

  let originalData = null;
  let currentViewData = null;
  let selectedTag = "all";
  let openDepth = 2; // 0=全て閉、1=カテゴリのみ、2=カテゴリ+子

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
    loadInitialData().then((data) => {
      originalData = data;
      currentViewData = data;
      renderTree(treeContainer, currentViewData, selectedTag, openDepth);
    }).catch((err) => {
      showError(treeContainer, "初期データの読み込みに失敗しました。空のデータで起動します。", err);
      const empty = { Categorys: {} };
      originalData = empty;
      currentViewData = empty;
      renderTree(treeContainer, currentViewData, selectedTag, openDepth);
    });
  }

  function setupTags() {
    setupTagBar(tagBar, CATEGORY_TAGS, selectedTag, (tagName) => {
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
  }
})();


