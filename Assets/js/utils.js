export function normalizeName(s) {
  return String(s || "").trim().toLowerCase();
}

export function validateMinimumSchema(json) {
  if (!json || typeof json !== "object" || !json.Categorys || typeof json.Categorys !== "object") {
    throw new Error('必須キー "Categorys" が存在しません。');
  }
}

export function showError(container, message, err) {
  const box = document.createElement("div");
  box.className = "empty-message error";
  box.textContent = `${message}`;
  if (err) {
    console.error(message, err);
  }
  container.innerHTML = "";
  container.appendChild(box);
}


