/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
*/


// src/utils.ts
var calcRandomPosition = (axis, currentZoom = 1) => {
  const scroll = axis === "x" ? window.scrollX : window.scrollY;
  const size = axis === "x" ? window.innerWidth : window.innerHeight;
  const randomOffset = (Math.random() < 0.5 ? -1 : 1) * Math.random() * (100 / currentZoom);
  return parseInt((scroll + size / 2 + randomOffset).toString());
};
function initializeCanvas(canvas_width, canvas_height) {
  const canvas = document.getElementById("canvas");
  const connectionsCanvas = document.getElementById("connections");
  if (!canvas || !connectionsCanvas) {
    console.error("Error while canvas initializtion");
    return;
  }
  canvas.style.width = `${canvas_width}px`;
  canvas.style.height = `${canvas_height}px`;
  connectionsCanvas.setAttribute("width", String(canvas_width));
  connectionsCanvas.setAttribute("height", String(canvas_height));
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  window.scrollTo(0, 0);
  connectionsCanvas.setAttribute("width", window.innerWidth.toString());
  connectionsCanvas.setAttribute("height", window.innerHeight.toString());
}
function cleanSVG() {
  let connectionCanvas = document.querySelector("svg");
  while (connectionCanvas.firstChild) {
    connectionCanvas.removeChild(connectionCanvas.firstChild);
  }
}
function getComputedCSSValue(varName) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (value.endsWith("rem")) {
    return parseFloat(value) * 16;
  } else if (value.endsWith("px")) {
    return parseFloat(value);
  } else if (value.endsWith("%")) {
  }
  return parseFloat(value);
}

// src/state.ts
var State = class {
  constructor() {
    this.canvasWidth = 3840;
    this.canvasHeight = 2160;
    this.viewPortPadding = 100;
    this.nodes = {};
    // Main nodes storage
    this.connections = {};
    // Main connections storage
    this.nodeIdCounter = 0;
    this.connIdCounter = 0;
    this.choiceIdCounter = 0;
    // Dragging variables
    this.isDragging = false;
    this.draggedNodes = /* @__PURE__ */ new Set();
    this.initialDraggingPositions = /* @__PURE__ */ new Map();
    //Connection canvas init
    this.connectionsCanvas = document.querySelector("svg");
    this.onConnection = false;
    this.currentConnection = null;
    // Create selection box element
    this.selectionBox = document.getElementById("selection-box");
    this.selectionStart = { x: 0, y: 0 };
    this.onSelection = false;
    this.selectedNodes = /* @__PURE__ */ new Set();
    //Zoom
    this.currentZoom = 1;
    this.minZoom = 0.5;
    this.maxZoom = 1.5;
    this.zoomStep = 0.1;
    //Undo 
    this.objectsHistory = [];
    this.connsToRemove = /* @__PURE__ */ new Set();
    //Resizing 
    this.isResizing = false;
    this.resizeStartX = 0;
    this.resizeStartY = 0;
  }
};
var state = new State();

