import { normalizeName } from "./utils.js";

export function renderTree(container, data, selectedTag) {
  container.innerHTML = "";
  if (!data || !data.Categorys || Object.keys(data.Categorys).length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-message";
    empty.textContent = "表示できるカテゴリがありません。検索条件を見直すか、JSONを読み込んでください。";
    container.appendChild(empty);
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
  container.appendChild(fragment);
}

export function renderCategory(categoryName, categoryObj, openByDefault) {
  const details = document.createElement("details");
  details.className = "category";
  if (openByDefault) details.setAttribute("open", "");

  const summary = document.createElement("summary");
  summary.textContent = categoryName;
  details.appendChild(summary);

  const summaryText = (categoryObj && categoryObj.Summary) ? String(categoryObj.Summary) : "";
  if (summaryText) {
    summary.setAttribute("title", summaryText);
  }

  const childCats = (categoryObj && categoryObj.Categorys) ? categoryObj.Categorys : {};
  const childCatNames = Object.keys(childCats || {}).sort((a, b) => a.localeCompare(b));
  for (const childName of childCatNames) {
    const childObj = childCats[childName] || {};
    details.appendChild(renderCategory(childName, childObj, false));
  }

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

export function renderComponent(componentName, componentObj) {
  const li = document.createElement("li");
  li.className = "component-item";
  const name = document.createElement("div");
  name.className = "component-name";
  name.textContent = componentName;
  const descriptionText = componentObj && componentObj.Description ? String(componentObj.Description) : "";
  if (descriptionText) {
    li.setAttribute("title", descriptionText);
    name.setAttribute("title", descriptionText);
  }
  li.appendChild(name);
  return li;
}


