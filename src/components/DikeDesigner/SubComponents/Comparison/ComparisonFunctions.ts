import type DikeDesignerModel from "../../DikeDesignerModel";
import type { DesignSnapshot } from "./snapshotUtils";
import { createSnapshot } from "./snapshotUtils";
import { type ProjectJSON, buildProjectJSON, loadProjectFromJSON, recalculateAlternativeData } from "../../Functions/SaveProjectFunctions";
import type { LayerVisibilityState } from "./ComparisonModel";
import { constructionLineSymbol, defaultPointSymbol } from "../../symbologyConfig";

import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
import Mesh from "@arcgis/core/geometry/Mesh";
import Polygon from "@arcgis/core/geometry/Polygon";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";

const DEFAULT_VISIBILITY: LayerVisibilityState = { ruimtebeslag2d: false, design3d: false, constructionLine: false, mesh: false };

export const formatDateTime = (value?: string): string => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleString("nl-NL");
};

export const buildMeshFromGeometries = (geometries: any[]): Mesh | null => {
    const meshes: Mesh[] = [];

    if (!geometries || geometries.length === 0) {
        return null;
    }

    geometries.forEach((geomData: any) => {
        try {
            if (geomData && geomData.geometry) {
                const polygon = Polygon.fromJSON(geomData.geometry);
                const mesh = Mesh.createFromPolygon(polygon, {});
                mesh.spatialReference = polygon.spatialReference;
                meshes.push(mesh);
            }
        } catch (e) {
            console.warn("Could not create mesh from geometry:", e);
        }
    });

    if (meshes.length === 0) {
        return null;
    }

    if (meshes.length === 1) {
        return meshes[0];
    }

    return meshUtils.merge(meshes);
};