// src/modules/nodes.ts
function addNode(type = "choice", x = calcRandomPosition("x"), y = calcRandomPosition("y")) {
  const node = {
    id: state.nodeIdCounter,
    type,
    title: `Node #${state.nodeIdCounter}`,
    text: "",
    x,
    y,
    width: getComputedCSSValue("--init-node-width"),
    height: getComputedCSSValue("--init-node-height"),
    inname: "node"
  };
  if (type === "choice") {
    node.choices = {};
  }
  state.nodes[state.nodeIdCounter] = node;
  renderNode(state.nodeIdCounter);
  state.nodeIdCounter++;
  return node;
}
function renderNode(nodeId) {
  const canvas = document.getElementById("canvas");
  if (!canvas)
    return;
  const existingNode = document.getElementById(`node-${nodeId}`);
  if (existingNode) {
    existingNode.remove();
  }
  const node = state.nodes[nodeId];
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }
  const nodeElement = document.createElement("div");
  nodeElement.className = `node ${node.type} resizable`;
  nodeElement.id = `node-${nodeId}`;
  nodeElement.style.left = `${node.x}px`;
  nodeElement.style.top = `${node.y}px`;
  nodeElement.style.transformOrigin = "top left";
  nodeElement.style.transform = `scale(${state.currentZoom})`;
  nodeElement.style.height = `${node.height}px`;
  nodeElement.style.width = `${node.width}px`;
  const container = document.createElement("div");
  container.className = "node-container";
  const baseSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--base-font-size"));
  const scaledFontSize = baseSize * state.currentZoom;
  const titleContainer = document.createElement("div");
  titleContainer.className = "node-title-container";
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "node-title node-input";
  titleInput.value = node.title || "Event title";
  titleInput.style.fontSize = `${scaledFontSize}px`;
  titleContainer.appendChild(titleInput);
  container.appendChild(titleContainer);
  const titleInputPoint = document.createElement("div");
  titleInputPoint.className = "connection-point input";
  titleInputPoint.onclick = (e) => handleConnectionPoint(e, titleInputPoint, null, null, nodeId, "node");
  const titleOutputPoint = document.createElement("div");
  titleOutputPoint.className = "connection-point output";
  titleOutputPoint.onclick = (e) => handleConnectionPoint(e, titleOutputPoint, nodeId, "node", null, null);
  titleOutputPoint.ondblclick = (e) => handleNewNodePoint(e, nodeId, "node");
  titleContainer.appendChild(titleInputPoint);
  titleContainer.appendChild(titleOutputPoint);
  const contentInput = document.createElement("textarea");
  contentInput.className = "node-content node-input";
  contentInput.value = node.text || "";
  contentInput.placeholder = "Enter content...";
  contentInput.style.fontSize = `${scaledFontSize}px`;
  container.appendChild(contentInput);
  nodeElement.appendChild(container);
  canvas.appendChild(nodeElement);
  titleInput.addEventListener("input", (e) => {
    e.stopPropagation();
    node.title = titleInput.value;
  });
  titleInput.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
  contentInput.addEventListener("input", (e) => {
    e.stopPropagation();
    node.text = contentInput.value;
  });
  contentInput.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
  if (node.type === "choice") {
    renderChoiceContainer(nodeId, container);
  }
}
function handleNewNodePoint(e, fromId, fromType) {
  e.stopPropagation();
  e.preventDefault();
  if (state.onConnection) {
    const svg = state.connectionsCanvas;
    const tempLine = svg.lastElementChild;
    if (tempLine && tempLine.tagName.toLowerCase() === "path") {
      tempLine.remove();
    }
    state.onConnection = false;
    state.currentConnection = null;
  }
  if (fromType === "choice") {
    if (typeof fromId !== "string") {
      console.error("fromId should be string to create new connection from choice");
      return;
    }
  }
  const node = addNode("choice", e.clientX + window.scrollX + 100, e.clientY + window.scrollY);
  addConnection(fromId, node.id, fromType);
}
function renderChoiceContainer(nodeId, container) {
  const node = state.nodes[nodeId];
  if (!node.choices) {
    return;
  }
  const choiceContainer = document.createElement("div");
  choiceContainer.className = "choice-container";
  const choicesDiv = document.createElement("div");
  choicesDiv.className = "choices-div";
  choicesDiv.id = `div-node-${nodeId}`;
  choicesDiv.innerHTML = "";
  choiceContainer.appendChild(choicesDiv);
  const addButton = document.createElement("button");
  addButton.className = "add-choice";
  addButton.textContent = "+";
  addButton.onclick = () => addChoice(nodeId);
  container.appendChild(choiceContainer);
  container.appendChild(addButton);
}
function addChoice(nodeId) {
  const node = state.nodes[nodeId];
  if (!node.choices) {
    return;
  }
  const choiceId = `${nodeId}-${state.choiceIdCounter}`;
  const choice = {
    id: choiceId,
    text: `Choice #${state.choiceIdCounter}`,
    conditions: "",
    inname: "choice",
    width: getComputedCSSValue("--min-choice-width"),
    height: getComputedCSSValue("--min-choice-height")
  };
  node.choices[choiceId] = choice;
  state.choiceIdCounter++;
  renderChoice(nodeId, choiceId);
  updateNodePadSize(nodeId, choiceId, "+");
}
function renderChoice(nodeId, choiceId) {
  const node = state.nodes[nodeId];
  if (!node.choices) {
    console.error(`Node ${nodeId} has no choices`);
    return;
  }
  const choice = node.choices[choiceId];
  const choiceItem = document.createElement("div");
  choiceItem.className = "choice-item";
  choiceItem.id = `choice-${choiceId}`;
  const choiceContent = document.createElement("div");
  choiceContent.className = "choice-content";
  choiceContent.style.height = `${choice.height}px`;
  choiceContent.style.width = `${choice.width}px`;
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.className = "choice-text node-input";
  textInput.value = choice.text || "Choice";
  const conditionsInput = document.createElement("input");
  conditionsInput.type = "text";
  conditionsInput.className = "choice-conditions node-input";
  conditionsInput.value = choice.conditions;
  conditionsInput.placeholder = "Add conditions...";
  const removeButton = document.createElement("button");
  removeButton.className = "remove-choice";
  removeButton.textContent = "\xD7";
  removeButton.onclick = (e) => {
    e.stopPropagation();
    removeChoice(nodeId, choiceId);
  };
  choiceContent.appendChild(textInput);
  choiceContent.appendChild(conditionsInput);
  choiceContent.appendChild(removeButton);
  choiceItem.appendChild(choiceContent);
  const inputPoint = document.createElement("div");
  inputPoint.className = "connection-point input";
  inputPoint.onclick = (e) => handleConnectionPoint(e, inputPoint, null, null, choiceId, "choice");
  choiceItem.appendChild(inputPoint);
  const outputPoint = document.createElement("div");
  outputPoint.className = "connection-point output";
  outputPoint.onclick = (e) => handleConnectionPoint(e, outputPoint, choiceId, "choice", null, null);
  outputPoint.ondblclick = (e) => handleNewNodePoint(e, choiceId, "choice");
  choiceItem.appendChild(outputPoint);
  let choicesDiv = document.querySelector(`#div-node-${nodeId}`);
  if (!choicesDiv) {
    return;
  }
  choicesDiv.appendChild(choiceItem);
  textInput.addEventListener("input", (e) => {
    e.stopPropagation();
    choice.text = textInput.value;
  });
  textInput.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
  conditionsInput.addEventListener("input", (e) => {
    e.stopPropagation();
    choice.conditions = conditionsInput.value;
  });
  conditionsInput.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
}
function removeChoice(nodeId, choiceId) {
  const node = state.nodes[nodeId];
  if (!node.choices) {
    console.error(`Node ${nodeId} has no choices`);
    return;
  }
  if (!(choiceId in node.choices)) {
    console.error(`Choice ${choiceId} not found in node ${nodeId}`);
    return;
  }
  const connectionsToRemove = Object.values(state.connections).filter(
    (conn) => conn.fromId === choiceId || conn.toId === choiceId
  );
  if (connectionsToRemove.length > 0) {
    addToActionHistory([...Array.from([node.choices[choiceId]]), ...Array.from(connectionsToRemove)]);
  } else {
    addToActionHistory([node.choices[choiceId]]);
  }
  updateNodePadSize(nodeId, choiceId, "-");
  const choice = node.choices[choiceId];
  delete node.choices[choiceId];
  let choicesDiv = document.querySelector(`#div-node-${nodeId}`);
  if (!choicesDiv) {
    return;
  }
  choicesDiv.innerHTML = "";
  Object.entries(node.choices).forEach(([id, _]) => {
    renderChoice(nodeId, id);
  });
  connectionsToRemove.forEach((conn) => {
    removeConnection(conn.id);
  });
  renderAllConnections();
}
function updateNodePadSize(nodeId, choiceId, orient) {
  const node = state.nodes[nodeId];
  if (!node.choices) {
    return;
  }
  const nodeElement = document.getElementById(`node-${nodeId}`);
  if (!nodeElement) {
    return;
  }
  let choice = node.choices[choiceId];
  const nodeDefaultPadding = 2 * getComputedCSSValue("--node-input-padding");
  if (nodeElement) {
    const currentHeight = parseInt(nodeElement.style.height);
    if (orient == "+") {
      node.height = currentHeight + choice.height + nodeDefaultPadding;
    } else {
      node.height = currentHeight - choice.height - nodeDefaultPadding;
    }
    nodeElement.style.height = `${node.height}px`;
  }
}
function removeNode(nodeId) {
  if (nodeId in state.nodes) {
    delete state.nodes[nodeId];
    const nodeElement = document.getElementById(`node-${nodeId}`);
    if (nodeElement) {
      nodeElement.remove();
    }
  } else {
    console.log(`No Node with ID: ${nodeId} found. Skipping`);
  }
}
function calculateMinNodeDimensions(nodeElement) {
  const baseMinWidth = getComputedCSSValue("--min-node-width");
  const baseMinHeight = getComputedCSSValue("--min-node-height");
  const choicesDiv = nodeElement.querySelector(".choices-div");
  const choicesRect = choicesDiv.getBoundingClientRect();
  const minWidth = baseMinWidth;
  const minHeight = baseMinHeight + choicesRect.height;
  console.log(minWidth, minHeight, choicesRect.height);
  return {
    minWidth,
    minHeight
  };
}

