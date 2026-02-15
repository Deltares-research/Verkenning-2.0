import { ModelBase, serializable } from "@vertigis/web/models";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import Graphic from "@arcgis/core/Graphic";
import Polyline from "@arcgis/core/geometry/Polyline";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

export interface StructureAttributes {
    type: string;
    depth: number;
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
    selectedLine: Polyline | null = null;
    
    // Offset parameters
    useOffset: boolean = false;
    offsetDistance: number = 0;
    offsetSide: 'left' | 'right' = 'right';
    
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
    structureType: string = "";
    depth: number | null = null;

    logMap(): void {
        console.log("ConstructionModel - Map:", this.map);
    }

    copyInputLine(inputGraphicsLayer: GraphicsLayer): void {
        console.log("Copying input line to construction layer...");

        if (!this.graphicsLayerConstructionLine) {
            console.error("Graphics layer not initialized");
            return;
        }

        // Clear existing construction line
        if (this.graphicsLayerConstructionLine?.graphics?.length > 0) {
            this.graphicsLayerConstructionLine.removeAll();
        }

        // Get the input line from the input graphics layer
        const inputGraphics = inputGraphicsLayer?.graphics;
        if (!inputGraphics || inputGraphics.length === 0) {
            console.error("No input line found");
            return;
        }

        // Get the first graphic (assuming there's one input line)
        const inputGraphic = inputGraphics.getItemAt(0);
        let lineGeometry = inputGraphic.geometry as Polyline;

        // Apply offset if needed
        if (this.useOffset && this.offsetDistance !== 0) {
            console.log(`Applying offset: ${this.offsetDistance}m to the ${this.offsetSide}`);
            
            // Determine offset direction based on side
            const offsetValue = this.offsetSide === 'right' ? -this.offsetDistance : this.offsetDistance;
            
            // Use geometryEngine to offset the line
            const offsetGeometry = geometryEngine.offset(
                lineGeometry,
                offsetValue,
                "meters",
                "miter"
            ) as Polyline;
            
            if (offsetGeometry) {
                lineGeometry = offsetGeometry;
            } else {
                console.error("Failed to create offset geometry");
                return;
            }
        }

        // Create a copy of the graphic with the (possibly offset) geometry
        const constructionGraphic = new Graphic({
            geometry: lineGeometry,
            symbol: {
                type: "simple-line",
                color: [0, 0, 255],
                width: 3
            } as any
        });

        // Add to construction layer
        this.graphicsLayerConstructionLine.add(constructionGraphic);
        this.drawnConstructionLine = lineGeometry;

        console.log("Input line copied successfully", {
            useOffset: this.useOffset,
            offsetDistance: this.offsetDistance,
            offsetSide: this.offsetSide
        });
    }

    clearLine(): void {
        if (this.graphicsLayerConstructionLine) {
            this.graphicsLayerConstructionLine.removeAll();
            this.drawnConstructionLine = null;
            this.selectedLine = null;
            this.structures = [];
            console.log("Construction line cleared");
        }
    }

    drawLine(): void {
        if (!this.sketchViewModel || !this.graphicsLayerConstructionLine) {
            console.error("SketchViewModel or graphics layer not initialized");
            return;
        }

        console.log("Starting line drawing...");

        // Clear existing graphics if any
        if (this.graphicsLayerConstructionLine?.graphics?.length > 0) {
            this.graphicsLayerConstructionLine.removeAll();
        }

        this.sketchViewModel.layer = this.graphicsLayerConstructionLine;
        this.sketchViewModel.create("polyline");

        // Set up event handler for when drawing is complete
        const handler = this.sketchViewModel.on("create", (event: any) => {
            if (event.state === "complete") {
                const drawnLine = event.graphic.geometry as Polyline;
                this.selectedLine = drawnLine;
                this.drawnConstructionLine = drawnLine;
                
                console.log("Line drawn successfully");
                
                // Remove the event handler
                handler.remove();
            }
        });
    }

    uploadGeoJSON(file: File): void {
        if (!this.graphicsLayerConstructionLine) {
            console.error("Graphics layer not initialized");
            return;
        }

        console.log("Uploading GeoJSON file:", file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const geojson = JSON.parse(e.target?.result as string);
                
                // Clear existing graphics
                if (this.graphicsLayerConstructionLine?.graphics?.length > 0) {
                    this.graphicsLayerConstructionLine.removeAll();
                }

                // Process GeoJSON
                let geometry: Polyline | null = null;

                if (geojson.type === "FeatureCollection") {
                    // Take the first feature with LineString geometry
                    const lineFeature = geojson.features.find(
                        (f: any) => f.geometry.type === "LineString" || f.geometry.type === "MultiLineString"
                    );
                    
                    if (lineFeature) {
                        geometry = this.convertGeoJSONToPolyline(lineFeature.geometry);
                    }
                } else if (geojson.type === "Feature") {
                    if (geojson.geometry.type === "LineString" || geojson.geometry.type === "MultiLineString") {
                        geometry = this.convertGeoJSONToPolyline(geojson.geometry);
                    }
                } else if (geojson.type === "LineString" || geojson.type === "MultiLineString") {
                    geometry = this.convertGeoJSONToPolyline(geojson);
                }

                if (geometry) {
                    const graphic = new Graphic({
                        geometry: geometry,
                        symbol: {
                            type: "simple-line",
                            color: [255, 255, 0, 0.9],
                            width: 6
                        } as any
                    });

                    this.graphicsLayerConstructionLine.add(graphic);
                    this.selectedLine = geometry;
                    this.drawnConstructionLine = geometry;

                    console.log("GeoJSON uploaded successfully");
                } else {
                    console.error("No valid line geometry found in GeoJSON");
                }
            } catch (error) {
                console.error("Error parsing GeoJSON:", error);
            }
        };

