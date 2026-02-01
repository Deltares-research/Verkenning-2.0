import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
import { createMeshFromPolygon } from "./DesignFunctions";

export async function loadGeometriesFromDesign(model): Promise<void> {
    try {
        // Clear previous meshes
        model.meshes = [];
        model.graphicsLayerMesh.removeAll();
        model.designLayer2D.removeAll();

        // Get all graphics from the 3D polygon layer
        const graphics = model.graphicsLayer3dPolygon.graphics.items;

        if (graphics && graphics.length > 0) {
            graphics.forEach((graphic) => {
                // Create mesh from the polygon
                if (graphic.geometry && graphic.geometry.type === "polygon") {
                    createMeshFromPolygon(model, graphic.geometry as __esri.Polygon, null);
                    console.log(graphic.geometry, "geometry added to mesh");
                }
            });

            // Also add 2D representation to designLayer2D
            graphics.forEach((graphic) => {
                if (graphic.geometry && graphic.geometry.type === "polygon") {
                    const polygon2d = new Polygon({
                        rings: (graphic.geometry as __esri.Polygon).rings.map(ring =>
                            ring.map(coord => [coord[0], coord[1]])
                        ),
                        spatialReference: graphic.geometry.spatialReference
                    });

                    const graphics2D = new Graphic({
                        geometry: polygon2d,
                        attributes: graphic.attributes
                    });

                    // Apply styling if available
                    if (model.designLayer2DGetSymbol && graphic.attributes?.name) {
                        const symbol = model.designLayer2DGetSymbol(graphic.attributes.name);
                        graphics2D.symbol = symbol as any;
                    }

                    model.designLayer2D.add(graphics2D);
                }
            });

            // Merge all meshes and add to graphics layer
            if (model.meshes.length > 0) {
                const merged = meshUtils.merge(model.meshes);
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
                model.mergedMesh = merged;
                model.meshGraphic = mergedGraphic;
            }

            console.log(`Loaded ${graphics.length} geometries from design and created mesh`);
            model.messages.commands.ui.displayNotification.execute({
                message: `Het ontwerp met ${graphics.length} onderdelen is succesvol geladen.`,
                title: "Ontwerp geladen",
                type: "success"
            });
        } else {
            console.warn("No geometries found");
            model.messages.commands.ui.alert.execute({
                message: "Geen ontwerpelementen gevonden.",
                title: "Ontwerp laden mislukt",
            });
        }
    } catch (error) {
        console.error("Error loading geometries from design:", error);
        model.messages.commands.ui.alert.execute({
            message: (error as Error)?.message || "Er is een fout opgetreden tijdens het laden van het ontwerp.",
            title: "Ontwerp laden mislukt",
        });
    }
}

export async function save3dDesignToFeatureLayer(model): Promise<number> {
    if (!model.graphicsLayer3dPolygon?.graphics?.length) {
        console.warn("No 3D polygon graphics to save");
        return 0;
    }

    if (!model.designFeatureLayer3dUrl) {
        console.error("Feature layer URL not configured");
        throw new Error("Feature layer URL not configured");
    }
    
    try {
        // Create or get the feature layer
        const featureLayerDesign = new FeatureLayer({
            url: model.designFeatureLayer3dUrl,
            hasZ: true,
        });



        const featureLayerWeergave = model.map.allLayers.items.find(
            (layer) => layer.title === model.designFeatureLayer3dWeergaveName
        ) as FeatureLayer;

        // Prepare features to add
        const featuresToAdd = model.graphicsLayer3dPolygon.graphics.items.map((graphic) => {
            // Project geometry to the feature layer's spatial reference if needed
            return new Graphic({
                geometry: graphic.geometry,
                attributes: {
                    ...graphic.attributes,
                    ontwerpnaam: model.designName || "Unnamed Design",
                }
            });
        });

        console.log(`Saving ${featuresToAdd.length} features to feature layer...`);

        // Apply edits to add features
        const result = await featureLayerDesign.applyEdits({
            addFeatures: featuresToAdd
        });

        console.log("Save result:", result);

        if (result.addFeatureResults?.length > 0) {
            const successCount = result.addFeatureResults.filter(r => !r.error).length;
            const errorCount = result.addFeatureResults.filter(r => r.error).length;
            
            console.log(`Successfully saved ${successCount} features`);
            model.messages.commands.ui.displayNotification.execute({
                message: `Het ontwerp, bestaande uit ${successCount} onderdelen is succesvol opgeslagen.`,
                title: "Opslaan geslaagd",
                type: "info"
            });

            if (errorCount > 0) {
                console.warn(`Failed to save ${errorCount} features`);
                result.addFeatureResults.filter(r => r.error).forEach(r => {
                    console.error("Save error:", r.error);
                });
            }

            featureLayerWeergave.refresh();
            
            return successCount;
        }
        
        return 0;
    } catch (error) {
        console.error("Error saving design to feature layer:", error);
        model.messages.commands.ui.alert.execute({
            message: (error as Error)?.message || "Er is een fout opgetreden tijdens het opslaan van het ontwerp.",
            title: "Opslaan mislukt",
    } 
        )
    }
}