// src/modules/actions.ts
function addToActionHistory(objects) {
  state.objectsHistory.push(objects);
}
function undoAction() {
  if (state.objectsHistory.length === 0) {
    console.log("No history to undo");
    return;
  }
  const Items = state.objectsHistory.at(-1);
  if (!Items) {
    console.log("No items in action history");
    return;
  }
  function isNode(item) {
    return item.inname === "node";
  }
  function isConnection(item) {
    return item.inname === "connection";
  }
  function isChoice(item) {
    return item.inname === "choice";
  }
  Items.forEach((item) => {
    if (isNode(item)) {
      const nodeId = Number(item.id);
      if (nodeId in state.nodes) {
        removeNode(nodeId);
      } else {
        state.nodes[nodeId] = item;
        renderNode(nodeId);
        const choices = state.nodes[nodeId].choices;
        if (choices) {
          Object.entries(choices).forEach(([choiceId, choice]) => {
            renderChoice(nodeId, choiceId);
          });
        }
      }
    } else if (isConnection(item)) {
      if (typeof item.fromId === "number" && !(item.fromId in state.nodes)) {
        return;
      }
      if (typeof item.toId === "number" && !(item.toId in state.nodes)) {
        return;
      }
      const connId = Number(item.id);
      if (connId in state.connections) {
        removeConnection(connId);
      } else {
        state.connections[connId] = item;
        renderConnection(state.connections[connId]);
      }
    } else if (isChoice(item)) {
      const choiceId = String(item.id);
      if (choiceId) {
        const [nodeId, _] = choiceId.split("-");
        if (nodeId !== null) {
          let choices = state.nodes[Number(nodeId)].choices;
          if (choices) {
            choices[choiceId] = item;
            const choicesDiv = document.querySelector(`#div-node-${nodeId}`);
            if (choicesDiv) {
              choicesDiv.innerHTML = "";
              Object.keys(choices).forEach((choiceId2) => {
                renderChoice(Number(nodeId), choiceId2);
              });
              updateNodePadSize(Number(nodeId), choiceId, "+");
            }
          }
        }
      }
    }
  });
  state.objectsHistory.pop();
}

