import { state } from '../state.js';
import * as Types from '../types.js';
import * as Nodes from '../modules/nodes.js';
import * as Utils from '../utils.js';

export function createEditorPanel(): void {
    // Create the panel if it doesn't exist
    if (!state.editorPanel) {
        state.editorPanel = document.createElement('div');
        state.editorPanel.className = 'editor-panel';
        document.body.appendChild(state.editorPanel);
    }
}

export async function showEditorPanel(nodeId: number): Promise<void> {
    if (!state.editorPanel) {
        console.error('Error while editorPanel showing.');
        return;
    }
    if (state.currentPanelNodeId != nodeId) {
        hideEditorPanel();
        await new Promise(resolve => setTimeout(resolve, Utils.getComputedCSSValue('--transition-normal')*1.25));
    }
    state.currentPanelNodeId = nodeId;


    let node = state.nodes[nodeId];
    state.editorPanel.innerHTML = '';

    // Create the editing container
    const container = document.createElement('div');
    container.className = 'node-container';
    
    // Title container with input
    const titleContainer = document.createElement('div');
    titleContainer.className = 'node-title-container';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'node-title node-input';
    titleInput.value = node.title || 'Event title';
    titleInput.addEventListener('input', () => {
        node.title = titleInput.value;
        // Re-render the node to update title
        Nodes.renderNode(nodeId);
    });
    titleInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey && e.code === 'KeyZ') {
            e.stopPropagation(); 
        }
    });

    titleContainer.appendChild(titleInput);
    container.appendChild(titleContainer);
    
    // Content area with textarea
    const contentInput = document.createElement('textarea');
    contentInput.className = 'node-content node-input';
    contentInput.value = node.text || '';
    contentInput.placeholder = 'Enter content...';
    contentInput.rows = 8;
    contentInput.id = "node-content-panel";

    contentInput.addEventListener('input', () => {
        node.text = contentInput.value;
        // Re-render the node to update content
        Nodes.renderNode(nodeId);
    });
    contentInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey && e.code === 'KeyZ') {
            e.stopPropagation(); 
        }
    });
    container.appendChild(contentInput);
    
    if (node.type === 'choice') {
        const choiceContainer = document.createElement('div');
        choiceContainer.className = 'choice-container';
        
        // Create a separate div to hold choices
        const choicesDiv = document.createElement('div');
        choicesDiv.className = 'choices-div';
        choicesDiv.id = `editor-choices-${nodeId}`;
        choiceContainer.appendChild(choicesDiv);

        // Add the "+" button for new choices
        const addButton = document.createElement('button');
        addButton.className = 'add-choice';
        addButton.textContent = '+';
        addButton.id = 'add-choice-editor';
        addButton.onclick = () => {
            Nodes.addChoice(nodeId);
            renderEditorChoices(nodeId);
        };

        // Initial render of choices if there are any existing choices
        if (node.choices && Object.keys(node.choices).length > 0) {
            Object.entries(node.choices).forEach(([choiceId, choice]) => {
                // Create choice elements in the editor
                const choiceItem = document.createElement('div');
                choiceItem.className = 'choice-item';
                choiceItem.id = `editor-choice-${choiceId}`;

                const choiceContent = document.createElement('div');
                choiceContent.className = 'choice-content';
                choiceContent.style.height = `${choice.height}px`;
                choiceContent.style.width = `${choice.width}px`;

                // Choice text input
                const textInput = document.createElement('input');
                textInput.type = 'text';
                textInput.className = 'choice-text node-input';
                textInput.value = choice.text || 'Choice';
                textInput.addEventListener('input', (e) => {
                    e.stopPropagation();
                    choice.text = textInput.value;
                    // Re-render both the node and the specific choice
                    Nodes.renderNode(nodeId);
                    Nodes.renderChoice(nodeId, choiceId);
                });
                // Conditions input
                const conditionsInput = document.createElement('input');
                conditionsInput.type = 'text';
                conditionsInput.className = 'choice-conditions node-input';
                conditionsInput.value = choice.conditions;
                conditionsInput.placeholder = 'Add conditions...';
                conditionsInput.addEventListener('input', (e) => {
                    e.stopPropagation();
                    choice.text = textInput.value;
                    // Re-render both the node and the specific choice
                    Nodes.renderNode(nodeId);
                    Nodes.renderChoice(nodeId, choiceId);
                });
                // Remove button
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-choice';
                removeButton.textContent = '×';
                removeButton.onclick = (e: MouseEvent) => {
                    e.stopPropagation();
                    Nodes.removeChoice(nodeId, choiceId);
                    renderEditorChoices(nodeId);
                };

                choiceContent.appendChild(textInput);
                choiceContent.appendChild(conditionsInput);
                choiceContent.appendChild(removeButton);
                choiceItem.appendChild(choiceContent);
                choicesDiv.appendChild(choiceItem);
            });
        }

        container.appendChild(choiceContainer);
        container.appendChild(addButton);
    }
    
    state.editorPanel.appendChild(container);
    state.editorPanel.classList.add('open');

    // Close button
    const closeButton = document.createElement('div');
    closeButton.className = 'panel-button';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => {
        hideEditorPanel();
    });
    state.editorPanel.appendChild(closeButton);

}

