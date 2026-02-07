import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import * as multiPartToSinglePartOperator from "@arcgis/core/geometry/operators/multiPartToSinglePartOperator";
import AreaMeasurementAnalysis from "@arcgis/core/analysis/AreaMeasurementAnalysis";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
// import Query from "@arcgis/core/rest/support/Query";

// Helper function to get query layer from mapping
function getQueryLayer(model: any, mappingKey: string, fallback: string): string {
    const mapping = (model.effectLayerMappings as any)?.[mappingKey];
    if (typeof mapping === 'object' && mapping?.query) {
        return mapping.query;
    }
    return fallback;
}


export async function getIntersectingFeatures(model, layerTitle, whereClause = null, bufferDistance = 0): Promise<object[]> {

    const layerToQuery = model.map.allLayers.items.find(
        (layer) => layer.title === layerTitle
    ) as FeatureLayer;

    if (!layerToQuery) {
        console.warn("BAG panden layer not found!");
        return [];
    }

    const geometries = model.graphicsLayerRuimtebeslag.graphics.items.map(g => g.geometry);

    const unionGeometry = geometries.length > 1
        ? geometryEngine.union(geometries as any[])
        : geometries[0];

    if (!unionGeometry) {
        console.warn("No geometry to query with.");
        return [];
    }

    const query = layerToQuery.createQuery();
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.geometry = unionGeometry;
    query.spatialRelationship = "intersects";
    if (whereClause) {
        query.where = whereClause;
    }
    if (bufferDistance > 0) {
        query.distance = bufferDistance;
        query.units = "meters";
    }

    try {
        const result = await layerToQuery.queryFeatures(query);
        console.log("Intersecting features:", result);

        // If buffer distance is specified, buffer features and filter by intersection
        if (bufferDistance > 0) {
            const bufferedFeatures = result.features
                .map(feature => {
                    const bufferedGeometry = geometryEngine.buffer(feature.geometry, bufferDistance, "meters");
                    // Handle case where buffer returns an array
                    const geometry = Array.isArray(bufferedGeometry) ? bufferedGeometry[0] : bufferedGeometry;
                    return {
                        ...feature,
                        geometry: geometry
                    };
                })
                .filter(bufferedFeature =>
                    geometryEngine.intersects(bufferedFeature.geometry, unionGeometry)
                );
            return bufferedFeatures;
        }

        return result.features;
    } catch (error) {
        console.error("Error querying features:", error);
        return [];
    }

}

export async function getIntersectingArea2dRuimtebeslag(model, layerTitle, whereClause = null, bufferDistance = 0): Promise<number> {
    const layerToQuery = model.map.allLayers.items.find(
        (layer) => layer.title === layerTitle
    ) as FeatureLayer;

    if (!layerToQuery) {
        console.warn(`Layer ${layerTitle} not found!`);
        return 0;
    }

    // Get union of all 2d ruimtebeslag polygons
    const geometries = model.graphicsLayerRuimtebeslag.graphics.items.map(g => g.geometry);
    const unionGeometry = geometries.length > 1
        ? geometryEngine.union(geometries as any[])
        : geometries[0];

    if (!unionGeometry) {
        console.warn("No geometry to query with.");
        return 0;
    }

    // Query features that intersect with 2d ruimtebeslag
    const query = layerToQuery.createQuery();
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.geometry = unionGeometry;
    query.spatialRelationship = "intersects";
    if (whereClause) {
        query.where = whereClause;
    }
    if (bufferDistance > 0) {
        query.distance = bufferDistance;
        query.units = "meters";
    }

    try {
        const result = await layerToQuery.queryFeatures(query);
        console.log(`Found ${result.features.length} intersecting features in ${layerTitle}`);

        let totalOverlapArea = 0;

        // Calculate intersection area for each feature (synchronous operations, no await needed)
        result.features.forEach((feature) => {
            // Buffer feature if bufferDistance is specified
            let featureGeometry = feature.geometry;
            if (bufferDistance > 0) {
                const buffered = geometryEngine.buffer(feature.geometry, bufferDistance, "meters");
                // Handle case where buffer returns an array
                featureGeometry = (Array.isArray(buffered) ? buffered[0] : buffered) as Polygon;
            }

            const intersection = geometryEngine.intersect(
                featureGeometry,
                unionGeometry
            );

            // // add graphic to graphicslayertemp
            // model.graphicsLayerTemp.graphics.add({
            //     geometry: intersection,
            //     symbol: {
            //         type: "simple-fill",
            //         color: [255, 0, 0, 0.5],
            //         outline: {
            //             color: [255, 0, 0, 1],
            //             width: 2
            //         }
            //     }
            // });

            if (intersection) {
                const area = geometryEngine.geodesicArea(intersection as Polygon, "square-meters");
                totalOverlapArea += area;
                console.log(`Intersection area for feature ${feature.attributes.OBJECTID || 'unknown'}: ${area.toFixed(2)} m²`);
            }
        });

        console.log(`Total overlap area with ${layerTitle}: ${totalOverlapArea.toFixed(2)} m²`);
        return totalOverlapArea;

    } catch (error) {
        console.error(`Error calculating intersection area with ${layerTitle}:`, error);
        return 0;
    }
}

