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
    costs: {
        [key: string]: any;
    };
    effects: {
        [key: string]: any;
    };
}

/**
 * Export graphics layer to GeoJSON features
 */
const graphicsToFeatures = (graphics: any[]): any[] => {
    if (!graphics || graphics.length === 0) return [];
    return graphics.map((graphic) => ({
        geometry: graphic.geometry ? graphic.geometry.toJSON() : null,
        attributes: graphic.attributes || {},
    }));
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
            design2d: graphicsToFeatures(model.designLayer2D?.graphics?.toArray() || []),
            ruimtebeslag2d: graphicsToFeatures(model.graphicsLayerRuimtebeslag?.graphics?.toArray() || []),
            ruimtebeslag3d: graphicsToFeatures(model.graphicsLayerRuimtebeslag3d?.graphics?.toArray() || []),
            inputLine: graphicsToFeatures(model.graphicsLayerLine?.graphics?.toArray() || []),
            constructionLine: graphicsToFeatures(model.graphicsLayerControlPoints?.graphics?.toArray() || []),
            crossSectionPoints: graphicsToFeatures(model.graphicsLayerPoint?.graphics?.toArray() || []),
        },
        chartData: model.chartData ? [...model.chartData] : [],
        costs: {
            excavationVolume: model.excavationVolume,
            fillVolume: model.fillVolume,
            totalVolumeDifference: model.totalVolumeDifference,
            // Add other cost-related data as needed
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
 * Save project as JSON file
 */
export const saveProjectAsJSON = (model: DikeDesignerModel) => {
    const projectJSON = buildProjectJSON(model);
    const filename = `${projectJSON.metadata.vak}-${projectJSON.metadata.alternatief}-${new Date().getTime()}.json`;

    const element = document.createElement("a");
    element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(projectJSON, null, 2))
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    model.messages.commands.ui.displayNotification.execute({
        title: "Ontwerp opgeslagen",
        message: `Project opgeslagen als ${filename}`,
        type: "success",
        disableTimeouts: false,
    });
};
