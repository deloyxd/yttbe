// Current selected layer
let selectedLayer = "bg-layer";
let selectedReorderLayer = "";

// Store layer positions and transformations
const layerState = {
  "bg-layer": { x: 0, y: 0, scale: 1, opacity: 1 },
  "character-layer": { x: 0, y: 0, scale: 1, opacity: 1 },
  "logo-layer": { x: 0, y: 0, scale: 1, opacity: 1 },
  "text-layer": { x: 0, y: 0, scale: 1, opacity: 1 },
};

const reorderPosition = {
  "character-layer": 0,
  "logo-layer": 0,
  "text-layer": 0,
}

// Track locked state of control groups
const lockedGroups = {
  "help-control-group": false,
  "bg-control-group": false,
  "character-control-group": false,
  "logo-control-group": false,
  "text-control-group": false,
};

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  // Set up layer selection
  document.querySelectorAll(".layer-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const newLayerId = this.dataset.layer;

      // Collapse all control groups if a different layer is selected
      if (selectedLayer !== newLayerId) {
        collapseAllControlGroups();
      }

      selectLayer(newLayerId);
    });
  });

  // Set up drag functionality for layers
  document.querySelectorAll(".layer").forEach((layer) => {
    layer.addEventListener("mousedown", startDrag);
  });

  // Set up image uploads
  document.getElementById("bg-upload").addEventListener("change", function (e) {
    loadImage(e.target.files[0], "bg-image");
  });

  document
    .getElementById("character-upload")
    .addEventListener("change", function (e) {
      loadImage(e.target.files[0], "character-image");
    });

  document
    .getElementById("logo-upload")
    .addEventListener("change", function (e) {
      loadImage(e.target.files[0], "logo-image");
    });

  // Set up scale controls
  document.getElementById("bg-scale").addEventListener("input", function () {
    const value = this.value / 100;
    document.getElementById("bg-scale-value").textContent = `${this.value}%`;
    layerState["bg-layer"].scale = value;
    updateLayer("bg-layer");
  });

  document
    .getElementById("character-scale")
    .addEventListener("input", function () {
      const value = this.value / 100;
      document.getElementById(
        "character-scale-value"
      ).textContent = `${this.value}%`;
      layerState["character-layer"].scale = value;
      updateLayer("character-layer");
    });

  document.getElementById("logo-scale").addEventListener("input", function () {
    const value = this.value / 100;
    document.getElementById("logo-scale-value").textContent = `${this.value}%`;
    layerState["logo-layer"].scale = value;
    updateLayer("logo-layer");
  });

  // Set up opacity controls
  document.getElementById("bg-opacity").addEventListener("input", function () {
    document.getElementById("bg-opacity-value").textContent = `${this.value}%`;
    layerState["bg-layer"].opacity = this.value / 100;
    updateLayer("bg-layer");
  });

  document
    .getElementById("character-opacity")
    .addEventListener("input", function () {
      document.getElementById(
        "character-opacity-value"
      ).textContent = `${this.value}%`;
      layerState["character-layer"].opacity = this.value / 100;
      updateLayer("character-layer");
    });

  document
    .getElementById("logo-opacity")
    .addEventListener("input", function () {
      document.getElementById(
        "logo-opacity-value"
      ).textContent = `${this.value}%`;
      layerState["logo-layer"].opacity = this.value / 100;
      updateLayer("logo-layer");
    });

  // Set up text controls
  document
    .getElementById("text-content")
    .addEventListener("input", function () {
      document.getElementById("text-layer").textContent = this.value;
    });

  document.getElementById("text-size").addEventListener("input", function () {
    document.getElementById("text-size-value").textContent = `${this.value}px`;
    document.getElementById("text-layer").style.fontSize = `${this.value}px`;
  });

  document.getElementById("text-color").addEventListener("input", function () {
    document.getElementById("text-layer").style.color = this.value;
  });

  // Set up download button
  document
    .getElementById("download-btn")
    .addEventListener("click", () => showConfirmationDialog("download"));

  // Set up control group toggles
  document.querySelectorAll(".control-group-header").forEach((header) => {
    header.addEventListener("click", function (e) {
      // Don't toggle if clicking an icon
      if (e.target.classList.contains("up-icon")) return;
      if (e.target.classList.contains("down-icon")) return;
      if (e.target.classList.contains("refresh-icon")) return;
      if (e.target.classList.contains("lock-icon")) return;

      const groupId = this.parentElement.id;
      toggleControlGroup(groupId);
    });
  });

  // Set up reordering buttons
  document.querySelectorAll(".move-icon").forEach((layer) => {
    // layer.addEventListener("mousedown", startReorder);
  });

  // Set up refresh buttons
  document.querySelectorAll(".refresh-icon").forEach((icon) => {
    icon.addEventListener("click", function () {
      const groupId = this.dataset.group;

      if (groupId) {
        toggleRefreshGroup(groupId);
      } else {
        resetAll();
      }
    });
  });

  // Set up lock buttons
  document.querySelectorAll(".lock-icon").forEach((icon) => {
    icon.addEventListener("click", function () {
      const groupId = this.dataset.group;
      toggleLockGroup(groupId);
    });
  });

  // Initialize the first layer as selected
  selectLayer("bg-layer");

  // Set up save and load buttons
  document
    .getElementById("save-btn")
    .addEventListener("click", () => showConfirmationDialog("save"));
  document
    .getElementById("load-btn")
    .addEventListener("click", () => showConfirmationDialog("load"));

  // Set up confirmation dialog buttons
  document
    .getElementById("dialog-confirm-btn")
    .addEventListener("click", confirmAction);
  document
    .getElementById("dialog-cancel-btn")
    .addEventListener("click", hideConfirmationDialog);

  loadState();
});

