import { state } from '../state.js';
import * as Types from '../types.js';
import * as Conn from '../modules/connections.js';
import * as Nodes from '../modules/nodes.js';

export function addToActionHistory(objects: Array<Types.Node | Types.Connection | Types.Choice>): void {
    state.objectsHistory.push(objects);
}

export function undoAction(): void {
    if (state.objectsHistory.length === 0) {
        console.log("No history to undo");
        return;
    }

    const Items = state.objectsHistory.at(-1);
    if (!Items) {
        console.log('No items in action history');
        return;
    }
    function isNode(item: Types.Node | Types.Connection | Types.Choice): item is Types.Node { return item.inname === 'node';}
    function isConnection(item: Types.Node | Types.Connection | Types.Choice): item is Types.Connection { return item.inname === 'connection';}
    function isChoice(item: Types.Node | Types.Connection | Types.Choice): item is Types.Choice { return item.inname === 'choice';}

    Items.forEach(item => {
        if (isNode(item)) {
            const nodeId = Number(item.id);
            if (nodeId in state.nodes) {
                Nodes.removeNode(nodeId);
            }
            else {
                state.nodes[nodeId] = item;
                Nodes.renderNode(nodeId);
                const choices = state.nodes[nodeId].choices;
                if (choices){
                    Object.entries(choices).forEach(([choiceId, choice]) => {
                        Nodes.renderChoice(nodeId, choiceId);
                    });
                }
            }

        }
        else if (isConnection(item)) {
            if (typeof item.fromId === 'number' && !(item.fromId in state.nodes)) {
                return;
            }
            if (typeof item.toId === 'number' && !(item.toId in state.nodes)) {
                return;
            }
            const connId = Number(item.id);
            if (connId in state.connections) {
                Conn.removeConnection(connId);
            }
            else {
                state.connections[connId] = item;
                Conn.renderConnection(state.connections[connId]);
            }
        }
        else if (isChoice(item)) {
            const choiceId = String(item.id);
            if (choiceId) {
                const [nodeId, _] = choiceId.split('-');
                if (nodeId !== null) {
                    let choices = state.nodes[Number(nodeId)].choices;
                    if (choices) {
                        choices[choiceId] = item;
                        const choicesDiv = document.querySelector(`#div-node-${nodeId}`);
                        if (choicesDiv) {
                            choicesDiv.innerHTML = '';
                            Object.keys(choices).forEach(choiceId => {
                                Nodes.renderChoice(Number(nodeId), choiceId);
                            });
                            Nodes.updateNodePadSize(Number(nodeId), choiceId, '+');
                        }
                    }
                }
            }
        }
    });
    state.objectsHistory.pop();
}