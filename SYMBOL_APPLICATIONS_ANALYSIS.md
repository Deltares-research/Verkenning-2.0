# Symbol Applications in Graphics Layers - Analysis Report

## Overview
This document catalogs all instances where symbols are applied to graphics in the Dike Designer application across the three main function files.

---

## 1. POINT SYMBOLS

### A. dwpPointSymbol (Profile/DWP Points)
**Definition Location:** [DikeDesignerModel.ts](DikeDesignerModel.ts#L188-L196)
```typescript
dwpPointSymbol = new PointSymbol3D({
    symbolLayers: [
        {
            type: "icon",
            size: 8,
            outline: { color: "#bcbcbcff", size: 1 },
            material: { color: "#575757ff" }
        } as any
    ]
});
```

**Applied in:**
- [ChartFunctions.ts#L401](ChartFunctions.ts#L401) - Profile points from chart clicks
```typescript
const graphic = new Graphic({
    geometry: cursorPoint,
    symbol: model.dwpPointSymbol,
    attributes: {
        afstand,
        hoogte,
        locatie: "",
        oid: newRow.oid
    }
});
model.graphicsLayerProfile.add(graphic);
```

- [DikeDesignerModel.ts#L495-L506](DikeDesignerModel.ts#L495-L506) - Excel upload points
```typescript
const graphic = new Graphic({
    geometry: cursorPoint,
    symbol: model.dwpPointSymbol,
    attributes: {
        afstand,
        hoogte,
        locatie: "",
        oid: point.oid
    }
});
model.graphicsLayerProfile.add(graphic);
```

**Layer:** `graphicsLayerProfile`

---

### B. cursorSymbol (Cursor Location Points)
**Definition Location:** [DikeDesignerModel.ts](DikeDesignerModel.ts#L177-L185)
```typescript
cursorSymbol = new PointSymbol3D({
    symbolLayers: [
        {
            type: "icon",
            size: 10,
            outline: { color: "#bcbcbcff", size: 1 },
            material: { color: "#F76430" }
        } as any
    ]
});
```

**Layer:** `cursorLocationLayer` (defined but not actively used in provided code sections)

---

### C. controlPointSymbol (Control/Construction Points)
**Definition Location:** [DikeDesignerModel.ts](DikeDesignerModel.ts#L198-L206)
```typescript
controlPointSymbol = new PointSymbol3D({
    symbolLayers: [
        {
            type: "icon",
            size: 6,
            outline: { color: "#bcbcbcff", size: 1 },
            material: { color: "#000000ff" }
        } as any
    ]
});
```

**Layer:** `graphicsLayerControlPoints` (cleared in [DesignFunctions.ts#L341](DesignFunctions.ts#L341))

---

## 2. POLYLINE SYMBOLS

### A. lineLayerSymbol (Input Lines / Base Path)
**Definition Location:** [DikeDesignerModel.ts](DikeDesignerModel.ts#L155-L164)
```typescript
lineLayerSymbol = {
    type: "simple-line",
    color: [64, 64, 64],           // Dark gray
    width: 3,
    marker: {
        style: "arrow",
        color: "grey",
        placement: "begin"
    }
};
```

**Applied in:**
- [DikeDesignerModel.ts#L323-L326](DikeDesignerModel.ts#L323-L326) - Feature layer lines
```typescript
model.graphicsLayerLine.add(graphic);
// (with symbol: this.lineLayerSymbol)
```

- [DesignFunctions.ts#L774-L781](DesignFunctions.ts#L774-L781) - Loaded feature lines
```typescript
model.graphicsLayerLine.add(new Graphic({
    geometry: projectedGeometry as __esri.Geometry,
    symbol: model.lineLayerSymbol,
    attributes: feature.attributes,
}));
```

**Layer:** `graphicsLayerLine`

---

### B. lineLayerSymbolCrosssection (Cross-Section Construction Lines)
**Definition Location:** [DikeDesignerModel.ts](DikeDesignerModel.ts#L166-L175)
```typescript
lineLayerSymbolCrosssection = {
    type: "simple-line",
    color: [36, 161, 14],           // Green
    width: 2,
    marker: {
        style: "arrow",
        color: "grey",
        placement: "begin"
    }
};
```

**Layer:** `graphicsLayerCrossSection` (drawn via sketch widget)

---

### C. Offset Lines (Temporary Construction Lines)
**Definition Location & Application:** [DesignFunctions.ts](DesignFunctions.ts#L143-L169)
```typescript
const offsetGraphic = new Graphic({
    geometry: new Polyline({
        paths: updatedPaths,
        spatialReference: SpatialReference.WebMercator,
    }),
    symbol: {
        type: "simple-line",
        style: "solid",
        color: "grey",
        width: 1,
    } as any,
});
model.graphicsLayerTemp.add(offsetGraphic);
```

**Characteristics:**
- Simple gray lines, width 1
- Represents offset paths from base line
- Temporary construction geometry

**Layer:** `graphicsLayerTemp`

---

## 3. POLYGON SYMBOLS (2D and 3D)

### A. Ruimtebeslag 2D Polygon (No Symbol Definition)
**Applied in:** [DesignFunctions.ts](DesignFunctions.ts#L448-L461)
```typescript
const aboveGroundGraphic = new Graphic({
    geometry: polygon2D,
    attributes: {
        zValues: zValueMap,
        originalPoints: result.ruimtebeslag_2d_points,
        type: 'ruimtebeslag_above_ground'
    },
});
model.graphicsLayerRuimtebeslag.add(aboveGroundGraphic);
```

**Characteristics:**
- No symbol explicitly defined in Graphic constructor
- Uses default layer renderer
- Stores z-value mapping in attributes for later use

**Layer:** `graphicsLayerRuimtebeslag`

---

### B. Ruimtebeslag 3D Polygon with PolygonSymbol3D
**Symbol Definition:** [DesignFunctions.ts](DesignFunctions.ts#L473-L494)
```typescript
const dikeSymbol = new PolygonSymbol3D({
    symbolLayers: [
        new FillSymbol3DLayer({
            material: {
                color: [85, 140, 75, 1],  // Green grass color, no transparency
            },
            castShadows: true
        })
    ]
});
```

**Applied in:**
```typescript
const aboveGroundGraphic3d = new Graphic({
    geometry: new Polygon({
        rings: rings3D,
        spatialReference: polygon2D.spatialReference,
        hasZ: true
    }),
    symbol: dikeSymbol,
    attributes: { type: 'ruimtebeslag_above_ground_3d' }
});
model.graphicsLayerRuimtebeslag3d.add(aboveGroundGraphic3d);
```

**Characteristics:**
- RGB color: [85, 140, 75] (green)
- Alpha: 1 (opaque)
- Includes shadow casting
- 3D polygon with z-coordinates

**Layer:** `graphicsLayerRuimtebeslag3d`

---

### C. Design/Dike 3D Polygon (No Explicit Symbol)
**Applied in:** [DesignFunctions.ts](DesignFunctions.ts#L600-L640)
```typescript
// When 3D dike symbol is created and added to graphicsLayer3dPolygon
model.graphicsLayer3dPolygon.add(graphic3d);
```

**Characteristics:**
- Polygon geometry with 3D coordinates
- Symbol applied at layer renderer level (likely)

**Layer:** `graphicsLayer3dPolygon`

---

## 4. MESH SYMBOLS (3D Design Surface)

### MeshSymbol3D (Merged Design Mesh)
**Symbol Definition:** [DesignFunctions.ts](DesignFunctions.ts#L318-L332)
```typescript
const mergedGraphic = new Graphic({
    geometry: merged,
    symbol: new MeshSymbol3D({
        symbolLayers: [
            {
                type: "fill",
                material: {
                    color: [85, 140, 75, 1],  // Green grass color for dike
                    colorMixMode: "replace"
                },
                castShadows: true
            }
        ]
    })
});
model.graphicsLayerMesh.add(mergedGraphic);
```

**Characteristics:**
- 3D mesh geometry (merged from multiple meshes)
- RGB color: [85, 140, 75] (green)
- Color mix mode: "replace"
- Shadow casting enabled

**Layer:** `graphicsLayerMesh`

---

## 5. GRAPHICS LAYERS SUMMARY

| Layer Name | Purpose | Graphics Type | Symbol Type |
|-----------|---------|---------------|------------|
| `graphicsLayerLine` | Input lines/base path | Polyline | SimpleLineSymbol |
| `graphicsLayerTemp` | Temporary offset lines | Polyline | SimpleLineSymbol (gray) |
| `graphicsLayerProfile` | DWP/Profile points | Point | PointSymbol3D |
| `graphicsLayerCrossSection` | Cross-section line | Polyline | SimpleLineSymbol (green) |
| `graphicsLayerControlPoints` | Control points | Point | PointSymbol3D |
| `graphicsLayerMesh` | 3D design surface | Mesh | MeshSymbol3D |
| `graphicsLayer3dPolygon` | 3D dike polygons | Polygon 3D | (Renderer level) |
| `graphicsLayerRuimtebeslag` | 2D land use area | Polygon | (No symbol/Renderer) |
| `graphicsLayerRuimtebeslag3d` | 3D land use area | Polygon 3D | PolygonSymbol3D |
| `cursorLocationLayer` | Cursor position | Point | PointSymbol3D |

---

## 6. KEY SYMBOL DEFINITIONS REFERENCE

### PointSymbol3D Variants
- **dwpPointSymbol**: Size 8, Dark gray (#575757ff), used for profile points
- **cursorSymbol**: Size 10, Orange (#F76430), used for cursor location
- **controlPointSymbol**: Size 6, Black (#000000ff), used for construction points

All PointSymbol3D use icon type with 1px outline in light gray (#bcbcbcff)

### SimpleLineSymbol Variants
- **lineLayerSymbol**: Width 3, Dark gray [64, 64, 64], arrow marker
- **lineLayerSymbolCrosssection**: Width 2, Green [36, 161, 14], arrow marker
- **Offset lines**: Width 1, Light gray color, no markers

### 3D Symbols
- **PolygonSymbol3D (Ruimtebeslag)**: FillSymbol3DLayer, Green [85, 140, 75], castShadows=true
- **MeshSymbol3D**: FillSymbol3DLayer, Green [85, 140, 75], colorMixMode="replace", castShadows=true

---

## 7. GRAPHICS LAYER INITIALIZATION

Graphics layers are initialized as properties in [DikeDesignerModel.ts](DikeDesignerModel.ts#L114-L129):
```typescript
graphicsLayerLine: GraphicsLayer;
cursorLocationLayer: GraphicsLayer;
graphicsLayerPoint: GraphicsLayer;
graphicsLayerCrossSection: GraphicsLayer;
graphicsLayerProfile: GraphicsLayer;
graphicsLayerTemp: GraphicsLayer;
graphicsLayerMesh: GraphicsLayer;
graphicsLayer3dPolygon: GraphicsLayer;
graphicsLayerRuimtebeslag: GraphicsLayer;
graphicsLayerRuimtebeslag3d: GraphicsLayer;
graphicsLayerControlPoints: GraphicsLayer;
```

**Note:** `graphicsLayerPoint` is declared but not used in the analyzed code sections.

---

## Summary Statistics

- **Total Graphics Layers:** 11
- **Point Symbols:** 3 (PointSymbol3D variants)
- **Line Symbols:** 3 (SimpleLineSymbol variants)
- **Polygon Symbols:** 2 (PolygonSymbol3D, default renderer)
- **Mesh Symbols:** 1 (MeshSymbol3D)
- **Total Graphics with Symbols:** 9+ instances
- **Color Scheme:** Primarily green [85, 140, 75] for 3D design, gray for construction lines, orange for cursor
