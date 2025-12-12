import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";

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