// src/modules/connections.ts
function handleConnectionPoint(e, element, fromId, fromType, toId, toType) {
  if (fromId !== null && fromType !== null && !state.onConnection) {
    e.stopPropagation();
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2 + window.scrollX;
    const startY = rect.top + rect.height / 2 + window.scrollY;
    state.currentConnection = {
      id: state.connIdCounter,
      fromId,
      toId,
      fromType,
      toType,
      startX,
      startY,
      endX: 0,
      endY: 0,
      controls: { x: 0, y: 0, type: "success" },
      inname: "connection"
    };
    state.onConnection = true;
    startDrawing(element, state.currentConnection);
  } else if (toId !== null && toType !== null && state.currentConnection) {
    e.stopPropagation();
    state.currentConnection.toId = toId;
    state.currentConnection.toType = toType;
    if (!state.currentConnection) {
      console.error("No active connection to complete");
      return;
    }
    if (state.currentConnection.fromId === state.currentConnection.toId) {
      state.onConnection = false;
      state.currentConnection = null;
      return;
    }
    renderConnection(state.currentConnection);
    state.connections[state.currentConnection.id] = state.currentConnection;
    state.connIdCounter++;
    state.currentConnection = null;
    state.onConnection = false;
  }
}
function startDrawing(titleInput, connection) {
  const svg = state.connectionsCanvas;
  if (svg) {
    let tempLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    tempLine.setAttribute("stroke", "var(--violet-color)");
    tempLine.setAttribute("stroke-width", "2");
    tempLine.setAttribute("fill", "none");
    svg.appendChild(tempLine);
    state.onConnection = true;
    const mouseMoveHandler = (e) => {
      updateLine(e, tempLine, connection);
    };
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", (e) => {
      tempLine.remove();
      state.onConnection = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
    });
  }
}
function renderConnection(conn) {
  var _a;
  const mainFromElement = document.getElementById(`${conn.fromType}-${conn.fromId}`);
  if (!mainFromElement) {
    console.error(`No ${conn.fromType}-${conn.fromId} found.`);
    return;
  }
  const fromElement = mainFromElement.querySelector(`.connection-point.output`);
  if (!fromElement) {
    console.error(`No fromElement for ${conn.fromType}-${conn.fromId} found.`);
    return;
  }
  const mainToElement = document.getElementById(`${conn.toType}-${conn.toId}`);
  if (!mainToElement) {
    console.error(`No ${conn.toType}-${conn.toId} found.`);
    return;
  }
  const toElement = mainToElement.querySelector(`.connection-point.input`);
  if (!toElement) {
    console.error(`No toElement for ${conn.fromType}-${conn.fromId} found.`);
    return;
  }
  const rectFrom = fromElement.getBoundingClientRect();
  conn.startX = rectFrom.left + rectFrom.width / 2;
  conn.startY = rectFrom.top + rectFrom.height / 2;
  const rectTo = toElement.getBoundingClientRect();
  conn.endX = rectTo.left + rectTo.width / 2;
  conn.endY = rectTo.top + rectTo.height / 2;
  const svg = state.connectionsCanvas;
  let line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.id = `connection-${conn.id}`;
  line.setAttribute("stroke", "var(--violet-color)");
  line.setAttribute("stroke-width", "2");
  line.setAttribute("fill", "none");
  const startX = conn.startX;
  const startY = conn.startY;
  const endX = conn.endX;
  const endY = conn.endY;
  const controlPoint1X = startX + (endX - startX) / 2;
  const controlPoint1Y = startY;
  const controlPoint2X = startX + (endX - startX) / 2;
  const controlPoint2Y = endY;
  const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
  line.setAttribute("d", path);
  svg.appendChild(line);
  const canvas = document.getElementById("canvas");
  if (canvas) {
    let mainControlsContainer = canvas.querySelector(".connection-controls");
    if (!mainControlsContainer) {
      mainControlsContainer = document.createElement("div");
      mainControlsContainer.className = "connection-controls";
      canvas.appendChild(mainControlsContainer);
    }
    let connectionControl = mainControlsContainer.querySelector(`#connection-control-${conn.id}`);
    if (!connectionControl) {
      connectionControl = document.createElement("div");
      connectionControl.className = "connection-control-item";
      connectionControl.id = `connection-control-${conn.id}`;
      const typeSelect2 = document.createElement("select");
      typeSelect2.className = "connection-type-select";
      const successOption = document.createElement("option");
      successOption.value = "success";
      successOption.textContent = "S";
      const failureOption = document.createElement("option");
      failureOption.value = "failure";
      failureOption.textContent = "F";
      typeSelect2.appendChild(successOption);
      typeSelect2.appendChild(failureOption);
      typeSelect2.value = conn.controls.type;
      typeSelect2.style.backgroundColor = conn.controls.type === "success" ? "var(--green-color)" : "var(--red-color)";
      typeSelect2.style.color = "white";
      typeSelect2.addEventListener("change", (e) => {
        const target = e.target;
        if (target.value !== "success" && target.value !== "failure") {
          console.error("Invalid connection type value");
          return;
        }
        state.connections[conn.id].controls.type = target.value;
        const newColor = target.value === "success" ? "var(--green-color)" : "var(--red-color)";
        target.style.backgroundColor = newColor;
      });
      connectionControl.appendChild(typeSelect2);
      const removeButton = document.createElement("div");
      removeButton.className = "connection-remove";
      removeButton.innerHTML = "\xD7";
      removeButton.onclick = (e) => {
        if (conn) {
          e.stopPropagation();
          addToActionHistory([conn]);
          removeConnection(conn.id);
        }
      };
      connectionControl.appendChild(removeButton);
      mainControlsContainer.appendChild(connectionControl);
    }
    connectionControl.style.left = `${conn.controls.x}px`;
    connectionControl.style.top = `${conn.controls.y}px`;
  }
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  conn.controls = {
    x: midX,
    y: midY,
    type: ((_a = conn.controls) == null ? void 0 : _a.type) || "success"
  };
  const controlsElement = document.getElementById(`connection-control-${conn.id}`);
  if (!controlsElement) {
    console.error(`Controls element for conn: ${conn.id} not found.`);
    return;
  }
  controlsElement.style.left = `${conn.controls.x}px`;
  controlsElement.style.top = `${conn.controls.y}px`;
  const typeSelect = controlsElement.querySelector(".connection-type-select");
  if (!typeSelect) {
    console.error(`Type select element for conn: ${conn.id} not found.`);
    return;
  }
}
function renderAllConnections() {
  cleanSVG();
  if (state.connections) {
    Object.entries(state.connections).forEach(([connId, conn]) => {
      renderConnection(conn);
    });
  }
}
function updateLine(event, tempLine, connection) {
  const startX = connection.startX - window.scrollX;
  const startY = connection.startY - window.scrollY;
  const endX = event.clientX;
  const endY = event.clientY;
  const controlPoint1X = startX + (endX - startX) / 2;
  const controlPoint1Y = startY;
  const controlPoint2X = startX + (endX - startX) / 2;
  const controlPoint2Y = endY;
  const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
  tempLine.setAttribute("d", path);
}
function removeConnection(connId) {
  delete state.connections[Number(connId)];
  const connElement = document.getElementById(`connection-${connId}`);
  if (connElement) {
    connElement.remove();
  }
  const connectionControls = document.getElementById(`connection-control-${connId}`);
  if (connectionControls) {
    connectionControls.remove();
  }
}
function addConnection(fromId, nodeId, fromType) {
  const connection = {
    id: state.connIdCounter,
    fromId,
    toId: nodeId,
    fromType,
    toType: "node",
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    controls: { x: 0, y: 0, type: "success" },
    inname: "connection"
  };
  state.connections[state.connIdCounter] = connection;
  state.connIdCounter++;
  renderConnection(connection);
}

