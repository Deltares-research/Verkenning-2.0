/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-imports */
/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */



import * as alphaShapeOperator from "@arcgis/core/geometry/operators/alphaShapeOperator";
import * as multiPartToSinglePartOperator from "@arcgis/core/geometry/operators/multiPartToSinglePartOperator";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

// import earcut from 'earcut';

import Graphic from "@arcgis/core/Graphic";

import Polyline from "@arcgis/core/geometry/Polyline";
import Polygon from "@arcgis/core/geometry/Polygon";
import Point from "@arcgis/core/geometry/Point";
import Multipoint from "@arcgis/core/geometry/Multipoint";
import Mesh from "@arcgis/core/geometry/Mesh";

import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import * as projection from "@arcgis/core/geometry/projection";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";

import { calculate3dAreas, calculate2dAreas } from "./EffectFunctions";
// Add type interfaces at the top
interface OffsetGeometries {
    [key: string]: __esri.Polyline;
}

interface CreatePolygonBetweenDistancesArgs {
    model: any;
    distanceA: string | number;
    distanceB: string | number;
    offsetGeometries: OffsetGeometries;
    polygonName: string;
}

export async function createDesigns(model): Promise<void> {
    let basePath: Polyline | undefined = undefined;
    let chartData: any[] = [];

    if (model.selectedDijkvakField) {

        // Use Promise.all() for parallel processing
        const designPromises = model.graphicsLayerLine.graphics.items
            .filter((graphic: __esri.Graphic) => graphic.attributes[model.selectedDijkvakField])
            .map((graphic: __esri.Graphic) => {
                const dijkvakValue = graphic.attributes[model.selectedDijkvakField];
                return createDesign(model, graphic.geometry, model.allChartData[dijkvakValue], dijkvakValue);
            });

        await Promise.all(designPromises);
    } else {
        basePath = model.graphicsLayerLine.graphics.items[0].geometry;
        chartData = model.chartData;
        await createDesign(model, basePath, chartData, "default");
    }
}

