import * as projection from "@arcgis/core/geometry/projection";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";

import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import * as multiPartToSinglePartOperator from "@arcgis/core/geometry/operators/multiPartToSinglePartOperator";
import AreaMeasurementAnalysis from "@arcgis/core/analysis/AreaMeasurementAnalysis";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
// import Query from "@arcgis/core/rest/support/Query";


export const handleCostCalculation = async (
    model, 
    setApiLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setApiError: React.Dispatch<React.SetStateAction<string | null>>
) => {
    setApiLoading(true);
    setApiError(null);

    try {


        // Convert graphics to GeoJSON
        // Convert graphics to GeoJSON for API
        const geojson = {
            type: "FeatureCollection",
            crs: {
                type: "name",
                properties: { name: "EPSG:4326" },
            },
            features: [],
        };

        // Project polygons to WGS84 and add to GeoJSON
        const projection = await import("@arcgis/core/geometry/projection");
        const SpatialReference = (await import("@arcgis/core/geometry/SpatialReference")).default;
        await projection.load();

        model.graphicsLayer3dPolygon.graphics.forEach((graphic) => {
            const geometry = graphic.geometry;
            if (geometry) {
                const projectedGeometry = projection.project(
                    geometry,
                    new SpatialReference({ wkid: 4326 })
                );

                if (projectedGeometry && !Array.isArray(projectedGeometry)) {
                    const polygonGeometry = projectedGeometry as __esri.Polygon;

                    const feature = {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: polygonGeometry.rings,
                        },
                        properties: graphic.attributes || {},
                    };
                    geojson.features.push(feature);
                }
            }
        });



        // API request with 30s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

//         const requestBody = {
//             geojson,
//             road_surface: model.intersectingInritten2dRuimtebeslag || 0,
//             ruimtebeslag_area: model.fillVolume || 0,
//             number_houses: model.intersectingPandenBuffer || 0,
//         };

        const queryParams = new URLSearchParams({
            road_surface: "100",      // hardcoded value
            ruimtebeslag_area: "5000",// hardcoded value
            number_houses: "3",       // hardcoded value
            });

        try {
            
            const response = await fetch(
                `http://localhost:8000/api/cost_calculation?${queryParams.toString()}`,
                 {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "x-api-key": model.apiKey, // API key in header
                },
                body: JSON.stringify(geojson), // only geojson in body
                signal: controller.signal,
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
                throw new Error(errorData.detail || `API request failed: HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log("API cost calculation result:", result);

  
        } catch (fetchError: unknown) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error && fetchError.name === "AbortError") {
                throw new Error("API verzoek duurde te lang (timeout na 30s)");
            }
            throw fetchError;
        }
    } catch (error: unknown) {
        console.error("API cost calculation error:", error);
        let errorMessage = "Onbekende fout opgetreden";

        if (error instanceof TypeError && error.message === "Failed to fetch") {
            errorMessage = "Kan de API niet bereiken. Controleer of de Python backend draait op http://localhost:8000";
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        setApiError(errorMessage);

    } finally {
        setApiLoading(false);
    }
};

