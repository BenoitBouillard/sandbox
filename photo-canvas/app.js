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
  slotData: {},
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
  state.slotData = {};

  state.selectedTemplate.slots.forEach((_, index) => {
    const card = document.createElement("div");
    card.className = "slot-card";
    card.dataset.slotIndex = index;

    const title = document.createElement("strong");
    title.textContent = `Slot ${index + 1}`;

    const preview = document.createElement("div");
    preview.className = "slot-preview";
    preview.id = `preview-${index}`;
    preview.textContent = "Drop a photo";
    preview.dataset.slotIndex = index;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.addEventListener("change", (event) => handleFileChange(index, event.target.files?.[0], preview));

    const controls = document.createElement("div");
    controls.className = "slot-controls";

    const slotState = createSlotState();
    state.slotData[index] = slotState;

    const zoomControl = createSliderControl({
      key: "zoom",
      label: "Zoom",
      min: 1,
      max: 3,
      step: 0.01,
      initial: 1,
      valueFormatter: (value) => `${Math.round(value * 100)}%`,
      onInput: (value) => {
        if (!slotState.image) return;
        slotState.zoom = value;
        render();
      },
    });
    zoomControl.input.dataset.slotIndex = index;

    const rotationControl = createSliderControl({
      key: "rotation",
      label: "Rotation",
      min: -180,
      max: 180,
      step: 1,
      initial: 0,
      valueFormatter: (value) => `${Math.round(value)}°`,
      onInput: (value) => {
        if (!slotState.image) return;
        slotState.rotation = value;
        render();
      },
    });
    rotationControl.input.dataset.slotIndex = index;

    controls.appendChild(zoomControl.wrapper);
    controls.appendChild(rotationControl.wrapper);

    const hint = document.createElement("p");
    hint.className = "slot-hint";
    hint.textContent = "Drag the preview to reposition the photo.";

    enablePreviewDragging(preview, index, slotState);

    card.appendChild(title);
    card.appendChild(preview);
    card.appendChild(fileInput);
    card.appendChild(controls);
    card.appendChild(hint);
    slotsContainer.appendChild(card);
  });

  downloadButton.disabled = true;
}

function createSliderControl({ key, label, min, max, step, valueFormatter, onInput, initial }) {
  const wrapper = document.createElement("label");
  wrapper.className = "slot-control";

  const topRow = document.createElement("div");
  topRow.className = "slot-control__header";

  const title = document.createElement("span");
  title.textContent = label;

  const value = document.createElement("span");
  value.className = "slot-control__value";
  const initialValue = initial ?? Number(min);
  value.textContent = valueFormatter(initialValue);
  value.dataset.valueFor = key;

  topRow.appendChild(title);
  topRow.appendChild(value);

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(initialValue);
  input.disabled = true;
  input.dataset.control = key;
  input.addEventListener("input", () => {
    const numericValue = Number(input.value);
    value.textContent = valueFormatter(numericValue);
    onInput(numericValue);
  });

  wrapper.appendChild(topRow);
  wrapper.appendChild(input);

  return { wrapper, input, valueElement: value };
}

function createSlotState() {
  return {
    image: null,
    zoom: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  };
}

function handleFileChange(slotIndex, file, previewElement) {
  const slotState = state.slotData[slotIndex];
  if (!slotState) return;

  if (!file) {
    resetSlotState(slotIndex);
    resetPreview(previewElement);
    updateDownloadState();
    render();
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      slotState.image = img;
      slotState.zoom = 1;
      slotState.rotation = 0;
      slotState.offsetX = 0;
      slotState.offsetY = 0;
      updatePreview(previewElement, img.src);
      syncSlotControls(slotIndex);
      updateDownloadState();
      render();
    };
    img.onerror = () => {
      alert("Unable to load that file. Please try another image.");
      resetSlotState(slotIndex);
      resetPreview(previewElement);
      updateDownloadState();
    };
    img.src = e.target?.result;
  };
  reader.readAsDataURL(file);
}

function resetPreview(preview) {
  preview.innerHTML = "";
  preview.textContent = "Drop a photo";
  preview.classList.remove("has-image");
}