        reader.readAsText(file);
    }

    private convertGeoJSONToPolyline(geojsonGeometry: any): Polyline | null {
        try {
            if (geojsonGeometry.type === "LineString") {
                // GeoJSON uses [longitude, latitude] format
                const paths = geojsonGeometry.coordinates.map((coord: number[]) => [coord[0], coord[1]]);
                
                return new Polyline({
                    paths: [paths],
                    spatialReference: { wkid: 4326 } // WGS84
                });
            } else if (geojsonGeometry.type === "MultiLineString") {
                // Take the first line from MultiLineString
                const paths = geojsonGeometry.coordinates[0].map((coord: number[]) => [coord[0], coord[1]]);
                
                return new Polyline({
                    paths: [paths],
                    spatialReference: { wkid: 4326 }
                });
            }
            return null;
        } catch (error) {
            console.error("Error converting GeoJSON to Polyline:", error);
            return null;
        }
    }

    selectLineFromMap(): void {
        if (!this.view) {
            console.error("View not initialized");
            return;
        }

        console.log("Enable line selection mode");
        
        // Set up click handler for line selection
        const clickHandler = this.view.on("click", (event: any) => {
            this.view.hitTest(event).then((response: any) => {
                // Find any line graphic in the results
                const result = response.results.find(
                    (result: any) => result.graphic.geometry.type === "polyline"
                );

                if (result) {
                    const graphic = result.graphic;
                    this.selectedLine = graphic.geometry as Polyline;
                    
                    console.log("Line selected:", this.selectedLine);
                    
                    // Clear any existing graphics in construction layer
                    if (this.graphicsLayerConstructionLine?.graphics?.length > 0) {
                        this.graphicsLayerConstructionLine.removeAll();
                    }
                    
                    // Add a highlighted version of the selected line
                    const highlightGraphic = new Graphic({
                        geometry: this.selectedLine,
                        symbol: {
                            type: "simple-line",
                            color: [255, 255, 0, 0.9], // Bright yellow
                            width: 6,
                            style: "solid"
                        } as any
                    });
                    
                    this.graphicsLayerConstructionLine?.add(highlightGraphic);
                    
                    // Remove click handler after selection
                    clickHandler.remove();
                }
            });
        });
    }

    createConstruction(): void {
        if (!this.selectedLine) {
            console.error("No line selected");
            return;
        }

        if (!this.graphicsLayerConstructionLine) {
            console.error("Graphics layer not initialized");
            return;
        }

        console.log("Creating construction from selected line...");

        // Clear existing construction line and structures
        if (this.graphicsLayerConstructionLine?.graphics?.length > 0) {
            this.graphicsLayerConstructionLine.removeAll();
        }
        this.structures = [];

        // Start with the selected line geometry
        let lineGeometry = this.selectedLine;

        // Apply offset if needed
        if (this.useOffset && this.offsetDistance !== 0) {
            console.log(`Applying offset: ${this.offsetDistance}m to the ${this.offsetSide}`);
            
            // Determine offset direction based on side
            const offsetValue = this.offsetSide === 'right' ? -this.offsetDistance : this.offsetDistance;
            
            // Use geometryEngine to offset the line
            const offsetGeometry = geometryEngine.offset(
                lineGeometry,
                offsetValue,
                "meters",
                "miter"
            ) as Polyline;
            
            if (offsetGeometry) {
                lineGeometry = offsetGeometry;
            } else {
                console.error("Failed to create offset geometry");
                return;
            }
        }

        // Create a copy of the graphic with the (possibly offset) geometry
        const constructionGraphic = new Graphic({
            geometry: lineGeometry,
            symbol: {
                type: "simple-line",
                color: [0, 0, 255],
                width: 3
            } as any,
            attributes: {
                type: this.structureType,
                depth: this.depth,
            }
        });

        // Add to construction layer
        this.graphicsLayerConstructionLine.add(constructionGraphic);
        this.drawnConstructionLine = lineGeometry;

        // Store structure for backend
        this.structures.push({
            geometry: lineGeometry,
            attributes: {
                type: this.structureType,
                depth: this.depth,
            }
        });

        console.log("Construction created with attributes:", { 
            type: this.structureType, 
            depth: this.depth,
            useOffset: this.useOffset,
            offsetDistance: this.offsetDistance,
            offsetSide: this.offsetSide
        });
        console.log("Structures for backend:", this.structures);
    }


}
