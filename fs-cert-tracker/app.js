const STORAGE_KEY = "fs-cert-tracker-records";

const defaultRecords = [
  {
    id: crypto.randomUUID(),
    project: "HVAC/R2 ATH6xx",
    status: "open",
    lastCheck: "2023-11-03",
    safetyLevel: "Subsystem FS1 (FSO)",
    owner: "Cédric Clapier",
    organization: "Rennes ATH",
    workstream: "Instrument cutter diagnostics, validate test bench",
    certificationBody: "INERIS",
    notes: "FSO follow-up needed; tooling validation in progress.",
  },
  {
    id: crypto.randomUUID(),
    project: "HVAC Machinery Regeneration",
    status: "in-progress",
    lastCheck: "2023-11-27",
    safetyLevel: "Subsystem FS1 (FSO) with cutter",
    owner: "Jonathan Dréan",
    organization: "Rennes ATH",
    workstream: "Scope to be FSO; design upgrades for regeneration flow",
    certificationBody: "INERIS",
    notes: "Monitoring build timelines and availability of test bench.",
  },
  {
    id: crypto.randomUUID(),
    project: "KalaRenewal (Bio Cell)",
    status: "blocked",
    lastCheck: "2023-12-03",
    safetyLevel: "Subsystem FS1 (FSO)",
    owner: "Maxime Lemaréchal",
    organization: "Kale",
    workstream: "Formalize safety concept; supplier alignment",
    certificationBody: "INERIS",
    notes: "Certification body on hold until design review is closed.",
  },
  {
    id: crypto.randomUUID(),
    project: "ATVS30 / Brandlabel Lenze",
    status: "open",
    lastCheck: "2023-11-28",
    safetyLevel: "Subsystem FS1 (FSO)",
    owner: "Alexandre Crozet",
    organization: "Stow",
    workstream: "Define motor safety requirements; Lenze to provide SIL3 data",
    certificationBody: "TÜV Rheinland",
    notes: "Waiting for firmware lock on Lenze Drive C2025.",
  },
  {
    id: crypto.randomUUID(),
    project: "ATVS30 / Brandlabel Nidec",
    status: "closed",
    lastCheck: "2023-11-10",
    safetyLevel: "Drive SIL2 / Pld",
    owner: "Melvin Kanté",
    organization: "Nidec",
    workstream: "FSO validation completed; production release",
    certificationBody: "Nidec",
    notes: "Ready to market; archive FS2/FS3 evidence with P28-2023.",
  },
];

const statusMap = {
  open: { label: "Open", className: "status-open" },
  "in-progress": { label: "In progress", className: "status-progress" },
  blocked: { label: "Blocked", className: "status-pending" },
  closed: { label: "Closed", className: "status-closed" },
};

const searchInput = document.querySelector("#search");
const statusFilter = document.querySelector("#status-filter");
const resetFilters = document.querySelector("#reset");
const tableBody = document.querySelector("#projects-table tbody");
const projectCount = document.querySelector("#project-count");

const form = document.querySelector("#project-form");
const editId = document.querySelector("#edit-id");
const projectField = document.querySelector("#project");
const statusField = document.querySelector("#status");
const lastCheckField = document.querySelector("#last-check");
const safetyField = document.querySelector("#safety-level");
const ownerField = document.querySelector("#owner");
const orgField = document.querySelector("#organization");
const workstreamField = document.querySelector("#workstream");
const certBodyField = document.querySelector("#cert-body");
const notesField = document.querySelector("#notes");
const submitBtn = document.querySelector("#submit-btn");

function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [...defaultRecords];

  try {
    const parsed = JSON.parse(raw);
    return parsed.map((item) => ({ ...item, id: item.id || crypto.randomUUID() }));
  } catch (error) {
    console.error("Could not parse saved data", error);
    return [...defaultRecords];
  }
}

let records = loadRecords();

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function renderEmpty() {
  tableBody.innerHTML = `<tr><td colspan="8" class="empty-state">No projects match the current filters.</td></tr>`;
  projectCount.textContent = "0 projects";
}

