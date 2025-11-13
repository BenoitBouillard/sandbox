const templates = [
  {
    id: "grid-4",
    name: "2 × 2 Grid",
    description: "Square layout, perfect for even story grids.",
    aspectRatio: 1,
    slots: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: "wide-film",
    name: "Film Strip",
    description: "Panoramic strip with four equal frames.",
    aspectRatio: 0.4,
    slots: [
      { x: 0, y: 0, w: 0.25, h: 1 },
      { x: 0.25, y: 0, w: 0.25, h: 1 },
      { x: 0.5, y: 0, w: 0.25, h: 1 },
      { x: 0.75, y: 0, w: 0.25, h: 1 },
    ],
  },
  {
    id: "one-plus-three",
    name: "Hero + Stack",
    description: "Large hero panel with a supporting column of three.",
    aspectRatio: 0.8,
    slots: [
      { x: 0, y: 0, w: 0.65, h: 1 },
      { x: 0.65, y: 0, w: 0.35, h: 1 / 3 },
      { x: 0.65, y: 1 / 3, w: 0.35, h: 1 / 3 },
      { x: 0.65, y: 2 / 3, w: 0.35, h: 1 / 3 },
    ],
  },
];

const state = {
  selectedTemplate: templates[0],
  images: {},
};

const templateSelect = document.getElementById("templateSelect");
const templateMeta = document.getElementById("templateMeta");
const slotsContainer = document.getElementById("slots");
const canvasWidthInput = document.getElementById("canvasWidth");
const backgroundInput = document.getElementById("backgroundColor");
const marginInput = document.getElementById("margin");
const radiusInput = document.getElementById("radius");
const marginValue = document.getElementById("marginValue");
const radiusValue = document.getElementById("radiusValue");
const downloadButton = document.getElementById("download");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function populateTemplates() {
  templates.forEach((tpl) => {
    const option = document.createElement("option");
    option.value = tpl.id;
    option.textContent = tpl.name;
    templateSelect.appendChild(option);
  });
  templateSelect.value = state.selectedTemplate.id;
  updateTemplateMeta();
}

function updateTemplateMeta() {
  templateMeta.textContent = state.selectedTemplate.description;
}

function createSlotInputs() {
  slotsContainer.innerHTML = "";
  state.images = {};

  state.selectedTemplate.slots.forEach((_, index) => {
    const card = document.createElement("div");
    card.className = "slot-card";

    const title = document.createElement("strong");
    title.textContent = `Slot ${index + 1}`;

    const preview = document.createElement("div");
    preview.className = "slot-preview";
    preview.id = `preview-${index}`;
    preview.textContent = "Drop a photo";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.addEventListener("change", (event) => handleFileChange(index, event.target.files?.[0], preview));

    card.appendChild(title);
    card.appendChild(preview);
    card.appendChild(fileInput);
    slotsContainer.appendChild(card);
  });

  downloadButton.disabled = true;
}

function handleFileChange(slotIndex, file, previewElement) {
  if (!file) {
    delete state.images[slotIndex];
    resetPreview(previewElement);
    updateDownloadState();
    render();
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.images[slotIndex] = img;
      updatePreview(previewElement, img.src);
      updateDownloadState();
      render();
    };
    img.onerror = () => {
      alert("Unable to load that file. Please try another image.");
      resetPreview(previewElement);
    };
    img.src = e.target?.result;
  };
  reader.readAsDataURL(file);
}

function resetPreview(preview) {
  preview.innerHTML = "";
  preview.textContent = "Drop a photo";
}

function updatePreview(preview, src) {
  preview.innerHTML = "";
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Slot preview";
  preview.appendChild(img);
}

function updateDownloadState() {
  const filled = Object.keys(state.images).length;
  downloadButton.disabled = filled === 0;
}

function render() {
  const template = state.selectedTemplate;
  const width = clamp(Number(canvasWidthInput.value) || 1200, 400, 3000);
  const height = Math.round(width * template.aspectRatio);
  canvas.width = width;
  canvas.height = height;

  const bg = backgroundInput.value;
  const margin = Number(marginInput.value);
  const radius = Number(radiusInput.value);

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  template.slots.forEach((slot, index) => {
    const img = state.images[index];
    if (!img) return;

    const slotX = slot.x * width + margin / 2;
    const slotY = slot.y * height + margin / 2;
    const slotW = slot.w * width - margin;
    const slotH = slot.h * height - margin;

    if (slotW <= 0 || slotH <= 0) {
      return;
    }

    drawRoundedImage(ctx, img, slotX, slotY, slotW, slotH, radius);
  });
}

function drawRoundedImage(context, image, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.save();
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
  context.clip();

  const scale = Math.max(width / image.width, height / image.height);
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  const dx = x + (width - scaledWidth) / 2;
  const dy = y + (height - scaledHeight) / 2;

  context.drawImage(image, dx, dy, scaledWidth, scaledHeight);
  context.restore();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function downloadImage() {
  const link = document.createElement("a");
  link.download = `photo-canvas-${state.selectedTemplate.id}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function init() {
  populateTemplates();
  createSlotInputs();
  render();

  templateSelect.addEventListener("change", () => {
    const selected = templates.find((tpl) => tpl.id === templateSelect.value);
    if (!selected) return;
    state.selectedTemplate = selected;
    updateTemplateMeta();
    createSlotInputs();
    render();
  });

  [canvasWidthInput, backgroundInput, marginInput, radiusInput].forEach((input) => {
    input.addEventListener("input", () => {
      marginValue.textContent = `${marginInput.value} px`;
      radiusValue.textContent = `${radiusInput.value} px`;
      render();
    });
  });

  downloadButton.addEventListener("click", downloadImage);
}

init();
