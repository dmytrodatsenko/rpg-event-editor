import * as Types from '../types.js';
import * as Utils from '../utils.js';
import * as Conn from '../modules/connections.js';
import * as Actions from '../modules/actions.js';
import * as Panel from '../modules/panel.js';

import { state } from '../state.js';

export function addNode(type: Types.NodeType = 'choice', x: number = Utils.calcRandomPosition('x'), y: number = Utils.calcRandomPosition('y'),): Types.Node {
    const node: Types.Node = {
        id: state.nodeIdCounter,
        type: type,
        title: `Node #${state.nodeIdCounter}`,
        text: '',
        x: x,
        y: y,
        width: Utils.getComputedCSSValue('--init-node-width'),
        height: Utils.getComputedCSSValue('--init-node-height'),
        inname: 'node'
    };
    if (type === 'choice'){
        node.choices = {}
    }
    
    state.nodes[state.nodeIdCounter] = node;
    renderNode(state.nodeIdCounter);

    state.nodeIdCounter++;
    return node;
 }

export function renderNode(nodeId: number): void {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    // Remove/re-render node if exist
    const existingNode = document.getElementById(`node-${nodeId}`);
    if (existingNode) {
        existingNode.remove();
    }

    const node = state.nodes[nodeId]
    if (!node) {
        throw new Error(`Node ${nodeId} not found`);
    }

    const nodeElement = document.createElement('div');
    nodeElement.className = `node ${node.type} resizable`;
    nodeElement.id = `node-${nodeId}`;
    nodeElement.style.left = `${node.x}px`;
    nodeElement.style.top = `${node.y}px`;
    nodeElement.style.transformOrigin = 'top left';
    nodeElement.style.transform = `scale(${state.currentZoom})`;
    nodeElement.style.height = `${node.height}px`;
    nodeElement.style.width = `${node.width}px`;
    
    // // Node container
    const container = document.createElement('div');
    container.className = 'node-container';

    const baseSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size'));
    const scaledFontSize = baseSize * state.currentZoom;
    
    // Title container with input
    const titleContainer = document.createElement('div');
    titleContainer.className = 'node-title-container';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'node-title node-input';
    titleInput.value = node.title || '';
    titleInput.style.fontSize = `${scaledFontSize}px`;
    titleContainer.appendChild(titleInput);
    container.appendChild(titleContainer);

    // // Connection points (for title)
    const titleInputPoint = document.createElement('div');
    titleInputPoint.className = 'connection-point input';
    titleInputPoint.onclick = (e: MouseEvent) => Conn.handleConnectionPoint(e, titleInputPoint, null, null, nodeId, 'node');
    const titleOutputPoint = document.createElement('div');
    titleOutputPoint.className = 'connection-point output';
    titleOutputPoint.onclick = (e: MouseEvent) => Conn.handleConnectionPoint(e, titleOutputPoint, nodeId, 'node', null, null,);
    titleOutputPoint.ondblclick = (e: MouseEvent) => handleNewNodePoint(e, nodeId, 'node');
    titleContainer.appendChild(titleInputPoint);
    titleContainer.appendChild(titleOutputPoint);

    // Content area with textarea
    const contentInput = document.createElement('textarea');
    contentInput.className = 'node-content node-input';
    contentInput.value = node.text || '';
    contentInput.placeholder = 'Enter content...';
    contentInput.style.fontSize = `${scaledFontSize}px`;

    container.appendChild(contentInput);
    nodeElement.appendChild(container);
    canvas.appendChild(nodeElement);

    //Elements listeners
    titleInput.addEventListener('input', (e) => {
        e.stopPropagation();
        node.title = titleInput.value;
        if (state.currentPanelNodeId != nodeId) {
            Panel.hideEditorPanel();
        }
        else {
            if (state.editorPanel && state.editorPanel.classList.contains('open')) {
                Panel.showEditorPanel(nodeId);
            }
        }
    });
    titleInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    titleInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey && e.code === 'KeyZ') {
            e.stopPropagation();
        }
    });
    contentInput.addEventListener('input', (e) => {
        e.stopPropagation();
        node.text = contentInput.value;
        if (state.currentPanelNodeId != nodeId) {
            Panel.hideEditorPanel();
        }
        else {
            if (state.editorPanel && state.editorPanel.classList.contains('open')) {
                Panel.showEditorPanel(nodeId);
            }
        }
    });
    contentInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    contentInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey && e.code === 'KeyZ') {
            e.stopPropagation();
        }
    });
    // Render if choice node type
    if (node.type === 'choice') {
        renderChoiceContainer(nodeId, container);
    }

}

