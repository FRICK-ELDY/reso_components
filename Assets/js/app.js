import { CATEGORY_TAGS } from "./constants.js";
import { loadInitialData, mergeLocalJsonFiles } from "./loader.js";
import { renderTree } from "./render.js";
import { filterData } from "./filter.js";
import { setupTagBar, updateTagActiveStates } from "./tags.js";
import { showError } from "./utils.js";

(function () {
  "use strict";

  const treeContainer = document.getElementById("treeContainer");
  const searchInput = document.getElementById("searchInput");
  const fileInput = document.getElementById("fileInput");
  const clearBtn = document.getElementById("clearBtn");
  const tagBar = document.getElementById("tagBar");

  let originalData = null;
  let currentViewData = null;
  let selectedTag = "all";

  init();

  function init() {
    wireEvents();
    setupTags();
    loadInitialData().then((data) => {
      originalData = data;
      currentViewData = data;
      renderTree(treeContainer, currentViewData, selectedTag);
    }).catch((err) => {
      showError(treeContainer, "初期データの読み込みに失敗しました。空のデータで起動します。", err);
      const empty = { Categorys: {} };
      originalData = empty;
      currentViewData = empty;
      renderTree(treeContainer, currentViewData, selectedTag);
    });
  }

  function setupTags() {
    setupTagBar(tagBar, CATEGORY_TAGS, selectedTag, (tagName) => {
      if (selectedTag.toLowerCase() === String(tagName).toLowerCase()) return;
      selectedTag = tagName;
      updateTagActiveStates(tagBar, selectedTag);
      renderTree(treeContainer, currentViewData, selectedTag);
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
      renderTree(treeContainer, currentViewData, selectedTag);
    });

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      currentViewData = originalData;
      renderTree(treeContainer, currentViewData, selectedTag);
    });

    fileInput.addEventListener("change", async (e) => {
      const files = (e.target && e.target.files) ? Array.from(e.target.files) : [];
      if (!files.length) return;
      try {
        const merged = await mergeLocalJsonFiles(files);
        originalData = merged;
        currentViewData = merged;
        searchInput.value = "";
        renderTree(treeContainer, currentViewData, selectedTag);
      } catch (error) {
        showError(treeContainer, "選択したJSONの読み込み/マージに失敗しました。ファイル内容と形式をご確認ください。", error);
      } finally {
        fileInput.value = "";
      }
    });
  }
})();


