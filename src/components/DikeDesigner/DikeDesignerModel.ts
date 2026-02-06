/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable import/order */
import * as am5 from "@amcharts/amcharts5";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import { whenOnce } from "@vertigis/arcgis-extensions/support/observableUtils";
import {
    ComponentModelBase,
    ComponentModelProperties,
    PropertyDefs,
    serializable,
} from "@vertigis/web/models";

import ConstructionModel from "./SubComponents/Construction/ConstructionModel";
import CostModel from "./SubComponents/Cost/CostModel";

import * as XLSX from "xlsx";

import { Features } from "@vertigis/web/messaging";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import ElevationLayer from "@arcgis/core/layers/ElevationLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";

import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import PolygonSymbol3D from "@arcgis/core/symbols/PolygonSymbol3D";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";
import Graphic from "@arcgis/core/Graphic";

import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon";
import Point from "@arcgis/core/geometry/Point";
import Multipoint from "@arcgis/core/geometry/Multipoint";
import Mesh from "@arcgis/core/geometry/Mesh";

import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import * as projectOperator from "@arcgis/core/geometry/operators/projectOperator";

import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";

import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";

import { getLineFeatureLayers } from "./Functions/DesignFunctions";
import { initializeChart } from "./Functions/ChartFunctions";
import { 
    lineLayerSymbol, 
    lineLayerSymbolCrosssection, 
    polygonSymbol3D, 
    cursorSymbol, 
    dwpPointSymbol, 
    controlPointSymbol, 
    getDesignLayer2DSymbol 
} from "./symbologyConfig";
import { array } from "@amcharts/amcharts5";
import { first } from "@amcharts/amcharts5/.internal/core/util/Array";
export interface DikeDesignerModelProperties extends ComponentModelProperties {
    elevationLayerUrl?: string;
    apiKey?: string;
    apiUrl?: string;
    designFeatureLayer3dUrl?: string;
    designFeatureLayer3dWeergaveName?: string;
    designFeatureLayer2dRuimtebeslagUrl?: string;
    designFeatureLayer2dRuimtebeslagWeergaveName?: string;
    percelenWaterschapLayerName?: string | null;
    natuurbeheerplanLayerName?: string | null;
    pandenBufferDistance?: number;
}
@serializable
export default class DikeDesignerModel extends ComponentModelBase<DikeDesignerModelProperties> {

    designName: string = "";
    constructionModel: ConstructionModel = new ConstructionModel();
    costModel: CostModel = new CostModel();
    designPanelVisible: boolean = false;
    crossSectionPanelVisible: boolean = false;
    costPanelVisible: boolean = false;
    comparisonPanelVisible: boolean = false;

    loading: boolean = false;
    mapInitialized: boolean = false;
    
    // Tracking calculation status for effects and costs
    effectsCalculated: boolean = false;
    costsCalculated: boolean = false;

    elevationLayerUrl: DikeDesignerModelProperties["elevationLayerUrl"];
    apiKey: DikeDesignerModelProperties["apiKey"];
    apiUrl: DikeDesignerModelProperties["apiUrl"];
    designFeatureLayer3dUrl: DikeDesignerModelProperties["designFeatureLayer3dUrl"];
    designFeatureLayer3dWeergaveName: DikeDesignerModelProperties["designFeatureLayer3dWeergaveName"];
    designFeatureLayer2dRuimtebeslagUrl: DikeDesignerModelProperties["designFeatureLayer2dRuimtebeslagUrl"];
    designFeatureLayer2dRuimtebeslagWeergaveName: DikeDesignerModelProperties["designFeatureLayer2dRuimtebeslagWeergaveName"];
    natuurbeheerplanLayerName: DikeDesignerModelProperties["natuurbeheerplanLayerName"];
    percelenWaterschapLayerName: DikeDesignerModelProperties["percelenWaterschapLayerName"];
    pandenBufferDistance: DikeDesignerModelProperties["pandenBufferDistance"];

