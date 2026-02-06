/**
 * Centralized symbology definitions for DikeDesigner
 * All symbol definitions are maintained in one place for consistency and easy updates
 */

import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import PolygonSymbol3D from "@arcgis/core/symbols/PolygonSymbol3D";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";

// ============================================
// Line Symbols
// ============================================

export const lineLayerSymbol = {
    type: "simple-line",
    color: [64, 64, 64],
    width: 3,
    marker: {
        style: "arrow",
        color: "grey",
        placement: "begin"
    }
};

export const lineLayerSymbolCrosssection = {
    type: "simple-line",
    color: [36, 161, 14],
    width: 2,
    marker: {
        style: "arrow",
        color: "grey",
        placement: "begin"
    }
};

// Construction line symbol - used for comparing construction lines
export const constructionLineSymbol = {
    type: "simple-line",
    color: [0, 0, 255],
    width: 3
};

// ============================================
// Point Symbols
// ============================================

export const cursorSymbol = new PointSymbol3D({
    symbolLayers: [
        {
            type: "icon",
            size: 10,
            outline: { color: "#bcbcbcff", size: 1 },
            material: { color: "#F76430" }
        } as any
    ]
});

export const dwpPointSymbol = new PointSymbol3D({
    symbolLayers: [
        {
            type: "icon",
            size: 8,
            outline: { color: "#bcbcbcff", size: 1 },
            material: { color: "#575757ff" }
        } as any
    ]
});

export const controlPointSymbol = new PointSymbol3D({
    symbolLayers: [
        {
            type: "icon",
            size: 6,
            outline: { color: "#bcbcbcff", size: 1 },
            material: { color: "#000000ff" }
        } as any
    ]
});

// Default point symbol for comparison panels
export const defaultPointSymbol = {
    type: "simple-marker",
    style: "circle",
    size: 6,
    color: [255, 0, 0, 0.8],
    outline: {
        color: [255, 255, 255],
        width: 1
    }
};

// ============================================
// Polygon Symbols
// ============================================

export const polygonSymbol3D = new PolygonSymbol3D({
    symbolLayers: [
        new FillSymbol3DLayer({
            material: {
                color: [85, 140, 75, 0.8],
            },
            castShadows: true,
        }),
    ],
});

// ============================================
// Helper functions for dynamic symbology
// ============================================

/**
 * Get symbol for design layer 2D based on feature name
 */
export const getDesignLayer2DSymbol = (name: string) => {
    if (name.includes("berm")) {
        // Green for berms
        return {
            type: "simple-fill",
            color: [102, 204, 102, 0.9],
            outline: { color: [0, 100, 0, 1], width: 1 }
        };
    }
    if (name.includes("kruin")) {
        // Grey for kruin
        return {
            type: "simple-fill",
            color: [180, 180, 180, 0.9],
            outline: { color: [80, 80, 80, 1], width: 1 }
        };
    }
    // Default color - light blue
    return {
        type: "simple-fill",
        color: [200, 200, 255, 0.9],
        outline: { color: [100, 100, 200, 1], width: 1 }
    };
};