export const ensureSnapshotLayer = (
    model: DikeDesignerModel,
    snapshot: DesignSnapshot,
    type: "ruimtebeslag2d" | "design3d" | "constructionLine" | "mesh"
): GraphicsLayer | null => {
    if (!model.map) {
        return null;
    }

    const compModel = model.comparisonModel;
    const existing = compModel.snapshotLayers[snapshot.id]?.[type];
    if (existing && existing instanceof GraphicsLayer) {
        return existing;
    }

    // For mesh and constructionLine, check if this is the current design
    if (type === "mesh" && model.graphicsLayerMesh) {
        const isCurrentSnapshot = model.activeSnapshotId === snapshot.id;
        if (isCurrentSnapshot) {
            compModel.snapshotLayers[snapshot.id] = {
                ...compModel.snapshotLayers[snapshot.id],
                mesh: model.graphicsLayerMesh,
            };
            return model.graphicsLayerMesh;
        }
    }

    if (type === "constructionLine" && model.constructionModel?.graphicsLayerConstructionLine) {
        const isCurrentSnapshot = model.activeSnapshotId === snapshot.id;
        if (isCurrentSnapshot) {
            compModel.snapshotLayers[snapshot.id] = {
                ...compModel.snapshotLayers[snapshot.id],
                constructionLine: model.constructionModel.graphicsLayerConstructionLine,
            };
            return model.constructionModel.graphicsLayerConstructionLine;
        }
    }

    const layerTitles: Record<string, string> = {
        ruimtebeslag2d: `Ruimtebeslag 2D - ${snapshot.name}`,
        design3d: `Ontwerp 3D - ${snapshot.name}`,
        constructionLine: `Constructielijn - ${snapshot.name}`,
        mesh: `Dijklichaam 3D - ${snapshot.name}`,
    };

    const layer = new GraphicsLayer({
        title: layerTitles[type],
        visible: false,
        elevationInfo: {
            mode: type === "design3d" || type === "mesh" ? "absolute-height" : "on-the-ground",
            offset: 0
        }
    });

    let geometries: any[] = [];

    if (type === "ruimtebeslag2d") {
        geometries = snapshot.projectJSON.geometries?.ruimtebeslag2d || [];
    } else if (type === "design3d") {
        geometries = snapshot.projectJSON.geometries?.design3d || [];
    } else if (type === "mesh") {
        geometries = snapshot.projectJSON.geometries?.design3d || [];
    } else if (type === "constructionLine") {
        console.log("Loading construction geometries for snapshot:", snapshot.projectJSON.constructions);
        const constructions = snapshot.projectJSON.constructions;
        const drawnConstruction = constructions?.drawnConstructionLine ? [constructions.drawnConstructionLine] : [];
        console.log("drawnConstruction array:", drawnConstruction);

        const structureGeometries = Array.isArray(constructions?.structures)
            ? constructions.structures
                .filter((struct: any) => struct?.geometry)
                .map((struct: any) => ({
                    geometry: struct.geometry.geometry ? struct.geometry.geometry : struct.geometry,
                    attributes: struct.attributes || struct.geometry?.attributes,
                }))
            : [];
        console.log("structureGeometries array:", structureGeometries);

        geometries = [...drawnConstruction, ...structureGeometries];
        console.log("Total construction geometries:", geometries.length, geometries);
    }

    if ((type === "design3d" || type === "mesh") && geometries && geometries.length > 0) {
        const mesh = buildMeshFromGeometries(geometries);
        if (mesh) {
            compModel.snapshotLayers[snapshot.id] = {
                ...compModel.snapshotLayers[snapshot.id],
                meshGeometry: mesh,
            };

            const meshSymbol = new MeshSymbol3D({
                symbolLayers: [
                    {
                        type: "fill",
                        material: {
                            color: [85, 140, 75, 0.8],
                            colorMixMode: "replace"
                        },
                        castShadows: true
                    }
                ]
            });

            const meshGraphic = new Graphic({
                geometry: mesh,
                symbol: meshSymbol,
            });
            layer.add(meshGraphic);
        }
    } else if (geometries && geometries.length > 0) {
        geometries.forEach((feature: any, idx: number) => {
            try {
                console.log(`Processing ${type} geometry ${idx}:`, feature);
                let geometry;
                let symbol = feature.symbol;

                if (feature.geometry?.x !== undefined && feature.geometry?.y !== undefined) {
                    geometry = new Point({
                        x: feature.geometry.x,
                        y: feature.geometry.y,
                        z: feature.geometry.z,
                        spatialReference: feature.geometry.spatialReference,
                    });
                    if (!symbol) {
                        symbol = defaultPointSymbol;
                    }
                } else if (feature.geometry?.paths) {
                    geometry = new Polyline({
                        paths: feature.geometry.paths,
                        spatialReference: feature.geometry.spatialReference,
                    });
                    if (!symbol) {
                        symbol = constructionLineSymbol;
                    }
                } else if (feature.geometry?.rings) {
                    geometry = new Polygon({
                        rings: feature.geometry.rings,
                        spatialReference: feature.geometry.spatialReference,
                    });
                } else {
                    const graphic = Graphic.fromJSON(feature);
                    if (graphic && graphic.geometry) {
                        layer.add(graphic);
                    }
                    return;
                }

                const graphic = new Graphic({
                    geometry,
                    symbol: symbol || undefined,
                    attributes: feature.attributes,
                });
                layer.add(graphic);
                console.log(`Added ${type} graphic ${idx} to layer:`, graphic);
                console.log(`  Geometry:`, geometry);
                console.log(`  Spatial Reference:`, geometry?.spatialReference);
                console.log(`  Extent:`, geometry?.extent);
            } catch (e) {
                console.warn(`Could not load ${type} geometry ${idx}:`, e, feature);
            }
        });
    }

    model.map.add(layer);
    console.log(`Added ${type} layer for snapshot ${snapshot.id}:`, layer, `with ${geometries.length} geometries`);
    console.log(`Layer in map.layers collection:`, model.map.layers.includes(layer));
    console.log(`Map layers count:`, model.map.layers.length);
    compModel.snapshotLayers[snapshot.id] = {
        ...compModel.snapshotLayers[snapshot.id],
        [type]: layer,
    };

    return layer;
};