function updatePreview(preview, src) {
  preview.innerHTML = "";
  preview.classList.add("has-image");
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Slot preview";
  const hint = document.createElement("span");
  hint.className = "slot-preview-hint";
  hint.textContent = "Drag to move";
  preview.appendChild(img);
  preview.appendChild(hint);
}

function updateDownloadState() {
  const filled = Object.values(state.slotData).filter((slot) => slot.image).length;
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
    const slotState = state.slotData[index];
    const img = slotState?.image;
    if (!img) return;

    const metrics = getSlotMetrics(slot, width, height, margin);
    if (metrics.width <= 0 || metrics.height <= 0) {
      return;
    }

    drawRoundedImage(ctx, img, metrics, radius, slotState);
  });
}

function getSlotMetrics(slot, width, height, margin) {
  return {
    x: slot.x * width + margin / 2,
    y: slot.y * height + margin / 2,
    width: slot.w * width - margin,
    height: slot.h * height - margin,
  };
}

function drawRoundedImage(context, image, metrics, radius, slotState) {
  const { x, y, width, height } = metrics;
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

  const coverScale = Math.max(width / image.width, height / image.height);
  const scale = coverScale * slotState.zoom;
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  const centerX = x + width / 2 + slotState.offsetX;
  const centerY = y + height / 2 + slotState.offsetY;

  context.translate(centerX, centerY);
  context.rotate((slotState.rotation * Math.PI) / 180);
  context.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
  context.restore();
}

function resetSlotState(slotIndex) {
  const slotState = state.slotData[slotIndex];
  if (!slotState) return;
  slotState.image = null;
  slotState.zoom = 1;
  slotState.rotation = 0;
  slotState.offsetX = 0;
  slotState.offsetY = 0;
  syncSlotControls(slotIndex);
}

function syncSlotControls(slotIndex) {
  const slotState = state.slotData[slotIndex];
  const card = slotsContainer.querySelector(`[data-slot-index="${slotIndex}"]`);
  if (!slotState || !card) return;

  const zoomInput = card.querySelector("input[data-control=\"zoom\"]");
  const rotationInput = card.querySelector("input[data-control=\"rotation\"]");
  const zoomValue = card.querySelector("[data-value-for=\"zoom\"]");
  const rotationValue = card.querySelector("[data-value-for=\"rotation\"]");

  const hasImage = Boolean(slotState.image);

  [zoomInput, rotationInput].forEach((input) => {
    if (!input) return;
    input.disabled = !hasImage;
  });

  if (zoomInput && zoomValue) {
    zoomInput.value = String(slotState.zoom);
    zoomValue.textContent = `${Math.round(slotState.zoom * 100)}%`;
  }

  if (rotationInput && rotationValue) {
    rotationInput.value = String(slotState.rotation);
    rotationValue.textContent = `${Math.round(slotState.rotation)}°`;
  }
}

function enablePreviewDragging(preview, slotIndex, slotState) {
  let activePointer = null;
  let lastX = 0;
  let lastY = 0;

  const handlePointerDown = (event) => {
    if (!slotState.image) return;
    activePointer = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    preview.setPointerCapture(activePointer);
    preview.classList.add("is-dragging");
  };

  const handlePointerMove = (event) => {
    if (activePointer !== event.pointerId || !slotState.image) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;

    const rect = preview.getBoundingClientRect();
    const margin = Number(marginInput.value);
    const metrics = getSlotMetrics(state.selectedTemplate.slots[slotIndex], canvas.width, canvas.height, margin);
    const slotWidth = metrics.width;
    const slotHeight = metrics.height;

    if (slotWidth > 0) {
      slotState.offsetX += (dx / rect.width) * slotWidth;
    }
    if (slotHeight > 0) {
      slotState.offsetY += (dy / rect.height) * slotHeight;
    }
    render();
  };

  const endPointer = (event) => {
    if (activePointer !== event.pointerId) return;
    preview.classList.remove("is-dragging");
    preview.releasePointerCapture(activePointer);
    activePointer = null;
  };

  preview.addEventListener("pointerdown", handlePointerDown);
  preview.addEventListener("pointermove", handlePointerMove);
  preview.addEventListener("pointerup", endPointer);
  preview.addEventListener("pointerleave", endPointer);
  preview.addEventListener("pointercancel", endPointer);
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
