import { ModelBase, serializable } from "@vertigis/web/models";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import Graphic from "@arcgis/core/Graphic";
import Polyline from "@arcgis/core/geometry/Polyline";

export interface StructureAttributes {
    type: string;
    depth: number;
    xLocation?: number;
}

@serializable
export default class ConstructionModel extends ModelBase {
    title: string;

    status: string;
    resultUrl: string;
    errorMessage: string;
    
    map: any;
    view: any;
    sketchViewModel: SketchViewModel | undefined;
    graphicsLayerConstructionLine: GraphicsLayer | undefined;
    drawnConstructionLine: any;
    
    // Store structures for backend analysis
    structures: Array<{
        geometry: Polyline;
        attributes: StructureAttributes;
    }> = [];
    
    // Construction parameters
    structureTypes: string[] = [
        "Heavescherm",
        "Verankerde damwand",
        "Onverankerde damwand",
        "Verticaal Zanddicht Geotextiel"
    ];
    structureType: string = "Heavescherm";
    depth: number = 5;
    xLocation: number = 0;

    logMap(): void {
        console.log("ConstructionModel - Map:", this.map);
    }

    startDrawingLine(): Promise<__esri.Polyline> {
        console.log("Starting construction line drawing...");

        if (!this.graphicsLayerConstructionLine || !this.sketchViewModel) {
            console.error("Graphics layer or sketch view model not initialized");
            return Promise.reject(new Error("Not initialized"));
        }

        if (this.graphicsLayerConstructionLine?.graphics?.length > 0) {
            this.graphicsLayerConstructionLine.removeAll();
        }

        this.sketchViewModel.layer = this.graphicsLayerConstructionLine;
        this.sketchViewModel.create("polyline");

        return new Promise((resolve, reject) => {
            const handler = this.sketchViewModel.on("create", (event: any) => {
                if (event.state === "complete") {
                    const drawnLine = event.graphic.geometry;
                    this.drawnConstructionLine = drawnLine;
                    this.sketchViewModel.set("state", "update");
                    this.sketchViewModel.update(event.graphic);

                    handler.remove();
                    resolve(drawnLine);
                }
            });
        });
    }

    clearLine(): void {
        if (this.graphicsLayerConstructionLine) {
            this.graphicsLayerConstructionLine.removeAll();
            this.drawnConstructionLine = null;
            this.structures = [];
            console.log("Construction line cleared");
        }
    }

    enableLineSelection(structureType: string, depth: number): void {
        if (!this.view) {
            console.error("View not initialized");
            return;
        }

        console.log("Enable line selection mode", { structureType, depth });
        
        // Set up click handler for line selection
        const clickHandler = this.view.on("click", (event: any) => {
            this.view.hitTest(event).then((response: any) => {
                const graphic = response.results.find(
                    (result: any) => result.graphic.layer === this.graphicsLayerConstructionLine
                )?.graphic;

                if (graphic) {
                    // Assign attributes to the clicked line
                    graphic.attributes = {
                        type: structureType,
                        depth: depth,
                    };
                    
                    // Store structure for backend
                    this.structures.push({
                        geometry: graphic.geometry,
                        attributes: {
                            type: structureType,
                            depth: depth,
                        }
                    });

                    console.log("Line selected with attributes:", graphic.attributes);
                    console.log("Structures for backend:", this.structures);
                    
                    // Remove click handler after selection
                    clickHandler.remove();
                }
            });
        });
    }

    createStructureAtLocation(xLocation: number, structureType: string, depth: number): void {
        console.log("Create structure at x-location", { xLocation, structureType, depth });
        
        if (!this.drawnConstructionLine) {
            console.error("No construction line drawn");
            return;
        }

        // Find the point on the construction line at the given x-location
        // This is a simplified version - you may need to adjust based on your coordinate system
        const paths = this.drawnConstructionLine.paths[0];
        
        // Find closest point to x-location
        let closestPoint = null;
        let minDistance = Infinity;
        
        for (const point of paths) {
            const distance = Math.abs(point[0] - xLocation);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }

        if (closestPoint) {
            // Create a vertical line segment at this location representing the structure
            const structureLine = new Polyline({
                paths: [[
                    [closestPoint[0], closestPoint[1]],
                    [closestPoint[0], closestPoint[1] - depth]
                ]],
                spatialReference: this.drawnConstructionLine.spatialReference
            });

            // Add to graphics layer
            const graphic = new Graphic({
                geometry: structureLine,
                symbol: {
                    type: "simple-line",
                    color: [255, 0, 0],
                    width: 3
                } as any,
                attributes: {
                    type: structureType,
                    depth: depth,
                    xLocation: xLocation
                }
            });

            this.graphicsLayerConstructionLine?.add(graphic);

            // Store structure for backend
            this.structures.push({
                geometry: structureLine,
                attributes: {
                    type: structureType,
                    depth: depth,
                    xLocation: xLocation
                }
            });

            console.log("Structure created at location:", { xLocation, structureType, depth });
            console.log("Structures for backend:", this.structures);
        }
    }

}