export const toggleSnapshotLayerVisibility = (
    model: DikeDesignerModel,
    snapshot: DesignSnapshot,
    type: "ruimtebeslag2d" | "design3d" | "constructionLine" | "mesh"
): void => {
    console.log(`Toggle ${type} for snapshot ${snapshot.id} (${snapshot.name})`);

    const compModel = model.comparisonModel;
    const isCurrentSnapshot = model.activeSnapshotId === snapshot.id;
    console.log(`Is current snapshot: ${isCurrentSnapshot}, model.designName: ${model.designName}`);

    // Handle current design's existing layers
    if (isCurrentSnapshot) {
        if (type === "ruimtebeslag2d" && model.graphicsLayerRuimtebeslag) {
            const current = compModel.layerVisibility[snapshot.id] || { ...DEFAULT_VISIBILITY };
            const nextState = { ...current, ruimtebeslag2d: !current.ruimtebeslag2d };
            console.log(`Toggling current 2D layer visibility to: ${nextState.ruimtebeslag2d}`);
            model.graphicsLayerRuimtebeslag.visible = nextState.ruimtebeslag2d;
            compModel.layerVisibility = { ...compModel.layerVisibility, [snapshot.id]: nextState };
            return;
        }

        if (type === "design3d" && model.graphicsLayerRuimtebeslag3d) {
            const current = compModel.layerVisibility[snapshot.id] || { ...DEFAULT_VISIBILITY };
            const nextState = { ...current, design3d: !current.design3d };
            console.log(`Toggling current 3D layer visibility to: ${nextState.design3d}`);
            model.graphicsLayerRuimtebeslag3d.visible = nextState.design3d;
            compModel.layerVisibility = { ...compModel.layerVisibility, [snapshot.id]: nextState };
            return;
        }

        if (type === "mesh" && model.graphicsLayerMesh) {
            const current = compModel.layerVisibility[snapshot.id] || { ...DEFAULT_VISIBILITY };
            const nextState = { ...current, mesh: !current.mesh };
            console.log(`Toggling current mesh layer visibility to: ${nextState.mesh}`);
            model.graphicsLayerMesh.visible = nextState.mesh;
            compModel.layerVisibility = { ...compModel.layerVisibility, [snapshot.id]: nextState };
            return;
        }

        if (type === "constructionLine" && model.constructionModel?.graphicsLayerConstructionLine) {
            const current = compModel.layerVisibility[snapshot.id] || { ...DEFAULT_VISIBILITY };
            const nextState = { ...current, constructionLine: !current.constructionLine };
            console.log(`Toggling current construction layer visibility to: ${nextState.constructionLine}`);
            model.constructionModel!.graphicsLayerConstructionLine.visible = nextState.constructionLine;
            compModel.snapshotLayers[snapshot.id] = {
                ...compModel.snapshotLayers[snapshot.id],
                constructionLine: model.constructionModel!.graphicsLayerConstructionLine,
            };
            compModel.layerVisibility = { ...compModel.layerVisibility, [snapshot.id]: nextState };
            return;
        }
    }

    const layer = ensureSnapshotLayer(model, snapshot, type);
    if (!layer) {
        console.log(`No layer returned for ${type}`);
        return;
    }

    const current = compModel.layerVisibility[snapshot.id] || { ...DEFAULT_VISIBILITY };
    const nextState = {
        ...current,
        [type]: !current[type],
    };
    console.log(`Setting ${type} layer visibility to: ${nextState[type]}, current was: ${current[type]}`);
    console.log(`Layer object:`, layer);
    console.log(`Layer graphics count:`, layer.graphics?.length);
    layer.visible = nextState[type];
    compModel.layerVisibility = { ...compModel.layerVisibility, [snapshot.id]: nextState };
};