// Select a layer function
function selectLayer(layerId) {
  collapseAllControlGroups();
  // Remove selected class from all layers
  document.querySelectorAll(".layer").forEach((layer) => {
    layer.classList.remove("selected");
  });

  // Add selected class to chosen layer
  document.getElementById(layerId).classList.add("selected");
  selectedLayer = layerId;

  // Highlight the corresponding button
  document.querySelectorAll(".layer-btn").forEach((button) => {
    button.style.background = "";
  });
  document.querySelector(
    `.layer-btn[data-layer="${layerId}"]`
  ).style.background = "rgba(255, 65, 108, 0.3)";

  const groupId = `${layerId.split("-")[0]}-control-group`;
  if (!lockedGroups[groupId]) expandControlGroup(groupId);
}

// Drag functionality
let isDragging = false;
let dragStartX, dragStartY;
let initialX, initialY;

function startDrag(e) {
  const layer = e.currentTarget;
  selectLayer(layer.id);

  const groupId = `${layer.id.split("-")[0]}-control-group`;
  if (lockedGroups[groupId]) return;

  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;

  // Store initial position
  initialX = layerState[layer.id].x;
  initialY = layerState[layer.id].y;

  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);

  e.preventDefault();
}

function startReorder(e) {
  const layer = e.currentTarget;
  selectedReorderLayer = layer.id;

  isDragging = true;
  dragStartY = e.clientY;

  // Store initial position
  initialY = reorderPosition[layer.id + '-layer'];

  document.addEventListener("mousemove", reorder);
  document.addEventListener("mouseup", stopReorder);

  e.preventDefault();
}

function drag(e) {
  if (!isDragging) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  layerState[selectedLayer].x = initialX + dx;
  layerState[selectedLayer].y = initialY + dy;

  updateLayer(selectedLayer);
}

function reorder(e) {
  if (!isDragging) return;

  const dy = e.clientY - dragStartY;

  reorderPosition[selectedReorderLayer + '-layer'] = initialY + dy;

  const layer = document.getElementById(selectedReorderLayer + '-control-group');
  const state = reorderPosition[selectedReorderLayer + '-layer'];

  layer.style.transform = `translate(0px, ${state}px)`;
}

function stopDrag() {
  isDragging = false;
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
}

function stopReorder() {
  reorderLayer(selectedReorderLayer + '-layer', initialY < reorderPosition[selectedReorderLayer + '-layer'] ? "down" : "up");
  isDragging = false;
  document.removeEventListener("mousemove", reorder);
  document.removeEventListener("mouseup", stopReorder);
}

