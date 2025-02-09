

export const calcRandomPosition = (axis: 'x' | 'y', currentZoom: number = 1): number => {
    const scroll = axis === 'x' ? window.scrollX : window.scrollY;
    const size = axis === 'x' ? window.innerWidth : window.innerHeight;
    const randomOffset = (Math.random() < 0.5 ? -1 : 1) * Math.random() * (100 / currentZoom);
    return parseInt((scroll + size / 2 + randomOffset).toString());
};

export function initializeCanvas(canvas_width: number, canvas_height: number) {
    const canvas = document.getElementById('canvas');
    const connectionsCanvas = document.getElementById('connections');
    if (!canvas || !connectionsCanvas) {
        console.error('Error while canvas initializtion');
        return;
    }
    // Set canvas dimensions
    canvas.style.width = `${canvas_width}px`;
    canvas.style.height = `${canvas_height}px`;
    
    // Set SVG dimensions to match canvas
    connectionsCanvas.setAttribute('width', String(canvas_width));
    connectionsCanvas.setAttribute('height', String(canvas_height));
    
    // Set up initial scroll position to center
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Center to the start
    window.scrollTo(0, 0);

    connectionsCanvas.setAttribute('width', window.innerWidth.toString());
    connectionsCanvas.setAttribute('height', window.innerHeight.toString());

}

export function cleanSVG(): void {
    let connectionCanvas = document.querySelector('svg') as SVGElement;
    while (connectionCanvas.firstChild) {
        connectionCanvas.removeChild(connectionCanvas.firstChild);
    }
}

export function getComputedCSSValue(varName: string): number {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    
    if (value.endsWith('rem')) {
      return parseFloat(value) * 16;
    } else if (value.endsWith('px')) {
      return parseFloat(value);
    } else if (value.endsWith('%')) {
    } else if (value.endsWith('ms')) {
    }
    return parseFloat(value);
  };

export function throttle(func: Function, limit: number) {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