export const addCurrentDesignSnapshot = (model: DikeDesignerModel): void => {
    try {
        const projectData = buildProjectJSON(model);
        const snapshot = createSnapshot(projectData, true); // Current design is already calculated

        const newSnapshots = [...model.comparisonSnapshots, snapshot];
        model.comparisonSnapshots = newSnapshots;
        model.activeSnapshotId = snapshot.id;
        console.log("Updated comparison snapshots, total:", newSnapshots.length);

        model.messages.commands.ui.displayNotification.execute({
            id: `comparison-add-${snapshot.id}`,
            title: "Succes",
            message: `Huidig ontwerp "${snapshot.name}" is toegevoegd aan de vergelijking.`,
            disableTimeouts: false
        });
    } catch (error) {
        console.error("Error capturing current design:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
        model.messages.commands.ui.alert.execute({
            title: "Error",
            message: `Kon het huidige ontwerp niet vastleggen: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
};

export const handleLoadFull = (model: DikeDesignerModel, pendingProjectData: ProjectJSON): void => {
    const snapshot = createSnapshot(pendingProjectData, false); // Imported without recalculation
    const newSnapshots = [...model.comparisonSnapshots, snapshot];
    model.comparisonSnapshots = newSnapshots;

    model.messages.commands.ui.displayNotification.execute({
        id: `comparison-loadfull-${snapshot.id}`,
        title: "Succes",
        message: `Ontwerp "${snapshot.name}" is toegevoegd met alle waarden.`,
        disableTimeouts: false,
    });
};

export const handleLoadAndRecalculate = async (model: DikeDesignerModel, pendingProjectData: ProjectJSON): Promise<void> => {
    const recalculatedProject = await recalculateAlternativeData(model, pendingProjectData);
    const recalculatedWithTimestamp: ProjectJSON = {
        ...recalculatedProject,
        metadata: {
            ...recalculatedProject.metadata,
            lastModified: new Date().toISOString(),
        },
    };
    const snapshot = createSnapshot(recalculatedWithTimestamp, true); // Just recalculated
    const newSnapshots = [...model.comparisonSnapshots, snapshot];
    model.comparisonSnapshots = newSnapshots;

    model.messages.commands.ui.displayNotification.execute({
        id: `comparison-recalc-add-${snapshot.id}`,
        title: "Succes",
        message: `Ontwerp "${snapshot.name}" is herberekend en toegevoegd.`,
        disableTimeouts: false,
    });
};

export const handleRecalculateSnapshot = async (model: DikeDesignerModel, snapshot: DesignSnapshot): Promise<void> => {
    try {
        model.loading = true;
        const recalculatedProject = await recalculateAlternativeData(model, snapshot.projectJSON);
        const updatedSnapshot: DesignSnapshot = {
            ...snapshot,
            projectJSON: {
                ...recalculatedProject,
                metadata: {
                    ...recalculatedProject.metadata,
                    lastModified: new Date().toISOString(),
                },
            },
            timestamp: new Date().toLocaleString("nl-NL"),
            recalculated: true, // Mark as recalculated
        };

        model.comparisonSnapshots = model.comparisonSnapshots.map((s) =>
            s.id === snapshot.id ? updatedSnapshot : s
        );

        model.messages.commands.ui.displayNotification.execute({
            id: `comparison-recalc-${snapshot.id}`,
            title: "Succes",
            message: `Ontwerp "${snapshot.name}" is herberekend.`,
            disableTimeouts: false,
        });
    } catch (error) {
        console.error("Error recalculating snapshot:", error);
        model.messages.commands.ui.alert.execute({
            title: "Fout",
            message: `Kon het ontwerp niet herberekenen: ${error instanceof Error ? error.message : String(error)}`,
        });
    } finally {
        model.loading = false;
    }
};

export const handleImportDesignFile = (
    model: DikeDesignerModel,
    file: File,
    onSuccess: (projectData: ProjectJSON) => void
): void => {
    console.log("Importing design file:", file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            console.log("File content loaded, length:", content.length);

            const projectData: ProjectJSON = JSON.parse(content);

            if (!projectData.metadata) {
                console.error("Missing metadata in project file");
                model.messages.commands.ui.alert.execute({
                    title: "Import Error",
                    message: "Het bestand mist metadata informatie.",
                });
                return;
            }

            if (!projectData.designValues) {
                console.error("Missing designValues in project file");
                model.messages.commands.ui.alert.execute({
                    title: "Import Error",
                    message: "Het bestand mist ontwerpwaarden.",
                });
                return;
            }

            if (!projectData.costs) {
                console.error("Missing costs in project file");
                model.messages.commands.ui.alert.execute({
                    title: "Import Error",
                    message: "Het bestand mist kosten informatie.",
                });
                return;
            }

            onSuccess(projectData);
        } catch (error) {
            console.error("Error parsing design file:", error);
            console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
            model.messages.commands.ui.alert.execute({
                title: "Import Error",
                message: `Kon het ontwerp bestand niet lezen: ${error instanceof Error ? error.message : "Onbekende fout"}`,
            });
        }
    };

    reader.onerror = (error) => {
        console.error("FileReader error:", error);
        model.messages.commands.ui.alert.execute({
            title: "Import Error",
            message: "Kon het bestand niet lezen van disk.",
        });
    };

    reader.readAsText(file);
};

export const removeSnapshot = (model: DikeDesignerModel, id: string): void => {
    console.log(`Removing snapshot ${id}...`);
    model.comparisonSnapshots = model.comparisonSnapshots.filter((s) => s.id !== id);

    const compModel = model.comparisonModel;
    const layers = compModel.snapshotLayers[id];
    console.log(`Found layers for snapshot ${id}:`, layers);

    if (layers) {
        if (layers.ruimtebeslag2d) {
            console.log("Removing ruimtebeslag2d layer");
            model.map?.remove(layers.ruimtebeslag2d);
        }
        if (layers.design3d) {
            console.log("Removing design3d layer");
            model.map?.remove(layers.design3d);
        }
        if (layers.constructionLine) {
            console.log("Removing constructionLine layer");
            model.map?.remove(layers.constructionLine);
        }
        delete compModel.snapshotLayers[id];
    } else {
        console.log(`No stored layers found for ${id}, checking map layers...`);
        const layersToRemove = model.map?.layers?.toArray()?.filter((layer: any) =>
            layer.title?.includes(`- ${id.substring(0, 4)}`) ||
            layer.title?.includes(id)
        ) || [];

        layersToRemove.forEach((layer: any) => {
            console.log(`Removing layer from map: ${layer.title}`);
            model.map?.remove(layer);
        });
    }

    const newVisibility = { ...compModel.layerVisibility };
    delete newVisibility[id];
    compModel.layerVisibility = newVisibility;

    console.log(`Snapshot ${id} removed. Remaining map layers:`, model.map?.layers?.length);
};

export const clearAllSnapshots = (model: DikeDesignerModel): void => {
    console.log("Clearing all snapshots...");
    model.comparisonSnapshots = [];

    const compModel = model.comparisonModel;

    Object.entries(compModel.snapshotLayers).forEach(([id, layers]) => {
        console.log(`Removing layers for snapshot ${id}`);
        if (layers.ruimtebeslag2d) {
            model.map?.remove(layers.ruimtebeslag2d);
        }
        if (layers.design3d) {
            model.map?.remove(layers.design3d);
        }
        if (layers.constructionLine) {
            model.map?.remove(layers.constructionLine);
        }
    });

    // Also remove any comparison layers that might still be on the map
    const comparisonLayers = model.map?.layers?.toArray()?.filter((layer: any) =>
        layer.title?.includes("Ruimtebeslag 2D") ||
        layer.title?.includes("Ontwerp 3D") ||
        layer.title?.includes("Constructielijn")
    ) || [];

    comparisonLayers.forEach((layer: any) => {
        console.log(`Force removing layer: ${layer.title}`);
        model.map?.remove(layer);
    });

    compModel.snapshotLayers = {};
    compModel.layerVisibility = {};

    console.log(`All snapshots cleared. Remaining map layers:`, model.map?.layers?.length);
};

export const clearMapLayers = (model: DikeDesignerModel): void => {
    try {
        const compModel = model.comparisonModel;
        Object.entries(compModel.snapshotLayers).forEach(([id, layers]) => {
            if (layers.ruimtebeslag2d) {
                layers.ruimtebeslag2d.visible = false;
            }
            if (layers.design3d) {
                layers.design3d.visible = false;
            }
            if (layers.constructionLine) {
                layers.constructionLine.visible = false;
            }
            compModel.layerVisibility = {
                ...compModel.layerVisibility,
                [id]: { ...DEFAULT_VISIBILITY },
            };
        });
        model.messages.commands.ui.displayNotification.execute({
            id: "mapCleared",
            message: "Kaart is gewist.",
        });
    } catch (error) {
        console.error("Error clearing map:", error);
    }
};

export const exportComparison = (snapshots: DesignSnapshot[]): void => {
    const dataStr = JSON.stringify(snapshots, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `vergelijking_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
};

export const loadSnapshot = (
    model: DikeDesignerModel,
    snapshot: DesignSnapshot,
): void => {
    try {
        model.designName = snapshot.name;
        model.activeSnapshotId = snapshot.id;
        loadProjectFromJSON(model, snapshot.projectJSON);

        // Turn on mesh by default after loading
        setTimeout(() => {
            if (model.graphicsLayerMesh) {
                model.graphicsLayerMesh.visible = true;
            }
        }, 100);

        // After loading, initialize the visibility state for this snapshot
        setTimeout(() => {
            model.comparisonModel.layerVisibility = {
                ...model.comparisonModel.layerVisibility,
                [snapshot.id]: {
                    ruimtebeslag2d: model.graphicsLayerRuimtebeslag?.visible ?? false,
                    design3d: model.graphicsLayerRuimtebeslag3d?.visible ?? false,
                    constructionLine: model.constructionModel?.graphicsLayerConstructionLine?.visible ?? false,
                    mesh: model.graphicsLayerMesh?.visible ?? true,
                }
            };
        }, 300);

        // Track the construction layer from the loaded snapshot
        if (
            model.constructionModel?.graphicsLayerConstructionLine
            && (
                snapshot.projectJSON.constructions?.drawnConstructionLine
                || (snapshot.projectJSON.constructions?.structures?.length || 0) > 0
            )
        ) {
            model.comparisonModel.snapshotLayers[snapshot.id] = {
                ...model.comparisonModel.snapshotLayers[snapshot.id],
                constructionLine: model.constructionModel.graphicsLayerConstructionLine,
            };
        }

        // Trigger a model update by modifying a property to ensure re-render
        model.loading = true;
        setTimeout(() => {
            model.loading = false;
        }, 100);

        model.messages.commands.ui.displayNotification.execute({
            id: `comparison-load-${snapshot.id}`,
            title: "Succes",
            message: `Ontwerp "${snapshot.name}" is geladen.`,
            disableTimeouts: false,
        });
    } catch (error) {
        console.error("Error loading snapshot:", error);
        model.messages.commands.ui.alert.execute({
            title: "Fout",
            message: `Kon het ontwerp niet laden: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
};

export const initializeComparison = (model: DikeDesignerModel): void => {
    const snapshots = model.comparisonSnapshots || [];

    if (snapshots.length === 0) {
        try {
            const projectData = buildProjectJSON(model);
            const snapshot = createSnapshot(projectData, true); // Current design is already calculated
            model.comparisonSnapshots = [snapshot];
            model.activeSnapshotId = snapshot.id;

            // Turn on mesh by default for the first alternative
            if (model.graphicsLayerMesh) {
                model.graphicsLayerMesh.visible = true;
            }
        } catch (error) {
            console.error("Error adding initial current design:", error);
        }
    }

    // Initialize visibility state from current model layers
    const currentSnapshots = model.comparisonSnapshots || [];
    if (currentSnapshots.length > 0) {
        const currentSnapshot = currentSnapshots[0];
        const isCurrentDesign = model.activeSnapshotId === currentSnapshot.id;
        if (isCurrentDesign) {
            model.comparisonModel.layerVisibility = {
                ...model.comparisonModel.layerVisibility,
                [currentSnapshot.id]: {
                    ruimtebeslag2d: model.graphicsLayerRuimtebeslag?.visible ?? false,
                    design3d: model.graphicsLayerRuimtebeslag3d?.visible ?? false,
                    constructionLine: model.constructionModel?.graphicsLayerConstructionLine?.visible ?? false,
                    mesh: model.graphicsLayerMesh?.visible ?? true,
                }
            };
        }
    }
};

export const syncVisibilityState = (model: DikeDesignerModel): void => {
    const snapshots = model.comparisonSnapshots || [];
    if (snapshots.length > 0) {
        const currentSnapshot = snapshots[0];
        const isCurrentDesign = model.activeSnapshotId === currentSnapshot.id;
        if (isCurrentDesign) {
            const currentState: LayerVisibilityState = {
                ruimtebeslag2d: model.graphicsLayerRuimtebeslag?.visible ?? false,
                design3d: model.graphicsLayerRuimtebeslag3d?.visible ?? false,
                constructionLine: model.constructionModel?.graphicsLayerConstructionLine?.visible ?? false,
                mesh: model.graphicsLayerMesh?.visible ?? false,
            };

            const prevState = model.comparisonModel.layerVisibility[currentSnapshot.id];
            if (!prevState ||
                prevState.ruimtebeslag2d !== currentState.ruimtebeslag2d ||
                prevState.design3d !== currentState.design3d ||
                prevState.constructionLine !== currentState.constructionLine ||
                prevState.mesh !== currentState.mesh) {
                model.comparisonModel.layerVisibility = {
                    ...model.comparisonModel.layerVisibility,
                    [currentSnapshot.id]: currentState,
                };
            }
        }
    }
};