// src/modules/zoom.ts
function updateZoomDisplay() {
  const zoomPercentage = Math.round(state.currentZoom * 100);
  const zoomDisplay = document.querySelector(".zoom-level");
  if (zoomDisplay) {
    zoomDisplay.textContent = `${zoomPercentage}%`;
  }
}
function initializeZoom() {
  updateZoomDisplay();
}
function zoomIn() {
  if (state.currentZoom < state.maxZoom) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    zoomAtPoint(state.zoomStep, centerX, centerY);
  }
}
function zoomOut() {
  if (state.currentZoom > state.minZoom) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    zoomAtPoint(-state.zoomStep, centerX, centerY);
  }
}
function zoomAtPoint(delta, mouseX, mouseY) {
  const newZoom = Math.max(state.minZoom, Math.min(state.maxZoom, state.currentZoom + delta));
  if (newZoom !== state.currentZoom) {
    const scale = newZoom / state.currentZoom;
    const canvas = document.getElementById("canvas");
    if (!canvas) {
      return;
    }
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = mouseX - canvasRect.left;
    const relativeY = mouseY - canvasRect.top;
    state.currentZoom = newZoom;
    applyZoom();
    adjustNodePositions(scale, relativeX, relativeY);
    renderAllConnections();
    updateZoomDisplay();
  }
}
function applyZoom() {
  Object.entries(state.nodes).forEach(([nodeId, node]) => {
    const nodeElement = document.getElementById(`node-${nodeId}`);
    if (nodeElement) {
      nodeElement.style.transform = `scale(${state.currentZoom})`;
      nodeElement.style.transformOrigin = "top left";
      const baseSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--base-font-size"));
      const scaledSize = baseSize * state.currentZoom;
      const inputs = nodeElement.querySelectorAll(".node-input");
      inputs.forEach((input) => {
        input.style.fontSize = `${scaledSize}px`;
      });
      const connectionPoints = nodeElement.querySelectorAll(".connection-point");
      connectionPoints.forEach((point) => {
        const baseSize2 = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--connection-point-size"));
        point.style.width = `${baseSize2 * state.currentZoom}px`;
        point.style.height = `${baseSize2 * state.currentZoom}px`;
      });
    }
  });
}
function adjustNodePositions(scale, pivotX, pivotY) {
  Object.entries(state.nodes).forEach(([nodeId, node]) => {
    const dx = node.x - pivotX;
    const dy = node.y - pivotY;
    const newX = Math.min(Math.max(0, pivotX + dx * scale), state.canvasWidth);
    const newY = Math.min(Math.max(0, pivotY + dy * scale), state.canvasHeight);
    node.x = newX;
    node.y = newY;
    const nodeElement = document.getElementById(`node-${node.id}`);
    if (nodeElement) {
      nodeElement.style.left = `${newX}px`;
      nodeElement.style.top = `${newY}px`;
    }
  });
}