// export async function calculate3dAreas(model) {
//     const graphics = model.graphicsLayer3dPolygon.graphics;
//     let totalArea = 0;

//     // Create elevation sampler once before the loop
//     console.log("Creating elevation sampler from merged mesh...");
//     const elevationSampler = await meshUtils.createElevationSampler(
//         model.mergedMesh
//     );
//     console.log("Elevation sampler created successfully");

//     const footprint2D = geometryEngine.union(model.graphicsLayerRuimtebeslag.graphics.items.map(g => g.geometry));

//     if (!footprint2D) {
//         console.warn("Failed to create 2D footprint union");
//         return 0;
//     }

//     for (const graphic of graphics) {
//         try {
//             // Create 2D version of the polygon (remove Z values)
//             const poly2D = new Polygon({
//                 rings: graphic.geometry.rings.map(
//                     ring => ring.map(([x, y, z]) => [x, y])
//                 ),
//                 spatialReference: graphic.geometry.spatialReference
//             });

//             // Intersect with footprint
//             const intersectXY = intersectionOperator.execute(poly2D, footprint2D) as Polygon;

//             if (!intersectXY || !intersectXY.rings || intersectXY.rings.length === 0) {
//                 console.warn("No intersection found for graphic:", graphic);
//                 continue;
//             }

//             // Create 3D polygon with elevations from the design mesh
//             const clipped3D = new Polygon({
//                 spatialReference: graphic.geometry.spatialReference,
//                 rings: intersectXY.rings.map(ring => {
//                     return ring.map(([x, y]) => {
//                         // Sample elevation from the design mesh at this XY location
//                         const z = elevationSampler.elevationAt(x, y);

//                         // If elevation is null/undefined, use 0 or skip the point
//                         if (z === null || z === undefined) {
//                             console.warn(`No elevation found at (${x}, ${y}), using 0`);
//                             return [x, y, 0];
//                         }

//                         return [x, y, z];
//                     });
//                 })
//             });

//             // Create a copy of the graphic with the new clipped3D geometry (don't modify original)
//             const graphicCopy = graphic.clone();
//             graphicCopy.geometry = clipped3D;

//             // Split multi-ring polygons into single-ring polygons
//             const singlePartPolygons = clipped3D.rings.length > 1
//                 ? multiPartToSinglePartOperator.executeMany([clipped3D])
//                 : [clipped3D];

//             console.log(`Processing ${singlePartPolygons.length} polygon part(s) for graphic`);

//             let graphicTotalArea = 0;

//             // Process each single-ring polygon separately
//             for (const singlePolygon of singlePartPolygons) {
//                 try {
//                     const areaMeasurement = new AreaMeasurementAnalysis({
//                         geometry: singlePolygon
//                     });