export async function createDesign(model, basePath, chartData, dijkvak): Promise<void> {
    console.log(basePath, "Base path geometry");

    // Add null checks at the beginning
    if (!basePath) {
        console.error("Base path is null or undefined");
        return;
    }

    if (!chartData || chartData.length === 0) {
        console.error("Chart data is null, undefined, or empty");
        return;
    }

    if (!basePath.spatialReference) {
        console.error("Base path has no spatial reference");
        return;
    }

    // Clear previous meshes for this design
    model.meshes = [];

    let offsetGeometries = []

    // RD New spatial reference (EPSG:28992)
    const rdNewSpatialRef = new SpatialReference({ wkid: 28992 });

    // Ensure projection module is loaded
    await projection.load();

    // Use Promise.all() to process all chart data in parallel
    const offsetPromises = chartData.map(async (row) => {
        try {

            let offsetDistance
            if (row.afstand > 0) {
                if (model.rivierzijde === 'rechts') {
                    offsetDistance = -Math.abs(row.afstand || 0);
                } else {
                    offsetDistance = Math.abs(row.afstand || 0);
                }
            } if (row.afstand < 0) {
                if (model.rivierzijde === 'rechts') {
                    offsetDistance = Math.abs(row.afstand || 0);
                } else {
                    offsetDistance = -Math.abs(row.afstand || 0);
                }
            }

            if (row.afstand === 0) {
                offsetDistance = 0;
            }

            console.log(offsetDistance, "Offset distance for row:", row);

            // Project to RD New for accurate planar offset
            const projectedLine = projection.project(basePath, rdNewSpatialRef) as Polyline;

            if (!projectedLine) {
                console.warn(`Failed to project line for row:`, row);
                return null;
            }

            // Apply planar offset in RD New (very accurate for Netherlands)
            const offsetLineRD = geometryEngine.offset(projectedLine, offsetDistance, "meters", "round") as Polyline;

            if (!offsetLineRD) {
                console.warn(`Failed to create offset for distance ${offsetDistance}:`, row);
                return null;
            }

            // Project back to Web Mercator
            const offsetLine = projection.project(offsetLineRD, SpatialReference.WebMercator) as Polyline;

            if (offsetLine) {
                const elevation = row.hoogte || 0;
                const updatedPaths = offsetLine.paths.map((path) =>
                    path.map((coord) => [coord[0], coord[1], elevation])
                );

                const offsetGraphic = new Graphic({
                    geometry: new Polyline({
                        paths: updatedPaths,
                        spatialReference: SpatialReference.WebMercator,
                    }),
                    symbol: {
                        type: "simple-line",
                        style: "solid",
                        color: "grey",
                        width: 1,
                    } as any,
                });

                model.graphicsLayerTemp.add(offsetGraphic);

                if (row.afstand !== undefined && row.afstand !== null) {
                    return { afstand: row.afstand, geometry: offsetGraphic.geometry };
                } else {
                    console.log("Row afstand is missing in the data.", row);
                    return null;
                }
            }
        } catch (error) {
            console.error(`Error processing row:`, row, error);
            return null;
        }
        return null;
    });

    // Wait for all offset operations to complete
    const offsetResults = await Promise.all(offsetPromises);

    // Build offsetGeometries object from results, filtering out null values
    offsetResults.forEach(result => {
        if (result?.afstand !== undefined && result?.afstand !== null && result?.geometry) {
            offsetGeometries[result.afstand] = result.geometry;
        }
    });

    // console.log("Offset geometries created:", Object.keys(offsetGeometries));
    console.log("Offset geometries created:", offsetGeometries);

    // Only proceed if we have valid geometries
    if (Object.keys(offsetGeometries).length === 0) {
        console.warn("No valid offset geometries created");
        return;
    }

    // Sort chart data by distance (afstand) to ensure correct order
    const sortedChartData = chartData
        .filter(row => row.afstand !== undefined && row.afstand !== null && row.afstand !== "")
        .sort((a, b) => parseFloat(a.afstand) - parseFloat(b.afstand));

    console.log("Sorted chart data by distance:", sortedChartData);

    // Create polygons between consecutive distance points
    for (let i = 0; i < sortedChartData.length - 1; i++) {
        const currentRow = sortedChartData[i];
        const nextRow = sortedChartData[i + 1];

        const currentGeometry = offsetGeometries[currentRow.afstand];
        const nextGeometry = offsetGeometries[nextRow.afstand];

        if (currentGeometry && nextGeometry) {
            let polygonName;

            if (currentRow.locatie && nextRow.locatie) {
                polygonName = `${currentRow.locatie}_${nextRow.locatie}`;
            } else {
                polygonName = `${currentRow.afstand}m_${nextRow.afstand}m`;
            }
            console.log(`Creating polygon between ${currentRow.afstand}m and ${nextRow.afstand}m`);

            createPolygonBetweenDistances({
                model,
                distanceA: currentRow.afstand,
                distanceB: nextRow.afstand,
                offsetGeometries: offsetGeometries as any,
                polygonName
            });
        } else {
            console.warn(`Missing geometry for distance range ${currentRow.afstand}m to ${nextRow.afstand}m`);
        }
    }



    // // Check and create polygons only if the required values exist
    // if (offsetGeometries["buitenkruin"] && offsetGeometries["binnenkruin"]) {
    //     createPolygonBetween(model, "buitenkruin", "binnenkruin", offsetGeometries);
    // }

    // const containsBinnenBerm = chartData.some((row) =>
    //     row.locatie?.toLowerCase().includes("binnenberm")
    // );

    // const containsBuitenBerm = chartData.some((row) =>
    //     row.locatie?.toLowerCase().includes("buitenberm")
    // );

    // if (containsBinnenBerm && containsBuitenBerm) {
    //     if (offsetGeometries["buitenkruin"] && offsetGeometries["bovenkant_buitenberm"]) {
    //         createPolygonBetween(model, "buitenkruin", "bovenkant_buitenberm", offsetGeometries);
    //     }
    //     if (offsetGeometries["binnenkruin"] && offsetGeometries["bovenkant_binnenberm"]) {
    //         createPolygonBetween(model, "binnenkruin", "bovenkant_binnenberm", offsetGeometries);
    //     }
    //     if (offsetGeometries["bovenkant_buitenberm"] && offsetGeometries["onderkant_buitenberm"]) {
    //         createPolygonBetween(model, "bovenkant_buitenberm", "onderkant_buitenberm", offsetGeometries);
    //     }
    //     if (offsetGeometries["onderkant_buitenberm"] && offsetGeometries["buitenteen"]) {
    //         createPolygonBetween(model, "onderkant_buitenberm", "buitenteen", offsetGeometries);
    //     }
    //     if (offsetGeometries["bovenkant_binnenberm"] && offsetGeometries["onderkant_binnenberm"]) {
    //         createPolygonBetween(model, "bovenkant_binnenberm", "onderkant_binnenberm", offsetGeometries);
    //     }
    //     if (offsetGeometries["onderkant_binnenberm"] && offsetGeometries["binnenteen"]) {
    //         createPolygonBetween(model, "onderkant_binnenberm", "binnenteen", offsetGeometries);
    //     }
    // }

    // if (containsBinnenBerm && !containsBuitenBerm) {
    //     if (offsetGeometries["buitenkruin"] && offsetGeometries["buitenteen"]) {
    //         createPolygonBetween(model, "buitenkruin", "buitenteen", offsetGeometries);
    //     }
    //     if (offsetGeometries["binnenkruin"] && offsetGeometries["bovenkant_binnenberm"]) {
    //         createPolygonBetween(model, "binnenkruin", "bovenkant_binnenberm", offsetGeometries);
    //     }
    //     if (offsetGeometries["bovenkant_binnenberm"] && offsetGeometries["onderkant_binnenberm"]) {
    //         createPolygonBetween(model, "bovenkant_binnenberm", "onderkant_binnenberm", offsetGeometries);
    //     }
    //     if (offsetGeometries["onderkant_binnenberm"] && offsetGeometries["binnenteen"]) {
    //         createPolygonBetween(model, "onderkant_binnenberm", "binnenteen", offsetGeometries);
    //     }

    // }
    // if (!containsBinnenBerm && containsBuitenBerm) {
    //     if (offsetGeometries["binnenkruin"] && offsetGeometries["binnenteen"]) {
    //         createPolygonBetween(model, "binnenkruin", "binnenteen", offsetGeometries);
    //     }
    //     if (offsetGeometries["buitenkruin"] && offsetGeometries["bovenkant_buitenberm"]) {
    //         createPolygonBetween(model, "buitenkruin", "bovenkant_buitenberm", offsetGeometries);
    //     }
    //     if (offsetGeometries["bovenkant_buitenberm"] && offsetGeometries["onderkant_buitenberm"]) {
    //         createPolygonBetween(model, "bovenkant_buitenberm", "onderkant_buitenberm", offsetGeometries);
    //     }
    //     if (offsetGeometries["onderkant_buitenberm"] && offsetGeometries["buitenteen"]) {
    //         createPolygonBetween(model, "onderkant_buitenberm", "buitenteen", offsetGeometries);
    //     }
    // }



    // if (!containsBinnenBerm && !containsBuitenBerm) {
    //     if (offsetGeometries["buitenkruin"] && offsetGeometries["buitenteen"]) {
    //         createPolygonBetween(model, "buitenkruin", "buitenteen", offsetGeometries);
    //     }
    //     if (offsetGeometries["binnenkruin"] && offsetGeometries["binnenteen"]) {
    //         createPolygonBetween(model, "binnenkruin", "binnenteen", offsetGeometries);
    //     }
    // }

    // console.log(model.uniqueParts, "Unique parts");

    const merged = meshUtils.merge(model.meshes);
    // union polygons first?
    const mergedGraphic = new Graphic({
        geometry: merged,
        symbol: {
            type: "mesh-3d",
            symbolLayers: [{ type: "fill" }],
        } as any,
    });
    model.graphicsLayerMesh.add(mergedGraphic);
    model.mergedMesh = merged;
    model.meshGraphic = mergedGraphic;
}