export function renderEditorChoices(nodeId: number): void {
    const node = state.nodes[nodeId];
    if (!node.choices) {
        console.error(`Node ${nodeId} has no choices`);
        return;
    }

    const choicesDiv = document.getElementById(`editor-choices-${nodeId}`);
    if (!choicesDiv) return;
    
    // Clear existing choices
    choicesDiv.innerHTML = '';

    // Render each choice
    Object.entries(node.choices).forEach(([choiceId, choice]) => {
        const choiceItem = document.createElement('div');
        choiceItem.className = 'choice-item';
        choiceItem.id = `editor-choice-${choiceId}`;

        const choiceContent = document.createElement('div');
        choiceContent.className = 'choice-content';
        choiceContent.style.height = `${choice.height}px`;
        choiceContent.style.width = `${choice.width}px`;

        // Choice text input
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'choice-text node-input';
        textInput.value = choice.text || 'Choice';
        textInput.addEventListener('input', () => {
            choice.text = textInput.value;
            const canvasChoiceText = document.querySelector(`#choice-${choiceId} .choice-text`) as HTMLInputElement;
            if (canvasChoiceText) {
                canvasChoiceText.value = textInput.value;
            }
        });
        textInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.ctrlKey && e.code === 'KeyZ') {
                e.stopPropagation();
            }
        });

        // Conditions input
        const conditionsInput = document.createElement('input');
        conditionsInput.type = 'text';
        conditionsInput.className = 'choice-conditions node-input';
        conditionsInput.value = choice.conditions;
        conditionsInput.placeholder = 'Add conditions...';
        conditionsInput.addEventListener('input', () => {
            choice.conditions = conditionsInput.value;
            const canvasChoiceConditions = document.querySelector(`#choice-${choiceId} .choice-conditions`) as HTMLInputElement;
            if (canvasChoiceConditions) {
                canvasChoiceConditions.value = conditionsInput.value;
            }
        });
        conditionsInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.ctrlKey && e.code === 'KeyZ') {
                e.stopPropagation();
            }
        });

        // Remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-choice';
        removeButton.textContent = '×';
        removeButton.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            Nodes.removeChoice(nodeId, choiceId);
            renderEditorChoices(nodeId);
        };

        choiceContent.appendChild(textInput);
        choiceContent.appendChild(conditionsInput);
        choiceContent.appendChild(removeButton);
        choiceItem.appendChild(choiceContent);
        choicesDiv.appendChild(choiceItem);
    });
}

export function hideEditorPanel(): void {
    if (state.editorPanel) {
        state.editorPanel.classList.remove('open');
    }
}