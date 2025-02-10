import { state } from '../state.js';
import * as Utils from '../utils.js';
import * as Conn from '../modules/connections.js';
import * as Node from '../modules/nodes.js';
import * as Zoom from '../modules/zoom.js';

declare global {
    interface Window {
        showSaveFilePicker(options?: {
            suggestedName?: string;
            types?: Array<{
                description: string;
                accept: Record<string, string[]>;
            }>;
        }): Promise<FileSystemFileHandle>;
    }

    interface Window {
        showOpenFilePicker(options?: {
            multiple?: boolean;
            types?: Array<{
                description: string;
                accept: Record<string, string[]>;
            }>;
        }): Promise<FileSystemFileHandle[]>;
    }
}

export async function saveState(): Promise<void> {
    try {
        const saveableState = {
            canvasWidth: state.canvasWidth,
            canvasHeight: state.canvasHeight,
            viewPortPadding: state.viewPortPadding,
            nodes: state.nodes,
            connections: state.connections,
            nodeIdCounter: state.nodeIdCounter,
            connIdCounter: state.connIdCounter,
            choiceIdCounter: state.choiceIdCounter,
            maxChoicesPerNode: state.maxChoicesPerNode,
            currentZoom: state.currentZoom
        };

        const stateJson: string = JSON.stringify(saveableState, null, 2);
        const blob: Blob = new Blob([stateJson], {
            type: 'application/json'
        });

        state.lastSaveLocation = localStorage.getItem('lastStateSaveLocation') || 'editor-state.json';
        const handle: FileSystemFileHandle = await window.showSaveFilePicker({
            suggestedName: state.lastSaveLocation,
            types: [{
                description: 'JSON State File',
                accept: {
                    'application/json': ['.json']
                }
            }]
        });
        const writable: FileSystemWritableFileStream = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        Utils.showNotification('save', 'State saved successfully!');

    } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error saving state:', error);
            throw new Error(`Failed to save state: ${error.message}`);
        }
    }
}

export async function loadState(): Promise<void> {
    try {
        // Show the file picker
        const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [{
                description: 'JSON State File',
                accept: {
                    'application/json': ['.json']
                }
            }]
        });
        const file = await handle.getFile();
        localStorage.setItem('lastStateSaveLocation', handle.name);
        const text = await file.text();
        const loadedState = JSON.parse(text);

        // Update the application state
        state.canvasWidth = loadedState.canvasWidth;
        state.canvasHeight = loadedState.canvasHeight;
        state.viewPortPadding = loadedState.viewPortPadding;
        state.nodes = loadedState.nodes;
        state.connections = loadedState.connections;
        state.nodeIdCounter = loadedState.nodeIdCounter;
        state.connIdCounter = loadedState.connIdCounter;
        state.choiceIdCounter = loadedState.choiceIdCounter;
        state.maxChoicesPerNode = loadedState.maxChoicesPerNode;
        state.currentZoom = loadedState.currentZoom;

        Object.entries(state.nodes).forEach(([nodeId, node]) => {
            console.log(node);
            Node.renderNode(Number(nodeId));
            if (node.choices) {
                Object.entries(node.choices).forEach(([choiceId, choice]) => {
                    Node.renderChoice(Number(nodeId), choiceId);
                });
            }

        });

        Conn.renderAllConnections();
        Zoom.initializeZoom();
        Utils.showNotification('load', 'State loaded successfully!');

    } catch (error: unknown) {
        // Type guard to ensure error is Error type
        if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error loading state:', error);
            throw new Error(`Failed to load state: ${error.message}`);
        }
    }
}
