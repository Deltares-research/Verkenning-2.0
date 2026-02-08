import type DikeDesignerModel from "../DikeDesignerModel";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
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
        crossSectionPoints: any[];
        crossSectionLine: any[];
        profilePoints: any[];
    };
    chartData: any[];
    allChartData: Record<string, any[]>;
    chartDataElevation: any[];
    designValues: {
        trajectLength: number | null;
        volumeDifference: number | null;
        excavationVolume: number | null;
        fillVolume: number | null;
        area2d: number | null;
        area3d: number | null;
    };
    costs: {
        complexity: string | null;
        depth: number | null;
        directCostGroundWork: Record<string, number>;
        directCostStructures: Record<string, number>;
        indirectConstructionCosts: Record<string, number>;
        engineeringCosts: Record<string, number>;
        otherCosts: Record<string, number>;
        realEstateCosts: Record<string, number>;
        risicoreservering: number | null;
    };
    effects: {
        intersectingPanden: object[];
        intersectingBomen: object[];
        intersectingPercelen: object[];
        intersectingPercelenArea: number | null;
        intersectingWegdelen2dRuimtebeslag: number | null;
        intersectingInritten2dRuimtebeslag: number | null;
        intersectingInritten2dRuimtebeslagCount: object[];
        intersectingNatura2000: number | null;
        intersectingGNN: number | null;
        intersectingBeheertypen: object[];
        intersectingBeheertypeArea: number | null;
        intersectingPandenArea: number | null;
        intersectingPandenBuffer: object[];
        intersectingPandenBufferArea: number | null;
        intersectingErven: object[];
        intersectingErvenArea: number | null;
        // Execution zone (uitvoeringszone) properties
        uitvoeringszoneWegoppervlak: number | null;
        uitvoeringszonePanden: object[];
        uitvoeringszonePandenArea: number | null;
        uitvoeringszonePercelen: object[];
        uitvoeringszonePercelenArea: number | null;
        uitvoeringszoneNatura2000: number | null;
        uitvoeringszoneGNN: number | null;
        uitvoeringszoneBeheertypeArea: number | null;
    };
    constructions: {
        structureType: string;
        depth: number;
        useOffset: boolean;
        offsetDistance: number;
        offsetSide: 'left' | 'right';
        drawnConstructionLine: any;
        structures: Array<{
            geometry: any;
            attributes: {
                type: string;
                depth: number;
            };
        }>;
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
            design3d: graphicsToFeatures(Array.from(model.graphicsLayer3dPolygon?.graphics || [])),
            design2d: graphicsToFeatures(Array.from((model.designLayer2D as any)?.graphics || [])),
            ruimtebeslag2d: graphicsToFeatures(Array.from(model.graphicsLayerRuimtebeslag?.graphics || [])),
            ruimtebeslag3d: graphicsToFeatures(Array.from(model.graphicsLayerRuimtebeslag3d?.graphics || [])),
            inputLine: graphicsToFeatures(Array.from(model.graphicsLayerLine?.graphics || [])),
            crossSectionPoints: graphicsToFeatures(Array.from(model.graphicsLayerPoint?.graphics || [])),
            crossSectionLine: graphicsToFeatures(Array.from(model.graphicsLayerCrossSection?.graphics || [])),
            profilePoints: graphicsToFeatures(Array.from(model.graphicsLayerProfile?.graphics || [])),
        },
        chartData: model.chartData ? [...model.chartData] : [],
        allChartData: model.allChartData ? { ...model.allChartData } : {},
        chartDataElevation: model.chartDataElevation ? [...model.chartDataElevation] : [],
        designValues: {
            trajectLength: model.lineLength || null,
            volumeDifference: model.totalVolumeDifference || null,
            excavationVolume: model.excavationVolume || null,
            fillVolume: model.fillVolume || null,
            area2d: model.total2dArea || null,
            area3d: model.total3dArea || null,
        },
        costs: {
            complexity: model.costModel?.complexity || null,
            depth: model.costModel?.depth || null,
            directCostGroundWork: model.costModel?.directCostGroundWork?.toDict() || {},
            directCostStructures: model.costModel?.directCostStructures?.toDict() || {},
            indirectConstructionCosts: model.costModel?.indirectConstructionCosts?.toDict() || {},
            engineeringCosts: model.costModel?.engineeringCosts?.toDict() || {},
            otherCosts: model.costModel?.otherCosts?.toDict() || {},
            realEstateCosts: model.costModel?.realEstateCosts?.toDict() || {},
            risicoreservering: model.costModel?.risicoreservering || null,
        },
        effects: {
            intersectingPanden: model.intersectingPanden || [],
            intersectingBomen: model.intersectingBomen || [],
            intersectingPercelen: model.intersectingPercelen || [],
            intersectingPercelenArea: model.intersectingPercelenArea || null,
            intersectingWegdelen2dRuimtebeslag: model.intersectingWegdelen2dRuimtebeslag || null,
            intersectingInritten2dRuimtebeslag: model.intersectingInritten2dRuimtebeslag || null,
            intersectingInritten2dRuimtebeslagCount: model.intersectingInritten2dRuimtebeslagCount || [],
            intersectingNatura2000: model.intersectingNatura2000 || null,
            intersectingGNN: model.intersectingGNN || null,
            intersectingBeheertypen: model.intersectingBeheertypen || [],
            intersectingBeheertypeArea: model.intersectingBeheertypeArea || null,
            intersectingPandenArea: model.intersectingPandenArea || null,
            intersectingPandenBuffer: model.intersectingPandenBuffer || [],
            intersectingPandenBufferArea: model.intersectingPandenBufferArea || null,
            intersectingErven: model.intersectingErven || [],
            intersectingErvenArea: model.intersectingErvenArea || null,
            // Execution zone (uitvoeringszone)
            uitvoeringszoneWegoppervlak: model.uitvoeringszoneWegoppervlak || null,
            uitvoeringszonePanden: model.uitvoeringszonePanden || [],
            uitvoeringszonePandenArea: model.uitvoeringszonePandenArea || null,
            uitvoeringszonePercelen: model.uitvoeringszonePercelen || [],
            uitvoeringszonePercelenArea: model.uitvoeringszonePercelenArea || null,
            uitvoeringszoneNatura2000: model.uitvoeringszoneNatura2000 || null,
            uitvoeringszoneGNN: model.uitvoeringszoneGNN || null,
            uitvoeringszoneBeheertypeArea: model.uitvoeringszoneBeheertypeArea || null,
        },
        constructions: {
            structureType: model.constructionModel?.structureType || "Heavescherm",
            depth: model.constructionModel?.depth || 5,
            useOffset: model.constructionModel?.useOffset || false,
            offsetDistance: model.constructionModel?.offsetDistance || 0,
            offsetSide: model.constructionModel?.offsetSide || 'right',
            drawnConstructionLine: model.constructionModel?.drawnConstructionLine ? featureToGeoJSON(new Graphic({
                geometry: model.constructionModel.drawnConstructionLine,
            })) : null,
            structures: (model.constructionModel?.structures || []).map(struct => ({
                geometry: struct.geometry ? featureToGeoJSON(new Graphic({
                    geometry: struct.geometry,
                })) : null,
                attributes: struct.attributes,
            })) || [],
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
        const { geometries, chartData, allChartData, chartDataElevation, designValues, effects, costs, metadata, constructions } = jsonData as any;

        // Clear existing graphics
        model.graphicsLayerTemp?.removeAll();
        model.graphicsLayer3dPolygon?.removeAll();
        model.designLayer2D.removeAll();
        model.graphicsLayerUitvoeringszone?.removeAll();
        cleanFeatureLayer(model.designLayer2D);
        model.graphicsLayerRuimtebeslag?.removeAll();
        model.graphicsLayerRuimtebeslag3d?.removeAll();
        model.graphicsLayerLine?.removeAll();
        model.graphicsLayerPoint?.removeAll();
        model.graphicsLayerCrossSection?.removeAll();
        model.graphicsLayerProfile?.removeAll();
        model.constructionModel?.graphicsLayerConstructionLine?.removeAll();
        
        // Clear construction model properties
        if (model.constructionModel) {
            model.constructionModel.drawnConstructionLine = null;
            model.constructionModel.selectedLine = null;
            model.constructionModel.structures = [];
            model.constructionModel.useOffset = false;
            model.constructionModel.offsetDistance = 0;
            model.constructionModel.offsetSide = 'right';
            model.constructionModel.structureType = "Heavescherm";
            model.constructionModel.depth = null;
        }

        // Load geometries
        if (geometries.design3d?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayer3dPolygon, geometries.design3d, model);
            // Also load to graphicsLayerTemp for visibility during loaded state
            loadGeometriesToLayer(model.graphicsLayerTemp, geometries.design3d, model);
        }
        if (geometries.design2d?.length > 0) {
            console.log(geometries.design2d, `Loading ${geometries.design2d.length} 2D design geometries`);
            loadGeometriesToLayer(model.designLayer2D, geometries.design2d, model);
            // Also load to graphicsLayerTemp for visibility during loaded state
            loadGeometriesToLayer(model.graphicsLayerTemp, geometries.design2d, model);
        }
        
        // Create meshes from the loaded 3D polygons
        if (geometries.design3d?.length > 0) {
            import("./SaveFunctions").then(({ loadGeometriesFromDesign }) => {
                loadGeometriesFromDesign(model).catch(err => console.error("Error loading geometries:", err));
            });
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

        // Load design values
        if (designValues) {
            model.lineLength = designValues.trajectLength || 0;
            model.totalVolumeDifference = designValues.volumeDifference || 0;
            model.excavationVolume = designValues.excavationVolume || 0;
            model.fillVolume = designValues.fillVolume || 0;
            model.total2dArea = designValues.area2d || 0;
            model.total3dArea = designValues.area3d || 0;
        }

        // Load effects
        if (effects) {
            model.intersectingPanden = effects.intersectingPanden || [];
            model.intersectingBomen = effects.intersectingBomen || [];
            model.intersectingPercelen = effects.intersectingPercelen || [];
            model.intersectingPercelenArea = effects.intersectingPercelenArea || 0;
            model.intersectingWegdelen2dRuimtebeslag = effects.intersectingWegdelen2dRuimtebeslag || 0;
            model.intersectingInritten2dRuimtebeslag = effects.intersectingInritten2dRuimtebeslag || 0;
            model.intersectingInritten2dRuimtebeslagCount = effects.intersectingInritten2dRuimtebeslagCount || [];
            model.intersectingNatura2000 = effects.intersectingNatura2000 || 0;
            model.intersectingGNN = effects.intersectingGNN || 0;
            model.intersectingBeheertypen = effects.intersectingBeheertypen || [];
            model.intersectingBeheertypeArea = effects.intersectingBeheertypeArea || 0;
            model.intersectingPandenArea = effects.intersectingPandenArea || 0;
            model.intersectingPandenBuffer = effects.intersectingPandenBuffer || [];
            model.intersectingPandenBufferArea = effects.intersectingPandenBufferArea || 0;
            model.intersectingErven = effects.intersectingErven || [];
            model.intersectingErvenArea = effects.intersectingErvenArea || 0;
            // Execution zone (uitvoeringszone)
            model.uitvoeringszoneWegoppervlak = effects.uitvoeringszoneWegoppervlak || 0;
            model.uitvoeringszonePanden = effects.uitvoeringszonePanden || [];
            model.uitvoeringszonePandenArea = effects.uitvoeringszonePandenArea || 0;
            model.uitvoeringszonePercelen = effects.uitvoeringszonePercelen || [];
            model.uitvoeringszonePercelenArea = effects.uitvoeringszonePercelenArea || 0;
            model.uitvoeringszoneNatura2000 = effects.uitvoeringszoneNatura2000 || 0;
            model.uitvoeringszoneGNN = effects.uitvoeringszoneGNN || 0;
            model.uitvoeringszoneBeheertypeArea = effects.uitvoeringszoneBeheertypeArea || 0;
        }

        // Load costs
        if (costs && model.costModel) {
            model.costModel.complexity = costs.complexity || "makkelijke maatregel";
            model.costModel.depth = costs.depth || 5;
            
            // Directly assign cost properties from saved dict format
            if (costs.directCostGroundWork) {
                Object.assign(model.costModel.directCostGroundWork, costs.directCostGroundWork);
            }
            if (costs.directCostStructures) {
                Object.assign(model.costModel.directCostStructures, costs.directCostStructures);
            }
            if (costs.indirectConstructionCosts) {
                Object.assign(model.costModel.indirectConstructionCosts, costs.indirectConstructionCosts);
            }
            if (costs.engineeringCosts) {
                Object.assign(model.costModel.engineeringCosts, costs.engineeringCosts);
            }
            if (costs.otherCosts) {
                Object.assign(model.costModel.otherCosts, costs.otherCosts);
            }
            if (costs.realEstateCosts) {
                Object.assign(model.costModel.realEstateCosts, costs.realEstateCosts);
            }
            model.costModel.risicoreservering = costs.risicoreservering || 0;
        }

        // Load constructions
        if (jsonData.constructions && model.constructionModel) {
            const constr = jsonData.constructions;
            model.constructionModel.structureType = constr.structureType || "Heavescherm";
            model.constructionModel.depth = constr.depth || 5;
            model.constructionModel.useOffset = constr.useOffset || false;
            model.constructionModel.offsetDistance = constr.offsetDistance || 0;
            model.constructionModel.offsetSide = constr.offsetSide || 'right';
            
            // Load drawn construction line geometry
            if (constr.drawnConstructionLine) {
                try {
                    const geometry = featureToGeometry(constr.drawnConstructionLine);
                    if (geometry) {
                        model.constructionModel.drawnConstructionLine = geometry;
                        
                        // Add the drawn line graphic to the construction layer
                        if (model.constructionModel.graphicsLayerConstructionLine) {
                            const graphic = new Graphic({
                                geometry: geometry,
                                symbol: {
                                    type: "simple-line",
                                    color: [0, 0, 255],
                                    width: 3
                                } as any
                            });
                            model.constructionModel.graphicsLayerConstructionLine.add(graphic);
                        }
                    }
                } catch (err) {
                    console.warn("Error loading construction line geometry:", err);
                }
            }
            
            // Load structures array
            if (constr.structures && Array.isArray(constr.structures)) {
                model.constructionModel.structures = constr.structures
                    .map((struct: any) => ({
                        geometry: struct.geometry ? featureToGeometry(struct.geometry) : null,
                        attributes: struct.attributes || { type: "Heavescherm", depth: 5 },
                    }))
                    .filter((struct: any) => struct.geometry !== null);
                
                // Add structures as graphics to the construction layer
                if (model.constructionModel.graphicsLayerConstructionLine) {
                    model.constructionModel.structures.forEach((struct: any) => {
                        if (struct.geometry) {
                            const graphic = new Graphic({
                                geometry: struct.geometry,
                                symbol: {
                                    type: "simple-line",
                                    color: [0, 0, 255],
                                    width: 3
                                } as any,
                                attributes: struct.attributes
                            });
                            model.constructionModel.graphicsLayerConstructionLine!.add(graphic);
                        }
                    });
                }
            }
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
 * Recalculate an alternative using temporary layers, without changing the current design.
 * Returns a ProjectJSON with updated designValues, costs and effects.
 */
export const recalculateAlternativeData = async (
    model: DikeDesignerModel,
    jsonData: ProjectJSON
): Promise<ProjectJSON> => {
    // Snapshot current model state
    const originalLayers = {
        graphicsLayer3dPolygon: model.graphicsLayer3dPolygon,
        graphicsLayerLine: model.graphicsLayerLine,
        graphicsLayerRuimtebeslag: model.graphicsLayerRuimtebeslag,
        graphicsLayerRuimtebeslag3d: model.graphicsLayerRuimtebeslag3d,
        graphicsLayerTemp: model.graphicsLayerTemp,
        graphicsLayerControlPoints: model.graphicsLayerControlPoints,
    };

    const originalValues = {
        designName: model.designName,
        totalVolumeDifference: model.totalVolumeDifference,
        excavationVolume: model.excavationVolume,
        fillVolume: model.fillVolume,
        total2dArea: model.total2dArea,
        total3dArea: model.total3dArea,
        lineLength: model.lineLength,
        intersectingPanden: [...model.intersectingPanden],
        intersectingBomen: [...model.intersectingBomen],
        intersectingPercelen: [...model.intersectingPercelen],
        intersectingPercelenArea: model.intersectingPercelenArea,
        intersectingWegdelen2dRuimtebeslag: model.intersectingWegdelen2dRuimtebeslag,
        intersectingInritten2dRuimtebeslag: model.intersectingInritten2dRuimtebeslag,
        intersectingInritten2dRuimtebeslagCount: [...model.intersectingInritten2dRuimtebeslagCount],
        intersectingNatura2000: model.intersectingNatura2000,
        intersectingGNN: model.intersectingGNN,
        intersectingBeheertypen: [...model.intersectingBeheertypen],
        intersectingBeheertypeArea: model.intersectingBeheertypeArea,
        intersectingPandenArea: model.intersectingPandenArea,
        intersectingPandenBuffer: [...model.intersectingPandenBuffer],
        intersectingPandenBufferArea: model.intersectingPandenBufferArea,
        intersectingErven: [...model.intersectingErven],
        intersectingErvenArea: model.intersectingErvenArea,
        // Execution zone (uitvoeringszone)
        uitvoeringszoneWegoppervlak: model.uitvoeringszoneWegoppervlak,
        uitvoeringszonePanden: [...model.uitvoeringszonePanden],
        uitvoeringszonePandenArea: model.uitvoeringszonePandenArea,
        uitvoeringszonePercelen: [...model.uitvoeringszonePercelen],
        uitvoeringszonePercelenArea: model.uitvoeringszonePercelenArea,
        uitvoeringszoneNatura2000: model.uitvoeringszoneNatura2000,
        uitvoeringszoneGNN: model.uitvoeringszoneGNN,
        uitvoeringszoneBeheertypeArea: model.uitvoeringszoneBeheertypeArea,
        // Calculation status flags
        effectsCalculated: model.effectsCalculated,
        costsCalculated: model.costsCalculated,
    };

    const originalCosts = model.costModel ? {
        complexity: model.costModel.complexity,
        depth: model.costModel.depth,
        directCostGroundWork: model.costModel.directCostGroundWork?.toDict() || {},
        directCostStructures: model.costModel.directCostStructures?.toDict() || {},
        indirectConstructionCosts: model.costModel.indirectConstructionCosts?.toDict() || {},
        engineeringCosts: model.costModel.engineeringCosts?.toDict() || {},
        otherCosts: model.costModel.otherCosts?.toDict() || {},
        realEstateCosts: model.costModel.realEstateCosts?.toDict() || {},
        risicoreservering: model.costModel.risicoreservering,
    } : null;

    // Temporary layers for isolated calculation
    const temp3d = new GraphicsLayer();
    const tempLine = new GraphicsLayer();
    const tempRuimtebeslag = new GraphicsLayer();
    const tempRuimtebeslag3d = new GraphicsLayer();
    const tempTemp = new GraphicsLayer();
    const tempControlPoints = new GraphicsLayer();

    try {
        model.graphicsLayer3dPolygon = temp3d;
        model.graphicsLayerLine = tempLine;
        model.graphicsLayerRuimtebeslag = tempRuimtebeslag;
        model.graphicsLayerRuimtebeslag3d = tempRuimtebeslag3d;
        model.graphicsLayerTemp = tempTemp;
        model.graphicsLayerControlPoints = tempControlPoints;

        // Load only 3D geometry and cost line into temp layers
        if (jsonData.geometries?.design3d?.length) {
            loadGeometriesToLayer(temp3d, jsonData.geometries.design3d, model);
            loadGeometriesToLayer(tempTemp, jsonData.geometries.design3d, model);
        }
        if (jsonData.geometries?.inputLine?.length) {
            loadGeometriesToLayer(tempLine, jsonData.geometries.inputLine, model);
        }

        // Run calculations on the temporary context
        const { calculateVolume } = await import("./DesignFunctions");
        const { handleCostCalculation } = await import("./CostFunctions");
        const { handleEffectAnalysis } = await import("./EffectFunctions");

        await calculateVolume(model);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await handleCostCalculation(model);
        // Immediately restore cost flag to prevent UI changes
        model.costsCalculated = originalValues.costsCalculated;
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await handleEffectAnalysis(model);
        // Immediately restore effect flag to prevent UI changes
        model.effectsCalculated = originalValues.effectsCalculated;

        // Build updated project JSON with recalculated geometries
        const updated: ProjectJSON = {
            ...jsonData,
            geometries: {
                ...jsonData.geometries,
                ruimtebeslag2d: graphicsToFeatures(Array.from(tempRuimtebeslag?.graphics || [])),
                ruimtebeslag3d: graphicsToFeatures(Array.from(tempRuimtebeslag3d?.graphics || [])),
            },
            designValues: {
                trajectLength: model.lineLength || null,
                volumeDifference: model.totalVolumeDifference || null,
                excavationVolume: model.excavationVolume || null,
                fillVolume: model.fillVolume || null,
                area2d: model.total2dArea || null,
                area3d: model.total3dArea || null,
            },
            costs: {
                complexity: model.costModel?.complexity || null,
                depth: model.costModel?.depth || null,
                directCostGroundWork: model.costModel?.directCostGroundWork?.toDict() || {},
                directCostStructures: model.costModel?.directCostStructures?.toDict() || {},
                indirectConstructionCosts: model.costModel?.indirectConstructionCosts?.toDict() || {},
                engineeringCosts: model.costModel?.engineeringCosts?.toDict() || {},
                otherCosts: model.costModel?.otherCosts?.toDict() || {},
                realEstateCosts: model.costModel?.realEstateCosts?.toDict() || {},
                risicoreservering: model.costModel?.risicoreservering || null,
            },
            effects: {
                intersectingPanden: model.intersectingPanden || [],
                intersectingBomen: model.intersectingBomen || [],
                intersectingPercelen: model.intersectingPercelen || [],
                intersectingPercelenArea: model.intersectingPercelenArea || null,
                intersectingWegdelen2dRuimtebeslag: model.intersectingWegdelen2dRuimtebeslag || null,
                intersectingInritten2dRuimtebeslag: model.intersectingInritten2dRuimtebeslag || null,
                intersectingInritten2dRuimtebeslagCount: model.intersectingInritten2dRuimtebeslagCount || [],
                intersectingNatura2000: model.intersectingNatura2000 || null,
                intersectingGNN: model.intersectingGNN || null,
                intersectingBeheertypen: model.intersectingBeheertypen || [],
                intersectingBeheertypeArea: model.intersectingBeheertypeArea || null,
                intersectingPandenArea: model.intersectingPandenArea || null,
                intersectingPandenBuffer: model.intersectingPandenBuffer || [],
                intersectingPandenBufferArea: model.intersectingPandenBufferArea || null,
                intersectingErven: model.intersectingErven || [],
                intersectingErvenArea: model.intersectingErvenArea || null,
                // Execution zone (uitvoeringszone)
                uitvoeringszoneWegoppervlak: model.uitvoeringszoneWegoppervlak || null,
                uitvoeringszonePanden: model.uitvoeringszonePanden || [],
                uitvoeringszonePandenArea: model.uitvoeringszonePandenArea || null,
                uitvoeringszonePercelen: model.uitvoeringszonePercelen || [],
                uitvoeringszonePercelenArea: model.uitvoeringszonePercelenArea || null,
                uitvoeringszoneNatura2000: model.uitvoeringszoneNatura2000 || null,
                uitvoeringszoneGNN: model.uitvoeringszoneGNN || null,
                uitvoeringszoneBeheertypeArea: model.uitvoeringszoneBeheertypeArea || null,
            },
        };

        return updated;
    } finally {
        // Restore model state
        model.graphicsLayer3dPolygon = originalLayers.graphicsLayer3dPolygon;
        model.graphicsLayerLine = originalLayers.graphicsLayerLine;
        model.graphicsLayerRuimtebeslag = originalLayers.graphicsLayerRuimtebeslag;
        model.graphicsLayerRuimtebeslag3d = originalLayers.graphicsLayerRuimtebeslag3d;
        model.graphicsLayerTemp = originalLayers.graphicsLayerTemp;
        model.graphicsLayerControlPoints = originalLayers.graphicsLayerControlPoints;

        model.designName = originalValues.designName;
        model.totalVolumeDifference = originalValues.totalVolumeDifference;
        model.excavationVolume = originalValues.excavationVolume;
        model.fillVolume = originalValues.fillVolume;
        model.total2dArea = originalValues.total2dArea;
        model.total3dArea = originalValues.total3dArea;
        model.lineLength = originalValues.lineLength;

        model.intersectingPanden = originalValues.intersectingPanden;
        model.intersectingBomen = originalValues.intersectingBomen;
        model.intersectingPercelen = originalValues.intersectingPercelen;
        model.intersectingPercelenArea = originalValues.intersectingPercelenArea;
        model.intersectingWegdelen2dRuimtebeslag = originalValues.intersectingWegdelen2dRuimtebeslag;
        model.intersectingInritten2dRuimtebeslag = originalValues.intersectingInritten2dRuimtebeslag;
        model.intersectingInritten2dRuimtebeslagCount = originalValues.intersectingInritten2dRuimtebeslagCount;
        model.intersectingNatura2000 = originalValues.intersectingNatura2000;
        model.intersectingGNN = originalValues.intersectingGNN;
        model.intersectingBeheertypen = originalValues.intersectingBeheertypen;
        model.intersectingBeheertypeArea = originalValues.intersectingBeheertypeArea;
        model.intersectingPandenArea = originalValues.intersectingPandenArea;
        model.intersectingPandenBuffer = originalValues.intersectingPandenBuffer;
        model.intersectingPandenBufferArea = originalValues.intersectingPandenBufferArea;
        model.intersectingErven = originalValues.intersectingErven;
        model.intersectingErvenArea = originalValues.intersectingErvenArea;
        
        // Restore execution zone (uitvoeringszone) values
        model.uitvoeringszoneWegoppervlak = originalValues.uitvoeringszoneWegoppervlak;
        model.uitvoeringszonePanden = originalValues.uitvoeringszonePanden;
        model.uitvoeringszonePandenArea = originalValues.uitvoeringszonePandenArea;
        model.uitvoeringszonePercelen = originalValues.uitvoeringszonePercelen;
        model.uitvoeringszonePercelenArea = originalValues.uitvoeringszonePercelenArea;
        model.uitvoeringszoneNatura2000 = originalValues.uitvoeringszoneNatura2000;
        model.uitvoeringszoneGNN = originalValues.uitvoeringszoneGNN;
        model.uitvoeringszoneBeheertypeArea = originalValues.uitvoeringszoneBeheertypeArea;

        // Restore calculation status flags
        model.effectsCalculated = originalValues.effectsCalculated;
        model.costsCalculated = originalValues.costsCalculated;

        if (model.costModel && originalCosts) {
            model.costModel.complexity = originalCosts.complexity;
            model.costModel.depth = originalCosts.depth;
            Object.assign(model.costModel.directCostGroundWork, originalCosts.directCostGroundWork);
            Object.assign(model.costModel.directCostStructures, originalCosts.directCostStructures);
            Object.assign(model.costModel.indirectConstructionCosts, originalCosts.indirectConstructionCosts);
            Object.assign(model.costModel.engineeringCosts, originalCosts.engineeringCosts);
            Object.assign(model.costModel.otherCosts, originalCosts.otherCosts);
            Object.assign(model.costModel.realEstateCosts, originalCosts.realEstateCosts);
            model.costModel.risicoreservering = originalCosts.risicoreservering;
        }
    }
};

/**
 * Load only the cost line and 3D polygon, then recalculate volumes, costs and effects.
 */
export const loadProjectForRecalculation = async (model: DikeDesignerModel, jsonData: ProjectJSON): Promise<void> => {
    try {
        const { geometries, metadata, constructions } = jsonData as any;

        // Clear existing graphics
        model.graphicsLayerTemp?.removeAll();
        cleanFeatureLayer(model.designLayer2D);
        model.graphicsLayerRuimtebeslag?.removeAll();
        model.graphicsLayerRuimtebeslag3d?.removeAll();
        model.graphicsLayerLine?.removeAll();
        model.graphicsLayerPoint?.removeAll();
        model.graphicsLayerCrossSection?.removeAll();
        model.graphicsLayerProfile?.removeAll();
        model.constructionModel?.graphicsLayerConstructionLine?.removeAll();
        
        // Clear construction model properties
        if (model.constructionModel) {
            model.constructionModel.drawnConstructionLine = null;
            model.constructionModel.selectedLine = null;
            model.constructionModel.structures = [];
            model.constructionModel.useOffset = false;
            model.constructionModel.offsetDistance = 0;
            model.constructionModel.offsetSide = 'right';
            model.constructionModel.structureType = "Heavescherm";
            model.constructionModel.depth = null;
        }

        // Load 3D design geometry
        if (geometries.design3d?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayer3dPolygon, geometries.design3d, model);
            loadGeometriesToLayer(model.graphicsLayerTemp, geometries.design3d, model);
        }

        // Load cost line (inputLine)
        if (geometries.inputLine?.length > 0) {
            loadGeometriesToLayer(model.graphicsLayerLine, geometries.inputLine, model);
        }

        // Load constructions (if present)
        if (constructions && model.constructionModel) {
            const constr = constructions;
            model.constructionModel.structureType = constr.structureType || "Heavescherm";
            model.constructionModel.depth = constr.depth || 5;
            model.constructionModel.useOffset = constr.useOffset || false;
            model.constructionModel.offsetDistance = constr.offsetDistance || 0;
            model.constructionModel.offsetSide = constr.offsetSide || "right";

            if (constr.drawnConstructionLine) {
                try {
                    const geometry = featureToGeometry(constr.drawnConstructionLine);
                    if (geometry && model.constructionModel.graphicsLayerConstructionLine) {
                        model.constructionModel.drawnConstructionLine = geometry;
                        const graphic = new Graphic({
                            geometry,
                            symbol: {
                                type: "simple-line",
                                color: [0, 0, 255],
                                width: 3,
                            } as any,
                        });
                        model.constructionModel.graphicsLayerConstructionLine.add(graphic);
                    }
                } catch (err) {
                    console.warn("Error loading construction line geometry:", err);
                }
            }

            if (constr.structures && Array.isArray(constr.structures)) {
                model.constructionModel.structures = constr.structures
                    .map((struct: any) => ({
                        geometry: struct.geometry ? featureToGeometry(struct.geometry) : null,
                        attributes: struct.attributes || { type: "Heavescherm", depth: 5 },
                    }))
                    .filter((struct: any) => struct.geometry !== null);

                if (model.constructionModel.graphicsLayerConstructionLine) {
                    model.constructionModel.structures.forEach((struct: any) => {
                        if (struct.geometry) {
                            const graphic = new Graphic({
                                geometry: struct.geometry,
                                symbol: {
                                    type: "simple-line",
                                    color: [0, 0, 255],
                                    width: 3,
                                } as any,
                                attributes: struct.attributes,
                            });
                            model.constructionModel.graphicsLayerConstructionLine!.add(graphic);
                        }
                    });
                }
            }
        }

        // Set design name from metadata
        if (metadata?.vak && metadata?.alternatief) {
            model.designName = `${metadata.vak} - ${metadata.alternatief}`;
        } else if (metadata?.vak) {
            model.designName = metadata.vak;
        }

        // Create meshes from 3D polygons
        if (geometries.design3d?.length > 0) {
            import("./SaveFunctions").then(({ loadGeometriesFromDesign }) => {
                loadGeometriesFromDesign(model).catch(err => console.error("Error loading geometries:", err));
            });
        }

        model.messages.commands.ui.displayNotification.execute({
            title: "Ontwerp geladen",
            message: "Geometrie geladen. Volumes, kosten en effecten worden herberekend...",
            disableTimeouts: false,
        });

        const { calculateVolume } = await import("./DesignFunctions");
        const { handleCostCalculation } = await import("./CostFunctions");
        const { handleEffectAnalysis } = await import("./EffectFunctions");

        await calculateVolume(model);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await handleCostCalculation(model);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await handleEffectAnalysis(model);
    } catch (error) {
        console.error("Error loading project for recalculation:", error);
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
 * Convert a geometry to GeoJSON format (for storage)
 */
const featureToGeoJSON = (graphic: any): any => {
    if (!graphic || !graphic.geometry) return null;
    
    return {
        geometry: graphic.geometry.toJSON(),
        attributes: graphic.attributes || {}
    };
};

/**
 * Convert GeoJSON format back to a geometry object
 */
const featureToGeometry = (feature: any): any => {
    if (!feature || !feature.geometry) return null;
    
    const geom = feature.geometry;
    
    try {
        if (geom.x !== undefined && geom.y !== undefined) {
            // Point
            return new Point({
                x: geom.x,
                y: geom.y,
                z: geom.z,
                spatialReference: geom.spatialReference,
            });
        } else if (geom.paths) {
            // Polyline
            return new Polyline({
                paths: geom.paths,
                spatialReference: geom.spatialReference,
            });
        } else if (geom.rings) {
            // Polygon
            return new Polygon({
                rings: geom.rings,
                spatialReference: geom.spatialReference,
            });
        }
    } catch (err) {
        console.error("Error converting feature to geometry:", err);
    }
    
    return null;
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
