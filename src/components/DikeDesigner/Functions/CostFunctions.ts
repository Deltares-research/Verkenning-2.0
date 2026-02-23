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
import * as XLSX from "xlsx";
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




        // API request with 120s timeout (cost calculation is slow)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);


        const payload = {
            geojson_dike: geojsonDike.features.length ? geojsonDike : null,
            geojson_structure: geojsonStructure.features.length ? geojsonStructure : null,
            complexity: model.costModel.complexity || "makkelijke maatregel",
            road_surface: Number(model.uitvoeringszoneWegoppervlak) || 0,
            number_houses: Number(model.intersectingPandenBuffer?.length) || 0,
        };
        console.log("API cost payload:", payload);

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

            
            const directeBouwkosten = result["breakdown"]["Bouwkosten"]["Directe Bouwkosten"];
            const indirecteBouwkosten = result["breakdown"]["Bouwkosten"]["Indirecte Bouwkosten"];
            const engineeringCosts = result["breakdown"]["Engineeringkosten"];
            const otherCosts = result["breakdown"]["Overige bijkomende kosten"];
            const realEstateCosts = result["breakdown"]["Vastgoedkosten"];
            const risicoreservering = result["breakdown"]["Risicoreservering"];

            
            model.costModel.risicoreservering = Number(risicoreservering['value'] ?? 0);
            model.costModel.risicoreserveringIncludingBTW = Number(risicoreservering['value_incl_BTW'] ?? 0);
            model.costModel.directCostGroundWork.fromApi(directeBouwkosten["Directe kosten grondwerk"]);
            model.costModel.directCostStructures.fromApi(directeBouwkosten["Directe kosten constructies"]);
            model.costModel.directCostInfrastructure.fromApi(directeBouwkosten["Directe kosten infrastructuur"]);
            model.costModel.indirectConstructionCosts.fromApi(indirecteBouwkosten);
            model.costModel.constructionCost.fromApi(result["breakdown"]["Bouwkosten"]);
            model.costModel.engineeringCosts.fromApi(engineeringCosts);
            model.costModel.otherCosts.fromApi(otherCosts);
            model.costModel.realEstateCosts.fromApi(realEstateCosts);


            model.messages.commands.ui.displayNotification.execute({
                message: "Kosten berekening succesvol voltooid.",
                title: "Kosten berekening voltooid",
            });

  
        } catch (fetchError: unknown) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error && fetchError.name === "AbortError") {
                throw new Error("API verzoek duurde te lang (timeout na 120s)");
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

        model.messages.commands.ui.alert.execute({
            message: `Fout bij kosten berekening: ${errorMessage}`,
            title: "API Fout",
        });

    } finally {
        model.loading = false;
        model.costsCalculated = true;
    }
};

type CostExportRow = {
    Pad: string;
    Kostenpost?: string;
    Type: "Subtotaal" | "Item" | "Totaal";
    Hoeveelheid?: number;
    Eenheid?: string;
    Eenheidsprijs?: number;
    "Opslag (%)"?: number;
    Basis?: number;
    "Totaal excl. BTW": number;
    "Totaal incl. BTW": number;
};

const toNumber = (value: unknown): number => {
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
};

const getSurchargePercent = (raw: unknown): number | undefined => {
    const num = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(num)) return undefined;
    return num <= 1 ? num * 100 : num;
};

const getInclusiveTotal = (value: unknown, explicitInclusive?: unknown): number => {
    if (explicitInclusive !== undefined && explicitInclusive !== null) {
        return toNumber(explicitInclusive);
    }

    if (value && typeof value === "object") {
        const maybe: any = value;
        if (maybe.value_incl_BTW !== undefined) {
            return toNumber(maybe.value_incl_BTW);
        }
    }

    return 0;
};

const isSurchargeItem = (item: any): item is { value?: unknown; base_cost?: unknown; surcharge_percentage?: unknown } => {
    return !!item && typeof item === "object" && "surcharge_percentage" in item;
};

