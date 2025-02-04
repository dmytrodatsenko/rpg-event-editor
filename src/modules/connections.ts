import * as Types from '../types.js';
import { state } from '../state.js';
import * as Utils from '../utils.js';
import * as Actions from '../modules/actions.js';

export function handleConnectionPoint(
        e: Event, 
        element: HTMLDivElement,
        fromId: number | string | null, 
        fromType: string | null,
        toId: number | string | null, 
        toType: string | null
    ): void {
    if ((fromId !== null && fromType !== null) && !state.onConnection) {
        e.stopPropagation();
        const rect = element.getBoundingClientRect();
        
        // Calculate center point of the connection point
        const startX = rect.left + (rect.width / 2) + window.scrollX;
        const startY = rect.top + (rect.height / 2) + window.scrollY;

        state.currentConnection = {
            id: state.connIdCounter,
            fromId: fromId,
            toId: toId,
            fromType: fromType,
            toType: toType,
            startX: startX,
            startY: startY,
            endX: 0,
            endY: 0,
            controls: { x: 0, y: 0, type: 'success'},
            inname: 'connection'
        };
        state.onConnection = true;
        startDrawing(element, state.currentConnection);
    }
    else if (toId !== null &&  toType !== null && state.currentConnection) {
        e.stopPropagation();
        state.currentConnection.toId = toId;
        state.currentConnection.toType = toType;

        // Double check connection existance
        if (!state.currentConnection) {
            console.error('No active connection to complete');
            return;
        }

        // Ommiting self connection (TODO Add parser same choice to same node)
        if (state.currentConnection.fromId === state.currentConnection.toId) {
            state.onConnection = false;
            state.currentConnection = null;
            return;
        }

        renderConnection(state.currentConnection);
        state.connections[state.currentConnection.id] = state.currentConnection;

        state.connIdCounter++;

        //addToActionHistory([currentConnection]);
        state.currentConnection = null;
        state.onConnection = false;

    }

}

export function startDrawing(titleInput: HTMLDivElement, connection: Types.Connection): void {
    const svg = state.connectionsCanvas;
    if (svg) {
        let tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempLine.setAttribute('stroke', 'var(--violet-color)');
        tempLine.setAttribute('stroke-width', '2');
        tempLine.setAttribute('fill', 'none');
        svg.appendChild(tempLine);

        state.onConnection = true;
        const mouseMoveHandler = (e: MouseEvent) => {
            updateLine(e, tempLine, connection);
        };
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', (e: MouseEvent) => {
            tempLine.remove();
            state.onConnection = false;
            document.removeEventListener('mousemove', mouseMoveHandler);
        })
    }
}