function resetPosition(layerId) {
  const groupId = `${layerId.split("-")[0]}-control-group`;
  if (lockedGroups[groupId]) return;

  layerState[layerId].x = 0;
  layerState[layerId].y = 0;
  const layer = document.getElementById(layerId);
  const state = layerState[layerId];

  layer.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
}

function unlockAll() {
  for (groupId in lockedGroups) {
    if (groupId !== "help-control-group") {
      if (lockedGroups[groupId]) {
        const lockIcon = document.querySelector(
          `.lock-icon[data-group="${groupId}"]`
        );
        lockIcon.classList.remove("locked");
        expandControlGroup(groupId);
        lockedGroups[groupId] = false;
      }
    }
  }
}

function resetAll() {
  if (Object.values(lockedGroups).some(Boolean)) {
    showAlertDialog("reset", "Unlock all components first?");
    return;
  }

  showAlertDialog("confirm reset", "Reset all components?");
}

function confirmResetAll() {
  for (layerId in layerState) {
    layerState[layerId].x = 0;
    layerState[layerId].y = 0;
    layerState[layerId].scale = 1;
    layerState[layerId].opacity = 1;
    updateLayer(layerId);
  }
}

// Update layer position and transformation
function updateLayer(layerId) {
  const layer = document.getElementById(layerId);
  const state = layerState[layerId];

  layer.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;

  if (layerId !== "text-layer") {
    layer.style.opacity = state.opacity;
  }

  // Update control panel visuals for scale and opacity
  const scaleInput = document.getElementById(`${layerId.split("-")[0]}-scale`);
  const scaleValueDisplay = document.getElementById(
    `${layerId.split("-")[0]}-scale-value`
  );
  if (scaleInput && scaleValueDisplay) {
    scaleInput.value = layerState[layerId].scale * 100;
    scaleValueDisplay.textContent = `${scaleInput.value}%`;
  }

  const opacityInput = document.getElementById(
    `${layerId.split("-")[0]}-opacity`
  );
  const opacityValueDisplay = document.getElementById(
    `${layerId.split("-")[0]}-opacity-value`
  );
  if (opacityInput && opacityValueDisplay) {
    opacityInput.value = layerState[layerId].opacity * 100;
    opacityValueDisplay.textContent = `${opacityInput.value}%`;
  }
}

// Save layer state to local storage
function saveState() {
  localStorage.setItem("layerState", JSON.stringify(layerState));
  console.log("Layer state saved!");
}

// Load layer state from local storage
function loadState() {
  const savedState = localStorage.getItem("layerState");
  if (savedState) {
    const parsedState = JSON.parse(savedState);
    for (const layerId in parsedState) {
      if (layerState.hasOwnProperty(layerId)) {
        layerState[layerId] = parsedState[layerId];
        updateLayer(layerId);
      }
    }
    console.log("Layer state loaded!");
  } else {
    console.log("No saved state found.");
  }
}