export const downloadCostTableExcel = (model: any) => {
    const rows: CostExportRow[] = [];

    const addSubtotal = (
        path: string,
        totalExcl: unknown,
        type: CostExportRow["Type"] = "Subtotaal",
        totalIncl?: unknown
    ) => {
        const excl = toNumber(totalExcl);
        rows.push({
            Pad: path,
            Type: type,
            "Totaal excl. BTW": excl,
            "Totaal incl. BTW": getInclusiveTotal(totalExcl, totalIncl),
        });
    };

    const addItem = (path: string, label: string, item: any) => {
        if (!item) return;

        if (isSurchargeItem(item)) {
            const excl = toNumber(item.value);
            rows.push({
                Pad: path,
                Kostenpost: label,
                Type: "Item",
                "Opslag (%)": getSurchargePercent(item.surcharge_percentage),
                Basis: item.base_cost !== undefined ? toNumber(item.base_cost) : undefined,
                "Totaal excl. BTW": excl,
                "Totaal incl. BTW": getInclusiveTotal(item),
            });
            return;
        }

        const excl = toNumber(item.value);
        rows.push({
            Pad: path,
            Kostenpost: label,
            Type: "Item",
            Hoeveelheid: item.quantity !== undefined ? toNumber(item.quantity) : undefined,
            Eenheid: item.unit ?? undefined,
            Eenheidsprijs: item.unit_cost !== undefined ? toNumber(item.unit_cost) : undefined,
            "Totaal excl. BTW": excl,
            "Totaal incl. BTW": getInclusiveTotal(item),
        });
    };

    const addValueItem = (path: string, label: string, valueExcl: unknown, valueIncl?: unknown) => {
        const excl = toNumber(valueExcl);
        rows.push({
            Pad: path,
            Kostenpost: label,
            Type: "Item",
            "Totaal excl. BTW": excl,
            "Totaal incl. BTW": getInclusiveTotal(valueExcl, valueIncl),
        });
    };

    const costModel = model?.costModel;
    if (!costModel) {
        model?.messages?.commands?.ui?.displayNotification?.execute?.({
            message: "Geen kostenmodel beschikbaar om te exporteren.",
            title: "Export mislukt",
        });
        return;
    }

    // Bouwkosten
    addSubtotal(
        "Bouwkosten (BK)",
        costModel.constructionCost?.totalConstructionCost,
        "Subtotaal",
        costModel.constructionCost?.totalConstructionCostIncludingBTW
    );
    addSubtotal(
        "Bouwkosten (BK) > Directe Bouwkosten (DBK)",
        costModel.indirectConstructionCosts?.totalDirectCosts,
        "Subtotaal",
        costModel.indirectConstructionCosts?.totalDirectCostsIncludingBTW
    );
    addSubtotal(
        "Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking",
        costModel.directCostGroundWork?.totaleBDBKGrondwerk
    );
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Opruimen terrein", costModel.directCostGroundWork?.opruimenTerrein);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Maaien terreinen", costModel.directCostGroundWork?.maaienTerreinen);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Afgraven grasbekleding", costModel.directCostGroundWork?.afgravenGrasbekleding);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Afgraven kleilaag", costModel.directCostGroundWork?.afgravenKleilaag);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Herkeuren kleilaag", costModel.directCostGroundWork?.herkeurenKleilaag);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Aanvullen kern", costModel.directCostGroundWork?.aanvullenKern);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Profieleren dijkkern", costModel.directCostGroundWork?.profielerenDijkkern);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Aanbrengen nieuwe kleilaag", costModel.directCostGroundWork?.aanbrengenNieuweKleilaag);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Profieleren van nieuwe kleilaag", costModel.directCostGroundWork?.profielerenVanNieuweKleilaag);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Hergebruik teelaarde", costModel.directCostGroundWork?.hergebruikTeelaarde);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Aanvullen teelaarde", costModel.directCostGroundWork?.aanvullenTeelaarde);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Profieleren nieuwe graslaag", costModel.directCostGroundWork?.profielerenNieuweGraslaag);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Grondversterking", "Inzaaien nieuwe toplaag", costModel.directCostGroundWork?.inzaaienNieuweToplaag);

    addSubtotal(
        "Bouwkosten (BK) > Directe Bouwkosten (DBK) > Constructies",
        costModel.directCostStructures?.totaleBDBKConstructie
    );
    addItem(
        "Bouwkosten (BK) > Directe Bouwkosten (DBK) > Constructies",
        model?.constructionModel?.structureType ?? "Constructie",
        costModel.directCostStructures?.structureDetails
    );

    addSubtotal(
        "Bouwkosten (BK) > Directe Bouwkosten (DBK) > Infrastructuur",
        costModel.directCostInfrastructure?.totaleBDBKInfra
    );
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Infrastructuur", "Verwijderen weg", costModel.directCostInfrastructure?.opbrekenRegionaleWeg);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Infrastructuur", "Aanleggen weg", costModel.directCostInfrastructure?.leverenEnAanbrengenRegionaleWeg);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Infrastructuur", "Verwijderen fietspad", costModel.directCostInfrastructure?.verwijderenFietspad);
    addItem("Bouwkosten (BK) > Directe Bouwkosten (DBK) > Infrastructuur", "Aanleggen fietspad", costModel.directCostInfrastructure?.aanleggenFietspad);

    addSubtotal(
        "Bouwkosten (BK) > Indirecte Bouwkosten (IBK)",
        costModel.indirectConstructionCosts?.totalIndirectCosts,
        "Subtotaal",
        costModel.indirectConstructionCosts?.totalIndirectCostsIncludingBTW
    );
    addItem("Bouwkosten (BK) > Indirecte Bouwkosten (IBK)", "Eenmalige algemene bouwplaats-, uitvoerings- en projectmanagementkosten", costModel.indirectConstructionCosts?.pmCost);
    addItem("Bouwkosten (BK) > Indirecte Bouwkosten (IBK)", "Algemene kosten (AK)", costModel.indirectConstructionCosts?.generalCost);
    addItem("Bouwkosten (BK) > Indirecte Bouwkosten (IBK)", "Winst & risico (WR)", costModel.indirectConstructionCosts?.riskProfit);

    // Engineeringkosten
    addSubtotal(
        "Engineeringkosten (EK)",
        costModel.engineeringCosts?.totalEngineeringCosts,
        "Subtotaal",
        costModel.engineeringCosts?.totalEngineeringCostsIncludingBTW
    );
    addSubtotal(
        "Engineeringkosten (EK) > Directe engineeringkosten",
        costModel.engineeringCosts?.totalDirectEngineeringCost,
        "Subtotaal",
        costModel.engineeringCosts?.totalDirectEngineeringCostIncludingBTW
    );
    addItem("Engineeringkosten (EK) > Directe engineeringkosten", "Engineeringskosten opdrachtgever (EPK)", costModel.engineeringCosts?.epkCost);
    addItem("Engineeringkosten (EK) > Directe engineeringkosten", "Engineeringkosten opdrachtnemer (schets-, voor-, definitief ontwerp)", costModel.engineeringCosts?.designCost);
    addItem("Engineeringkosten (EK) > Directe engineeringkosten", "Onderzoeken (archeologie, explosieven, LNC)", costModel.engineeringCosts?.researchCost);
    addSubtotal(
        "Engineeringkosten (EK) > Indirecte engineering kosten",
        costModel.engineeringCosts?.totalIndirectEngineeringCosts,
        "Subtotaal",
        costModel.engineeringCosts?.totalIndirectEngineeringCostsIncludingBTW
    );
    addItem("Engineeringkosten (EK) > Indirecte engineering kosten", "Algemene kosten (AK)", costModel.engineeringCosts?.generalCost);
    addItem("Engineeringkosten (EK) > Indirecte engineering kosten", "Risico & winst (WR)", costModel.engineeringCosts?.riskProfit);

    // Overige bijkomende kosten
    addSubtotal(
        "Overige bijkomende kosten",
        costModel.otherCosts?.totalGeneralCosts,
        "Subtotaal",
        costModel.otherCosts?.totalGeneralCostsIncludingBTW
    );
    addSubtotal(
        "Overige bijkomende kosten > Directe overige bijkomende kosten",
        costModel.otherCosts?.totalDirectGeneralCosts,
        "Subtotaal",
        costModel.otherCosts?.totalDirectGeneralCostsIncludingBTW
    );
    addItem("Overige bijkomende kosten > Directe overige bijkomende kosten", "Vergunningen, heffingen en verzekering", costModel.otherCosts?.insurances);
    addItem("Overige bijkomende kosten > Directe overige bijkomende kosten", "Kabels & leidingen", costModel.otherCosts?.cablesPipes);
    addItem("Overige bijkomende kosten > Directe overige bijkomende kosten", "Planschade & inpassingsmaatregelen", costModel.otherCosts?.damages);
    addSubtotal(
        "Overige bijkomende kosten > Indirecte overige bijkomende kosten",
        costModel.otherCosts?.totalIndirectGeneralCosts,
        "Subtotaal",
        costModel.otherCosts?.totalIndirectGeneralCostsIncludingBTW
    );
    addItem("Overige bijkomende kosten > Indirecte overige bijkomende kosten", "Algemene kosten (AK)", costModel.otherCosts?.generalCost);
    addItem("Overige bijkomende kosten > Indirecte overige bijkomende kosten", "Risico & winst (WR)", costModel.otherCosts?.riskProfit);

    // Subtotaal investeringkosten + risico
    const subtotalInvestment =
        toNumber(costModel.constructionCost?.totalConstructionCost) +
        toNumber(costModel.engineeringCosts?.totalEngineeringCosts) +
        toNumber(costModel.otherCosts?.totalGeneralCosts);
    const subtotalInvestmentIncl =
        getInclusiveTotal(costModel.constructionCost?.totalConstructionCost, costModel.constructionCost?.totalConstructionCostIncludingBTW) +
        getInclusiveTotal(costModel.engineeringCosts?.totalEngineeringCosts, costModel.engineeringCosts?.totalEngineeringCostsIncludingBTW) +
        getInclusiveTotal(costModel.otherCosts?.totalGeneralCosts, costModel.otherCosts?.totalGeneralCostsIncludingBTW);
    addSubtotal("Subtotaal investeringkosten", subtotalInvestment, "Subtotaal", subtotalInvestmentIncl);
    addValueItem(
        "Subtotaal investeringkosten",
        "Objectoverstijgende risico's",
        costModel.risicoreservering,
        costModel.risicoreserveringIncludingBTW
    );

    // Totalen
    addSubtotal("Investeringskosten", costModel.totalExcludingBTW, "Totaal", costModel.totalIncludingBTW);

    // Vastgoedkosten
    addSubtotal(
        "Vastgoedkosten",
        costModel.realEstateCosts?.totalRealEstateCosts,
        "Subtotaal",
        costModel.realEstateCosts?.totalRealEstateCostsIncludingBTW
    );
    addItem("Vastgoedkosten", "Direct benoemd", costModel.realEstateCosts?.directBenoemdItem);
    addItem("Vastgoedkosten", "Direct niet benoemd", costModel.realEstateCosts?.directNietBenoemdItem);
    addItem("Vastgoedkosten", "Indirect", costModel.realEstateCosts?.indirectItem);
    addItem("Vastgoedkosten", "Risico", costModel.realEstateCosts?.riskItem);

    const headerOrder: Array<keyof CostExportRow> = [
        "Pad",
        "Kostenpost",
        "Type",
        "Hoeveelheid",
        "Eenheid",
        "Eenheidsprijs",
        "Opslag (%)",
        "Basis",
        "Totaal excl. BTW",
        "Totaal incl. BTW",
    ];

    const ws = XLSX.utils.json_to_sheet(rows, { header: headerOrder as string[] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kosten");

    const fileName = "kostenoverzicht.xlsx";
    XLSX.writeFile(wb, fileName);
};

