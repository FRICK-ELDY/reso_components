export function fileNameForTag(tagName) {
  const safe = String(tagName || "").replace(/\s+/g, "");
  return `${safe}.json`;
}

export async function loadInitialData(baseDir, tags) {
  const split = await tryLoadSplitCategoryData(baseDir, tags);
  if (split) return split;
  return { Category: {} };
}

export async function tryLoadSplitCategoryData(baseDir, tags) {
  if (location.protocol === "file:") return null;
  const targets = (tags || []).filter(t => t.toLowerCase() !== "all");
  const requests = targets.map(async (tag) => {
    const url = baseDir + fileNameForTag(tag);
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const categoryObj = normalizeSplitCategoryJson(json, tag);
      if (categoryObj) {
        return { tag, obj: categoryObj, url };
      }
    } catch (_e) {}
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
    Category: merged,
    _meta: {
      source: sources
    }
  };
}

export function normalizeSplitCategoryJson(json, categoryName) {
  if (!json || typeof json !== "object") return null;
  const looksLikeCategory =
    typeof json.Summary === "string" ||
    (json.Components && typeof json.Components === "object") ||
    (json.Category && typeof json.Category === "object");
  if (looksLikeCategory) {
    return {
      Summary: json.Summary,
      Category: json.Category,
      Components: json.Components
    };
  }
  if (json.Category && typeof json.Category === "object") {
    if (json.Category[categoryName]) {
      return json.Category[categoryName];
    }
    const keys = Object.keys(json.Category);
    if (keys.length === 1) {
      return json.Category[keys[0]];
    }
  }
  return null;
}

export async function mergeLocalJsonFiles(files, tags) {
  const entries = await Promise.all(files.map(async (file) => {
    const text = await file.text();
    const json = JSON.parse(text);
    const tag = resolveTagFromFileName(file.name, tags);
    return { file, json, tag };
  }));
  const merged = { Category: {} };
  for (const { json, tag } of entries) {
    const looksLikeCategory =
      json && typeof json === "object" &&
      (typeof json.Summary === "string" ||
        (json.Components && typeof json.Components === "object") ||
        (json.Category && typeof json.Category === "object"));
    if (looksLikeCategory) {
      const catName = tag || "Unknown";
      merged.Category[catName] = {
        Summary: json.Summary,
        Category: json.Category,
        Components: json.Components
      };
      continue;
    }
    if (json && typeof json === "object" && json.Category && typeof json.Category === "object") {
      const keys = Object.keys(json.Category);
      if (keys.length === 1 && tag && json.Category[tag]) {
        merged.Category[tag] = json.Category[tag];
      } else {
        for (const k of keys) {
          merged.Category[k] = json.Category[k];
        }
      }
      continue;
    }
  }
  return merged;
}

export function resolveTagFromFileName(fileName, tags) {
  const lower = String(fileName || "").toLowerCase();
  for (const tag of (tags || [])) {
    if (tag.toLowerCase() === "all") continue;
    const expected = fileNameForTag(tag).toLowerCase();
    if (lower === expected) return tag;
  }
  const m2 = lower.match(/^(.+)\.json$/i);
  if (m2 && m2[1]) {
    const safe2 = m2[1];
    for (const tag of (tags || [])) {
      if (tag.toLowerCase() === "all") continue;
      const safeTag = String(tag).replace(/\s+/g, "").toLowerCase();
      if (safeTag === safe2) return tag;
    }
    return null;
  }
  return null;
}