    graphicsLayerLine: GraphicsLayer;
    cursorLocationLayer: GraphicsLayer;
    graphicsLayerPoint: GraphicsLayer;
    graphicsLayerCrossSection: GraphicsLayer;
    graphicsLayerProfile: GraphicsLayer;
    graphicsLayerTemp: GraphicsLayer;
    graphicsLayerMesh: GraphicsLayer;
    graphicsLayer3dPolygon: GraphicsLayer;
    graphicsLayerRuimtebeslag: GraphicsLayer;
    graphicsLayerRuimtebeslag3d: GraphicsLayer;
    elevationLayer: ElevationLayer;

    graphicsLayerControlPoints: GraphicsLayer;

    designLayer2D: FeatureLayer | GraphicsLayer | null = null;
    designLayer2DGetSymbol: ((name: string) => any) | null = null;
    uniqueParts: string[] = [];

    map: any;
    view: any;
    mapElement: HTMLElement | null = null;
    sketchViewModel: SketchViewModel | undefined;
    drawnPoint: any;
    drawnLine: any;
    offsetGeometries: any[] = [];
    meshes: Mesh[] = [];
    mergedMesh: Mesh | null = null;
    meshGraphic: Graphic | null = null;
    gridSize: number = 1
    totalVolumeDifference: number = 0
    excavationVolume: number = 0
    fillVolume: number = 0
    total2dArea: number = 0
    total3dArea: number = 0
    lineLength: number = 0

    chartData: any[] = []
    allChartData: Record<string, any[]> = {}
    excelSheets: Record<string, any[]> = {};
    activeSheet: string = "";

    chartRoot: any = null
    chart: any = null
    chartSeries: any = null

    chartDataElevation: any[] = []

    crossSectionChartData: any[] = []
    crossSectionChartRoot: any = null
    crossSectionChart: any = null
    meshSeriesData: any[] = null

    userLinePoints: any[] = []
    slopeLabels: am5.Label[] = []

    isPlacingDwpProfile: boolean = false
    rivierzijde: 'rechts' | 'links' = 'rechts';
    referentieLocatie: string = 'binnenkruin';

    lineFeatureLayers: FeatureLayer[] = []
    selectedLineLayerId: string | null
    selectedLineLayer: FeatureLayer | null
    selectedDijkvakLayerFields: string[] = []
    selectedDijkvakField: string | null = null

    selectedDwpLocation: string | null = null
    selectedPointIndex: number | null = null
    selectingDwpLocation: boolean = false
    crossSectionLength: number = 100
    
    // Comparison panel snapshots - persists across tab switches
    comparisonSnapshots: any[] = [];

    lineLayerSymbol = lineLayerSymbol;
    lineLayerSymbolCrosssection = lineLayerSymbolCrosssection;
    polygonSymbol3D = polygonSymbol3D;
    cursorSymbol = cursorSymbol;
    dwpPointSymbol = dwpPointSymbol;
    controlPointSymbol = controlPointSymbol;
    // data for analysis
    intersectingPanden: object[] = []
    intersectingBomen: object[] = []
    intersectingPercelen: object[] = []
    intersectingPercelenArea: number = 0
    intersectingWegdelen2dRuimtebeslag: number = 0
    intersectingInritten2dRuimtebeslag: number = 0
    intersectingInritten2dRuimtebeslagCount: object[] = []
    intersectingNatura2000: number = 0
    intersectingGNN: number = 0
    intersectingBeheertypen: object[] = []
    intersectingPandenArea: number = 0
    intersectingPandenBuffer: object [] = []
    intersectingPandenBufferArea: number = 0
    intersectingErven: object[] = []
    intersectingErvenArea: number = 0

    dwpLocations: string[] = [
        "buitenteen",
        "onderkant_buitenberm",
        "bovenkant_buitenberm",
        "buitenkruin",
        "binnenkruin",
        "bovenkant_binnenberm",
        "onderkant_binnenberm",
        "binnenteen",
    ]


    overviewVisible: boolean = false

