import React, { useRef, useState } from "react";
import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import Paper from "@vertigis/web/ui/Paper";
import Typography from "@vertigis/web/ui/Typography";
import Box from "@vertigis/web/ui/Box";
import { useWatchAndRerender } from "@vertigis/web/ui";
import { Delete as DeleteIcon, Download as DownloadIcon, Clear as ClearIcon, Add as AddIcon, Visibility as VisibilityIcon, Assessment as AssessmentIcon, Upload as UploadIcon } from "@mui/icons-material";
import type DikeDesignerModel from "../../DikeDesignerModel";
import { type ProjectJSON, buildProjectJSON, loadProjectFromJSON } from "../../Functions/SaveProjectFunctions";
import { createSnapshot, type DesignSnapshot } from "./snapshotUtils";
import { constructionLineSymbol, defaultPointSymbol } from "../../symbologyConfig";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
import Mesh from "@arcgis/core/geometry/Mesh";
import Polygon from "@arcgis/core/geometry/Polygon";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";

interface ComparisonAlternativesPanelProps {
    model: DikeDesignerModel;
    onLoadDesign?: () => void;
}

const ComparisonAlternativesPanel: React.FC<ComparisonAlternativesPanelProps> = ({ model, onLoadDesign }) => {
    const designFileInputRef = useRef<HTMLInputElement>(null);
    const snapshotLayersRef = useRef<Record<string, { ruimtebeslag2d?: GraphicsLayer; design3d?: GraphicsLayer; constructionLine?: GraphicsLayer; mesh?: Mesh }>>({});
    const [layerVisibility, setLayerVisibility] = useState<Record<string, { ruimtebeslag2d: boolean; design3d: boolean; constructionLine: boolean }>>({});
    
    // Use model property for persistent storage across tab switches
    useWatchAndRerender(model, "comparisonSnapshots");
    const snapshots = model.comparisonSnapshots || [];

    const buildMeshFromGeometries = (geometries: any[]): Mesh | null => {
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

    const ensureLayer = (
        snapshot: DesignSnapshot,
        type: "ruimtebeslag2d" | "design3d" | "constructionLine"
    ): GraphicsLayer | null => {
        if (!model.map) {
            return null;
        }

        const existing = snapshotLayersRef.current[snapshot.id]?.[type];
        if (existing) {
            return existing;
        }

        if (type === "constructionLine" && model.constructionModel?.graphicsLayerConstructionLine) {
            const isCurrentSnapshot = model.designName === snapshot.name;
            if (isCurrentSnapshot) {
                snapshotLayersRef.current[snapshot.id] = {
                    ...snapshotLayersRef.current[snapshot.id],
                    constructionLine: model.constructionModel.graphicsLayerConstructionLine,
                };
                return model.constructionModel.graphicsLayerConstructionLine;
            }
        }

        const layerTitles: Record<string, string> = {
            ruimtebeslag2d: `Ruimtebeslag 2D - ${snapshot.name}`,
            design3d: `Ontwerp 3D - ${snapshot.name}`,
            constructionLine: `Constructielijn - ${snapshot.name}`,
        };

        const layer = new GraphicsLayer({
            title: layerTitles[type],
            visible: false,
            elevationInfo: {
                mode: "on-the-ground",
                offset: 0
            }
        });

        let geometries: any[] = [];
        
        if (type === "ruimtebeslag2d") {
            geometries = snapshot.projectJSON.geometries?.ruimtebeslag2d || [];
        } else if (type === "design3d") {
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

        if (type === "design3d" && geometries && geometries.length > 0) {
            const mesh = buildMeshFromGeometries(geometries);
            if (mesh) {
                snapshotLayersRef.current[snapshot.id] = {
                    ...snapshotLayersRef.current[snapshot.id],
                    mesh,
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
                        // Point geometry
                        geometry = new Point({
                            x: feature.geometry.x,
                            y: feature.geometry.y,
                            z: feature.geometry.z,
                            spatialReference: feature.geometry.spatialReference,
                        });
                        // Provide a default symbol for points if none exists
                        if (!symbol) {
                            symbol = defaultPointSymbol;
                        }
                    } else if (feature.geometry?.paths) {
                        // Polyline geometry
                        geometry = new Polyline({
                            paths: feature.geometry.paths,
                            spatialReference: feature.geometry.spatialReference,
                        });
                        // Provide a default symbol for polylines if none exists
                        if (!symbol) {
                            symbol = constructionLineSymbol;
                        }
                    } else if (feature.geometry?.rings) {
                        // Polygon geometry
                        geometry = new Polygon({
                            rings: feature.geometry.rings,
                            spatialReference: feature.geometry.spatialReference,
                        });
                    } else {
                        // Fallback to fromJSON
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
        snapshotLayersRef.current[snapshot.id] = {
            ...snapshotLayersRef.current[snapshot.id],
            [type]: layer,
        };

        return layer;
    };

    const toggleLayerVisibility = (
        snapshot: DesignSnapshot,
        type: "ruimtebeslag2d" | "design3d" | "constructionLine"
    ) => {
        console.log(`Toggle ${type} for snapshot ${snapshot.id} (${snapshot.name})`);
        
        if (type === "constructionLine" && model.constructionModel?.graphicsLayerConstructionLine) {
            const isCurrentSnapshot = model.designName === snapshot.name;
            console.log(`Is current snapshot: ${isCurrentSnapshot}, model.designName: ${model.designName}`);
            if (isCurrentSnapshot) {
                setLayerVisibility(prev => {
                    const current = prev[snapshot.id] || { ruimtebeslag2d: false, design3d: false, constructionLine: false };
                    const nextState = {
                        ...current,
                        constructionLine: !current.constructionLine,
                    };
                    console.log(`Toggling current construction layer visibility to: ${nextState.constructionLine}`);
                    model.constructionModel!.graphicsLayerConstructionLine.visible = nextState.constructionLine;
                    snapshotLayersRef.current[snapshot.id] = {
                        ...snapshotLayersRef.current[snapshot.id],
                        constructionLine: model.constructionModel!.graphicsLayerConstructionLine,
                    };
                    return { ...prev, [snapshot.id]: nextState };
                });
                return;
            }
        }

        const layer = ensureLayer(snapshot, type);
        if (!layer) {
            console.log(`No layer returned for ${type}`);
            return;
        }

        setLayerVisibility(prev => {
            const current = prev[snapshot.id] || { ruimtebeslag2d: false, design3d: false, constructionLine: false };
            const nextState = {
                ...current,
                [type]: !current[type],
            };
            console.log(`Setting ${type} layer visibility to: ${nextState[type]}, current was: ${current[type]}`);
            console.log(`Layer object:`, layer);
            console.log(`Layer graphics count:`, layer.graphics?.length);
            layer.visible = nextState[type];
            return { ...prev, [snapshot.id]: nextState };
        });
    };

    const addCurrentDesign = () => {
        try {
            const projectData = buildProjectJSON(model);
            const snapshot = createSnapshot(projectData);
            
            const newSnapshots = [...model.comparisonSnapshots, snapshot];
            model.comparisonSnapshots = newSnapshots;
            console.log("Updated comparison snapshots, total:", newSnapshots.length);

            model.messages.commands.ui.displayNotification.execute({
                title: "Succes",
                message: `Huidig ontwerp "${snapshot.name}" is toegevoegd aan de vergelijking.`,
                disableTimeouts: true
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

    const handleFileInputClick = () => {
        if (designFileInputRef.current) {
            designFileInputRef.current.click();
        }
    };

    const handleImportDesignFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log("Importing design file:", file.name);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                console.log("File content loaded, length:", content.length);
                
                const projectData: ProjectJSON = JSON.parse(content);

                // Validate the JSON structure
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

                const snapshot = createSnapshot(projectData);
                console.log("Created snapshot:", snapshot);
                
                const newSnapshots = [...model.comparisonSnapshots, snapshot];
                model.comparisonSnapshots = newSnapshots;
                console.log("Updated comparison snapshots, total:", newSnapshots.length);

                model.messages.commands.ui.alert.execute({
                    title: "Succes",
                    message: `Ontwerp "${snapshot.name}" is toegevoegd aan de vergelijking.`,
                });
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
        event.target.value = "";
    };

    const removeSnapshot = (id: string) => {
        console.log(`Removing snapshot ${id}...`);
        model.comparisonSnapshots = model.comparisonSnapshots.filter((s) => s.id !== id);
        
        const layers = snapshotLayersRef.current[id];
        console.log(`Found layers for snapshot ${id}:`, layers);
        
        if (layers) {
            // Remove all stored layers
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
            delete snapshotLayersRef.current[id];
        } else {
            // If no layers were created yet, check if we need to clean up from map directly
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
        
        setLayerVisibility(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        
        console.log(`Snapshot ${id} removed. Remaining map layers:`, model.map?.layers?.length);
    };

    const clearAll = () => {
        console.log("Clearing all snapshots...");
        model.comparisonSnapshots = [];
        
        // Remove all stored layers from snapshotLayersRef
        Object.entries(snapshotLayersRef.current).forEach(([id, layers]) => {
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
        
        snapshotLayersRef.current = {};
        setLayerVisibility({});
        
        console.log(`All snapshots cleared. Remaining map layers:`, model.map?.layers?.length);
    };

    const clearMap = () => {
        try {
            Object.entries(snapshotLayersRef.current).forEach(([id, layers]) => {
                if (layers.ruimtebeslag2d) {
                    layers.ruimtebeslag2d.visible = false;
                }
                if (layers.design3d) {
                    layers.design3d.visible = false;
                }
                if (layers.constructionLine) {
                    layers.constructionLine.visible = false;
                }
                setLayerVisibility(prev => ({
                    ...prev,
                    [id]: { ruimtebeslag2d: false, design3d: false, constructionLine: false },
                }));
            });
            model.messages.commands.ui.displayNotification.execute({
                id: "mapCleared",
                message: "Kaart is gewist.",
            });
        } catch (error) {
            console.error("Error clearing map:", error);
        }
    };

    const exportComparison = () => {
        const dataStr = JSON.stringify(snapshots, null, 2);
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        const exportFileDefaultName = `vergelijking_${new Date().toISOString().split("T")[0]}.json`;

        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
    };

    const loadSnapshot = (snapshot: DesignSnapshot) => {
        try {
            // Set the design name in the model
            model.designName = snapshot.name;

            // Load the project data - use the stored ProjectJSON directly
            loadProjectFromJSON(model, snapshot.projectJSON);

            // Track the construction layer from the loaded snapshot
            if (
                model.constructionModel?.graphicsLayerConstructionLine
                && (
                    snapshot.projectJSON.constructions?.drawnConstructionLine
                    || (snapshot.projectJSON.constructions?.structures?.length || 0) > 0
                )
            ) {
                snapshotLayersRef.current[snapshot.id] = {
                    ...snapshotLayersRef.current[snapshot.id],
                    constructionLine: model.constructionModel.graphicsLayerConstructionLine,
                };
                // Initialize visibility state
                setLayerVisibility(prev => ({
                    ...prev,
                    [snapshot.id]: prev[snapshot.id] || { ruimtebeslag2d: false, design3d: false, constructionLine: false },
                }));
            }

            // Trigger a model update by modifying a property to ensure re-render
            model.loading = true;
            setTimeout(() => {
                model.loading = false;
            }, 100);

            // Call the callback to switch to the next tab if provided
            if (onLoadDesign) {
                setTimeout(() => {
                    onLoadDesign();
                }, 200);
            }

            model.messages.commands.ui.displayNotification.execute({
                title: "Succes",
                message: `Ontwerp "${snapshot.name}" is geladen. Ga naar het 'Dimensioneer grondlichaam' tabblad.`,
                disableTimeouts: true,
            });
        } catch (error) {
            console.error("Error loading snapshot:", error);
            model.messages.commands.ui.alert.execute({
                title: "Fout",
                message: `Kon het ontwerp niet laden: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    };

    return (
        <Box style={{ padding: "20px", height: "100%", overflow: "auto" }}>
            <Stack spacing={3}>
                {/* Header */}
                <Box>
                    <Typography variant="h5" style={{ marginBottom: "8px", fontWeight: "bold" }}>
                        Alternatieven Beheren
                    </Typography>
                    <Typography variant="body2" style={{ color: "#666" }}>
                        Voeg ontwerpen toe en beheer welke je wilt vergelijken.
                    </Typography>
                </Box>

                {/* Action Buttons */}
                <Paper style={{ padding: "16px", backgroundColor: "#f8f9fa" }}>
                    <Stack spacing={2}>
                        {/* Primary Actions */}
                        <Stack direction="row" spacing={1.5} style={{ flexWrap: "wrap", gap: "8px" }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={addCurrentDesign}
                                size="medium"
                                style={{ flex: "1 1 auto", minWidth: "180px" }}
                            >
                                Voeg Huidig Toe
                            </Button>
                            <input
                                type="file"
                                accept=".json"
                                ref={designFileInputRef}
                                onChange={handleImportDesignFile}
                                style={{ display: "none" }}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleFileInputClick}
                                size="medium"
                                style={{ flex: "1 1 auto", minWidth: "180px" }}
                            >
                                Upload Alternatief
                            </Button>
                        </Stack>
                        
                        {/* Comparison Table Button - Prominent */}
                        {snapshots.length > 0 && (
                            <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                size="medium"
                                startIcon={<AssessmentIcon />}
                                onClick={() => {
                                    if (snapshots.length < 2) {
                                        model.messages.commands.ui.alert.execute({
                                            title: "Meer alternatieven nodig",
                                            message: "Voeg minstens 2 alternatieven toe om ze te kunnen vergelijken.",
                                        });
                                    } else {
                                        model.comparisonPanelVisible = true;
                                    }
                                }}
                                disabled={snapshots.length < 2}
                                style={{ 
                                    padding: "8px 16px",
                                    fontWeight: 600,
                                }}
                            >
                                Vergelijkingstabel ({snapshots.length} alternatieven)
                            </Button>
                        )}
                        
                        {/* Secondary Actions */}
                        {/* {snapshots.length > 0 && (
                            <Stack direction="row" spacing={1} style={{ flexWrap: "wrap", gap: "6px", paddingTop: "8px", borderTop: "1px solid #e0e0e0" }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={exportComparison}
                                    size="small"
                                >
                                    Export
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<VisibilityIcon />}
                                    onClick={clearMap}
                                    size="small"
                                >
                                    Wis Kaart
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={clearAll}
                                    size="small"
                                >
                                    Wis Alles
                                </Button>
                            </Stack>
                        )} */}
                    </Stack>
                </Paper>

                {/* Snapshot Cards */}
                {snapshots.length > 0 && (
                    <Box>
                        <Typography variant="h6" style={{ marginBottom: "12px", fontWeight: "600" }}>
                            Geïmporteerde Alternatieven ({snapshots.length})
                        </Typography>
                        <Stack spacing={2}>
                            {snapshots.map((snapshot) => (
                                <Paper
                                    key={snapshot.id}
                                    elevation={1}
                                    style={{
                                        padding: "12px 16px",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    <Stack spacing={1.5}>
                                        <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                            <Box style={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: "4px" }}>
                                                    {snapshot.name}
                                                </Typography>
                                                <Typography variant="caption" style={{ color: "#888" }}>
                                                    {snapshot.timestamp}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Stack direction="row" spacing={0.5} style={{ flexWrap: "wrap", gap: "6px" }}>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                startIcon={<UploadIcon />}
                                                onClick={() => loadSnapshot(snapshot)}
                                                style={{ minWidth: "80px", flex: "1 1 auto" }}
                                            >
                                                Laden
                                            </Button>
                                            <Button
                                                variant={layerVisibility[snapshot.id]?.ruimtebeslag2d ? "contained" : "outlined"}
                                                color="primary"
                                                size="small"
                                                onClick={() => toggleLayerVisibility(snapshot, "ruimtebeslag2d")}
                                                style={{ minWidth: "50px", flex: "1 1 auto" }}
                                            >
                                                {layerVisibility[snapshot.id]?.ruimtebeslag2d ? "👁" : "👁"} 2D
                                            </Button>
                                            <Button
                                                variant={layerVisibility[snapshot.id]?.design3d ? "contained" : "outlined"}
                                                color="primary"
                                                size="small"
                                                onClick={() => toggleLayerVisibility(snapshot, "design3d")}
                                                style={{ minWidth: "50px", flex: "1 1 auto" }}
                                            >
                                                {layerVisibility[snapshot.id]?.design3d ? "👁" : "👁"} 3D
                                            </Button>
                                            <Button
                                                variant={layerVisibility[snapshot.id]?.constructionLine ? "contained" : "outlined"}
                                                color="primary"
                                                size="small"
                                                onClick={() => toggleLayerVisibility(snapshot, "constructionLine")}
                                                style={{ minWidth: "80px", flex: "1 1 auto" }}
                                            >
                                                {layerVisibility[snapshot.id]?.constructionLine ? "👁" : "👁"} Constr.
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => removeSnapshot(snapshot.id)}
                                                style={{ minWidth: "36px", padding: "4px 8px" }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* Empty State */}
                {snapshots.length === 0 && (
                    <Paper elevation={0} style={{ padding: "40px", textAlign: "center", backgroundColor: "#f5f7fa", border: "2px dashed #cbd5e0", borderRadius: "8px" }}>
                        <Typography variant="h6" style={{ marginBottom: "8px", color: "#718096", fontWeight: 600 }}>
                            Geen Alternatieven
                        </Typography>
                        <Typography variant="body2" style={{ color: "#a0aec0" }}>
                            Voeg het huidige ontwerp toe of upload een opgeslagen alternatief om te beginnen.
                        </Typography>
                    </Paper>
                )}
            </Stack>
        </Box>
    );
};

export default ComparisonAlternativesPanel;
