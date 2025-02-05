import * as Types from '../src/types.js';

 class State {
    public canvasWidth = 3840;
    public canvasHeight = 2160;
    public viewPortPadding = 100;

    public nodes: Record<number, Types.Node> = {}; // Main nodes storage
    public connections: Record<number, Types.Connection> = {}; // Main connections storage

    public nodeIdCounter = 0;
    public connIdCounter = 0;
    public choiceIdCounter = 0;

    // Dragging variables
    public isDragging: boolean = false;
    public draggedNodes = new Set<number>();
    public initialDraggingPositions = new Map<number, Types.DragPosition>();

    //Connection canvas init
    public connectionsCanvas = document.querySelector('svg') as SVGElement;
    public onConnection: boolean = false;
    public currentConnection: Types.Connection | null = null; 

    // Create selection box element
    public selectionBox = document.getElementById('selection-box')
    public selectionStart = { x: 0, y: 0 };
    public onSelection: boolean = false;
    public selectedNodes = new Set<Types.Node>();

    //Zoom
    public currentZoom = 1;
    public minZoom = 0.5;
    public maxZoom = 1.5;
    public zoomStep = 0.1;

    //Undo 
    public objectsHistory: (Types.Node | Types.Connection | Types.Choice)[][] = [];
    public connsToRemove = new Set<Types.Connection>();

    //Resizing 
    public isResizing: boolean = false;
    public resizeStartX: number = 0;
    public resizeStartY: number = 0;
    public activeResizeNode: Types.Node | null = null;

 }

 export let state = new State();