export async function calculateVolume(model): Promise<void> {
    model.graphicsLayerControlPoints.removeAll();

    const gridSize = model.gridSize;

    let elevationSampler = await meshUtils.createElevationSampler(
        model.mergedMesh
    );

    // **PROJECT MESH EXTENT TO RD NEW FOR PROPER METER-BASED GRID**
    const extent = model.meshGraphic.geometry.extent;

    // RD New spatial reference (EPSG:28992) where 1 unit = 1 meter
    const rdNewSpatialRef = new SpatialReference({ wkid: 28992 });
    await projection.load();

    // Create extent polygon and project to RD New
    const extentPolygon = new Polygon({
        rings: [[
            [extent.xmin, extent.ymin],
            [extent.xmax, extent.ymin],
            [extent.xmax, extent.ymax],
            [extent.xmin, extent.ymax],
            [extent.xmin, extent.ymin]
        ]],
        spatialReference: extent.spatialReference
    });

    const projectedExtent = projection.project(extentPolygon, rdNewSpatialRef) as Polygon;
    const rdExtent = projectedExtent.extent;

    console.log(`Original extent (Web Mercator): xmin=${extent.xmin.toFixed(2)}, xmax=${extent.xmax.toFixed(2)}, ymin=${extent.ymin.toFixed(2)}, ymax=${extent.ymax.toFixed(2)}`);
    console.log(`RD extent: xmin=${rdExtent.xmin.toFixed(2)}, xmax=${rdExtent.xmax.toFixed(2)}, ymin=${rdExtent.ymin.toFixed(2)}, ymax=${rdExtent.ymax.toFixed(2)}`);

    const pointCoordsForVolume = [];
    const groundPoints = [];

    // **GENERATE GRID IN RD NEW COORDINATES WITH PROPER METER SPACING**
    let pointCount = 0;
    let validPoints = 0;

    for (let rdX = rdExtent.xmin; rdX <= rdExtent.xmax; rdX += gridSize) {
        for (let rdY = rdExtent.ymin; rdY <= rdExtent.ymax; rdY += gridSize) {
            pointCount++;

            // **PROJECT EACH GRID POINT BACK TO WEB MERCATOR FOR ELEVATION SAMPLING**
            const rdPoint = new Point({
                x: rdX,
                y: rdY,
                spatialReference: rdNewSpatialRef
            });

            const webMercatorPoint = projection.project(rdPoint, SpatialReference.WebMercator) as Point;

            // Query the elevation at the point
            const elevation = elevationSampler.elevationAt(webMercatorPoint.x, webMercatorPoint.y);
            if (elevation) {
                validPoints++;

                // Add control point graphic using Web Mercator coordinates
                // model.graphicsLayerControlPoints.add(new Graphic({ 
                //     geometry: webMercatorPoint, 
                //     symbol: model.controlPointSymbol 
                // }));

                // Add the point to the volume calculation
                pointCoordsForVolume.push([webMercatorPoint.x, webMercatorPoint.y, elevation]);

                // Add the point to the ground elevation query
                groundPoints.push([webMercatorPoint.x, webMercatorPoint.y]);
            }
        }
    }

    // **ADD VERIFICATION LOGGING TO CHECK ACTUAL DISTANCES**
    console.log(`Total grid points generated: ${pointCount}`);
    console.log(`Valid points with elevation: ${validPoints}`);

    if (validPoints >= 2) {
        // Check distance between first two points
        const point1WM = new Point({
            x: pointCoordsForVolume[0][0],
            y: pointCoordsForVolume[0][1],
            spatialReference: SpatialReference.WebMercator
        });
        const point2WM = new Point({
            x: pointCoordsForVolume[1][0],
            y: pointCoordsForVolume[1][1],
            spatialReference: SpatialReference.WebMercator
        });

        // Project to RD for accurate distance measurement
        const point1RD = projection.project(point1WM, rdNewSpatialRef) as Point;
        const point2RD = projection.project(point2WM, rdNewSpatialRef) as Point;

        const actualDistance = Math.sqrt(
            Math.pow(point2RD.x - point1RD.x, 2) + Math.pow(point2RD.y - point1RD.y, 2)
        );

        console.log(`Verification: Actual distance between first two control points: ${actualDistance.toFixed(2)}m (expected: ${gridSize}m)`);
    }

    if (pointCoordsForVolume.length === 0) {
        console.warn("No points were processed. Ensure the mesh geometries and grid size are correct.");
        return;
    }

    // **KEEP VOLUME CALCULATIONS USING CORRECT MODEL.GRIDSIZE AREA**
    // Query ground elevations for all points
    const multipointForGround = new Multipoint({
        points: groundPoints,
        spatialReference: SpatialReference.WebMercator
    });

    const groundResult = await model.elevationLayer.queryElevation(multipointForGround, { returnSampleInfo: true });
    console.log("Ground elevation query result:", groundResult);

    let totalVolumeDifference = 0;
    let excavationVolume = 0;
    let fillVolume = 0;

    groundResult.geometry.points.forEach(([x, y, zGround], index) => {
        const z3D = pointCoordsForVolume[index][2]; // Z value from the mesh geometry
        const volumeDifference = (z3D - zGround) * model.gridSize * model.gridSize; // Volume difference for this point

        if (volumeDifference > 0) {
            fillVolume += volumeDifference; // Fill volume (material to be added)
        } else {
            excavationVolume += Math.abs(volumeDifference); // Cut volume (material to be removed)
        }

        totalVolumeDifference += volumeDifference;
    });


    try {
        // filter groundResult points for elevation above zGround and remove z-values
        const filteredGroundPoints = groundResult.geometry.points.filter(([x, y, zGround], index) => {
            const z3D = pointCoordsForVolume[index][2]; // Z value from the mesh geometry
            return z3D > zGround;
        }).map(([x, y]) => [x, y]);

        const multipointAboveGround = new Multipoint({
            points: filteredGroundPoints,
            spatialReference: SpatialReference.WebMercator
        });

        const alphaShapeAboveGround = alphaShapeOperator.execute(multipointAboveGround, 5);

        const singlePartAlphaShape = multiPartToSinglePartOperator.executeMany([alphaShapeAboveGround.alphaShape]);

        if (singlePartAlphaShape) {

            // iterate over singlePartAlphaShape parts and create graphics
            singlePartAlphaShape.forEach(part => {
                const aboveGroundGraphic = new Graphic({
                    geometry: part,
                });
                model.graphicsLayerRuimtebeslag.add(aboveGroundGraphic);
            });
        }
    } catch (error) {
        console.error("Error creating alpha shape for above ground volume:", error);
    }

    model.excavationVolume = excavationVolume.toFixed(2);
    model.fillVolume = fillVolume.toFixed(2);
    model.totalVolumeDifference = totalVolumeDifference.toFixed(2);

    console.log("Total volume difference:", totalVolumeDifference, "m³");
    console.log("Total cut volume:", excavationVolume, "m³");
    console.log("Total fill volume:", fillVolume, "m³");
}