    // New method to handle GeoJSON upload
    handleGeoJSONUpload(file: File): void {
        const reader = new FileReader();

        function extractEPSG(crs: any): number | null {
            if (!crs) {
                console.warn("No CRS information found.");
                return null;
            }

            if (typeof crs === "string") {
                // Handle cases where CRS is a string (e.g., "EPSG:4326")
                const match = crs.match(/EPSG[:]*([0-9]+)/);
                return match ? parseInt(match[1]) : null;
            }

            if (crs?.properties?.name) {
                // Handle cases where CRS is an object with a "name" property
                const name = crs.properties.name;

                // Match EPSG codes in formats like "EPSG:4326" or "urn:ogc:def:crs:EPSG::4326"
                const match = name.match(/EPSG[:]*([0-9]+)/);
                if (match) {
                    return parseInt(match[1]);
                }

                // Handle cases like "urn:ogc:def:crs:OGC:1.3:CRS84"
                if (name.includes("CRS84")) {
                    console.warn("CRS84 detected, defaulting to EPSG:4326.");
                    return 4326; // CRS84 is equivalent to EPSG:4326
                }
            }

            console.warn("Unsupported CRS format:", crs);
            return null;
        }

        reader.onload = (e) => {
            try {
                const geojson = JSON.parse(e.target?.result as string);
                console.log("Parsed GeoJSON:", geojson);
                if (!geojson?.features) {
                    console.error("Invalid GeoJSON format.");
                    return;
                }

                const inEPSG = extractEPSG(geojson.crs?.properties?.name || "");
                console.log("Input EPSG:", inEPSG);

                projectOperator.load().then(() => {
                    geojson.features.forEach(feature => {
                        const { geometry, properties } = feature;

                        let esriGeometry;
                        const spatialRefOut = new SpatialReference({ wkid: 3857 });
                        let spatialRefIn = new SpatialReference({ wkid: inEPSG });

                        if (!inEPSG) {
                            spatialRefIn = new SpatialReference({ wkid: 4326 });
                        }



                        if (geometry.type === "LineString") {
                            esriGeometry = new Polyline({
                                paths: [geometry.coordinates],
                                spatialReference: spatialRefIn
                            });
                        } else if (geometry.type === "MultiLineString") {
                            esriGeometry = new Polyline({
                                paths: geometry.coordinates,
                                spatialReference: spatialRefIn
                            });
                        } else {
                            console.warn("Unsupported geometry type:", geometry.type);
                            return;
                        }

                        const projected = projectOperator.execute(esriGeometry, spatialRefOut);


                        const graphic = new Graphic({
                            geometry: projected as any,
                            attributes: properties,
                            symbol: this.lineLayerSymbol as any,
                        });

                        this.graphicsLayerLine.add(graphic);
                    })


                })

                // this.processGeoJSON(geojson, inEPSG);
            } catch (error) {
                console.error("Error parsing GeoJSON:", error);
            }
        };

        reader.readAsText(file);
    }
    startDrawingLine(lineLayer: GraphicsLayer): Promise<__esri.Polyline> {

        console.log("Starting line drawing...");

        if (lineLayer?.graphics?.length > 0) {
            // Clear existing graphics if any
            lineLayer.removeAll();
        }
        this.sketchViewModel.layer = lineLayer;
        this.sketchViewModel.create("polyline");

        return new Promise((resolve, reject) => {
            const handler = this.sketchViewModel.on("create", (event: any) => {
                if (event.state === "complete") {
                    const drawnLine = event.graphic.geometry;
                    this.drawnLine = drawnLine;
                    this.sketchViewModel.set("state", "update");
                    this.sketchViewModel.update(event.graphic);

                    handler.remove(); // Clean up the event listener
                    resolve(drawnLine);
                }
                // Optionally handle cancel/error states here
                // else if (event.state === "cancel") {
                //     handler.remove();
                //     reject(new Error("Drawing cancelled"));
                // }
            });
        });
    }
    startDrawingPoint(pointLayer: GraphicsLayer): Promise<__esri.Point> {

        console.log("Starting point drawing...");

        if (pointLayer?.graphics?.length > 0) {
            // Clear existing graphics if any
            pointLayer.removeAll();
        }
        this.sketchViewModel.layer = pointLayer;
        this.sketchViewModel.create("point");

        return new Promise((resolve, reject) => {
            const handler = this.sketchViewModel.on("create", (event: any) => {
                if (event.state === "complete") {
                    const drawnPoint = event.graphic.geometry;
                    this.drawnPoint = drawnPoint;
                    this.sketchViewModel.set("state", "update");
                    this.sketchViewModel.update(event.graphic);


                    handler.remove(); // Clean up the event listener
                    resolve(drawnPoint);
                }
                // Optionally handle cancel/error states here
                // else if (event.state === "cancel") {
                //     handler.remove();
                //     reject(new Error("Drawing cancelled"));
                // }
            });
        });
    }

