export function setupTagBar(tagBar, categoryTags, selectedTag, onSelect) {
  if (!tagBar) return () => {};
  tagBar.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const tagName of categoryTags) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag";
    btn.textContent = tagName;
    btn.setAttribute("aria-pressed", String(tagName.toLowerCase() === selectedTag.toLowerCase()));
    btn.addEventListener("click", () => {
      onSelect(tagName);
    });
    frag.appendChild(btn);
  }
  tagBar.appendChild(frag);
  return () => updateTagActiveStates(tagBar, selectedTag);
}

export function updateTagActiveStates(tagBar, selectedTag) {
  if (!tagBar) return;
  const buttons = tagBar.querySelectorAll(".tag");
  buttons.forEach((btn) => {
    const isActive = String(btn.textContent || "").toLowerCase() === selectedTag.toLowerCase();
    btn.setAttribute("aria-pressed", String(isActive));
  });
}