export async function calculateDesignValues(model): Promise<void> {
    // Check if required data exists before calculating
    if (!model.mergedMesh) {
        console.warn("No merged mesh available for design calculations");
        return;
    }

    const total2dArea = await calculate2dAreas(model);
    model.total2dArea = total2dArea.toFixed(2);
    const total3dArea = await calculate3dAreas(model);
    model.total3dArea = total3dArea.toFixed(2);

    if (model.graphicsLayerLine?.graphics?.length > 0) {
        console.log("Calculating line length...");
        const firstGraphic = model.graphicsLayerLine.graphics.getItemAt(0);
        if (firstGraphic?.geometry) {
            console.log("Calculating line length...");
            const length = geometryEngine.geodesicLength(firstGraphic.geometry, "meters");
            console.log("Calculated line length:", length);
            model.lineLength = length.toFixed(2);
        } else {
            console.log("No geometry found in the first graphic of graphicsLayerLine.");
        }
    }
}

function createMeshFromPolygon(model, polygon, textureUrl = null) {

    const mesh = Mesh.createFromPolygon(polygon, {

    });
    mesh.spatialReference = polygon.spatialReference

    // const symbol = {
    //     type: "mesh-3d",
    //     symbolLayers: [{ type: "fill" }]
    // };

    model.meshes.push(mesh);

    // graphicsLayerTemp.add(new Graphic({ geometry: mesh, symbol, attributes: { footprint: polygon } }));
}

