import type DikeDesignerModel from "../DikeDesignerModel";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import Point from "@arcgis/core/geometry/Point";
import Extent from "@arcgis/core/geometry/Extent";
import { cleanFeatureLayer } from "./DesignFunctions";

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
        crossSectionLine: any[];
        profilePoints: any[];
    };
    chartData: any[];
    allChartData: Record<string, any[]>;
    chartDataElevation: any[];
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
            crossSectionLine: graphicsToFeatures(model.graphicsLayerCrossSection?.graphics?.toArray() || []),
            profilePoints: graphicsToFeatures(model.graphicsLayerProfile?.graphics?.toArray() || []),
        },
        chartData: model.chartData ? [...model.chartData] : [],
        allChartData: model.allChartData ? { ...model.allChartData } : {},
        chartDataElevation: model.chartDataElevation ? [...model.chartDataElevation] : [],
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
 * Load project from JSON file
 */
export const loadProjectFromJSON = (model: DikeDesignerModel, jsonData: ProjectJSON): void => {
    try {
        const { geometries, chartData, allChartData, chartDataElevation, volumes, metadata } = jsonData;

        // Clear existing graphics
        model.graphicsLayerTemp?.removeAll();
        cleanFeatureLayer(model.designLayer2D);
        model.graphicsLayerRuimtebeslag?.removeAll();
        model.graphicsLayerRuimtebeslag3d?.removeAll();
        model.graphicsLayerLine?.removeAll();
        model.graphicsLayerControlPoints?.removeAll();
        model.graphicsLayerPoint?.removeAll();
        model.graphicsLayerCrossSection?.removeAll();
        model.graphicsLayerProfile?.removeAll();

        // Load geometries
        if (geometries.design3d?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayerTemp, geometries.design3d, model);
        }
        if (geometries.design2d?.length > 0) {
            loadGeometriesToLayer(model.designLayer2D, geometries.design2d, model);
        }
        if (geometries.ruimtebeslag2d?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayerRuimtebeslag, geometries.ruimtebeslag2d, model);
        }
        if (geometries.ruimtebeslag3d?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayerRuimtebeslag3d, geometries.ruimtebeslag3d, model);
        }
        if (geometries.inputLine?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayerLine, geometries.inputLine, model);
        }
        if (geometries.constructionLine?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayerControlPoints, geometries.constructionLine, model);
        }
        if (geometries.crossSectionPoints?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayerPoint, geometries.crossSectionPoints, model);
        }
        if (geometries.crossSectionLine?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayerCrossSection, geometries.crossSectionLine, model);
        }
        if (geometries.profilePoints?.length > 0) {
            console.log(`Loading ${geometries.profilePoints.length} profile points`);
            loadGeometriesToLayer(model.graphicsLayerProfile, geometries.profilePoints, model);
        }
        if (geometries.crossSectionPoints?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayerPoint, geometries.crossSectionPoints, model);
        }

        // Load chart data
        if (chartData && chartData.length > 0) {
            model.chartData = chartData;
        }

        // Load all chart data (for different sheets/dijkvakken)
        if (allChartData && Object.keys(allChartData).length > 0) {
            model.allChartData = { ...allChartData };
        }

        // Load elevation chart data (AHN profile)
        if (chartDataElevation && chartDataElevation.length > 0) {
            model.chartDataElevation = chartDataElevation;
        }

        // Load volumes
        if (volumes) {
            model.excavationVolume = volumes.excavationVolume;
            model.fillVolume = volumes.fillVolume;
            model.totalVolumeDifference = volumes.totalVolumeDifference;
        }

        // Set design name from metadata
        if (metadata.vak && metadata.alternatief) {
            model.designName = `${metadata.vak} - ${metadata.alternatief}`;
        } else if (metadata.vak) {
            model.designName = metadata.vak;
        }

        // Zoom to the extent of loaded geometries
        if (model.view && model.view.extent) {
            let allExtents: any[] = [];
            
            // Collect extents from all layers with geometries
            [model.graphicsLayerTemp, model.designLayer2D, model.graphicsLayerRuimtebeslag, 
             model.graphicsLayerRuimtebeslag3d, model.graphicsLayerLine, model.graphicsLayerControlPoints,
             model.graphicsLayerPoint, model.graphicsLayerCrossSection, model.graphicsLayerProfile].forEach((layer: any) => {
                if (layer?.graphics?.length > 0) {
                    layer.graphics.forEach((graphic: any) => {
                        if (graphic.geometry?.extent) {
                            allExtents.push(graphic.geometry.extent);
                        }
                    });
                }
            });

            // If we have geometries, zoom to their extent
            if (allExtents.length > 0) {
                try {
                    // Calculate union of all extents
                    let unionExtent = allExtents[0];
                    allExtents.forEach((ext: any) => {
                        if (unionExtent) {
                            unionExtent = unionExtent.union(ext);
                        }
                    });

                    if (unionExtent) {
                        model.view.extent = unionExtent.expand(1.2);
                        console.log("Zoomed to loaded geometries extent");
                    }
                } catch (error) {
                    console.warn("Could not zoom to extent:", error);
                }
            }
        }

        model.messages.commands.ui.displayNotification.execute({
            title: "Ontwerp geladen",
            message: `Project '${metadata.vak}' succesvol geladen`,
            disableTimeouts: false,
        });
    } catch (error) {
        console.error("Error loading project from JSON:", error);
        model.messages.commands.ui.alert.execute({
            title: "Fout bij laden",
            message: `Er is een fout opgetreden bij het laden van het project: ${(error as Error)?.message}`,
        });
    }
};