//                     model.view.analyses.add(areaMeasurement);
//                     // model.view.analyses.remove(areaMeasurement);

//                     const analysisView = await model.view.whenAnalysisView(areaMeasurement);
//                     const result = analysisView.result;

//                     if (result && result.area) {
//                         console.log("3D Area for polygon part:", result.area.value, "square meters");
//                         graphicTotalArea += result.area.value;
//                     }

//                     // Optionally remove the analysis after measurement
//                     model.view.analyses.remove(areaMeasurement);

//                 } catch (areaError) {
//                     console.error("Error measuring area for polygon part:", areaError);
//                 }
//             }

//             graphic.attributes = {
//                 ...graphicCopy.attributes,
//                 // "area_3d": graphicTotalArea
//             };

//             totalArea += graphicTotalArea;

//             console.log("Total 3D area for graphic:", graphicTotalArea, "square meters");

//         } catch (error) {
//             console.error("Error processing graphic:", graphic, error);
//         }
//     }

//     console.log("Total 3D Area for all graphics:", totalArea, "square meters");
//     console.log(model.view.analyses, "Current analyses in view");
//     return totalArea;
// }


export async function calculate2dAreas(model) {
    let totalArea = 0;
    for (const graphic of model.graphicsLayerRuimtebeslag.graphics.items) {
        try {
            const area = geometryEngine.geodesicArea(graphic.geometry, "square-meters");
            totalArea += area;
        } catch (error) {
            console.error("Error calculating 2D area for graphic:", graphic, error);
        }

        // console.log("Calculating area for 2dgraphic:", graphic);
        // try {
        //     const area = geometryEngine.geodesicArea(graphic.geometry, "square-meters");
        //     totalArea += area;
        // } catch (error) {
        //     console.error("Error calculating 2D area for graphic:", graphic, error);
        // }
    }
    console.log("Total 2D Area for all graphics:", totalArea, "square meters");
    return totalArea;
}

export async function calculate3dAreas(model) {
    let totalArea = 0;
    
    for (const graphic of model.graphicsLayerRuimtebeslag3d.graphics.items) {
        try {
            const polygon3D = graphic.geometry as Polygon;
            
            // Split multi-ring polygons into single-ring polygons
            const singlePartPolygons = polygon3D.rings.length > 1
                ? multiPartToSinglePartOperator.executeMany([polygon3D])
                : [polygon3D];

            console.log(`Processing ${singlePartPolygons.length} polygon part(s) for graphic`);

            let graphicTotalArea = 0;

            // Process each single-ring polygon separately
            for (const singlePolygon of singlePartPolygons) {
                try {
                    const areaMeasurement = new AreaMeasurementAnalysis({
                        geometry: singlePolygon
                    });

                    model.view.analyses.add(areaMeasurement);

                    const analysisView = await model.view.whenAnalysisView(areaMeasurement);
                    const result = analysisView.result;

                    if (result && result.area) {
                        console.log("3D Area for polygon part:", result.area.value, "square meters");
                        graphicTotalArea += result.area.value;
                    }

                    // Remove the analysis after measurement
                    model.view.analyses.remove(areaMeasurement);

                } catch (areaError) {
                    console.error("Error measuring area for polygon part:", areaError);
                }
            }

            totalArea += graphicTotalArea;
            console.log("Total 3D area for graphic:", graphicTotalArea, "square meters");

        } catch (error) {
            console.error("Error processing graphic:", graphic, error);
        }
    }

    console.log("Total 3D Area for all graphics:", totalArea, "square meters");
    return totalArea;
}

export function getLineLength(profileLine: any): number {
    try {
        const path = profileLine.paths[0];
        const lineSegments = path.length - 1;
        let totalLength = 0;

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

            const segmentLength = geometryEngine.geodesicLength(lineSegment, "meters");
            totalLength += segmentLength;
        }

        console.log("Total geodesic line length:", totalLength, "meters");
        return totalLength;
    } catch (error) {
        console.error("Error calculating line length:", error);
        return 0;
    }
}