export function createPolygonBetween(model: any, nameA: string, nameB: string, offsetGeometries: OffsetGeometries): void {
    const geomA = offsetGeometries[nameA];
    const geomB = offsetGeometries[nameB];
    if (!geomA || !geomB) {
        console.warn(`Could not find lines for ${nameA} and/or ${nameB}`);
        return;
    }

    // part for graphiclayers
    const pathAtotal = geomA.paths[0];
    const pathBtotal = geomB.paths[0].slice().reverse();
    let ring = pathAtotal.concat(pathBtotal);
    ring.push(pathAtotal[0]);

    let ring2d = ring.map(point => [point[0], point[1]]);

    const polygon3d = new Polygon({
        rings: [ring],
        spatialReference: geomA.spatialReference
    });

    const polygon2d = new Polygon({
        rings: [ring2d],
        spatialReference: geomA.spatialReference
    });

    const partName = `${nameA}-${nameB}`;

    const graphics2D = new Graphic({
        geometry: polygon2d,
        attributes: { name: partName }
    });

    const graphic3d = new Graphic({
        geometry: polygon3d,
        attributes: { name: partName }
    });

    model.graphicsLayer3dPolygon.add(graphic3d);

    model.designLayer2D.applyEdits({
        addFeatures: [graphics2D]
    }).catch((error) => {
        console.error("Error adding 2D polygon to design layer:", error);
    });

    // part for meshes, taking care of proper triangulation
    const pathAforMesh = geomA.paths[0];
    const pathBforMesh = geomB.paths[0];

    // Make sure both paths have the same number of vertices
    const minLength = Math.min(pathAforMesh.length, pathBforMesh.length);
    const trimmedPathA = pathAforMesh.slice(0, minLength);
    const trimmedPathB = pathBforMesh.slice(0, minLength);

    // Create segments by connecting corresponding vertex pairs
    for (let i = 0; i < minLength - 1; i++) {
        // Create a quad (4-sided polygon) from two consecutive vertex pairs
        const quad = [
            trimmedPathA[i],       // Vertex i on line A
            trimmedPathA[i + 1],   // Vertex i+1 on line A  
            trimmedPathB[i + 1],   // Vertex i+1 on line B
            trimmedPathB[i],       // Vertex i on line B
            trimmedPathA[i]        // Close the polygon
        ];

        const segmentPolygon = new Polygon({
            rings: [quad],
            spatialReference: geomA.spatialReference
        });

        // Each quad will have simple, predictable triangulation
        createMeshFromPolygon(model, segmentPolygon, null);
    }
}

export function createPolygonBetweenDistances(args: CreatePolygonBetweenDistancesArgs): void {
    const { model, distanceA, distanceB, offsetGeometries, polygonName } = args;
    const geomA = offsetGeometries[distanceA];
    const geomB = offsetGeometries[distanceB];
    if (!geomA || !geomB) {
        console.warn(`Could not find lines for distance ${distanceA} and/or ${distanceB}`);
        return;
    }

    // part for graphiclayers
    const pathAtotal = geomA.paths[0];
    const pathBtotal = geomB.paths[0].slice().reverse();
    let ring = pathAtotal.concat(pathBtotal);
    ring.push(pathAtotal[0]);

    let ring2d = ring.map(point => [point[0], point[1]]);

    const polygon3d = new Polygon({
        rings: [ring],
        spatialReference: geomA.spatialReference
    });

    const polygon2d = new Polygon({
        rings: [ring2d],
        spatialReference: geomA.spatialReference
    });

    const graphics2D = new Graphic({
        geometry: polygon2d,
        attributes: { name: polygonName }
    });

    const graphic3d = new Graphic({
        geometry: polygon3d,
        attributes: { name: polygonName }
    });

    model.graphicsLayer3dPolygon.add(graphic3d);

    model.designLayer2D.applyEdits({
        addFeatures: [graphics2D]
    }).catch((error) => {
        console.error("Error adding 2D polygon to design layer:", error);
    });

    // part for meshes, taking care of proper triangulation
    const pathAforMesh = geomA.paths[0];
    const pathBforMesh = geomB.paths[0];

    // Make sure both paths have the same number of vertices
    const minLength = Math.min(pathAforMesh.length, pathBforMesh.length);
    const trimmedPathA = pathAforMesh.slice(0, minLength);
    const trimmedPathB = pathBforMesh.slice(0, minLength);

    // Create segments by connecting corresponding vertex pairs
    for (let i = 0; i < minLength - 1; i++) {
        // Create a quad (4-sided polygon) from two consecutive vertex pairs
        const quad = [
            trimmedPathA[i],       // Vertex i on line A
            trimmedPathA[i + 1],   // Vertex i+1 on line A  
            trimmedPathB[i + 1],   // Vertex i+1 on line B
            trimmedPathB[i],       // Vertex i on line B
            trimmedPathA[i]        // Close the polygon
        ];

        const segmentPolygon = new Polygon({
            rings: [quad],
            spatialReference: geomA.spatialReference
        });

        // Each quad will have simple, predictable triangulation
        createMeshFromPolygon(model, segmentPolygon, null);
    }
}


export async function getLineFeatureLayers(map): Promise<FeatureLayer[]> {
    if (!map) {
        console.error("Map is not initialized.");
        return [];
    }

    // Filter layers with line geometry
    const lineFeatureLayers = map.layers
        .filter((layer) => layer.type === "feature")
        .filter((layer: FeatureLayer) => layer.geometryType === "polyline");

    console.log("Line Feature Layers:", lineFeatureLayers);
    return lineFeatureLayers as FeatureLayer[];
}

