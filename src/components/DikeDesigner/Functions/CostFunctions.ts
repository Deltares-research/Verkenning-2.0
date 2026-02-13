import * as projectOperator from "@arcgis/core/geometry/operators/projectOperator"
import SpatialReference from "@arcgis/core/geometry/SpatialReference";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";

import * as intersectionOperator from "@arcgis/core/geometry/operators/intersectionOperator";
import * as multiPartToSinglePartOperator from "@arcgis/core/geometry/operators/multiPartToSinglePartOperator";
import AreaMeasurementAnalysis from "@arcgis/core/analysis/AreaMeasurementAnalysis";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
import { IndirectConstructionCosts, DirectCostGroundWork, EngineeringCosts, OtherCosts, RealEstateCosts,  } from "../SubComponents/Cost/CostModel";
// import Query from "@arcgis/core/rest/support/Query";


export const handleCostCalculation = async (
    model
) => {
    model.loading = true;

    try {
        // Convert graphics to GeoJSON for API
        const geojsonDike = {
            type: "FeatureCollection",
            crs: {
                type: "name",
                properties: { name: "EPSG:4326" },
            },
            features: [],
        };

        const geojsonStructure = {
            type: "FeatureCollection",
            crs: {
                type: "name",
                properties: { name: "EPSG:4326" },
            },
            features: [],
            };

        // Project polygons to WGS84 and add to GeoJSON
        await projectOperator.load();
        

        model.graphicsLayer3dPolygon.graphics.forEach((graphic) => {
            const geometry = graphic.geometry;
            if (geometry) {
                const projectedGeometry = projectOperator.execute(
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
                    geojsonDike.features.push(feature);
                }
            }
        });


        model.constructionModel.structures.forEach((structure) => {
            const geometry = structure.geometry;
            if (!geometry) return;

            const projected = projectOperator.execute(
                geometry,
                new SpatialReference({ wkid: 4326 })
            );

            if (projected && !Array.isArray(projected)) {
                const polyline = projected as __esri.Polyline;

                geojsonStructure.features.push({
                type: "Feature",
                geometry: {
                    type: polyline.paths.length > 1 ? "MultiLineString" : "LineString",
                    coordinates:
                    polyline.paths.length > 1
                        ? polyline.paths
                        : polyline.paths[0],
                },
                properties: {
                    ...structure.attributes, // ✅ type, depth, etc.
                },
                });
            }
        });




        // API request with 30s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);


        const payload = {
            geojson_dike: geojsonDike.features.length ? geojsonDike : null,
            geojson_structure: geojsonStructure.features.length ? geojsonStructure : null,
            complexity: model.costModel.complexity || "makkelijke maatregel",
            road_surface: Number(model.uitvoeringszoneWegoppervlak) || 0,
            number_houses: Number(model.intersectingPandenBuffer?.length) || 0,
        };
        console.log("API cost payload:", payload);

        // // Download payload as JSON file
        // const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = `cost-payload-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        // document.body.appendChild(a);
        // a.click();
        // document.body.removeChild(a);
        // URL.revokeObjectURL(url);


        try {
            
            const response = await fetch(`${model.apiUrl}cost_calculation`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "x-api-key": model.apiKey,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
                throw new Error(errorData.detail || `API request failed: HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log("API cost calculation result:", result);
            console.log('1', 1)

            // update model for table
            model.costModel.constructionCost.fromApi(result["breakdown"]["Bouwkosten"]);
            console.log('2', 1)

            
            const directeBouwkosten = result["breakdown"]["Bouwkosten"]["Directe Bouwkosten"];
            const indirecteBouwkosten = result["breakdown"]["Bouwkosten"]["Indirecte Bouwkosten"];
            const engineeringCosts = result["breakdown"]["Engineeringkosten"];
            const otherCosts = result["breakdown"]["Overige bijkomende kosten"];
            const realEstateCosts = result["breakdown"]["Vastgoedkosten"];
            const risicoreservering = result["breakdown"]["Risicoreservering"];
            model.costModel.risicoreservering = Number(risicoreservering['value'] ?? 0);


            console.log("Updated model costModel:", model.costModel.risicoreservering);



            model.costModel.directCostGroundWork.fromApi(directeBouwkosten["Directe kosten grondwerk"]);
            model.costModel.directCostStructures.fromApi(directeBouwkosten["Directe kosten constructies"]);
            model.costModel.directCostInfrastructure.fromApi(directeBouwkosten["Directe kosten infrastructuur"]);
            model.costModel.indirectConstructionCosts.fromApi(indirecteBouwkosten);
            console.log("1", 1);
            model.costModel.engineeringCosts.fromApi(engineeringCosts);
            console.log("2", 2);


            model.costModel.otherCosts.fromApi(otherCosts);
            console.log("3", 3);
            model.costModel.realEstateCosts.fromApi(realEstateCosts);
            console.log("4", 4);

            

            model.messages.commands.ui.displayNotification.execute({
                message: "Kosten berekening succesvol voltooid.",
                title: "Kosten berekening voltooid",
            });

  
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


    } finally {
        model.loading = false;
        model.costsCalculated = true;
    }
};