export function renderConnection(conn: Types.Connection): void {
    const mainFromElement = document.getElementById(`${conn.fromType}-${conn.fromId}`);
    if (!mainFromElement) {
        console.error(`No ${conn.fromType}-${conn.fromId} found.`)
        return;
    }
    const fromElement = mainFromElement.querySelector(`.connection-point.output`);
    if (!fromElement) {
        console.error(`No fromElement for ${conn.fromType}-${conn.fromId} found.`);
        return;
    }

    const mainToElement = document.getElementById(`${conn.toType}-${conn.toId}`);
    if (!mainToElement) {
        console.error(`No ${conn.toType}-${conn.toId} found.`)
        return;
    }
    const toElement = mainToElement.querySelector(`.connection-point.input`);
    if (!toElement) {
        console.error(`No toElement for ${conn.fromType}-${conn.fromId} found.`);
        return;
    }

    const rectFrom = fromElement.getBoundingClientRect();
    conn.startX = rectFrom.left + (rectFrom.width / 2); 
    conn.startY = rectFrom.top + (rectFrom.height / 2); 

    const rectTo = toElement.getBoundingClientRect();
    conn.endX = rectTo.left + (rectTo.width / 2);
    conn.endY = rectTo.top + (rectTo.height / 2); 

    //Update connection line
    const svg = state.connectionsCanvas;
    let line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.id = `connection-${conn.id}`;
    line.setAttribute('stroke', 'var(--violet-color)');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('fill', 'none');

    const startX = conn.startX;
    const startY = conn.startY;
    const endX = conn.endX;
    const endY = conn.endY;
    const controlPoint1X = startX + (endX - startX) / 2;
    const controlPoint1Y = startY;
    const controlPoint2X = startX + (endX - startX) / 2;
    const controlPoint2Y = endY;
    const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
    
    line.setAttribute('d', path);
    svg.appendChild(line);
    const canvas = document.getElementById('canvas');
    if (canvas) {
        // Get or create the main controls container
        let mainControlsContainer = canvas.querySelector('.connection-controls') as HTMLElement;
        if (!mainControlsContainer) {
            mainControlsContainer = document.createElement('div');
            mainControlsContainer.className = 'connection-controls';
            canvas.appendChild(mainControlsContainer);
        }
    
        // Check if connection control already exists
        let connectionControl = mainControlsContainer.querySelector(`#connection-control-${conn.id}`) as HTMLElement;
        
        // Only create new elements if connectionControl doesn't exist
        if (!connectionControl) {
            connectionControl = document.createElement('div');
            connectionControl.className = 'connection-control-item';
            connectionControl.id = `connection-control-${conn.id}`;
            
            // Create the select element
            const typeSelect = document.createElement('select');
            typeSelect.className = 'connection-type-select';
            
            const successOption = document.createElement('option');
            successOption.value = 'success';
            successOption.textContent = 'S';
            const failureOption = document.createElement('option');
            failureOption.value = 'failure';
            failureOption.textContent = 'F';
            
            typeSelect.appendChild(successOption);
            typeSelect.appendChild(failureOption);
            
            typeSelect.value = conn.controls.type;
            typeSelect.style.backgroundColor = conn.controls.type === 'success' ? 'var(--green-color)' : 'var(--red-color)';
            typeSelect.style.color = 'white';
            
            typeSelect.addEventListener('change', (e: Event) => {
                const target = e.target as HTMLSelectElement;
                if (target.value !== 'success' && target.value !== 'failure') {
                    console.error('Invalid connection type value');
                    return;
                }
                state.connections[conn.id].controls.type = target.value;
                const newColor = target.value === 'success' ? 'var(--green-color)' : 'var(--red-color)';
                target.style.backgroundColor = newColor;
            });

            // Add select to connection control
            connectionControl.appendChild(typeSelect);
    
            const removeButton = document.createElement('div');
            removeButton.className = 'connection-remove';
            removeButton.innerHTML = '×';
            removeButton.onclick = (e: MouseEvent) => {
                if (conn) {
                    e.stopPropagation();
                    Actions.addToActionHistory([conn]);
                    removeConnection(conn.id);
                }
            };
            connectionControl.appendChild(removeButton);
            
            // Add connection control to main container
            mainControlsContainer.appendChild(connectionControl);
        }
    
        // Update position even if element already exists
        connectionControl.style.left = `${conn.controls.x}px`;
        connectionControl.style.top = `${conn.controls.y}px`;
    }

    // Update control position in the connection object
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    conn.controls = {
        x: midX,
        y: midY, 
        type: conn.controls?.type || 'success'
    };

    const controlsElement = document.getElementById(`connection-control-${conn.id}`);
    if (!controlsElement) {
        console.error(`Controls element for conn: ${conn.id} not found.`);
        return;
    }
    controlsElement.style.left = `${conn.controls.x}px`;
    controlsElement.style.top = `${conn.controls.y}px`;

    const typeSelect = controlsElement.querySelector('.connection-type-select');
    if (!typeSelect) {
        console.error(`Type select element for conn: ${conn.id} not found.`);
        return;
    }
}

export function renderAllConnections(): void {
    Utils.cleanSVG();
    if (state.connections) {
        Object.entries(state.connections).forEach(([connId, conn]) => {
            renderConnection(conn);
        });
    }
}


function  updateLine(event: MouseEvent, tempLine: SVGPathElement, connection: Types.Connection) {        
    const startX = connection.startX - window.scrollX;
    const startY = connection.startY - window.scrollY;
    
    const endX = event.clientX;
    const endY = event.clientY;
    
    // Create curved path
    const controlPoint1X = startX + (endX - startX) / 2;
    const controlPoint1Y = startY;
    const controlPoint2X = startX + (endX - startX) / 2;
    const controlPoint2Y = endY;
    
    const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
    tempLine.setAttribute('d', path);
}


export function removeConnection(connId: number){
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

export function addConnection(fromId: number | string, nodeId: number, fromType: string): void {
    const connection: Types.Connection = {
        id: state.connIdCounter,
        fromId: fromId,
        toId: nodeId,
        fromType: fromType,
        toType: 'node',
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        controls: { x: 0, y: 0, type: 'success' },
        inname: 'connection'
    };
    state.connections[state.connIdCounter] = connection;
    state.connIdCounter ++;
    renderConnection(connection);
}