export function setInputLineFromFeatureLayer(model) {
    const inputLineFeatureLayer = model.map.layers.find((layer) => layer.id === model.selectedLineLayerId) as FeatureLayer;
    //  find featurelayer with line geometry
    const lineGeometry = inputLineFeatureLayer.queryFeatures({
        where: "1=1",
        returnGeometry: true,
        outFields: ["*"],
    }).then(async (result) => {
        const features = result.features;
        if (features.length > 0) {
            features.forEach((feature) => {

                const lineGeometry = feature.geometry;
                projection.load().then(() => {
                    const projectedGeometry = projection.project(
                        lineGeometry,
                        new SpatialReference({ wkid: 3857 })
                    );
                    model.graphicsLayerLine.add(new Graphic({
                        geometry: projectedGeometry as __esri.Geometry,
                        symbol: model.lineLayerSymbol,
                        attributes: feature.attributes,
                    }));

                })
            })

        } else {
            console.warn("No features found in the selected feature layer.");
        }
    }).catch((error) => {
        console.error("Error querying feature layer:", error);
    })

}

export function cleanFeatureLayer(layer) {
    layer.queryObjectIds().then((objectIds) => {
        if (objectIds.length === 0) {
            console.log("No features to delete.");
            return;
        }
        const deletes = objectIds.map(id => ({
            objectId: id
        }));

        layer.applyEdits({
            deleteFeatures: deletes
        }).catch((error) => {
            console.error("Error deleting features:", error);
        });
    });
}


export async function createCrossSection(model) {

    model.startDrawingLine(model.graphicsLayerCrossSection).then(() => { // set interval dynamically?
        getPointsOnLine(model.graphicsLayerCrossSection.graphics.items[0].geometry, 0.1).then((offsetLocations) => {
            console.log(offsetLocations, "Offset locations for cross section");
            const sRef = model.graphicsLayerCrossSection.graphics.items[0].geometry.spatialReference;
            const promises = offsetLocations.map(loc =>
                getPointAlongLine(model.graphicsLayerCrossSection.graphics.items[0].geometry.paths[0], loc, sRef)
            );

            Promise.all(promises).then(async pointGraphics => {
                console.log(pointGraphics, "Point graphics for cross section");
                const multipoint = new Multipoint({
                    hasM: true,
                    points: pointGraphics.map(g => {
                        const { x, y } = g.geometry as Point;
                        const offset = g.attributes?.offset ?? 0;
                        return [x, y, undefined, offset]; // [x, y, z, m]
                    }),
                    spatialReference: model.graphicsLayerCrossSection.graphics.items[0].geometry.spatialReference
                });


                const elevationResult = await model.elevationLayer.queryElevation(multipoint, { returnSampleInfo: true });

                model.crossSectionChartData = elevationResult.geometry.points.map((point, index) => ({
                    afstand: point[3], // m value
                    hoogte: point[2],
                    x: point[0],
                    y: point[1]
                }));


                model.crossSectionPanelVisible = true;


                console.log("Elevation query result:", elevationResult);

                if (model.meshes.length > 0) {

                    let elevationSampler = await meshUtils.createElevationSampler(
                        model.mergedMesh, {
                        noDataValue: -999
                    }
                    );



                    const meshElevationResult = elevationSampler.queryElevation(multipoint)
                    console.log("Mesh elevation result:", meshElevationResult);
                    if ("points" in meshElevationResult && Array.isArray(meshElevationResult.points)) {
                        model.meshSeriesData = meshElevationResult.points
                            .filter(point => point[2] !== -999)
                            .map((point, index) => ({
                                afstand: point[3], // m value
                                hoogte: point[2]
                            }));
                        console.log("Mesh series data:", model.meshSeriesData);
                    } else {
                        model.meshSeriesData = [];
                        console.warn("meshElevationResult does not have a 'points' property or is not an array.", meshElevationResult);
                    }

                    console.log("Mesh elevation result:", meshElevationResult);


                }

            });

            // model.crossSectionLocations = offsetLocations;
            // model.graphicsLayerTemp.removeAll();
        });
    });
}