/**
 * Helper function to load features into a graphics layer
 */
const loadGeometriesToLayer = (layer: any, features: any[], model?: any): void => {
    if (!layer || !features) {
        console.log("loadGeometriesToLayer: layer or features is null/undefined", { layer: !!layer, features: !!features, count: features?.length });
        return;
    }

    console.log(`loadGeometriesToLayer: Processing ${features.length} features for layer`);

    features.forEach((feature: any, index: number) => {
        try {
            let geometry;

            if (feature.geometry?.x !== undefined && feature.geometry?.y !== undefined) {
                // Point geometry
                console.log(`Feature ${index}: Creating point at (${feature.geometry.x}, ${feature.geometry.y})`);
                geometry = new Point({
                    x: feature.geometry.x,
                    y: feature.geometry.y,
                    z: feature.geometry.z,
                    spatialReference: feature.geometry.spatialReference,
                });
            } else if (feature.geometry?.paths) {
                // Polyline geometry
                console.log(`Feature ${index}: Creating polyline`);
                geometry = new Polyline({
                    paths: feature.geometry.paths,
                    spatialReference: feature.geometry.spatialReference,
                });
            } else if (feature.geometry?.rings) {
                // Polygon geometry
                console.log(`Feature ${index}: Creating polygon`);
                geometry = new Polygon({
                    rings: feature.geometry.rings,
                    spatialReference: feature.geometry.spatialReference,
                });
            }

            if (geometry) {
                // Apply default symbol based on geometry type and layer
                const symbol = getDefaultSymbolForGeometry(geometry, layer, model);

                // Preserve all attributes, including oid for profile points
                const attributes = feature.attributes || {};
                if (attributes.oid === undefined) {
                    attributes.oid = Math.random(); // Generate oid if missing
                }

                const graphic = new Graphic({
                    geometry,
                    attributes: attributes,
                    symbol: symbol,
                });
                
                // Check if it's a FeatureLayer (has applyEdits) or GraphicsLayer (has add)
                if (layer.applyEdits) {
                    // FeatureLayer - use applyEdits
                    layer.applyEdits({
                        addFeatures: [graphic]
                    }).catch((error: any) => {
                        console.error("Error adding feature to layer:", error);
                    });
                } else if (layer.add) {
                    // GraphicsLayer - use add
                    console.log(`Feature ${index}: Added to graphics layer`);
                    layer.add(graphic);
                } else {
                    console.warn("Layer has neither applyEdits nor add method");
                }
            } else {
                console.warn(`Feature ${index}: No geometry created`);
            }
        } catch (error) {
            console.error("Error loading geometry:", error);
        }
    });
};

/**
 * Get a default symbol based on geometry type and layer
 */
const getDefaultSymbolForGeometry = (geometry: any, layer?: any, model?: any): any => {
    if (geometry.type === "point") {
        if (layer === model?.graphicsLayerProfile) {
            return model?.dwpPointSymbol;
        }
        if (layer === model?.graphicsLayerControlPoints) {
            return model?.controlPointSymbol;
        }
        if (layer === model?.graphicsLayerPoint) {
            return model?.cursorSymbol;
        }
        return undefined;
    } else if (geometry.type === "polyline") {
        if (layer === model?.graphicsLayerCrossSection) {
            return model?.lineLayerSymbolCrosssection;
        }
        if (layer === model?.graphicsLayerLine) {
            return model?.lineLayerSymbol;
        }
        if (layer === model?.graphicsLayerControlPoints) {
            return model?.lineLayerSymbol;
        }
        if (layer === model?.graphicsLayerTemp) {
            return model?.lineLayerSymbol;
        }
        return undefined;
    } else if (geometry.type === "polygon") {
        if (
            layer === model?.graphicsLayerRuimtebeslag ||
            layer === model?.graphicsLayerRuimtebeslag3d ||
            layer === model?.graphicsLayerTemp ||
            layer === model?.designLayer2D
        ) {
            return model?.polygonSymbol3D;
        }
        return undefined;
    }
    return undefined;
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
