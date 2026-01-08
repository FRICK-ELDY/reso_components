export function filterData(data, query) {
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

export function pruneCategory(catName, catObj, query) {
  const summaryText = (catObj && catObj.Summary) ? String(catObj.Summary).toLowerCase() : "";
  const catMatches = catName.toLowerCase().includes(query) || summaryText.includes(query);

  const resultChildCats = {};
  const childCats = (catObj && catObj.Categorys) ? catObj.Categorys : {};
  for (const childName of Object.keys(childCats || {})) {
    const childObj = childCats[childName] || {};
    const prunedChild = pruneCategory(childName, childObj, query);
    if (prunedChild) {
      resultChildCats[childName] = prunedChild;
    }
  }

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