export async function getElevationData(model) {
    getPointsOnLine(model.graphicsLayerCrossSection.graphics.items[0].geometry, 0.1).then((offsetLocations) => {
        console.log(offsetLocations, "Offset locations for cross section");
        const sRef = model.graphicsLayerCrossSection.graphics.items[0].geometry.spatialReference;
        const promises = offsetLocations.map(loc =>
            getPointAlongLine(model.graphicsLayerCrossSection.graphics.items[0].geometry.paths[0], loc, sRef)
        );

        Promise.all(promises).then(async pointGraphics => {
            console.log(pointGraphics, "Point graphics for cross section");
            const multipoint = new Multipoint({
                hasM: true,
                points: pointGraphics.map(g => {
                    const { x, y } = g.geometry as Point;
                    const offset = g.attributes?.offset ?? 0;
                    return [x, y, undefined, offset]; // [x, y, z, m]
                }),
                spatialReference: model.graphicsLayerCrossSection.graphics.items[0].geometry.spatialReference
            });
            console.log(pointGraphics, "Point graphics for cross section");
            console.log(multipoint, "Multipoint for cross section");

            const elevationResult = await model.elevationLayer.queryElevation(multipoint, { returnSampleInfo: true });
            console.log(elevationResult, "Elevation result for cross section");

            model.chartDataElevation = elevationResult.geometry.points.map((point, index) => ({
                afstand: point[3], // m value
                hoogte: point[2],
                x: point[0],
                y: point[1]
            }));

            // Find intersection of perpendicular line with the reference line
            const perpendicularLine = model.graphicsLayerCrossSection.graphics.items[0].geometry as Polyline;
            const referenceLine = model.graphicsLayerLine.graphics.items[0].geometry as Polyline;

            const intersection = geometryEngine.intersectLinesToPoints(perpendicularLine, referenceLine);

            if (intersection) {
                // Find the geodesic distance along the perpendicular line to the intersection point
                let intersectionDistance = 0;

                // Calculate geodesic distance from start of perpendicular line to intersection point
                const perpStart = new Point({
                    x: perpendicularLine.paths[0][0][0],
                    y: perpendicularLine.paths[0][0][1],
                    spatialReference: perpendicularLine.spatialReference
                });

                const intersectionPoint = Array.isArray(intersection) ? intersection[0] : intersection;

                // Create a line segment from start to intersection for geodesic measurement
                const lineToIntersection = new Polyline({
                    paths: [[[perpStart.x, perpStart.y], [intersectionPoint.x, intersectionPoint.y]]],
                    spatialReference: perpendicularLine.spatialReference
                });

                intersectionDistance = geometryEngine.geodesicLength(lineToIntersection, "meters");

                console.log("Geodesic intersection distance along perpendicular line:", intersectionDistance);

                // Adjust all distances to be relative to the intersection point (0,0)
                model.chartDataElevation = model.chartDataElevation.map(point => ({
                    afstand: point.afstand - intersectionDistance, // Negative for one side, positive for the other
                    hoogte: point.hoogte,
                    x: point.x,
                    y: point.y
                }));

                console.log("Adjusted elevation chart data with intersection at 0:", model.chartDataElevation);
            } else {
                console.warn("No intersection found between perpendicular line and reference line");
            }

        })

    });
}

// code for creating offset locations based on a start offset, segment length, step size, and segment number --> move to separate file if needed
export function createOffsetLocations(
    startOffset: number,
    segmentLength: number,
    stepSize: number,
    segmentNumber: number
) {
    const locations = [];
    let iterations = Math.floor(segmentLength / stepSize);
    let offset = startOffset;
    let offsetInSegment = 0;
    for (let i = 0; i < iterations; i++) {
        locations.push({
            offset,
            offsetInSegment,
            segment: segmentNumber,
        });
        offset += stepSize;
        offsetInSegment += stepSize;
    }
    return locations;
}

export function getPointsOnLine(profileLine: any, intervalSize: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
        try {
            const path = profileLine.paths[0];
            const lineSegments = path.length - 1;
            let totalLength = 0;
            let startDistance = 0;
            let offsetLocations: any[] = [];

            for (let step = 0; step < lineSegments; step++) {
                const [xStart, yStart] = path[step];
                const [xEnd, yEnd] = path[step + 1];

                const lineSegment = new Polyline({
                    hasZ: false,
                    hasM: false,
                    paths: [
                        [
                            [xStart, yStart],
                            [xEnd, yEnd],
                        ],
                    ],
                    spatialReference: profileLine.spatialReference,
                });

                let segmentLength = Math.round(geometryEngine.geodesicLength(lineSegment, "meters"));
                if (segmentLength % 2 !== 0) segmentLength += 1;

                totalLength += segmentLength;

                // Add offset locations for this segment
                offsetLocations = offsetLocations.concat(
                    createOffsetLocations(startDistance, segmentLength, intervalSize, step)
                );
                startDistance += segmentLength;
            }
            //   console.log(offsetLocations, "Offset locations");
            resolve(offsetLocations);
        } catch (error) {
            reject(error);
        }
    });
}

export function getPointAlongLine(
    paths: number[],
    offsetLocation: { offset: number; offsetInSegment: number; segment: number },
    spatialReference: __esri.SpatialReference
): Promise<__esri.Graphic> {
    return new Promise((resolve, reject) => {
        try {
            const x1 = paths[offsetLocation.segment][0];
            const y1 = paths[offsetLocation.segment][1];
            const x2 = paths[offsetLocation.segment + 1][0];
            const y2 = paths[offsetLocation.segment + 1][1];

            const lineSegment = new Polyline({
                hasZ: false,
                hasM: false,
                paths: [
                    [
                        [x1, y1],
                        [x2, y2],
                    ],
                ],
                spatialReference,
            });

            const pathDistancePlanar = geometryEngine.planarLength(lineSegment, "meters");
            const pathDistanceGeodesic = geometryEngine.geodesicLength(lineSegment, "meters");
                       const planarToGeodesic = pathDistancePlanar / pathDistanceGeodesic;

            let distanceDiff = offsetLocation.offsetInSegment * planarToGeodesic;

            const angle = Math.atan2(y2 - y1, x2 - x1);
            const x3 = distanceDiff * Math.cos(angle);
            const y3 = distanceDiff * Math.sin(angle);

            const point = new Point({
                x: x1 + x3,
                y: y1 + y3,
                m: offsetLocation.offset,
                spatialReference,
            });

            const defaultPointSymbol = {
                type: "simple-marker",
                color: [226, 119, 40, 0],
                outline: {
                    color: [255, 255, 255,  0],
                    width: 1,
                },
            };

            const pointGraphic = new Graphic({
                geometry: point,
                symbol: defaultPointSymbol as any,
                attributes: {
                    offset: offsetLocation.offset,
                },
            });

            resolve(pointGraphic);
        } catch (error) {
            reject(error);
        }
    });
}