function renderTable() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  const filtered = records.filter((record) => {
    const matchesStatus = status === "all" || record.status === status;
    const matchesQuery =
      !query ||
      record.project.toLowerCase().includes(query) ||
      (record.owner || "").toLowerCase().includes(query) ||
      (record.organization || "").toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  if (!filtered.length) {
    renderEmpty();
    return;
  }

  projectCount.textContent = `${filtered.length} project${filtered.length > 1 ? "s" : ""}`;

  const rows = filtered
    .sort((a, b) => new Date(b.lastCheck) - new Date(a.lastCheck))
    .map((record) => {
      const statusMeta = statusMap[record.status] || statusMap.open;
      return `
        <tr data-id="${record.id}">
          <td>
            <div class="tagline">${record.project}</div>
          </td>
          <td><span class="badge ${statusMeta.className}">${statusMeta.label}</span></td>
          <td>${formatDate(record.lastCheck)}</td>
          <td>${record.safetyLevel || "–"}</td>
          <td>
            <div class="owner">
              <strong>${record.owner || "Not assigned"}</strong>
              <span class="muted">${record.organization || ""}</span>
            </div>
          </td>
          <td>
            <div>${record.workstream || ""}</div>
            <div class="muted">${record.certificationBody || ""}</div>
          </td>
          <td>
            <div class="note-chip">${record.notes || ""}</div>
          </td>
          <td class="actions">
            <button class="ghost" data-action="edit">Edit</button>
            <button class="ghost" data-action="check">Check today</button>
            <button class="ghost" data-action="delete">Remove</button>
          </td>
        </tr>
      `;
    })
    .join("");

  tableBody.innerHTML = rows;
}

function resetForm() {
  form.reset();
  editId.value = "";
  submitBtn.textContent = "Save project";
}

function handleSubmit(event) {
  event.preventDefault();

  const payload = {
    project: projectField.value.trim(),
    status: statusField.value,
    lastCheck: lastCheckField.value,
    safetyLevel: safetyField.value.trim(),
    owner: ownerField.value.trim(),
    organization: orgField.value.trim(),
    workstream: workstreamField.value.trim(),
    certificationBody: certBodyField.value.trim(),
    notes: notesField.value.trim(),
  };

  if (editId.value) {
    records = records.map((record) => (record.id === editId.value ? { ...record, ...payload } : record));
  } else {
    records = [{ id: crypto.randomUUID(), ...payload }, ...records];
  }

  saveRecords();
  renderTable();
  resetForm();
}

function handleTableClick(event) {
  const action = event.target.dataset.action;
  if (!action) return;

  const row = event.target.closest("tr");
  const { id } = row.dataset;
  const record = records.find((item) => item.id === id);
  if (!record) return;

  if (action === "delete") {
    records = records.filter((item) => item.id !== id);
  }

  if (action === "edit") {
    editId.value = record.id;
    projectField.value = record.project;
    statusField.value = record.status;
    lastCheckField.value = record.lastCheck;
    safetyField.value = record.safetyLevel || "";
    ownerField.value = record.owner || "";
    orgField.value = record.organization || "";
    workstreamField.value = record.workstream || "";
    certBodyField.value = record.certificationBody || "";
    notesField.value = record.notes || "";
    submitBtn.textContent = "Update project";
    projectField.focus();
  }

  if (action === "check") {
    const today = new Date().toISOString().slice(0, 10);
    records = records.map((item) => (item.id === id ? { ...item, lastCheck: today } : item));
  }

  saveRecords();
  renderTable();
}

function resetFiltersAndRender() {
  searchInput.value = "";
  statusFilter.value = "all";
  renderTable();
}

searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);
resetFilters.addEventListener("click", resetFiltersAndRender);
tableBody.addEventListener("click", handleTableClick);
form.addEventListener("submit", handleSubmit);
form.addEventListener("reset", resetForm);

renderTable();