export function handleNewNodePoint(e: MouseEvent, fromId: number | string, fromType: 'node' | 'choice'): void {
    e.stopPropagation();
    e.preventDefault();
    
    if (state.onConnection) {
        const svg = state.connectionsCanvas;
        // Remove any temporary connection line
        const tempLine = svg.lastElementChild;
        if (tempLine && tempLine.tagName.toLowerCase() === 'path') {
            tempLine.remove();
        }
        state.onConnection = false;
        state.currentConnection = null;
    }
    if (fromType === 'choice') {
        if (typeof fromId !== 'string') {
            console.error('fromId should be string to create new connection from choice');
            return;
        }
    }
    const node = addNode('choice', e.clientX + window.scrollX + 100, e.clientY + window.scrollY);
    Conn.addConnection(fromId, node.id, fromType);
}

function renderChoiceContainer(nodeId: number, container: HTMLDivElement): void {
    const node = state.nodes[nodeId]
    if (!node.choices) {
        return;
    }

    const choiceContainer = document.createElement('div');
    choiceContainer.className = 'choice-container';
    
    // Create a separate div to hold choices
    const choicesDiv = document.createElement('div');
    choicesDiv.className = 'choices-div';
    choicesDiv.id = `div-node-${nodeId}`;
    choicesDiv.innerHTML = '';
    choiceContainer.appendChild(choicesDiv);

    // Add the "+" button for new choices
    const addButton = document.createElement('button');
    addButton.className = 'add-choice';
    addButton.textContent = '+';
    addButton.onclick = () => addChoice(nodeId);

    container.appendChild(choiceContainer);
    container.appendChild(addButton);
}

export function addChoice(nodeId: number): void {
    const node = state.nodes[nodeId]
    if (!node.choices) {
        return;
    }
    if (Object.values(node.choices).length >= state.maxChoicesPerNode) {
        Utils.showNotification('error', `Max choices in Node: ${nodeId}`);
        return;
    }
    const choiceId = `${nodeId}-${state.choiceIdCounter}`;

    const choice: Types.Choice = {
        id: choiceId,
        text: `Choice #${state.choiceIdCounter}`,
        conditions: '',
        inname: 'choice',
        width: Utils.getComputedCSSValue('--min-choice-width'),
        height: Utils.getComputedCSSValue('--min-choice-height'),
    };
    node.choices[choiceId] = choice;
    state.choiceIdCounter++;

    renderChoice(nodeId, choiceId);
    updateNodePadSize(nodeId, choiceId, '+');

    if (state.editorPanel && state.editorPanel.classList.contains('open')) {
        Panel.renderEditorChoices(nodeId);
    }
    //state.addToActionHistory([choice]);
}