export async function locateDwpProfile(model) {

    // clean up previous graphics
    model.graphicsLayerPoint.removeAll();
    model.graphicsLayerCrossSection.removeAll();

    // draw point on or near line
    await model.startDrawingPoint(model.graphicsLayerPoint);

    // create line perpendicular to input line at that point (model.graphicsLayerLine)
    const perpendicularLine = createPerpendicularLine(model.graphicsLayerLine.graphics.items[0].geometry, model.graphicsLayerPoint.graphics.items[0].geometry, model.crossSectionLength);
    model.graphicsLayerCrossSection.add(new Graphic({
        geometry: perpendicularLine,
        symbol: model.lineLayerSymbolCrosssection,
    }));

    // get elevation data on that line
    getElevationData(model);

}

export function clearDwpProfile(model) {
    model.graphicsLayerProfile.removeAll();
    model.chartData = [];
}

function createPerpendicularLine(polyline, point, length = 50, centerAtPoint = true) {
    const paths = polyline.paths[0];
    let minDist = Infinity;
    let closestSegment = null;
    let closestPoint = null;

    // 1. Find closest segment
    for (let i = 0; i < paths.length - 1; i++) {
        const p1 = paths[i];
        const p2 = paths[i + 1];

        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];

        // Projection of point onto segment
        const t = ((point.x - p1[0]) * dx + (point.y - p1[1]) * dy) / (dx * dx + dy * dy);
        const tClamped = Math.max(0, Math.min(1, t));

        const projX = p1[0] + tClamped * dx;
        const projY = p1[1] + tClamped * dy;

        const dist2 = (point.x - projX) ** 2 + (point.y - projY) ** 2;

        if (dist2 < minDist) {
            minDist = dist2;
            closestSegment = [p1, p2];
            closestPoint = { x: projX, y: projY };
        }
    }

    // 2. Compute perpendicular vector
    const [p1, p2] = closestSegment;
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];

    // Normalize the direction vector
    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / segmentLength;
    const normalizedDy = dy / segmentLength;

    // Perpendicular vector (rotated 90 degrees)
    const perpX = -normalizedDy;
    const perpY = normalizedDx;

    // 3. Construct perpendicular line with specified geodesic length in meters
    // Create a test line to measure geodesic vs planar ratio
    const testLine = new Polyline({
        paths: [[[closestPoint.x, closestPoint.y], [closestPoint.x + perpX * 100, closestPoint.y + perpY * 100]]],
        spatialReference: polyline.spatialReference
    });

    const planarLength = geometryEngine.planarLength(testLine, "meters");
    const geodesicLength = geometryEngine.geodesicLength(testLine, "meters");
    const geodesicToPlanarRatio = planarLength / geodesicLength;

    // Calculate the coordinate offset needed for the desired geodesic length
    const coordinateOffset = length * geodesicToPlanarRatio;
    let start, end;
    if (centerAtPoint) {
        // Center the line at the point, extending in both directions
        const halfOffset = coordinateOffset / 2;
        start = [closestPoint.x - perpX * halfOffset, closestPoint.y - perpY * halfOffset];
        end = [closestPoint.x + perpX * halfOffset, closestPoint.y + perpY * halfOffset];
    } else {
        start = [closestPoint.x, closestPoint.y];
        end = [closestPoint.x + perpX * coordinateOffset, closestPoint.y + perpY * coordinateOffset];
    }

    return new Polyline({
        paths: [[start, end]],
        spatialReference: polyline.spatialReference
    });
}

export function setDwpLocation(model) {
    model.chartData[model.selectedPointIndex].locatie = model.selectedDwpLocation;
    model.chartData = [...model.chartData]; // Force reactivity
    model.allChartData[model.activeSheet] = [...model.chartData];
}

export function setMapDwpLocation(model, item) {

    // replace point in graphics layer
    const graphic = model.graphicsLayerProfile.graphics.items.find(g => g.attributes.oid === item.oid);

    // fix x values properly
    if (graphic) {
        graphic.attributes.hoogte = item.hoogte;
        graphic.attributes.afstand = item.afstand;
        // Optionally update geometry if needed
        let closestPoint = model.chartDataElevation[0];
        let minDistance = Math.abs(closestPoint.afstand - item.afstand);
        model.chartDataElevation.forEach(dataPoint => {
            const distance = Math.abs(dataPoint.afstand - item.afstand);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = dataPoint;
            }
        });

        // Create the map point using the closest elevation data point
        const cursorPoint = new Point({
            x: closestPoint.x,
            y: closestPoint.y,
            spatialReference: new SpatialReference({
                wkid: 3857
            })
        });
        graphic.geometry = cursorPoint;
    }

}

export function clearDwpLocation(model, item) {
    // remove point in graphics layer
    const graphic = model.graphicsLayerProfile.graphics.items.find(g => g.attributes.oid === item.oid);
    if (graphic) {
        model.graphicsLayerProfile.remove(graphic);
    }
}
