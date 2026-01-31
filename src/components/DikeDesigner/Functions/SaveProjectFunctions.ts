import type DikeDesignerModel from "../DikeDesignerModel";

/**
 * Project JSON structure for local saving
 */
export interface ProjectJSON {
    metadata: {
        vak: string;
        alternatief: string;
        createdAt: string;
        lastModified: string;
        version: string;
    };
    geometries: {
        design3d: any[];
        design2d: any[];
        ruimtebeslag2d: any[];
        ruimtebeslag3d: any[];
        inputLine: any[];
        constructionLine: any[];
        crossSectionPoints: any[];
    };
    chartData: any[];
    volumes: {
        excavationVolume: number | null;
        fillVolume: number | null;
        totalVolumeDifference: number | null;
    };
    costs: {
        [key: string]: any;
    };
    effects: {
        [key: string]: any;
    };
}

/**
 * Round coordinate to specified decimal places to reduce file size
 */
const roundCoordinate = (coord: number, decimals: number = 2): number => {
    const factor = Math.pow(10, decimals);
    return Math.round(coord * factor) / factor;
};

/**
 * Simplify coordinate arrays by reducing precision
 */
const simplifyCoordinates = (coords: any, decimals: number = 2): any => {
    if (!coords) return coords;
    
    if (Array.isArray(coords)) {
        if (typeof coords[0] === 'number') {
            // Single coordinate pair [x, y] or [x, y, z]
            return coords.map(c => roundCoordinate(c, decimals));
        } else {
            // Nested arrays (paths, rings, etc.)
            return coords.map(c => simplifyCoordinates(c, decimals));
        }
    }
    return coords;
};

/**
 * Export graphics layer to compact GeoJSON features
 */
const graphicsToFeatures = (graphics: any[]): any[] => {
    if (!graphics || graphics.length === 0) return [];
    return graphics.map((graphic) => {
        const geomJSON = graphic.geometry ? graphic.geometry.toJSON() : null;
        
        // Simplify geometry coordinates to reduce file size
        if (geomJSON) {
            if (geomJSON.x !== undefined) {
                // Point geometry
                geomJSON.x = roundCoordinate(geomJSON.x);
                geomJSON.y = roundCoordinate(geomJSON.y);
                if (geomJSON.z !== undefined) {
                    geomJSON.z = roundCoordinate(geomJSON.z, 3); // Keep more precision for elevation
                }
            } else if (geomJSON.paths) {
                // Polyline geometry
                geomJSON.paths = simplifyCoordinates(geomJSON.paths);
            } else if (geomJSON.rings) {
                // Polygon geometry
                geomJSON.rings = simplifyCoordinates(geomJSON.rings);
            }
            
            // Remove unnecessary spatial reference details (save space)
            if (geomJSON.spatialReference && geomJSON.spatialReference.wkid) {
                geomJSON.spatialReference = { wkid: geomJSON.spatialReference.wkid };
            }
        }
        
        return {
            geometry: geomJSON,
            attributes: graphic.attributes || {},
        };
    });
};

/**
 * Build the complete project JSON
 */
export const buildProjectJSON = (model: DikeDesignerModel): ProjectJSON => {
    const designNameParts = splitDesignName(model.designName || "");

    return {
        metadata: {
            vak: designNameParts.vak,
            alternatief: designNameParts.alternatief,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            version: "1.0",
        },
        geometries: {
            design3d: graphicsToFeatures(model.graphicsLayerTemp?.graphics?.toArray() || []),
            design2d: graphicsToFeatures((model.designLayer2D as any)?.graphics?.toArray() || []),
            ruimtebeslag2d: graphicsToFeatures(model.graphicsLayerRuimtebeslag?.graphics?.toArray() || []),
            ruimtebeslag3d: graphicsToFeatures(model.graphicsLayerRuimtebeslag3d?.graphics?.toArray() || []),
            inputLine: graphicsToFeatures(model.graphicsLayerLine?.graphics?.toArray() || []),
            constructionLine: graphicsToFeatures(model.graphicsLayerControlPoints?.graphics?.toArray() || []),
            crossSectionPoints: graphicsToFeatures(model.graphicsLayerPoint?.graphics?.toArray() || []),
        },
        chartData: model.chartData ? [...model.chartData] : [],
        volumes: {
            excavationVolume: model.excavationVolume || null,
            fillVolume: model.fillVolume || null,
            totalVolumeDifference: model.totalVolumeDifference || null,
        },
        costs: {
            // Add cost-related data as needed
        },
        effects: {
            intersectingPanden: model.intersectingPanden?.length || 0,
            intersectingBomen: model.intersectingBomen?.length || 0,
            intersectingPercelen: model.intersectingPercelen?.length || 0,
            intersectingPercelenArea: model.intersectingPercelenArea || 0,
            intersectingNatura2000: model.intersectingNatura2000 || 0,
            intersectingGNN: model.intersectingGNN || 0,
            // Add other effect-related data as needed
        },
    };
};

/**
 * Split design name into vak and alternatief
 */
const splitDesignName = (name: string) => {
    const trimmed = name?.trim() || "";
    if (!trimmed) {
        return { vak: "", alternatief: "" };
    }
    const parts = trimmed.split(" - ");
    if (parts.length >= 2) {
        return {
            vak: parts[0].trim(),
            alternatief: parts.slice(1).join(" - ").trim(),
        };
    }
    return { vak: trimmed, alternatief: "" };
};

/**
 * Save project as JSON file (minified for smaller size)
 */
export const saveProjectAsJSON = (model: DikeDesignerModel) => {
    const projectJSON = buildProjectJSON(model);
    const filename = `${projectJSON.metadata.vak}-${projectJSON.metadata.alternatief}-${new Date().getTime()}.json`;

    const element = document.createElement("a");
    // Use minified JSON (no whitespace) to reduce file size
    element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(projectJSON))
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    model.messages.commands.ui.displayNotification.execute({
        title: "Ontwerp opgeslagen",
        message: `Project opgeslagen als ${filename}`,
        disableTimeouts: false,
    });
};