export async function handleEffectAnalysis(model) {
    model.loading = true;
    await getIntersectingFeatures(model, getQueryLayer(model, "bag_panden", "BAG 2D")).then((result) => {
        model.intersectingPanden = result;
        console.log("Intersecting panden:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting features:", error);
    });

    await getIntersectingArea2dRuimtebeslag(model, getQueryLayer(model, "bag_panden", "BAG 2D")).then((result) => {
        model.intersectingPandenArea = result;
        console.log("Total BAG intersecting area:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting area:", error);
    });

    await getIntersectingFeatures(model, "Bomenregister 2015").then((result) => {
        model.intersectingBomen = result;
        console.log("Intersecting bomen:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting features:", error);
    });

    // Get all percelen that intersect with ruimtebeslag
    const percelenIntersectPromise = getIntersectingFeatures(model, "DKK - perceel");
    // Get all waterschap percelen that intersect with ruimtebeslag
    const percelenWaterschapIntersectPromise = getIntersectingFeatures(model, model.percelenWaterschapLayerName);

    Promise.all([percelenIntersectPromise, percelenWaterschapIntersectPromise])
        .then(([percelenIntersect, percelenWaterschapIntersect]) => {
            // Filter out features without valid geometry
            const waterschapGeoms = percelenWaterschapIntersect
                .map(p => (p as any).geometry)
                .filter(g => g && g.spatialReference);

            let waterschapUnion = null;
            if (waterschapGeoms.length > 0) {
                waterschapUnion = geometryEngine.union(waterschapGeoms);
            }

            model.intersectingPercelen = percelenIntersect.filter(perceel => {
                const geom = (perceel as any).geometry;
                if (!waterschapUnion) return true; // If no waterschapUnion, keep all
                const intersection = geometryEngine.intersect(geom, waterschapUnion);
                // keep perceel if there is NO overlapping area
                return !intersection || geometryEngine.geodesicArea(intersection as Polygon, "square-meters") === 0;
            });

            console.log("Intersecting percelen not owned by waterschap:", model.intersectingPercelen);

            // get area for intersectingPercelen (overlapping part)
            const geometries = model.graphicsLayerRuimtebeslag.graphics.items.map(g => g.geometry);
            const unionGeometry = geometries.length > 1
                ? geometryEngine.union(geometries as any[])
                : geometries[0];

            let totalPercelenOverlapArea = 0;
            if (model.intersectingPercelen.length > 0 && unionGeometry) {
                model.intersectingPercelen.forEach(perceel => {
                    const geom = (perceel as any).geometry;
                    const intersection = geometryEngine.intersect(geom, unionGeometry);
                    if (intersection) {
                        const area = geometryEngine.geodesicArea(intersection as Polygon, "square-meters");
                        totalPercelenOverlapArea += area;
                    }
                });
            }
            model.intersectingPercelenArea = totalPercelenOverlapArea;
            console.log("Total overlap area for intersectingPercelen:", totalPercelenOverlapArea, "m²");

        })
        .catch((error) => {
            console.error("Error fetching intersecting features:", error);
        });

    await getIntersectingArea2dRuimtebeslag(model, getQueryLayer(model, "bgt_wegdeel", "BGT - wegdeel")).then((result) => {
        console.log("Total 2D intersecting area:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting area:", error);
    });

    await getIntersectingArea2dRuimtebeslag(model, getQueryLayer(model, "bgt_wegdeel", "BGT - wegdeel"), "functie='inrit'").then((result) => {
        model.intersectingInritten2dRuimtebeslag = result;
        console.log("Total 2D intersecting area:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting area:", error);
    });

    await getIntersectingFeatures(model, getQueryLayer(model, "bgt_wegdeel", "BGT - wegdeel"), "functie='inrit'").then((result) => {
        model.intersectingInritten2dRuimtebeslagCount = result;
        console.log("Intersecting inritten:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting features:", error);
    });

    await getIntersectingArea2dRuimtebeslag(model, getQueryLayer(model, "natura2000", "Natura 2000")).then((result) => {
        model.intersectingNatura2000 = result;
        console.log("Total Natura 2000 intersecting area:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting area:", error);
    });

    await getIntersectingArea2dRuimtebeslag(model, getQueryLayer(model, "gnn", "Groene Ontwikkelingszone en Gelders NatuurNetwerk"), "objectnaam = 'Gelders natuurnetwerk'").then((result) => {
        model.intersectingGNN = result;
        console.log("Total GNN intersecting area:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting area:", error);
    });

    console.log(model.natuurbeheerplanLayerName, "natuurbeheerplanLayerName");

    await getIntersectingFeatures(model, model.natuurbeheerplanLayerName).then((result) => {
        // Get unique beheertype values
        const beheertypeValues = result.map((feature: any) => feature.getAttribute("beheertype")).filter((value, index, self) => self.indexOf(value) === index);

        // Get the layer to access field domains
        const natuurbeheerLayer = model.map.allLayers.items.find((layer) => layer.title === model.natuurbeheerplanLayerName);

        // Map coded values to their descriptions if domain exists
        if (natuurbeheerLayer && natuurbeheerLayer.fields) {
            const beheertypeField = natuurbeheerLayer.fields.find((field: any) => field.name === "beheertype");

            if (beheertypeField && beheertypeField.domain && beheertypeField.domain.codedValues) {
                // Map codes to their names
                model.intersectingBeheertypen = beheertypeValues.map((code) => {
                    const codedValue = beheertypeField.domain.codedValues.find((cv: any) => cv.code === code);
                    return codedValue ? codedValue.name : code; // Return description or code if not found
                });
                console.log("Intersecting beheertypen (decoded):", model.intersectingBeheertypen);
            } else {
                // No domain found, use raw values
                model.intersectingBeheertypen = beheertypeValues;
                console.log("Intersecting beheertypen (no domain):", model.intersectingBeheertypen);
            }
        } else {
            model.intersectingBeheertypen = beheertypeValues;
        }

        console.log("Intersecting features:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting features:", error);
    });

    await getIntersectingArea2dRuimtebeslag(model, model.natuurbeheerplanLayerName).then((result) => {
        model.intersectingBeheertypeArea = result;
        console.log("Total beheertype intersecting area:", result);
    }).catch((error) => {
        console.error("Error fetching beheertype intersecting area:", error);
    });

    await getIntersectingFeatures(model, getQueryLayer(model, "bag_panden", "BAG 2D"), null, model.pandenBufferDistance).then((result) => {
        model.intersectingPandenBuffer = result;
        console.log("Intersecting panden:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting features:", error);
    });

    await getIntersectingArea2dRuimtebeslag(model, getQueryLayer(model, "bag_panden", "BAG 2D"), null, model.pandenBufferDistance).then((result) => {
        model.intersectingPandenBufferArea = result;
        console.log("Total BAG intersecting area:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting area:", error);
    });

    await getIntersectingFeatures(model, "BGT - onbegroeid terreindeel", "fysiekvoorkomen='erf'").then((result) => {
        model.intersectingErven = result;
        console.log("Intersecting erven:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting features:", error);
    });

    await getIntersectingArea2dRuimtebeslag(model, "BGT - onbegroeid terreindeel", "fysiekvoorkomen='erf'").then((result) => {
        model.intersectingErvenArea = result;
        console.log("Total erven intersecting area:", result);
    }).catch((error) => {
        console.error("Error fetching intersecting area:", error);
    });

    // ===== EXECUTION ZONE (UITVOERINGSZONE) ANALYSIS =====
    console.log("Starting execution zone analysis with buffer:", model.uitvoeringszoneBufferDistance || 10, "meters");

    // Create and visualize the execution zone buffer geometry
    const bufferDistance = model.uitvoeringszoneBufferDistance || 10;
    const geometries = model.graphicsLayerRuimtebeslag.graphics.items.map(g => g.geometry);
    
    if (geometries.length > 0) {
        const unionGeometry = geometries.length > 1
            ? geometryEngine.union(geometries as any[])
            : geometries[0];

        if (unionGeometry) {
            // Create execution zone by buffering the union geometry
            const executionZone = geometryEngine.buffer(unionGeometry, bufferDistance, "meters");
            const executionZoneGeometry = Array.isArray(executionZone) ? executionZone[0] : executionZone;

            // Clear existing graphics and add the execution zone to the map
            model.graphicsLayerUitvoeringszone.graphics.removeAll();
            
            const executionZoneGraphic = new Graphic({
                geometry: executionZoneGeometry,
                symbol: new SimpleFillSymbol({
                    color: [0, 255, 0, 0.15], // Green with 15% opacity
                    outline: {
                        color: [0, 255, 0, 0.8], // Green outline with 80% opacity
                        width: 2
                    }
                })
            });

            model.graphicsLayerUitvoeringszone.graphics.add(executionZoneGraphic);
            console.log("Execution zone visualization added to map");
        }
    }

    // Wegoppervlak in uitvoeringszone
    await getIntersectingAreaInExecutionZone(model, getQueryLayer(model, "bgt_wegdeel", "BGT - wegdeel")).then((result) => {
        model.uitvoeringszoneWegoppervlak = result;
        console.log("Execution zone - wegoppervlak:", result);
    }).catch((error) => {
        console.error("Error fetching execution zone wegoppervlak:", error);
    });

    // Panden in uitvoeringszone
    await getIntersectingFeaturesInExecutionZone(model, getQueryLayer(model, "bag_panden", "BAG 2D")).then((result) => {
        model.uitvoeringszonePanden = result;
        console.log("Execution zone - panden:", result);
    }).catch((error) => {
        console.error("Error fetching execution zone panden:", error);
    });

    await getIntersectingAreaInExecutionZone(model, getQueryLayer(model, "bag_panden", "BAG 2D")).then((result) => {
        model.uitvoeringszonePandenArea = result;
        console.log("Execution zone - panden area:", result);
    }).catch((error) => {
        console.error("Error fetching execution zone panden area:", error);
    });

    // Percelen in uitvoeringszone (niet Waterschap)
    await getIntersectingFeaturesInExecutionZone(model, getQueryLayer(model, "kadastrale_percelen", "Kadastrale percelen"), "eigenaar <> 'Waterschap Rivierenland'").then((result) => {
        model.uitvoeringszonePercelen = result;
        console.log("Execution zone - percelen (not Waterschap):", result);
    }).catch((error) => {
        console.error("Error fetching execution zone percelen:", error);
    });

    await getIntersectingAreaInExecutionZone(model, getQueryLayer(model, "kadastrale_percelen", "Kadastrale percelen"), "eigenaar <> 'Waterschap Rivierenland'").then((result) => {
        model.uitvoeringszonePercelenArea = result;
        console.log("Execution zone - percelen area:", result);
    }).catch((error) => {
        console.error("Error fetching execution zone percelen area:", error);
    });

    // Natura 2000 in uitvoeringszone
    await getIntersectingAreaInExecutionZone(model, getQueryLayer(model, "natura2000", "Natura 2000")).then((result) => {
        model.uitvoeringszoneNatura2000 = result;
        console.log("Execution zone - Natura 2000 area:", result);
    }).catch((error) => {
        console.error("Error fetching execution zone Natura 2000:", error);
    });

    // GNN in uitvoeringszone
    await getIntersectingAreaInExecutionZone(model, getQueryLayer(model, "gnn", "Groene Ontwikkelingszone en Gelders NatuurNetwerk"), "objectnaam = 'Gelders natuurnetwerk'").then((result) => {
        model.uitvoeringszoneGNN = result;
        console.log("Execution zone - GNN area:", result);
    }).catch((error) => {
        console.error("Error fetching execution zone GNN:", error);
    });

    // Beheertypen in uitvoeringszone
    await getIntersectingAreaInExecutionZone(model, model.natuurbeheerplanLayerName).then((result) => {
        model.uitvoeringszoneBeheertypeArea = result;
        console.log("Execution zone - beheertype area:", result);
    }).catch((error) => {
        console.error("Error fetching execution zone beheertype area:", error);
    });

    model.loading = false;
    model.effectsCalculated = true;

}