// src/modules/selection.ts
function startDrag(e, nodeId) {
  if (state.isResizing || e.target instanceof HTMLElement && e.target.className.includes("resizable")) {
    state.isDragging = false;
    return;
  }
  e.preventDefault();
  state.isDragging = true;
  state.isResizing = false;
  const node = state.nodes[nodeId];
  if (!state.selectedNodes.has(node)) {
    if (!e.ctrlKey && !e.metaKey) {
      clearNodeSelection();
    }
    selectNode(nodeId);
  }
  state.selectedNodes.forEach((node2) => {
    if (node2) {
      state.draggedNodes.add(node2.id);
      state.initialDraggingPositions.set(node2.id, {
        x: node2.x,
        y: node2.y,
        offsetX: e.clientX - node2.x,
        offsetY: e.clientY - node2.y
      });
    }
  });
}
function selectNode(nodeId) {
  const nodeElement = document.getElementById(`node-${nodeId}`);
  const node = state.nodes[nodeId];
  if (nodeElement && !state.selectedNodes.has(node)) {
    state.selectedNodes.add(node);
    nodeElement.classList.add("selected");
  }
}
function clearNodeSelection() {
  state.selectedNodes.forEach((node) => {
    if (node && typeof node.id === "number") {
      deselectNode(node.id);
    }
  });
  state.selectedNodes.clear();
}
function deselectNode(nodeId) {
  const nodeElement = document.getElementById(`node-${nodeId}`);
  const node = state.nodes[nodeId];
  if (nodeElement && state.selectedNodes.has(node)) {
    state.selectedNodes.delete(node);
    nodeElement.classList.remove("selected");
  }
}
function handleDrag(e) {
  if (!state.isDragging)
    return;
  state.draggedNodes.forEach((nodeId) => {
    const node = state.nodes[nodeId];
    const initialPos = state.initialDraggingPositions.get(nodeId);
    if (node && initialPos) {
      const newX = Math.min(Math.max(0, e.clientX - initialPos.offsetX), state.canvasWidth);
      const newY = Math.min(Math.max(0, e.clientY - initialPos.offsetY), state.canvasHeight);
      node.x = newX;
      node.y = newY;
      const element = document.getElementById(`node-${nodeId}`);
      if (element) {
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
      }
    }
  });
  renderAllConnections();
}
function endDrag() {
  state.isDragging = false;
  state.draggedNodes.clear();
  state.initialDraggingPositions.clear();
}

