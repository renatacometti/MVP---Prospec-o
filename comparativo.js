const matrix = document.querySelector("#comparison-matrix");
const selectors = [...document.querySelectorAll(".agency-selector")];
const showSelected = document.querySelector("#show-selected");
const selectedCount = document.querySelector("#selected-count");

function updateVisibleAgencies() {
  const selected = selectors.filter((selector) => selector.checked).map((selector) => selector.dataset.target);
  selectedCount.textContent = selected.length;

  document.querySelectorAll("[data-agency]").forEach((cell) => {
    const shouldHide = showSelected.checked && !selected.includes(cell.dataset.agency);
    cell.classList.toggle("agency-hidden", shouldHide);
  });

  const visibleColumns = showSelected.checked ? Math.max(selected.length, 1) : selectors.length;
  matrix.style.gridTemplateColumns = `190px repeat(${visibleColumns}, minmax(185px, 1fr))`;
}

selectors.forEach((selector) => selector.addEventListener("change", updateVisibleAgencies));
showSelected.addEventListener("change", updateVisibleAgencies);
updateVisibleAgencies();