// Helper functions for execution zone (uitvoeringszone) analysis with buffer
export async function getIntersectingFeaturesInExecutionZone(model, layerTitle, whereClause = null): Promise<object[]> {
    const bufferDistance = model.uitvoeringszoneBufferDistance || 10; // Default 10 meters
    
    const layerToQuery = model.map.allLayers.items.find(
        (layer) => layer.title === layerTitle
    ) as FeatureLayer;

    if (!layerToQuery) {
        console.warn(`${layerTitle} layer not found!`);
        return [];
    }

    // Get union of all 2d ruimtebeslag polygons and buffer it
    const geometries = model.graphicsLayerRuimtebeslag.graphics.items.map(g => g.geometry);
    const unionGeometry = geometries.length > 1
        ? geometryEngine.union(geometries as any[])
        : geometries[0];

    if (!unionGeometry) {
        console.warn("No geometry to create execution zone with.");
        return [];
    }

    // Create execution zone by buffering the union geometry
    const executionZone = geometryEngine.buffer(unionGeometry, bufferDistance, "meters");
    const executionZoneGeometry = Array.isArray(executionZone) ? executionZone[0] : executionZone;

    const query = layerToQuery.createQuery();
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.geometry = executionZoneGeometry;
    query.spatialRelationship = "intersects";
    if (whereClause) {
        query.where = whereClause;
    }

    try {
        const result = await layerToQuery.queryFeatures(query);
        console.log(`Execution zone - Intersecting features in ${layerTitle}:`, result);
        return result.features;
    } catch (error) {
        console.error("Error querying features in execution zone:", error);
        return [];
    }
}

