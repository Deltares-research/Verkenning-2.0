import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import AreaMeasurementAnalysis from "@arcgis/core/analysis/AreaMeasurementAnalysis";
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

export function calculate3dArea(polygon) {
    const rings = polygon.rings[0];  // outer ring
    
    // Handle case where polygon may not be closed or is closed
    const isClosed = rings.length > 0 && 
                     rings[0][0] === rings[rings.length - 1][0] && 
                     rings[0][1] === rings[rings.length - 1][1] &&
                     (rings[0][2] || 0) === (rings[rings.length - 1][2] || 0);
    
    const numVertices = isClosed ? rings.length - 1 : rings.length;
    
    let area = 0;

    // Fan triangulation from first vertex
    // For n unique vertices, we get n-2 triangles
    for (let i = 1; i < numVertices - 1; i++) {
        const p0 = rings[0];
        const p1 = rings[i];
        const p2 = rings[i + 1];

        area += triangleArea3D(p0, p1, p2);
    }

    return area; // square meters (for Web Mercator coordinates)
}

function triangleArea3D(a, b, c) {
    const ab = [
        b[0] - a[0],
        b[1] - a[1],
        (b[2] || 0) - (a[2] || 0)
    ];

    const ac = [
        c[0] - a[0],
        c[1] - a[1],
        (c[2] || 0) - (a[2] || 0)
    ];

    // cross product
    const cross = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0]
    ];

    // area = |cross| / 2
    return Math.sqrt(
        cross[0] * cross[0] +
        cross[1] * cross[1] +
        cross[2] * cross[2]
    ) / 2;
}

export async function calculate3dAreas(graphics, model) {
    let totalArea = 0;
    
    // Use for...of loop to properly await each async operation
    for (const graphic of graphics) {
        const polygon = graphic.geometry;
        const areaMeasurement = new AreaMeasurementAnalysis({
            geometry: polygon
        });

        // add to scene view
        model.view.analyses.add(areaMeasurement);

        // retrieve measured results from analysis view once available
        const analysisView = await model.view.whenAnalysisView(areaMeasurement);
       
        const result = analysisView.result;
        console.log("3D Area for graphic:", graphic, "is", result.area.value, "square meters");
        // add attribute to graphic
        graphic.attributes = {
            ...graphic.attributes,
            "area_3d": result.area.value
        };

        model.view.analyses.remove(areaMeasurement);
        totalArea += result.area.value;
    }
    
    console.log("Total 3D Area:", totalArea, "square meters");
    return totalArea;
}