    selectLineFromMap() {
    }

    initializeEmptyChartData(): void {
        if (!this.allChartData || Object.keys(this.allChartData).length === 0) {
            // Create a default empty sheet
            const defaultSheetName = "vak 1";
            const defaultData = [
                // {
                //     locatie: "",
                //     afstand: "",
                //     hoogte: "",
                // }
            ];

            this.allChartData = {
                [defaultSheetName]: defaultData
            };

            this.chartData = [...defaultData];
            this.activeSheet = defaultSheetName;

            console.log("Initialized empty chart data with default sheet");
        }
    }



    handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>, model) => {
        const fileInput = event.target;
        const file = fileInput.files?.[0];

        if (file) {
            // Clear existing chart data
            this.chartData = [];

            const reader = new FileReader();

            reader.onload = (e) => {
                console.log("Reading Excel file...");
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });

                // extract just the first sheet
                const firstSheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // sort data and set model.chartData
                if (jsonData.length > 1) {
                    this.chartData = jsonData
                        .slice(1) // Skip the header row
                        .map((row: any[], index) => ({
                            oid: index + 1, // Add oid for proper row identification
                            locatie: row[1] || "", // Location name
                            afstand: row[2] || "", // X-axis value
                            hoogte: row[3] || "", // Y-axis value
                        }))
                        .sort((a, b) => parseFloat(a.afstand) - parseFloat(b.afstand)); // Sort by afstand
                }

                console.log("Uploaded chart data for first sheet:", this.chartData);

                // remove all graphics from the line layer
                this.graphicsLayerProfile.removeAll();

                // set all points from upload on the map
                this.chartData.forEach((point) => {

                    const afstand = parseFloat(point.afstand);
                    const hoogte = parseFloat(point.hoogte);

                    let closestPoint = model.chartDataElevation[0];
                    let minDistance = Math.abs(closestPoint.afstand - afstand);
                    model.chartDataElevation.forEach(dataPoint => {
                        const distance = Math.abs(dataPoint.afstand - afstand);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestPoint = dataPoint;
                        }
                    });

                    const cursorPoint = new Point({
                        x: closestPoint.x,
                        y: closestPoint.y,
                        spatialReference: new SpatialReference({
                            wkid: 3857
                        })
                    });

                    // Create new graphic and add to graphics layer
                    const graphic = new Graphic({
                        geometry: cursorPoint,
                        symbol: model.dwpPointSymbol,
                        attributes: {
                            afstand,
                            hoogte,
                            locatie: "",
                            oid: point.oid
                        }
                    });

                    // Add to the profile graphics layer
                    if (model.graphicsLayerProfile) {
                        model.graphicsLayerProfile.add(graphic);
                        console.log("Added profile point graphic:", graphic);
                    }

                });
            };

            reader.readAsArrayBuffer(file);
        }

        // Reset the file input value to allow reuploading the same file
        fileInput.value = "";

    };



    handleExcelDownload = () => {
        const ws = XLSX.utils.json_to_sheet(this.chartData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Designs");
        XLSX.writeFile(wb, "designs.xlsx");
    };

    // New method to set the table data for a selected sheet
    setSheetData(sheetName: string): void {
        const sheetData = this.excelSheets[sheetName];
        if (sheetData) {
            // Prepare and sort chart data
            if (sheetData.length > 1) {
                const sortedData = sheetData
                    .slice(1) // Skip the header row
                    .map((row: any[]) => ({
                        locatie: row[0], // Location name
                        afstand: row[1], // X-axis value
                        hoogte: row[2], // Y-axis value
                    }))
                    .sort((a, b) => a.afstand - b.afstand); // Sort by afstand (X-axis)

                this.chartData = sortedData; // Update chartData to trigger UI update
            }
        }
    }

    protected override _getSerializableProperties(): PropertyDefs<DikeDesignerModelProperties> {
        const props = super._getSerializableProperties();
        return {
            ...props,
            elevationLayerUrl: {
                serializeModes: ["initial"],
                default: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
            },
            apiKey: {
                serializeModes: ["initial"],
                default: "",
            },
            apiUrl: {
                serializeModes: ["initial"],
                default: "",
            },
            designFeatureLayer3dUrl: {
                serializeModes: ["initial"],
                default: "https://portal.wsrl.nl/kaarten/rest/services/Hosted/zwo_ontwerpen_3d/FeatureServer/0",
            },
            designFeatureLayer3dWeergaveName: {
                serializeModes: ["initial"],
                default: "3D vlakken - test",
            },
            designFeatureLayer2dRuimtebeslagUrl: {
                serializeModes: ["initial"],
                default: "https://portal.wsrl.nl/kaarten/rest/services/Hosted/zwo_ruimtebeslag_2d/FeatureServer/0",
            },
            designFeatureLayer2dRuimtebeslagWeergaveName: {
                serializeModes: ["initial"],
                default: "2D ruimtebeslag - test",
            },
            percelenWaterschapLayerName: {
                serializeModes: ["initial"],
                default: null,
            },
            natuurbeheerplanLayerName: {
                serializeModes: ["initial"],
                default: null,
            },
            pandenBufferDistance: {
                serializeModes: ["initial"],
                default: 2,
            },
        };
    }

    protected async _onInitialize(): Promise<void> {
        await super._onInitialize();
        console.log("DikeDesignerModel initialized");
        console.log("ConstructionModel", this.constructionModel);

        this.messages.events.map.initialized.subscribe(async (map) => {
            console.log("Map initialized:", map);
            this.mapElement = document.querySelector(".gcx-map")
            this.map = map.maps.map;
            this.view = map.maps["view"];
            
            // Pass map to ConstructionModel
            this.constructionModel.map = this.map;
            this.constructionModel.view = this.view;
            this.constructionModel.logMap();

            this.designLayer2D = new GraphicsLayer({
                title: "Ontwerpdata - 2D",
                listMode: "show",
                visible: false,
                elevationInfo: {
                    mode: "on-the-ground",
                    offset: 0
                }
            });

            // Helper to pick color based on rules
            function getSymbolForName(name: string) {
                return getDesignLayer2DSymbol(name);
            }

            // Store the styling function in the model for later use when adding features
            this.designLayer2DGetSymbol = getSymbolForName;

            this.graphicsLayerPoint = new GraphicsLayer({
                title: "Point Layer",
                elevationInfo: {
                    mode: "on-the-ground",
                    offset: 0
                },
                listMode: "hide",
            });

            this.graphicsLayerControlPoints = new GraphicsLayer({
                title: "Control Points Layer",
                elevationInfo: {
                    mode: "on-the-ground",
                    offset: 0
                },
                listMode: "hide",
            });

            this.graphicsLayerRuimtebeslag = new GraphicsLayer({
                title: "Ruimtebeslag 2D",
                elevationInfo: {
                    mode: "on-the-ground",
                    offset: 0
                },
                listMode: "show",
                visible: false,
            });
            
            this.graphicsLayerRuimtebeslag3d = new GraphicsLayer({
                title: "Ruimtebeslag 3D",
                elevationInfo: {
                    mode: "absolute-height",
                    offset: 0
                },
                listMode: "show",
                visible: false,
            });

            this.cursorLocationLayer = new GraphicsLayer({
                title: "Cursor Location Layer",
                elevationInfo: {
                    mode: "relative-to-scene",
                    offset: 0
                },
                listMode: "hide",
            });

            this.cursorLocationLayer.add(
                new Graphic({
                    geometry: new Point({ x: 0, y: 0 }),
                    symbol: this.cursorSymbol,
                })
            )

            this.graphicsLayerLine = new GraphicsLayer({
                title: "Temporary Layer",
                elevationInfo: {
                    mode: "on-the-ground",
                    offset: 0
                },
                listMode: "hide",
            });

            this.graphicsLayerCrossSection = new GraphicsLayer({
                title: "Dwarsprofiel - tijdelijk",
                elevationInfo: {
                    mode: "on-the-ground",
                    offset: 0
                },
                listMode: "hide",
            });

            this.graphicsLayerProfile = new GraphicsLayer({
                title: "Profiel - tijdelijk",
                elevationInfo: {
                    mode: "on-the-ground",
                    offset: 0
                },
                listMode: "hide",
            });

            this.graphicsLayerTemp = new GraphicsLayer({
                title: "Ontwerpdata - lijnen",
                elevationInfo: {
                    mode: "absolute-height",
                    offset: 0
                },
                listMode: "show",
                visible: false,
            });

            this.graphicsLayer3dPolygon = new GraphicsLayer({
                title: "Ontwerpdata 3D",
                elevationInfo: {    
                    mode: "absolute-height",
                    offset: 0
                },
                listMode: "show",
                visible: false
            });
            
            this.graphicsLayerMesh = new GraphicsLayer({
                title: "Dijklichaam 3D",
                elevationInfo: {
                    mode: "absolute-height",
                    offset: 0
                },
                listMode: "show",
            });


            this.elevationLayer = new ElevationLayer({
                url: this.elevationLayerUrl,
            });
            
            // Initialize construction graphics layer
            const graphicsLayerConstructionLine = new GraphicsLayer({
                title: "Constructielijn - tijdelijk",
                elevationInfo: {
                    mode: "on-the-ground",
                    offset: 0
                },
                listMode: "hide",
            });
            
            // Create group layers for better organization
            const temporaryLayersGroup = new GroupLayer({
                title: "Tijdelijke lagen",
                visible: true,
                listMode: "show",
                visibilityMode: "independent",
                layers: [
                    this.graphicsLayerProfile,
                    this.graphicsLayerCrossSection,
                    this.graphicsLayerLine,
                    this.graphicsLayerControlPoints,
                    this.graphicsLayerPoint,
                    this.cursorLocationLayer
                ]
            });

            const designLayersGroup = new GroupLayer({
                title: "Ontwerp lagen",
                visible: true,
                visibilityMode: "independent",
                layers: [
                    this.graphicsLayerMesh,
                    this.graphicsLayer3dPolygon,
                    graphicsLayerConstructionLine,
                    this.graphicsLayerTemp,
                    this.designLayer2D
                ]
            });

            const ruimtebeslagGroup = new GroupLayer({
                title: "Ruimtebeslag",
                visible: true,
                visibilityMode: "independent",
                layers: [
                    this.graphicsLayerRuimtebeslag3d,
                    this.graphicsLayerRuimtebeslag
                ]
            });

            // Add group layers to map
            this.map.add(ruimtebeslagGroup);
            this.map.add(designLayersGroup);
            this.map.add(temporaryLayersGroup);
            
            // Pass construction layer to ConstructionModel
            this.constructionModel.graphicsLayerConstructionLine = graphicsLayerConstructionLine;

            this.lineFeatureLayers = await getLineFeatureLayers(this.map);

            await whenOnce(this.view, "basemapView.baseLayerViews");

            this.sketchViewModel = new SketchViewModel({
                polylineSymbol: this.lineLayerSymbol as any,
                view: this.view,
                snappingOptions: {
                    enabled: true,
                    featureSources: [{
                        layer: this.graphicsLayerLine,
                        enabled: true
                    }]
                }
            });
            
            // Pass sketchViewModel to ConstructionModel
            this.constructionModel.sketchViewModel = this.sketchViewModel;

            // Mark map as initialized, enabling UI
            this.mapInitialized = true;

        });
    }
}
