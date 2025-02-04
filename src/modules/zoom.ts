
import { state } from '../state.js';
import * as Conn from '../modules/connections.js';


function updateZoomDisplay() {
    const zoomPercentage = Math.round(state.currentZoom * 100);
    const zoomDisplay = document.querySelector('.zoom-level');
    if (zoomDisplay) {
        zoomDisplay.textContent = `${zoomPercentage}%`;
    }
}

export function initializeZoom() {
    updateZoomDisplay();
}

export function  zoomIn() {
    if (state.currentZoom < state.maxZoom) {
        // Zoom in at center of viewport
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        zoomAtPoint(state.zoomStep, centerX, centerY);
    }
}
export function  zoomOut() {
    if (state.currentZoom > state.minZoom) {
        // Zoom out at center of viewport
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        zoomAtPoint(-state.zoomStep, centerX, centerY);
    }
}

function zoomAtPoint(delta: number, mouseX: number, mouseY: number) {
    const newZoom = Math.max(state.minZoom, Math.min(state.maxZoom, state.currentZoom + delta));
    
    if (newZoom !== state.currentZoom) {
        // Calculate scaling factor
        const scale = newZoom / state.currentZoom;
        
        // Get canvas element and its current position
        const canvas = document.getElementById('canvas');
        if (!canvas) {
            return;
        }
        const canvasRect = canvas.getBoundingClientRect();
        
        // Calculate mouse position relative to canvas
        const relativeX = mouseX - canvasRect.left;
        const relativeY = mouseY - canvasRect.top;
        
        // Update zoom level
        state.currentZoom = newZoom;
        
        // Apply zoom to canvas and nodes
        applyZoom();
        
        // Adjust node positions to zoom around mouse point
        adjustNodePositions(scale, relativeX, relativeY);
        
        // Update connections
        Conn.renderAllConnections();
        
        // Update zoom display
        updateZoomDisplay();
        
        // Check if we need to shift to positive space
        //shiftToPositiveSpace();
    }
}

function applyZoom() {
    // Apply zoom to all nodes
    Object.entries(state.nodes).forEach(([nodeId, node]) => {
        const nodeElement = document.getElementById(`node-${nodeId}`);
        if (nodeElement) {
            // Scale the node size
            nodeElement.style.transform = `scale(${state.currentZoom})`;
            nodeElement.style.transformOrigin = 'top left';
            
            // Adjust font sizes
            const baseSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size'));
            const scaledSize = baseSize * state.currentZoom;
            
            // Update input fields font size
            const inputs = nodeElement.querySelectorAll<HTMLInputElement>('.node-input');
            inputs.forEach(input => {
                input.style.fontSize = `${scaledSize}px`;
            });
            
            // Update connection points size
            const connectionPoints = nodeElement.querySelectorAll<HTMLInputElement>('.connection-point');
            connectionPoints.forEach(point => {
                const baseSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--connection-point-size'));
                point.style.width = `${baseSize * state.currentZoom}px`;
                point.style.height = `${baseSize * state.currentZoom}px`;
            });
        }
    });
}

function adjustNodePositions(scale: number, pivotX: number, pivotY: number) {
    Object.entries(state.nodes).forEach(([nodeId, node]) => {
        // Calculate new position relative to pivot point
        const dx = node.x - pivotX;
        const dy = node.y - pivotY;
        
        // Scale position
        const newX = Math.min(Math.max(0, pivotX + dx * scale), state.canvasWidth);
        const newY = Math.min(Math.max(0, pivotY + dy * scale), state.canvasHeight);
        
        // Update node position
        node.x = newX;
        node.y = newY;
        
        // Update DOM element position
        const nodeElement = document.getElementById(`node-${node.id}`);
        if (nodeElement) {
            nodeElement.style.left = `${newX}px`;
            nodeElement.style.top = `${newY}px`;
        }
    });
}