// index.ts
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("DOM Content Loaded");
    initializeCanvas(state.canvasWidth, state.canvasHeight);
    initializeZoom();
    const addNodeBtn = document.getElementById("addNode");
    addNodeBtn == null ? void 0 : addNodeBtn.addEventListener("click", () => {
      addNode("choice");
    });
  } catch (error) {
    console.error("Failed to initialize NodeManager:", error);
  }
});
document.addEventListener("mouseup", () => {
  if (state.isResizing) {
    state.isResizing = false;
  }
});
window.addEventListener("resize", () => {
  state.connectionsCanvas.setAttribute("width", window.innerWidth.toString());
  state.connectionsCanvas.setAttribute("height", window.innerHeight.toString());
});
document.addEventListener("mousemove", (e) => handleDrag(e));
document.addEventListener("mouseup", () => {
  endDrag();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete") {
    state.selectedNodes.forEach((node) => {
      const nodeId = Number(node.id);
      removeNode(nodeId);
      Object.entries(state.connections).forEach(([connId, conn]) => {
        let shouldRemove = false;
        if (typeof conn.fromId === "string") {
          const [fromNodeId] = conn.fromId.split("-");
          shouldRemove = Number(fromNodeId) === nodeId;
        } else if (typeof conn.fromId === "number") {
          shouldRemove = Number(conn.fromId) === nodeId;
        }
        if (!shouldRemove && typeof conn.toId === "string") {
          const [toNodeId] = conn.toId.split("-");
          shouldRemove = Number(toNodeId) === nodeId;
        } else if (!shouldRemove && typeof conn.toId === "number") {
          shouldRemove = Number(conn.toId) === nodeId;
        }
        if (shouldRemove) {
          state.connsToRemove.add(conn);
        }
      });
    });
    addToActionHistory([...Array.from(state.selectedNodes), ...Array.from(state.connsToRemove)]);
    state.selectedNodes.clear();
    state.connsToRemove.forEach((conn) => {
      removeConnection(Number(conn.id));
    });
  }
});
window.addEventListener("scroll", () => {
  renderAllConnections();
});
document.addEventListener("mousedown", (e) => {
  if (!(e.target instanceof Element))
    return;
  e.stopPropagation();
  const nodeElement = e.target.closest(".node");
  if (nodeElement) {
    const nodeId = parseInt(nodeElement.id.split("-")[1]);
    const node = state.nodes[nodeId];
    if (e.ctrlKey) {
      if (state.selectedNodes.has(node)) {
        deselectNode(nodeId);
      } else {
        selectNode(nodeId);
      }
    } else {
      if (!state.selectedNodes.has(node)) {
        clearNodeSelection();
        selectNode(nodeId);
      }
    }
    startDrag(e, nodeId);
  }
  if (e.button === 0 && !e.target.closest(".node") && !e.target.closest(".connection-point") && !e.target.closest(".toolbar")) {
    state.onSelection = true;
    state.selectionStart.x = e.clientX + window.scrollX;
    state.selectionStart.y = e.clientY + window.scrollY;
    if (!state.selectionBox)
      return;
    clearNodeSelection();
    state.selectionBox.style.left = `${state.selectionStart.x}px`;
    state.selectionBox.style.top = `${state.selectionStart.y}px`;
    state.selectionBox.style.width = "0px";
    state.selectionBox.style.height = "0px";
    state.selectionBox.style.display = "block";
  }
});
document.addEventListener("mouseup", () => {
  if (state.onSelection) {
    state.onSelection = false;
    if (state.selectionBox) {
      state.selectionBox.style.display = "none";
      document.body.style.userSelect = "";
    }
  }
});
document.addEventListener("mousemove", (e) => {
  if (!state.onSelection)
    return;
  const currentX = e.clientX + window.scrollX;
  const currentY = e.clientY + window.scrollY;
  const width = Math.abs(currentX - state.selectionStart.x);
  const height = Math.abs(currentY - state.selectionStart.y);
  const left = Math.min(currentX, state.selectionStart.x);
  const top = Math.min(currentY, state.selectionStart.y);
  if (!state.selectionBox) {
    return;
  }
  state.selectionBox.style.width = `${width}px`;
  state.selectionBox.style.height = `${height}px`;
  state.selectionBox.style.left = `${left}px`;
  state.selectionBox.style.top = `${top}px`;
  const selectionRect = {
    left,
    right: left + width,
    top,
    bottom: top + height
  };
  document.body.style.userSelect = "none";
  Object.entries(state.nodes).forEach(([nodeId, node]) => {
    const nodeElement = document.getElementById(`node-${node.id}`);
    if (!nodeElement) {
      return;
    }
    const viewportRect = nodeElement.getBoundingClientRect();
    const nodeRect = {
      left: viewportRect.left + window.scrollX,
      right: viewportRect.right + window.scrollX,
      top: viewportRect.top + window.scrollY,
      bottom: viewportRect.bottom + window.scrollY
    };
    const intersects = !(selectionRect.left > nodeRect.right || selectionRect.right < nodeRect.left || selectionRect.top > nodeRect.bottom || selectionRect.bottom < nodeRect.top);
    if (intersects) {
      selectNode(node.id);
    } else {
      deselectNode(node.id);
    }
  });
});
var zoomInBtn = document.getElementById("zoomIn");
zoomInBtn == null ? void 0 : zoomInBtn.addEventListener("click", () => {
  zoomIn();
});
var zoomOutBtn = document.getElementById("zoomOut");
zoomOutBtn == null ? void 0 : zoomOutBtn.addEventListener("click", () => {
  zoomOut();
});
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.code === "KeyZ") {
    e.preventDefault();
    e.stopPropagation();
    undoAction();
  }
});
document.addEventListener("mousedown", (e) => {
  const target = e.target;
  if (target.className.includes("resizable")) {
    e.preventDefault();
    e.stopPropagation();
    state.isResizing = true;
    const nodeId = Number(target.id.split("-")[1]);
    if (typeof nodeId !== "number") {
      return;
    }
    state.activeResizeNode = state.nodes[nodeId];
    state.isDragging = false;
    state.resizeStartX = e.pageX;
    state.resizeStartY = e.pageY;
    clearNodeSelection();
    selectNode(nodeId);
  }
}, true);
document.addEventListener("mousemove", (e) => {
  if (!state.isResizing || !state.activeResizeNode)
    return;
  state.selectedNodes.clear();
  const nodeElement = document.querySelector(`#node-${state.activeResizeNode.id}`);
  if (nodeElement) {
    const { minWidth, minHeight } = calculateMinNodeDimensions(nodeElement);
    const deltaX = e.pageX - state.resizeStartX;
    const deltaY = e.pageY - state.resizeStartY;
    const newWidth = Math.max(minWidth, state.activeResizeNode.width + deltaX / state.currentZoom);
    const newHeight = Math.max(minHeight, state.activeResizeNode.height + deltaY / state.currentZoom);
    if (state.activeResizeNode.width !== newWidth) {
      nodeElement.style.width = `${newWidth}px`;
      state.activeResizeNode.width = newWidth;
      state.resizeStartX = e.pageX;
    }
    if (state.activeResizeNode.height !== newHeight) {
      nodeElement.style.height = `${newHeight}px`;
      state.activeResizeNode.height = newHeight;
      state.resizeStartY = e.pageY;
    }
    renderAllConnections();
  }
}, { passive: true });
document.addEventListener("mouseup", () => {
  if (state.isResizing) {
    state.isResizing = false;
    if (state.activeResizeNode) {
      state.nodes[state.activeResizeNode.id] = state.activeResizeNode;
      state.activeResizeNode = null;
    }
    state.resizeStartX = 0;
    state.resizeStartY = 0;
  }
});