export async function save2dRuimtebeslagToFeatureLayer(model): Promise<number> {
    if (!model.graphicsLayerRuimtebeslag?.graphics?.length) {
        console.warn("No 2D ruimtebeslag graphics to save");
        return 0;
    }
    if (!model.designFeatureLayer2dRuimtebeslagUrl) {
        console.error("2D Ruimtebeslag Feature layer URL not configured");
        throw new Error("2D Ruimtebeslag Feature layer URL not configured");
    }
    try {
        // Create or get the feature layer
        const featureLayer2dRuimtebeslag = new FeatureLayer({
            url: model.designFeatureLayer2dRuimtebeslagUrl,
        });
        const featureLayerWeergave = model.map.allLayers.items.find(
            (layer) => layer.title === model.designFeatureLayer2dRuimtebeslagWeergaveName
        ) as FeatureLayer;
        // Prepare features to add
        const featuresToAdd = model.graphicsLayerRuimtebeslag.graphics.items.map((graphic) => {
            return new Graphic({
                geometry: graphic.geometry,
                attributes: {
                    ...graphic.attributes,
                    ontwerpnaam: model.designName || "Unnamed Design",
                }
            });
        });
        console.log(`Saving ${featuresToAdd.length} 2D ruimtebeslag features to feature layer...`);
        // Apply edits to add features
        const result = await featureLayer2dRuimtebeslag.applyEdits({    
            addFeatures: featuresToAdd
        });
        console.log("2D Ruimtebeslag save result:", result);    
        if (result.addFeatureResults?.length > 0) {
            const successCount = result.addFeatureResults.filter(r => !r.error).length;
            const errorCount = result.addFeatureResults.filter(r => r.error).length;
            console.log(`Successfully saved ${successCount} 2D ruimtebeslag features`);
            model.messages.commands.ui.displayNotification.execute({
                message: `Het 2D ruimtebeslag, bestaande uit ${successCount} onderdelen is succesvol opgeslagen.`,
                title: "Opslaan 2D Ruimtebeslag geslaagd",
                type: "info"
            });
            if (errorCount > 0) {
                console.warn(`Failed to save ${errorCount} 2D ruimtebeslag features`);
                result.addFeatureResults.filter(r => r.error).forEach(r => {
                    console.error("2D Ruimtebeslag save error:", r.error);
                });
            }

            featureLayerWeergave.refresh();
            
            return successCount;
        }       
        return 0;
    } catch (error) {
        console.error("Error saving 2D ruimtebeslag to feature layer:", error);
        model.messages.commands.ui.alert.execute({
            message: (error as Error)?.message || "Er is een fout opgetreden tijdens het opslaan van het 2D ruimtebeslag.",
            title: "Opslaan 2D Ruimtebeslag mislukt",
        });
    }
}