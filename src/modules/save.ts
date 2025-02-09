import { state } from '../state.js';

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

        // Convert to JSON, maintaining readable formatting
        const stateJson: string = JSON.stringify(saveableState, null, 2);

        // Create a Blob with the JSON data
        const blob: Blob = new Blob([stateJson], {
            type: 'application/json'
        });

        // Get the last used filename from localStorage or use default
        const lastSaveLocation: string = localStorage.getItem('lastStateSaveLocation') || 'editor-state.json';

        // Show the save dialog
        const handle: FileSystemFileHandle = await window.showSaveFilePicker({
            suggestedName: lastSaveLocation,
            types: [{
                description: 'JSON State File',
                accept: {
                    'application/json': ['.json']
                }
            }]
        });

        // Save the filename for next time
        localStorage.setItem('lastStateSaveLocation', handle.name);

        // Write the file
        const writable: FileSystemWritableFileStream = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        console.log('State saved successfully!');
    } catch (error: unknown) {
        // Type guard to ensure error is Error type
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

        // Get the file
        const file = await handle.getFile();

        // Store the filename for next time
        localStorage.setItem('lastStateSaveLocation', handle.name);

        // Read the file contents
        const text = await file.text();
        
        // Parse the JSON
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

        console.log('State loaded successfully!');
    } catch (error: unknown) {
        // Type guard to ensure error is Error type
        if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error loading state:', error);
            throw new Error(`Failed to load state: ${error.message}`);
        }
    }
}
