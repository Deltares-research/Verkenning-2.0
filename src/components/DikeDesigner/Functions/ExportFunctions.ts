import * as projectOperator from "@arcgis/core/geometry/operators/projectOperator"
import SpatialReference from "@arcgis/core/geometry/SpatialReference";

export function export3dGraphicsLayerAsGeoJSON(model): void {
    const geojson = {
        type: "FeatureCollection",
        crs: {
            type: "name",
            properties: { name: "EPSG:4326" },
        },
        features: [],
    };

    projectOperator.load().then(() => {
        model.graphicsLayer3dPolygon.graphics.forEach((graphic) => {
            const geometry = graphic.geometry;

            if (geometry) {
                const projectedGeometry = projectOperator.execute(
                    geometry,
                    new SpatialReference({ wkid: 4326 })
                );

                if (projectedGeometry) {
                    let feature: any = {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: (projectedGeometry as __esri.Polygon).rings,
                        },
                        properties: graphic.attributes || {},
                    };
                    geojson.features.push(feature);
                }
            }
        });

        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        const prefix = model.designName ? `${model.designName}` : "";
        a.download = `${prefix}_ontwerp_3d.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

export function exportRuimteslagLayerAsGeoJSON(model): void {
    const geojson = {
        type: "FeatureCollection",
        crs: {
            type: "name",
            properties: { name: "EPSG:4326" },
        },
        features: [],
    };

    projectOperator.load().then(() => {
        model.graphicsLayerRuimtebeslag.graphics.forEach((graphic) => {
            const geometry = graphic.geometry;

            if (geometry) {
                const projectedGeometry = projectOperator.execute(
                    geometry,
                    new SpatialReference({ wkid: 4326 })
                );

                if (projectedGeometry && !Array.isArray(projectedGeometry) && projectedGeometry.type === "polygon") {
                    let feature: any = {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: (projectedGeometry as __esri.Polygon).rings,
                        },
                        properties: graphic.attributes || {},
                    };
                    geojson.features.push(feature);
                }
            }
        });

        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        const prefix = model.designName ? `${model.designName}` : "";
        a.download = `${prefix}_ruimtebeslag_2d.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

export function exportDesignLayer2DAsGeoJSON(model): void {
    const geojson = {
        type: "FeatureCollection",
        crs: {
            type: "name",
            properties: { name: "EPSG:4326" },
        },
        features: [],
    };

    projectOperator.load().then(() => {
        model.designLayer2D.graphics.forEach((graphic) => {
            const geometry = graphic.geometry;

            if (geometry) {
                const projectedGeometry = projectOperator.execute(
                    geometry,
                    new SpatialReference({ wkid: 4326 })
                );

                if (projectedGeometry && !Array.isArray(projectedGeometry) && projectedGeometry.type === "polygon") {
                    let feature: any = {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: (projectedGeometry as __esri.Polygon).rings,
                        },
                        properties: graphic.attributes || {},
                    };
                    geojson.features.push(feature);
                }
            }
        });

        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        const prefix = model.designName ? `${model.designName}` : "";
        a.download = `${prefix}_ontwerp_2d.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        model.messages.commands.ui.displayNotification.execute({
            title: "2D ontwerp geëxporteerd",
            message: `2D ontwerp opgeslagen als ${prefix}_ontwerp_2d.geojson`,
            type: "success",
        });
    });
}

export function exportConstructionLineAsGeoJSON(model): void {
    const graphicsLayer = model.constructionModel?.graphicsLayerConstructionLine;
    if (!graphicsLayer || !graphicsLayer.graphics.length) return;

    const geojson = {
        type: "FeatureCollection",
        crs: {
            type: "name",
            properties: { name: "EPSG:4326" },
        },
        features: [],
    };

    projectOperator.load().then(() => {
        graphicsLayer.graphics.forEach((graphic) => {
            const geometry = graphic.geometry;
            if (geometry) {
                const projectedGeometry = projectOperator.execute(
                    geometry,
                    new SpatialReference({ wkid: 4326 })
                );
                if (projectedGeometry) {
                    let feature: any = {
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: (projectedGeometry as __esri.Polyline).paths[0],
                        },
                        properties: graphic.attributes || {},
                    };
                    geojson.features.push(feature);
                }
            }
        });

        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const prefix = model.designName ? `${model.designName}` : "";
        a.download = `${prefix}_constructielijn.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

export function exportInputLinesAsGeoJSON(model): void {
    const geojson = {
        type: "FeatureCollection",
        crs: {
            type: "name",
            properties: { name: "EPSG:4326" },
        },
        features: [],
    };
    
    projectOperator.load().then(() => {
        model.graphicsLayerLine.graphics.forEach((graphic) => {
            const geometry = graphic.geometry;
            if (geometry) {
                const projectedGeometry = projectOperator.execute(
                    geometry,
                    new SpatialReference({ wkid: 4326 })
                );
                if (projectedGeometry) {
                    let feature: any = {
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: (projectedGeometry as __esri.Polyline).paths[0],
                        },
                        properties: graphic.attributes || {},
                    };
                    geojson.features.push(feature);
                }
            }
        });
        
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const prefix = model.designName ? `${model.designName}` : "";
        a.download = `${prefix}_input_lines.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
