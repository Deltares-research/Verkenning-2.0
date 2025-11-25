import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";

import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import * as multiPartToSinglePartOperator from "@arcgis/core/geometry/operators/multiPartToSinglePartOperator";
import AreaMeasurementAnalysis from "@arcgis/core/analysis/AreaMeasurementAnalysis";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
// import Query from "@arcgis/core/rest/support/Query";


export async function getIntersectingFeatures(model, layerTitle) {

    const layerToQuery = model.map.allLayers.items.find(
        (layer) => layer.title === layerTitle
    ) as FeatureLayer;

    if (!layerToQuery) {
        console.warn("BAG panden layer not found!");
        return [];
    }

    const geometries = model.graphicsLayerTemp.graphics.items.map(g => g.geometry);

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

    try {
        const result = await layerToQuery.queryFeatures(query);
        console.log("Intersecting features:", result);
        return result.features;
    } catch (error) {
        console.error("Error querying features:", error);
        return [];
    }

}


export async function calculate3dAreas(model) {
    const graphics = model.graphicsLayer3dPolygon.graphics;
    let totalArea = 0;
    
    // Create elevation sampler once before the loop
    console.log("Creating elevation sampler from merged mesh...");
    const elevationSampler = await meshUtils.createElevationSampler(
        model.mergedMesh
    );
    console.log("Elevation sampler created successfully");

    const footprint2D = geometryEngine.union(model.graphicsLayerRuimtebeslag.graphics.items.map(g => g.geometry));
    
    if (!footprint2D) {
        console.warn("Failed to create 2D footprint union");
        return 0;
    }

    for (const graphic of graphics) {
        try {
            // Create 2D version of the polygon (remove Z values)
            const poly2D = new Polygon({
                rings: graphic.geometry.rings.map(
                    ring => ring.map(([x, y, z]) => [x, y])
                ),
                spatialReference: graphic.geometry.spatialReference
            });

            // Intersect with footprint
            const intersectXY = intersectionOperator.execute(poly2D, footprint2D) as Polygon;
            
            if (!intersectXY || !intersectXY.rings || intersectXY.rings.length === 0) {
                console.warn("No intersection found for graphic:", graphic);
                continue;
            }

            // Create 3D polygon with elevations from the design mesh
            const clipped3D = new Polygon({
                spatialReference: graphic.geometry.spatialReference,
                rings: intersectXY.rings.map(ring => {
                    return ring.map(([x, y]) => {
                        // Sample elevation from the design mesh at this XY location
                        const z = elevationSampler.elevationAt(x, y);
                        
                        // If elevation is null/undefined, use 0 or skip the point
                        if (z === null || z === undefined) {
                            console.warn(`No elevation found at (${x}, ${y}), using 0`);
                            return [x, y, 0];
                        }
                        
                        return [x, y, z];
                    });
                })
            });

            // Update the graphic geometry
            graphic.geometry = clipped3D;

            // Split multi-ring polygons into single-ring polygons
            const singlePartPolygons = clipped3D.rings.length > 1
                ? multiPartToSinglePartOperator.executeMany([clipped3D])
                : [clipped3D];

            console.log(`Processing ${singlePartPolygons.length} polygon part(s) for graphic`);

            let graphicTotalArea = 0;

            // Process each single-ring polygon separately
            for (const singlePolygon of singlePartPolygons) {
                try {
                    const areaMeasurement = new AreaMeasurementAnalysis({
                        geometry: singlePolygon
                    });

                    model.view.analyses.add(areaMeasurement);
                    // model.view.analyses.remove(areaMeasurement);

                    const analysisView = await model.view.whenAnalysisView(areaMeasurement);
                    const result = analysisView.result;
                    
                    if (result && result.area) {
                        console.log("3D Area for polygon part:", result.area.value, "square meters");
                        graphicTotalArea += result.area.value;
                    }

                    // Optionally remove the analysis after measurement
                    // model.view.analyses.remove(areaMeasurement);

                } catch (areaError) {
                    console.error("Error measuring area for polygon part:", areaError);
                }
            }

            // Store total area for this graphic
            graphic.attributes = {
                ...graphic.attributes,
                "area_3d": graphicTotalArea
            };

            totalArea += graphicTotalArea;
            
            console.log("Total 3D area for graphic:", graphicTotalArea, "square meters");

        } catch (error) {
            console.error("Error processing graphic:", graphic, error);
        }
    }
    
    console.log("Total 3D Area for all graphics:", totalArea, "square meters");
    console.log(model.view.analyses, "Current analyses in view");
    return totalArea;
}

export function calculate2dAreas(model) {
    let totalArea = 0;
    for (const graphic of model.graphicsLayerRuimtebeslag.graphics.items) {
        console.log("Calculating area for 2dgraphic:", graphic);
        try {
            const area = geometryEngine.geodesicArea(graphic.geometry, "square-meters");
            totalArea += area;
        } catch (error) {
            console.error("Error calculating 2D area for graphic:", graphic, error);
        }
    }
    console.log("Total 2D Area for all graphics:", totalArea, "square meters");
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