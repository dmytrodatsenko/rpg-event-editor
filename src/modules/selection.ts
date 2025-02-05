import { state } from '../state.js';
import * as Conn from '../modules/connections.js';

export function startDrag(e: MouseEvent, nodeId: number): void {
    // Don't start drag if resizing
    if (state.isResizing || e.target instanceof HTMLElement && e.target.className.includes('resizable')) {
        state.isDragging = false;
        return;
    }

    e.preventDefault();

    state.isDragging = true;
    state.isResizing = false;
    const node = state.nodes[nodeId];
    // Handle selection during drag start
    if (!state.selectedNodes.has(node)) {
        if (!e.ctrlKey && !e.metaKey) {
            clearNodeSelection();
        }
        selectNode(nodeId);
    }        
    state.selectedNodes.forEach(node => {
        if (node) {
            state.draggedNodes.add(node.id);
            state.initialDraggingPositions.set(node.id, {
                x: node.x,
                y: node.y,
                offsetX: e.clientX - node.x,
                offsetY: e.clientY - node.y
            });
        }
    });
}

export function selectNode(nodeId: number) {
    const nodeElement = document.getElementById(`node-${nodeId}`);
    const node = state.nodes[nodeId];
    if (nodeElement && !state.selectedNodes.has(node)) {
        state.selectedNodes.add(node);
        nodeElement.classList.add('selected');
    }
}

export function clearNodeSelection(): void {
    state.selectedNodes.forEach(node => {
        if (node && typeof node.id === 'number') {
            deselectNode(node.id);
        }
    });
    state.selectedNodes.clear();
}

export function deselectNode(nodeId: number): void {
    const nodeElement = document.getElementById(`node-${nodeId}`);
    const node = state.nodes[nodeId];
    if (nodeElement && state.selectedNodes.has(node)) {
        state.selectedNodes.delete(node);
        nodeElement.classList.remove('selected');
    }
}

export function handleDrag(e: MouseEvent): void {
    if (!state.isDragging) return;
    
    state.draggedNodes.forEach((nodeId: number) => {
        const node = state.nodes[nodeId];
        const initialPos = state.initialDraggingPositions.get(nodeId);
        
        if (node && initialPos) {
            // Calculate new position
            const newX = Math.min(Math.max(0, e.clientX - initialPos.offsetX), state.canvasWidth);
            const newY = Math.min(Math.max(0, e.clientY - initialPos.offsetY), state.canvasHeight);
            
            // Update node position
            node.x = newX;
            node.y = newY;
            
            // Update DOM element position
            const element = document.getElementById(`node-${nodeId}`);
            if (element) {
                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
            }
        }
    });
    //Render all connections after drag happened (TODO! not memory efficient, render only those connection that were dragged with node)
    Conn.renderAllConnections();
}

export function endDrag(): void {
    state.isDragging = false;
    state.draggedNodes.clear();
    state.initialDraggingPositions.clear();
}