// Load image from file input
function loadImage(file, elementId) {
  if (!file || !file.type.match("image.*")) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById(elementId).src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Download thumbnail
function downloadThumbnail() {
  const thumbnailContainer = document.getElementById("thumbnail-container");

  html2canvas(thumbnailContainer, {
    width: thumbnailContainer.offsetWidth,
    height: thumbnailContainer.offsetHeight,
    useCORS: true,
  }).then(function (canvas) {
    const link = document.createElement("a");
    link.download = "youtube_thumbnail.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

// Toggle control group visibility
function toggleControlGroup(groupId) {
  if (lockedGroups[groupId]) return;

  const content = document.getElementById(
    `${groupId.split("-")[0]}-control-content`
  );
  const icon = document.querySelector(`.toggle-icon[data-group="${groupId}"]`);

  if (content.classList.contains("expanded")) {
    collapseControlGroup(groupId);
  } else {
    expandControlGroup(groupId);
  }
}

// Expand control group
function expandControlGroup(groupId) {
  const content = document.getElementById(
    `${groupId.split("-")[0]}-control-content`
  );
  const icon = document.querySelector(`.toggle-icon[data-group="${groupId}"]`);

  content.classList.add("expanded");
  icon.classList.remove("fa-chevron-down");
  icon.classList.add("fa-chevron-up");
}

// Collapse control group
function collapseControlGroup(groupId) {
  const content = document.getElementById(
    `${groupId.split("-")[0]}-control-content`
  );
  const icon = document.querySelector(`.toggle-icon[data-group="${groupId}"]`);

  content.classList.remove("expanded");
  icon.classList.remove("fa-chevron-up");
  icon.classList.add("fa-chevron-down");
}

// Collapse all control groups
function collapseAllControlGroups() {
  document.querySelectorAll(".control-group-content").forEach((content) => {
    content.classList.remove("expanded");
  });

  document.querySelectorAll(".toggle-icon").forEach((icon) => {
    icon.classList.remove("fa-chevron-up");
    icon.classList.add("fa-chevron-down");
  });
}

// Toggle refresh on control group
function toggleRefreshGroup(groupId) {
  const lockIcon = document.querySelector(
    `.refresh-icon[data-group="${groupId}"]`
  );

  const layerId = `${groupId.split("-")[0]}-layer`;
  resetPosition(layerId);
}

// Confirmation Dialog Functions
let currentAction = ""; // To store which action (download, save, load) is pending

function showConfirmationDialog(action) {
  currentAction = action;
  const dialog = document.getElementById("confirmation-dialog");
  const confirmBtn = document.getElementById("dialog-confirm-btn");
  const message = document.getElementById("dialog-message");

  let actionText = "";
  if (action === "download") {
    actionText = "download the thumbnail";
  } else if (action === "save") {
    actionText = "save the current state";
  } else if (action === "load") {
    actionText = "load the last saved state";
  }

  confirmBtn.textContent = `Confirm`;
  message.textContent =
    `Are you sure you want to ${actionText}?` +
    (action === "save"
      ? ` This will replace the last saved state on this device.`
      : ``);
  dialog.classList.add("visible");
}

function showAlertDialog(action, msg) {
  currentAction = action;
  const dialog = document.getElementById("confirmation-dialog");
  const confirmBtn = document.getElementById("dialog-confirm-btn");
  const message = document.getElementById("dialog-message");
  message.textContent = msg;
  confirmBtn.textContent = currentAction === "reset" ? `Okay` : `Confirm`;
  dialog.classList.add("visible");
}

function hideConfirmationDialog() {
  const dialog = document.getElementById("confirmation-dialog");
  dialog.classList.remove("visible");
}

function confirmAction() {
  hideConfirmationDialog(); // Hide the dialog first

  if (currentAction === "download") {
    downloadThumbnail();
  } else if (currentAction === "save") {
    saveState();
  } else if (currentAction === "load") {
    loadState();
  } else if (currentAction === "reset") {
    unlockAll();
    resetAll();
  } else if (currentAction === "confirm reset") {
    confirmResetAll();
  }
}

// Toggle lock on control group
function toggleLockGroup(groupId) {
  const lockIcon = document.querySelector(
    `.lock-icon[data-group="${groupId}"]`
  );

  lockedGroups[groupId] = !lockedGroups[groupId];

  if (lockedGroups[groupId]) {
    lockIcon.classList.add("locked");
    // If locking, also expand the panel
    collapseControlGroup(groupId);
  } else {
    lockIcon.classList.remove("locked");
    expandControlGroup(groupId);
  }
}

function reorderLayer(layerId, direction) {
  const container = document.getElementById("thumbnail-container");
  const layer = document.getElementById(layerId);
  const layers = Array.from(container.children);
  const currentIndex = layers.indexOf(layer);

  if (direction === "up" && currentIndex > 1) {
    container.insertBefore(layer, layers[currentIndex - 1]);
    layer.style.zIndex = currentIndex - 1;
    layers[currentIndex - 1].style.zIndex = currentIndex;
  } else if (direction === "down" && currentIndex < layers.length - 1) {
    container.insertBefore(layers[currentIndex + 1], layer);
    layer.style.zIndex = currentIndex + 1;
    layers[currentIndex + 1].style.zIndex = currentIndex;
  }
}