export function renderChoice(nodeId: number, choiceId: string): void {
    
    const node = state.nodes[nodeId];
    if (!node.choices) {
        console.error(`Node ${nodeId} has no choices`);
        return;
    }
    const choice = node.choices[choiceId];
    
    const choiceItem = document.createElement('div');
    choiceItem.className = 'choice-item';
    choiceItem.id = `choice-${choiceId}`;    

    const choiceContent = document.createElement('div');
    choiceContent.className = 'choice-content';
    choiceContent.style.height = `${choice.height}px`;
    choiceContent.style.width = `${choice.width}px`;

    // Choice text input
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'choice-text node-input';
    textInput.value = choice.text || 'Choice';

    // Conditions input
    const conditionsInput = document.createElement('input');
    conditionsInput.type = 'text';
    conditionsInput.className = 'choice-conditions node-input';
    conditionsInput.value = choice.conditions;
    conditionsInput.placeholder = 'Add conditions...';

    // Remove button
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-choice';
    removeButton.textContent = '×';

    removeButton.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        removeChoice(nodeId, choiceId);
    };

    choiceContent.appendChild(textInput);
    choiceContent.appendChild(conditionsInput);
    choiceContent.appendChild(removeButton);
    
    //choiceItem.appendChild(buttonContainer);
    choiceItem.appendChild(choiceContent);

    // Connection points
    const inputPoint = document.createElement('div');
    inputPoint.className = 'connection-point input';
    inputPoint.onclick = (e) => Conn.handleConnectionPoint(e, inputPoint, null, null, choiceId, 'choice');
    choiceItem.appendChild(inputPoint);

    const outputPoint = document.createElement('div');
    outputPoint.className = 'connection-point output';
    outputPoint.onclick = (e) => Conn.handleConnectionPoint(e, outputPoint, choiceId, 'choice', null, null);
    outputPoint.ondblclick = (e: MouseEvent) => handleNewNodePoint(e, choiceId, 'choice');
    choiceItem.appendChild(outputPoint);
    
    // Find the choices container and append the choice item
    let choicesDiv = document.querySelector(`#div-node-${nodeId}`);
    if (!choicesDiv) {return;}
    choicesDiv.appendChild(choiceItem);

    // Event listeners
    textInput.addEventListener('input', (e) => {
        e.stopPropagation();
        choice.text = textInput.value;
        if (state.currentPanelNodeId != nodeId) {
            Panel.hideEditorPanel();
        }
        else {
            if (state.editorPanel && state.editorPanel.classList.contains('open')) {
                Panel.showEditorPanel(nodeId);
            }
        }
    });
    textInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    textInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey && e.code === 'KeyZ') {
            e.stopPropagation();
        }
    });

    conditionsInput.addEventListener('input', (e) => {
        e.stopPropagation();
        choice.conditions = conditionsInput.value;
        if (state.currentPanelNodeId != nodeId) {
            Panel.hideEditorPanel();
        }
        else {
            if (state.editorPanel && state.editorPanel.classList.contains('open')) {
                Panel.showEditorPanel(nodeId);
            }
        }
    });
    conditionsInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    conditionsInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey && e.code === 'KeyZ') {
            e.stopPropagation();
        }
    });

}


export function removeChoice(nodeId: number, choiceId: string): void {
    const node = state.nodes[nodeId];
    if (!node.choices) {
        console.error(`Node ${nodeId} has no choices`);
        return;
    }

    if (!(choiceId in node.choices)) {
        console.error(`Choice ${choiceId} not found in node ${nodeId}`);
        return;
    }

    // Store connections to be removed
    const connectionsToRemove = Object.values(state.connections).filter(conn => 
        conn.fromId === choiceId || conn.toId === choiceId
    );

    // Add connections to history before removal

    if (connectionsToRemove.length > 0) {
        Actions.addToActionHistory([...Array.from([node.choices[choiceId]]), ...Array.from(connectionsToRemove)]);
    }
    else {
        Actions.addToActionHistory([node.choices[choiceId]]);
    }

    // Update node size based on choice size
    updateNodePadSize(nodeId, choiceId, '-');

    // Remove choice from node
    const choice = node.choices[choiceId];
    delete node.choices[choiceId];

    // Remove choice element and re-render other choices
    let choicesDiv = document.querySelector(`#div-node-${nodeId}`) as HTMLDivElement;
    if (!choicesDiv) {return;}
    choicesDiv.innerHTML = '';
    Object.entries(node.choices).forEach(([id, _]) => {
        renderChoice(nodeId, id);
    });

    // Remove related connections
    connectionsToRemove.forEach(conn => {
        Conn.removeConnection(conn.id);
    });

    // Update connections
    Conn.renderAllConnections();

    //Udpate editor panel
    if (state.editorPanel && state.editorPanel.classList.contains('open')) {
        Panel.renderEditorChoices(nodeId);
    }
}


