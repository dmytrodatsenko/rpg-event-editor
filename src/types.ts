export type NodeType = 'choice' | 'end' | 'fight' | 'shop';

export interface Node {
    id: number;
    type: NodeType;
    title: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    inname: 'node';
    choices?: Record<string, Choice>;
}

export interface Choice {
    id: string;
    text: string;
    conditions: string;
    inname: 'choice'; 
    width: number;
    height: number;
}

export interface Connection {
    id: number;
    fromId: string | number;
    toId: string | number | null;
    fromType: string | null;
    toType: string | null;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    controls: {
        x: number;
        y: number;
        type: 'success' | 'failure';
    };
    inname: 'connection';
}

export interface ObjectsHistory {
    nodes: Node[][]; 
    choices: Choice[][];
    connections: Connection[][];
}

export interface DragPosition {
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
}

export interface Theme {
    background: {
      primary: string;
      secondary: string;
    };
    text: {
      primary: string;
      secondary: string;
    };
    node: {
        primary: string;
        secondary: string;
    }
    border: {
      default: string;
      hover: string;
    };
    button: {
        default: string;
        hover: string;
    };
    status: {
      success: string;
      error: string;
    };
  }