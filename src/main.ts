import * as Utils from './utils.js';
import * as Zoom from './modules/zoom.js';
import * as Nodes from './modules/nodes.js';
import * as Select from './modules/selection.js';
import * as Actions from './modules/actions.js';
import * as Conn from './modules/connections.js';

import {state} from './state.js';

// Set up canvas dimensions and scrolling


document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM Content Loaded');
        Utils.initializeCanvas(state.canvasWidth, state.canvasHeight);
        Zoom.initializeZoom();

        //Add node
        const addNodeBtn = document.getElementById('addNode');
        addNodeBtn?.addEventListener('click', () => {
            Nodes.addNode('choice');
        });
        
    } catch (error) {
        console.error('Failed to initialize NodeManager:', error);
    }

});

document.addEventListener('mouseup', () => {
    if (state.isResizing) {
        state.isResizing = false;
    }
});


// Keep existing resize listener
window.addEventListener('resize', () => {
    state.connectionsCanvas.setAttribute('width', window.innerWidth.toString());
    state.connectionsCanvas.setAttribute('height', window.innerHeight.toString());
});


// Add event listeners for dragging with proper binding
document.addEventListener('mousemove', (e) => Select.handleDrag(e));
document.addEventListener('mouseup', () => {
    Select.endDrag();
});


// Deletion
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete') {
        state.selectedNodes.forEach((node) => {
            const nodeId = Number(node.id);
            Nodes.removeNode(nodeId);
            
            // Remove all connections attached to the node and conn elements
            Object.entries(state.connections).forEach(([connId, conn]) => {
                let shouldRemove = false;
    
                if (typeof conn.fromId === 'string') {
                    const [fromNodeId] = conn.fromId.split('-');
                    shouldRemove = Number(fromNodeId) === nodeId;
                }
                else if (typeof conn.fromId === 'number'){
                    shouldRemove = Number(conn.fromId) === nodeId;
                }
                if (!shouldRemove && typeof conn.toId === 'string') {
                    const [toNodeId] = conn.toId.split('-');
                    shouldRemove = Number(toNodeId) === nodeId;
                }
                else if (!shouldRemove && typeof conn.toId === 'number'){
                    shouldRemove = Number(conn.toId) === nodeId;
                }

                if (shouldRemove) {
                    state.connsToRemove.add(conn);
                }
            });
        });

        Actions.addToActionHistory([...Array.from(state.selectedNodes), ...Array.from(state.connsToRemove)]);
        state.selectedNodes.clear();
        state.connsToRemove.forEach(conn => {
            Conn.removeConnection(Number(conn.id));
        });
    }
});


// Add scroll event listener
window.addEventListener('scroll', () => {
    Conn.renderAllConnections();
});

//Selection listeners
document.addEventListener('mousedown', (e: MouseEvent) => {
    // Type guard for event target
    if (!(e.target instanceof Element)) return;
    e.stopPropagation();

    const nodeElement = e.target.closest('.node');
    
    if (nodeElement) {
        const nodeId = parseInt(nodeElement.id.split('-')[1]);
        const node = state.nodes[nodeId];

        if (e.ctrlKey) {
            if (state.selectedNodes.has(node)) {
                Select.deselectNode(nodeId);
            } else {
                Select.selectNode(nodeId);
            }
        } else {
            // Only clear existing selection if clicking on an unselected node
            if (!state.selectedNodes.has(node)) {
                Select.clearNodeSelection();
                Select.selectNode(nodeId);
            }
        }       
        Select.startDrag(e, nodeId); 
    }

    // Only start selection if left mouse button is pressed and not on a node or connection
    if (e.button === 0 && 
        !e.target.closest('.node') && 
        !e.target.closest('.connection-point') &&
        !e.target.closest('.toolbar')) {
        state.onSelection = true;
        state.selectionStart.x = e.clientX + window.scrollX;
        state.selectionStart.y = e.clientY + window.scrollY;

        if (!state.selectionBox) return;

        //Clear exist slection
        Select.clearNodeSelection();

        // Update selection box position and size
        state.selectionBox.style.left = `${state.selectionStart.x}px`;
        state.selectionBox.style.top = `${state.selectionStart.y}px`;
        state.selectionBox.style.width = '0px';
        state.selectionBox.style.height = '0px';
        state.selectionBox.style.display = 'block';
    }
});
// Handle mouseup event to finish selection
document.addEventListener('mouseup', () => {
    if (state.onSelection) {
        state.onSelection = false;
        if (state.selectionBox) {
            state.selectionBox.style.display = 'none';
            document.body.style.userSelect = '';
        }
    }
});
// Handle mousemove event to update selection area
document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!state.onSelection) return;

    const currentX = e.clientX + window.scrollX;
    const currentY = e.clientY + window.scrollY;
    
    // Calculate dimensions and position of selection box
    const width = Math.abs(currentX - state.selectionStart.x);
    const height = Math.abs(currentY - state.selectionStart.y);
    const left = Math.min(currentX, state.selectionStart.x);
    const top = Math.min(currentY, state.selectionStart.y);
    
    // Update selection box
    if (!state.selectionBox) {
        return;
    }
    state.selectionBox.style.width = `${width}px`;
    state.selectionBox.style.height = `${height}px`;
    state.selectionBox.style.left = `${left}px`;
    state.selectionBox.style.top = `${top}px`;
    
    // Get selection box boundaries in document coordinates
    const selectionRect = {
        left: left,
        right: left + width,
        top: top,
        bottom: top + height
    };

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    
    // Check which nodes are within the selection
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
        
        // Check if node intersects with selection box
        const intersects = !(
            selectionRect.left > nodeRect.right ||
            selectionRect.right < nodeRect.left ||
            selectionRect.top > nodeRect.bottom ||
            selectionRect.bottom < nodeRect.top
        );
        
        if (intersects) {
            Select.selectNode(node.id);
        } else {
            Select.deselectNode(node.id);
        }

    });
});

// Zoom listeners
const zoomInBtn = document.getElementById('zoomIn');
zoomInBtn?.addEventListener('click', () => {
    Zoom.zoomIn();
});
const zoomOutBtn = document.getElementById('zoomOut');
zoomOutBtn?.addEventListener('click', () => {
    Zoom.zoomOut();
});

// Undo
document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.ctrlKey && e.code === 'KeyZ') {
        e.preventDefault();
        e.stopPropagation();
        Actions.undoAction();
    }
});

//Resize
document.addEventListener('mousedown', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.className.includes('resizable')) {
        e.preventDefault();
        e.stopPropagation();
        state.isResizing = true;
        const nodeId = Number(target.id.split('-')[1]);
        if (typeof nodeId !== 'number') { return; }
        state.activeResizeNode = state.nodes[nodeId];
        state.isDragging = false;

        state.resizeStartX = e.pageX;  
        state.resizeStartY = e.pageY; 

        // Clear other selected nodes, select only active node
        Select.clearNodeSelection();
        Select.selectNode(nodeId);
    }
}, true); 

document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!state.isResizing || !state.activeResizeNode) return;
    
    state.selectedNodes.clear();
    const nodeElement = document.querySelector<HTMLInputElement>(`#node-${state.activeResizeNode.id}`);
    if (nodeElement) {
        const { minWidth, minHeight } = Nodes.calculateMinNodeDimensions(nodeElement);
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
        Conn.renderAllConnections();
    }
}, { passive: true });

document.addEventListener('mouseup', () => {
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