export function updateNodePadSize(nodeId: number, choiceId: string, orient: '+' | '-'): void {
    const node = state.nodes[nodeId];
    if (!node.choices) {
        return;
    }

    const nodeElement = document.getElementById(`node-${nodeId}`);
    if (!nodeElement) {
        return;
    }

    let choice = node.choices[choiceId];
    const nodeDefaultPadding = 2 * Utils.getComputedCSSValue('--node-input-padding');
    if (nodeElement) {
        const currentHeight = parseInt(nodeElement.style.height);
        if (orient == '+') {
            node.height = currentHeight + choice.height + nodeDefaultPadding;
        }
        else {
            node.height = currentHeight - choice.height - nodeDefaultPadding;
        }
        nodeElement.style.height = `${node.height}px`;
    }
}


export function removeNode(nodeId: number): void {
    if (nodeId in state.nodes) {
        // Remove node and node elements
        delete state.nodes[nodeId];
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement) {
            nodeElement.remove();
        }
    } else {
        console.log(`No Node with ID: ${nodeId} found. Skipping`);
    }
}

export function calculateMinNodeDimensions(nodeElement: HTMLElement): { minWidth: number, minHeight: number } {
    // Get base minimum dimensions from CSS
    const baseMinWidth = Utils.getComputedCSSValue('--min-node-width');
    const baseMinHeight = Utils.getComputedCSSValue('--min-node-height');
    const choicesDiv = nodeElement.querySelector('.choices-div') as HTMLDivElement;
    
    const choicesRect = choicesDiv.getBoundingClientRect();
    const minWidth = baseMinWidth;
    const minHeight = baseMinHeight + choicesRect.height; 
    return {
        minWidth: minWidth,
        minHeight: minHeight
    };
}



// export function calculateMinNodeDimensions(nodeElement: HTMLElement): { minWidth: number, minHeight: number } {
//     // Get base minimum dimensions from CSS
//     const baseMinWidth = Utils.getComputedCSSValue('--min-node-width');
//     const baseMinHeight = Utils.getComputedCSSValue('--min-node-height');
    
//     const titleContainer = nodeElement.querySelector('.node-title-container') as HTMLElement;
//     const contentInput = nodeElement.querySelector('.node-content') as HTMLElement;
    
//     // Get title and content heights
//     const titleHeight = titleContainer ? titleContainer.offsetHeight : 0;
//     const contentHeight = contentInput ? contentInput.offsetHeight : 0;

//     // Find choices container
//     const choicesContainer = nodeElement.querySelector('.choice-container');
//     if (!choicesContainer) {
//         return {  
//             minWidth: baseMinWidth,
//             minHeight: Math.max(baseMinHeight, titleHeight + contentHeight) 
//         };
//     }

    
//     // Calculate choices dimensions
//     const choicesDiv = choicesContainer.querySelector('.choices-div');
//     let choicesHeight = 0;
//     let maxChoiceWidth = baseMinWidth;

//     if (choicesDiv) {
//         // Get all choice items
//         const choices = choicesDiv.querySelectorAll('.choice-item');
//         choices.forEach(choice => {
//             const choiceElement = choice as HTMLElement;
//             choicesHeight += choiceElement.offsetHeight;
//             const choiceWidth = choiceElement.offsetWidth;
//             maxChoiceWidth = Math.max(maxChoiceWidth, choiceWidth);    
//         });

//         // Add spacing between choices if there are multiple choices
//         if (choices.length > 1) {
//             choicesHeight += (choices.length - 1); //* contentSpacing;
//         }
//     }

//     //Work here add choices 
//     return {  
//         minWidth: baseMinWidth,
//         minHeight: Math.max(baseMinHeight, titleHeight + contentHeight) 
//     };
// }