export async function getIntersectingAreaInExecutionZone(model, layerTitle, whereClause = null): Promise<number> {
    const bufferDistance = model.uitvoeringszoneBufferDistance || 10; // Default 10 meters
    
    const layerToQuery = model.map.allLayers.items.find(
        (layer) => layer.title === layerTitle
    ) as FeatureLayer;

    if (!layerToQuery) {
        console.warn(`Layer ${layerTitle} not found!`);
        return 0;
    }

    // Get union of all 2d ruimtebeslag polygons and buffer it
    const geometries = model.graphicsLayerRuimtebeslag.graphics.items.map(g => g.geometry);
    const unionGeometry = geometries.length > 1
        ? geometryEngine.union(geometries as any[])
        : geometries[0];

    if (!unionGeometry) {
        console.warn("No geometry to create execution zone with.");
        return 0;
    }

    // Create execution zone by buffering the union geometry
    const executionZone = geometryEngine.buffer(unionGeometry, bufferDistance, "meters");
    const executionZoneGeometry = Array.isArray(executionZone) ? executionZone[0] : executionZone;

    const query = layerToQuery.createQuery();
    query.returnGeometry = true;
    query.outFields = ["*"];
    query.geometry = executionZoneGeometry;
    query.spatialRelationship = "intersects";
    if (whereClause) {
        query.where = whereClause;
    }

    try {
        const result = await layerToQuery.queryFeatures(query);
        console.log(`Execution zone - Found ${result.features.length} intersecting features in ${layerTitle}`);

        let totalOverlapArea = 0;

        result.features.forEach((feature) => {
            const intersection = geometryEngine.intersect(
                feature.geometry,
                executionZoneGeometry
            );

            if (intersection) {
                const area = geometryEngine.geodesicArea(intersection as Polygon, "square-meters");
                totalOverlapArea += area;
            }
        });

        console.log(`Total execution zone intersection area in ${layerTitle}: ${totalOverlapArea.toFixed(2)} m²`);
        return totalOverlapArea;
    } catch (error) {
        console.error("Error calculating intersection area in execution zone:", error);
        return 0;
    }
}

