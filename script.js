const modal = document.querySelector("#financing-modal");
const openModalButton = document.querySelector("#open-modal");
const closeModalButton = document.querySelector("#close-modal");
const cancelModalButton = document.querySelector("#cancel-modal");
const conditionForm = document.querySelector("#condition-form");
const institutionSearch = document.querySelector("#institution-search");
const tableBody = document.querySelector("#conditions-table-body");
const recordsCount = document.querySelector("#records-count");
const modalTitle = document.querySelector("#modal-title");
const modalSubmitButton = conditionForm.querySelector('button[type="submit"]');
let lastFocusedElement = null;
let editingRow = null;

function openModal(row = null) {
  lastFocusedElement = document.activeElement;
  editingRow = row;
  modalTitle.textContent = row ? "Editar condição de financiamento" : "Adicionar condição de financiamento";
  modalSubmitButton.textContent = row ? "Salvar alterações" : "Salvar condição";

  if (row) fillFormFromRow(row);

  modal.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => document.querySelector("#agency").focus());
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  conditionForm.reset();
  editingRow = null;
  lastFocusedElement?.focus();
}

function fillFormFromRow(row) {
  if (row.dataset.condition) {
    const savedCondition = JSON.parse(row.dataset.condition);
    Object.entries(savedCondition).forEach(([name, value]) => {
      const field = conditionForm.elements.namedItem(name);
      if (field) field.value = value;
    });
    return;
  }

  const cells = [...row.cells].map((cell) => cell.textContent.trim());
  const rateMatch = cells[2].match(/^([\d,.]+)%\s*(.+)$/);

  conditionForm.elements.agency.value = cells[0];
  conditionForm.elements.credit_line.value = cells[1] === "—" ? "" : cells[1];
  conditionForm.elements.applicable_interest.value = rateMatch ? rateMatch[1].replace(",", ".") : "";
  conditionForm.elements.interest_periodicity.value = rateMatch ? rateMatch[2] : "";
  conditionForm.elements.currency.value = cells[3] === "—" ? "BRL" : cells[3];
  conditionForm.elements.total_term.value = cells[4].replace(/\D/g, "");
  conditionForm.elements.grace_term.value = cells[5] === "—" ? "" : cells[5].replace(/\D/g, "");
  conditionForm.elements.max_credit.value = cells[6] === "—" ? "" : cells[6].replace("R$", "").trim();
  conditionForm.elements.amortization_term.value = cells[7] === "—" ? "" : cells[7].replace(/\D/g, "");
}

function formatCurrency(value) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
}

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function actionButtons(agency) {
  return `<button type="button" aria-label="Editar ${agency}" title="Editar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.3-1 10.8-10.8-3.3-3.3L5 15.7zM14.7 6l3.3 3.3" /></svg></button><button type="button" aria-label="Excluir ${agency}" title="Excluir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg></button>`;
}

function updateCount() {
  const rows = [...tableBody.rows];
  const visible = rows.filter((row) => !row.hidden).length;
  recordsCount.textContent = `Exibindo ${visible} de ${rows.length} registros`;
}

openModalButton.addEventListener("click", () => openModal());
closeModalButton.addEventListener("click", closeModal);
cancelModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) closeModal(); });

institutionSearch.addEventListener("input", () => {
  const term = institutionSearch.value.trim().toLocaleLowerCase("pt-BR");
  [...tableBody.rows].forEach((row) => { row.hidden = !row.cells[0].textContent.toLocaleLowerCase("pt-BR").includes(term); });
  updateCount();
});

tableBody.addEventListener("click", (event) => {
  const editButton = event.target.closest('button[title="Editar"]');
  if (editButton) {
    openModal(editButton.closest("tr"));
    return;
  }

  const deleteButton = event.target.closest('button[title="Excluir"]');
  if (!deleteButton) return;

  const row = deleteButton.closest("tr");
  row.remove();
  updateCount();
});

conditionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(conditionForm);
  const agency = data.get("agency");
  const rate = Number(data.get("applicable_interest")).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const grace = data.get("grace_term");
  const amortization = data.get("amortization_term");
  const values = [
    agency,
    data.get("credit_line") || "—",
    `${rate}% ${data.get("interest_periodicity")}`,
    data.get("currency") || "—",
    `${data.get("total_term")} meses`,
    grace ? `${grace} meses` : "—",
    data.get("max_credit") ? formatCurrency(data.get("max_credit")) : "—",
    amortization ? `${amortization} meses` : "—",
  ];
  let savedRow;
  if (editingRow) {
    values.forEach((value, index) => { editingRow.cells[index].textContent = value; });
    editingRow.cells[8].innerHTML = actionButtons(agency);
    savedRow = editingRow;
  } else {
    const row = tableBody.insertRow();
    values.forEach((value) => { const cell = row.insertCell(); cell.textContent = value; });
    const actionsCell = row.insertCell();
    actionsCell.className = "row-actions";
    actionsCell.innerHTML = actionButtons(agency);
    savedRow = row;
  }
  savedRow.dataset.condition = JSON.stringify(Object.fromEntries(data.entries()));
  closeModal();
  institutionSearch.value = "";
  [...tableBody.rows].forEach((tableRow) => { tableRow.hidden = false; });
  updateCount();
});
