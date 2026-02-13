import { ModelBase, serializable } from "@vertigis/web/models";

export interface StructureAttributes {
    type: string;
    depth: number;
}

export interface CostItem {
    value: number
    unit_cost: number
    quantity: number
    unit: string
    description: string
    dimensions: string
}

export interface SurchargeCostItem {
    value: number
    base_cost: number
    surcharge_percentage: number
    code: string
    description: string
}

export class DirectCostGroundWork {
    opruimenTerrein: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '',description: '', dimensions: ''}
    maaienTerreinen: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '',description: '', dimensions: ''}
    afgravenGrasbekleding: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    afgravenKleilaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '',description: '', dimensions: '' }
    herkeurenKleilaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    aanvullenKern: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    profielerenDijkkern: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    aanbrengenNieuweKleilaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    profielerenVanNieuweKleilaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    hergebruikTeelaarde: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    aanvullenTeelaarde: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    profielerenNieuweGraslaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    inzaaienNieuweToplaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    totaleBDBKGrondwerk: number = 0

    // map API response to class properties
    fromApi(api: Record<string, CostItem | number> = {}) {
        this.opruimenTerrein = api.kosten_opruimen as CostItem ?? this.opruimenTerrein
        this.maaienTerreinen = api.kosten_maaien as CostItem ?? this.maaienTerreinen
        this.afgravenGrasbekleding = api.afgraven_toplaag as CostItem ?? this.afgravenGrasbekleding
        this.afgravenKleilaag = api.afgraven_oud_materiaal as CostItem ?? this.afgravenKleilaag
        this.herkeurenKleilaag = api.hergebruik_oud_materiaal as CostItem ?? this.herkeurenKleilaag
        this.aanvullenKern = api.aanvullen_kern as CostItem ?? this.aanvullenKern
        this.profielerenDijkkern = api.profileren_dijkkern as CostItem ?? this.profielerenDijkkern
        this.aanbrengenNieuweKleilaag = api.aanbrengen_nieuwe_kleilaag as CostItem ?? this.aanbrengenNieuweKleilaag
        this.profielerenVanNieuweKleilaag = api.profileren_nieuwe_kleilaag as CostItem ?? this.profielerenVanNieuweKleilaag
        this.hergebruikTeelaarde = api.hergebruik_toplaag as CostItem ?? this.hergebruikTeelaarde
        this.aanvullenTeelaarde = api.aanvullen_toplaag as CostItem ?? this.aanvullenTeelaarde
        this.profielerenNieuweGraslaag = api.profileren_nieuwe_toplaag as CostItem ?? this.profielerenNieuweGraslaag
        this.inzaaienNieuweToplaag = api.inzaaien_nieuwe_toplaag as CostItem ?? this.inzaaienNieuweToplaag
        this.totaleBDBKGrondwerk = api.totale_BDBK_grondwerk as number ?? 0
    }

    // convenience getters for value only
    get opruimenTerreinValue() { return this.opruimenTerrein.value }
    get maaienTerreinenValue() { return this.maaienTerreinen.value }
    get afgravenGrasbekledingValue() { return this.afgravenGrasbekleding.value }
    get afgravenKleilaagValue() { return this.afgravenKleilaag.value }
    get herkeurenKleilaagValue() { return this.herkeurenKleilaag.value }
    get aanvullenKernValue() { return this.aanvullenKern.value }
    get profielerenDijkkernValue() { return this.profielerenDijkkern.value }
    get aanbrengenNieuweKleilaagValue() { return this.aanbrengenNieuweKleilaag.value }
    get profielerenVanNieuweKleilaagValue() { return this.profielerenVanNieuweKleilaag.value }
    get hergebruikTeelaardeValue() { return this.hergebruikTeelaarde.value }
    get aanvullenTeelaardeValue() { return this.aanvullenTeelaarde.value }
    get profielerenNieuweGraslaagValue() { return this.profielerenNieuweGraslaag.value }
    get inzaaienNieuweToplaagValue() { return this.inzaaienNieuweToplaag.value }

    toDict(): Record<string, number> {
        return {
            opruimenTerrein: this.opruimenTerrein.value,
            maaienTerreinen: this.maaienTerreinen.value,
            afgravenGrasbekleding: this.afgravenGrasbekleding.value,
            afgravenKleilaag: this.afgravenKleilaag.value,
            herkeurenKleilaag: this.herkeurenKleilaag.value,
            aanvullenKern: this.aanvullenKern.value,
            profielerenDijkkern: this.profielerenDijkkern.value,
            aanbrengenNieuweKleilaag: this.aanbrengenNieuweKleilaag.value,
            profielerenVanNieuweKleilaag: this.profielerenVanNieuweKleilaag.value,
            hergebruikTeelaarde: this.hergebruikTeelaarde.value,
            aanvullenTeelaarde: this.aanvullenTeelaarde.value,
            profielerenNieuweGraslaag: this.profielerenNieuweGraslaag.value,
            inzaaienNieuweToplaag: this.inzaaienNieuweToplaag.value,
            totaleBDBKGrondwerk: this.totaleBDBKGrondwerk,
        }
    }
}


export class DirectCostStructures {
    structureDetails: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    totaleBDBKConstructie: number = 0;

    fromApi(api: Record<string, CostItem | number> = {}) {
        this.structureDetails = api.directe_bouwkosten as CostItem || this.structureDetails;
        this.totaleBDBKConstructie = api.totale_BDBK_constructie as number ?? 0
    }
    toDict(): Record<string, number> {
        return {
            structureDetails: this.structureDetails.value,
            totaleBDBKConstructie: this.totaleBDBKConstructie,
        };
    }
}

export class DirectCostInfrastructure {
    opbrekenRegionaleWeg: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    leverenEnAanbrengenRegionaleWeg: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    verwijderenFietspad: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    aanleggenFietspad: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    totaleBDBKInfra: number = 0;

    fromApi(api: Record<string, CostItem | number> = {}) {
        this.opbrekenRegionaleWeg = api.verwijderen_weg as CostItem || this.opbrekenRegionaleWeg;
        this.leverenEnAanbrengenRegionaleWeg = api.aanleggen_weg as CostItem || this.leverenEnAanbrengenRegionaleWeg;
        this.verwijderenFietspad = api.verwijderen_fietspad as CostItem || this.verwijderenFietspad;
        this.aanleggenFietspad = api.aanleggen_fietspad as CostItem || this.aanleggenFietspad;
        this.totaleBDBKInfra = api.totale_BDBK_infrastructuur as number ?? 0
    }
    toDict(): Record<string, number> {
        return {
            opbrekenRegionaleWeg: this.opbrekenRegionaleWeg.value,
            leverenEnAanbrengenRegionaleWeg: this.leverenEnAanbrengenRegionaleWeg.value,
            verwijderenFietspad: this.verwijderenFietspad.value,
            aanleggenFietspad: this.aanleggenFietspad.value,
            totaleBDBKInfra: this.totaleBDBKInfra,
        };
    }
}

export class DirectConstructionCost {
    directeKostenGrondwerk: DirectCostGroundWork = new DirectCostGroundWork();
    directeKostenConstructies: DirectCostStructures = new DirectCostStructures();
    directeKostenInfra: DirectCostInfrastructure = new DirectCostInfrastructure();
    NTDBK: number = 0;
    totaleDBK: number = 0;

    fromApi(api: Record<string, any> = {}) {
        this.directeKostenGrondwerk.fromApi(api["Directe kosten grondwerk"] || {});
        this.directeKostenConstructies.fromApi(api["Directe kosten constructies"] || {});
        this.directeKostenInfra.fromApi(api["Directe kosten infrastructuur"] || api["Directe kosten infra"] || {});
        this.NTDBK = api.NTDBK as number ?? 0;
        this.totaleDBK = api.totale_DBK as number ?? 0;
    }

    toDict(): Record<string, any> {
        return {
            directeKostenGrondwerk: this.directeKostenGrondwerk.toDict(),
            directeKostenConstructies: this.directeKostenConstructies.toDict(),
            directeKostenInfra: this.directeKostenInfra.toDict(),
            NTDBK: this.NTDBK,
            totaleDBK: this.totaleDBK,
        };
    }
}


export class IndirectConstructionCosts {
    pmCost: number = 0;
    generalCost: number = 0
    riskProfit: number = 0;
    totalDirectCosts: number = 0;
    totalIndirectCosts: number = 0;

    fromApi(api: Record<string, any> = {}) {
        this.pmCost = (api.pm_kosten as any)?.value ?? 0;
        this.generalCost = (api.algemene_kosten as any)?.value ?? 0;
        this.riskProfit = (api.risico_en_winst as any)?.value ?? 0;
        this.totalDirectCosts = api.totale_directe_bouwkosten as number ?? 0;
        this.totalIndirectCosts = api.indirecte_bouwkosten as number ?? 0;
    }
    
    toDict(): Record<string, number> {
        return {
            pmCost: this.pmCost,
            generalCost: this.generalCost,
            riskProfit: this.riskProfit,
            totalDirectCosts: this.totalDirectCosts,
            totalIndirectCosts: this.totalIndirectCosts,
        };
    }
}

export class ConstructionCost {
    directConstructionCost: DirectConstructionCost = new DirectConstructionCost();
    indirectConstructionCosts: IndirectConstructionCosts = new IndirectConstructionCosts();
    totalConstructionCost: number = 0;

    fromApi(api: Record<string, any> = {}) {
        const directe = api["Directe Bouwkosten"] || api["Directe bouwkosten"] || {};
        const indirecte = api["Indirecte Bouwkosten"] || api["Indirecte bouwkosten"] || {};

        this.directConstructionCost.fromApi(directe);
        this.indirectConstructionCosts.fromApi(indirecte);
        this.totalConstructionCost =
            (indirecte?.totale_bouwkosten as number) ??
            (api.totale_bouwkosten as number) ??
            0;
    }   
    toDict(): Record<string, any> {
        return {
            directConstructionCost: this.directConstructionCost.toDict(),
            indirectConstructionCosts: this.indirectConstructionCosts.toDict(),
            totalConstructionCost: this.totalConstructionCost,
        };
    }
}


export class EngineeringCosts {
    epkCost: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: ''}
    designCost: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: ''}
    researchCost: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: ''}
    generalCost: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: ''}
    riskProfit: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: ''}

    totalDirectEngineeringCost: number = 0;
    totalIndirectEngineeringCosts: number = 0;
    totalEngineeringCosts: number = 0;


    // map API response to class properties
    fromApi(api: Record<string, SurchargeCostItem | number> = {}) {
        this.epkCost = api.engineering_opdrachtgever as SurchargeCostItem ?? this.epkCost
        this.designCost = api.engineering_opdrachtnemer as SurchargeCostItem ?? this.designCost
        this.researchCost = api.onderzoekskosten as SurchargeCostItem ?? this.researchCost
        this.generalCost = api.algemene_kosten as SurchargeCostItem ?? this.generalCost
        this.riskProfit = api.winst_en_risico as SurchargeCostItem ?? this.riskProfit

        this.totalDirectEngineeringCost = api.direct_engineering_cost as number ?? 0
        this.totalIndirectEngineeringCosts = api.indirect_engineering_cost as number ?? 0
        this.totalEngineeringCosts = api.total_engineering_costs as number ?? 0
    }

    toDict(): Record<string, any> {
        return {
            epkCost: this.epkCost,
            designCost: this.designCost,
            researchCost: this.researchCost,
            generalCost: this.generalCost,
            riskProfit: this.riskProfit,
            totalDirectEngineeringCost: this.totalDirectEngineeringCost,
            totalIndirectEngineeringCosts: this.totalIndirectEngineeringCosts,
            totalEngineeringCosts: this.totalEngineeringCosts,
        }
    }
}


export class OtherCosts {
    insurances: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: '' }
    cablesPipes: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: '' }
    damages: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: '' }   
    generalCost: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: '' }
    riskProfit: SurchargeCostItem = { value: 0, base_cost: 0, surcharge_percentage: 0, code: '', description: '' }

    totalDirectGeneralCosts: number = 0;
    totalIndirectGeneralCosts: number = 0;
    totalGeneralCosts: number = 0;

    fromApi(api: Record<string, SurchargeCostItem | number> = {}) {
        this.insurances = api.vergunningen_verzekeringen as SurchargeCostItem ?? this.insurances
        this.cablesPipes = api.kabels_leidingen as SurchargeCostItem ?? this.cablesPipes
        this.damages = api.planschade_inpassingsmaatregelen as SurchargeCostItem ?? this.damages
        this.generalCost = api.algemene_kosten as SurchargeCostItem ?? this.generalCost
        this.riskProfit = api.risico_en_winst as SurchargeCostItem ?? this.riskProfit

        this.totalDirectGeneralCosts = api.direct_general_costs as number ?? 0
        this.totalIndirectGeneralCosts = api.indirect_general_costs as number ?? 0
        this.totalGeneralCosts = api.total_general_costs as number ?? 0
    }

    toDict(): Record<string, any> {
        return {
            insurances: this.insurances,
            cablesPipes: this.cablesPipes,
            damages: this.damages,
            generalCost: this.generalCost,
            riskProfit: this.riskProfit,
            totalDirectGeneralCosts: this.totalDirectGeneralCosts,
            totalIndirectGeneralCosts: this.totalIndirectGeneralCosts,
            totalGeneralCosts: this.totalGeneralCosts,
        }
    }
}

export class RealEstateCosts {
    directBenoemdItem: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    directNietBenoemdItem: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    indirectItem: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    riskItem: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '', description: '', dimensions: '' }
    totalRealEstateCosts: number = 0;
    

    private normalizeCostItem(value: unknown, fallback: CostItem): CostItem {
        const safeFallback: CostItem =
            fallback && typeof fallback === "object"
                ? fallback
                : { value: 0, unit_cost: Number.NaN, quantity: Number.NaN, unit: "", description: "", dimensions: "" };

        if (value && typeof value === "object") {
            const maybe: any = value;
            let rawValue: unknown = maybe.value;
            if (rawValue && typeof rawValue === "object" && "value" in (rawValue as any)) {
                rawValue = (rawValue as any).value;
            }

            const parsedValue = Number(rawValue);

            const hasQuantity = "quantity" in maybe;
            const hasUnitCost = "unit_cost" in maybe;
            const hasUnit = "unit" in maybe;

            const parsedQuantity = hasQuantity ? Number(maybe.quantity) : Number.NaN;
            const parsedUnitCost = hasUnitCost ? Number(maybe.unit_cost ?? maybe.unitCost) : Number.NaN;
            const dimensionLike = maybe.dimensions ?? maybe.dimension ?? safeFallback.dimensions ?? "";

            return {
                value: Number.isFinite(parsedValue) ? parsedValue : Number(safeFallback.value ?? 0),
                unit_cost: Number.isFinite(parsedUnitCost) ? parsedUnitCost : Number.NaN,
                quantity: Number.isFinite(parsedQuantity) ? parsedQuantity : Number.NaN,
                unit: hasUnit ? String(maybe.unit ?? "") : "",
                description: String(maybe.description ?? safeFallback.description ?? ""),
                dimensions: dimensionLike == null ? "" : String(dimensionLike),
            };
        }
        if (typeof value === "number") {
            return { ...safeFallback, value };
        }
        return safeFallback;
    }

    fromApi(api: Record<string, any> = {}) {
        const section = (api?.Vastgoedkosten ?? api?.vastgoedkosten ?? api) as Record<string, any>;

        this.directBenoemdItem = this.normalizeCostItem(
            section?.direct_benoemd_real_estate_cost ?? section?.directBenoemdRealEstateCost,
            this.directBenoemdItem
        );
        this.directNietBenoemdItem = this.normalizeCostItem(
            section?.direct_niet_benoemd_real_estate_cost ?? section?.directNietBenoemdRealEstateCost,
            this.directNietBenoemdItem
        );
        this.indirectItem = this.normalizeCostItem(
            section?.indirect_real_estate_cost ?? section?.indirectRealEstateCost,
            this.indirectItem
        );
        this.riskItem = this.normalizeCostItem(
            section?.real_estate_risk_cost ?? section?.realEstateRiskCost,
            this.riskItem
        );
        this.totalRealEstateCosts = Number(section?.total_real_estate_costs ?? section?.totalRealEstateCosts ?? 0);
    }

  toDict(): Record<string, number> {
    return {
        directBenoemdItem: this.directBenoemdItem.value,
        directNietBenoemdItem: this.directNietBenoemdItem.value,
        indirectItem: this.indirectItem.value,
        riskItem: this.riskItem.value,
        totalRealEstateCosts: this.totalRealEstateCosts,
    };
  }
}

@serializable
export default class CostModel extends ModelBase {
    title: string = ""

    status: string = ""
    resultUrl: string = ""
    errorMessage: string = ""

    map: any
    view: any

    
    complexityTypes: string[] = ["makkelijke maatregel", "gemiddelde maatregel", "moeilijke maatregel"]
    complexity: string = "makkelijke maatregel"
    depth: number = 5

    // Nested cost objects
    directCostGroundWork: DirectCostGroundWork = new DirectCostGroundWork()
    directCostStructures: DirectCostStructures = new DirectCostStructures();
    directCostInfrastructure: DirectCostInfrastructure = new DirectCostInfrastructure();
    indirectConstructionCosts: IndirectConstructionCosts = new IndirectConstructionCosts();
    constructionCost: ConstructionCost = new ConstructionCost();

    engineeringCosts: EngineeringCosts = new EngineeringCosts();
    otherCosts: OtherCosts = new OtherCosts();
    realEstateCosts: RealEstateCosts = new RealEstateCosts();
    risicoreservering: number = 0;    

    get totalExcludingBTW(): number {
        return (
            (this.constructionCost?.totalConstructionCost ?? 0) +
            (this.engineeringCosts?.totalEngineeringCosts ?? 0) +
            (this.otherCosts?.totalGeneralCosts ?? 0) +
            (this.risicoreservering ?? 0)
        );
    }

    get totalIncludingBTW(): number {
        return this.totalExcludingBTW * 1.21;
    }

    // Converts the model into the API-ready nested dictionary
    toDict(): Record<string, any> {
        return {
            "Directe kosten grondwerk": this.directCostGroundWork.toDict(),
            "Directe kosten constructies": this.directCostStructures.toDict(),
            "Directe kosten infra": this.directCostInfrastructure.toDict(),
            "Bouwkosten": this.constructionCost.toDict(),
            "Engineeringkosten": this.engineeringCosts.toDict(),
            "Overige bijkomende kosten": this.otherCosts.toDict(),
            "Risicoreservering": this.risicoreservering,
            "Vastgoedkosten": this.realEstateCosts.toDict(),
            "Totaal exclusief BTW": this.totalExcludingBTW,
            "Totaal inclusief BTW": this.totalIncludingBTW,
        }
    }

    // Prepare hierarchical pie chart data structure
    getPieChartData() {
        return [
            {
                category: "Grondwerk",
                value: this.directCostGroundWork.totaleBDBKGrondwerk,
                children: [
                    { category: "Opruimen terrein", value: this.directCostGroundWork.opruimenTerrein.value },
                    { category: "Maaien terreinen", value: this.directCostGroundWork.maaienTerreinen.value },
                    { category: "Afgraven grasbekleding", value: this.directCostGroundWork.afgravenGrasbekleding.value },
                    { category: "Afgraven kleilaag", value: this.directCostGroundWork.afgravenKleilaag.value },
                    { category: "Herkeuren kleilaag", value: this.directCostGroundWork.herkeurenKleilaag.value },
                    { category: "Aanvullen kern", value: this.directCostGroundWork.aanvullenKern.value },
                    { category: "Profieleren dijkkern", value: this.directCostGroundWork.profielerenDijkkern.value },
                    { category: "Nieuwe kleilaag", value: this.directCostGroundWork.aanbrengenNieuweKleilaag.value },
                    { category: "Profieleren kleilaag", value: this.directCostGroundWork.profielerenVanNieuweKleilaag.value },
                    { category: "Hergebruik teelaarde", value: this.directCostGroundWork.hergebruikTeelaarde.value },
                    { category: "Aanvullen teelaarde", value: this.directCostGroundWork.aanvullenTeelaarde.value },
                    { category: "Profieleren graslaag", value: this.directCostGroundWork.profielerenNieuweGraslaag.value },
                ].filter(d => d.value > 0)
            },
            // {
            //     category: "Constructie",
            //     value: this.indirectConstructionCosts.totalCosts,
            //     children: [
            //         { category: "PM kosten", value: this.indirectConstructionCosts.pmCost },
            //         { category: "Algemene kosten (C)", value: this.indirectConstructionCosts.generalCost },
            //         { category: "Risico & winst (C)", value: this.indirectConstructionCosts.riskProfit },
            //     ].filter(d => d.value > 0)
            // },
            {
                category: "Engineering",
                value: this.engineeringCosts.totalEngineeringCosts,
                children: [
                    // { category: "EPK kosten", value: this.engineeringCosts.epkCost },
                    // { category: "Ontwerp", value: this.engineeringCosts.designCost },
                    // { category: "Onderzoeken", value: this.engineeringCosts.researchCost },
                    // { category: "Algemene kosten (E)", value: this.engineeringCosts.generalCost },
                    // { category: "Risico & winst (E)", value: this.engineeringCosts.riskProfit },
                ].filter(d => d.value > 0)
            },
            {
                category: "Overige kosten",
                value: this.otherCosts.totalGeneralCosts,
                children: [
                    // { category: "Vergunningen", value: this.otherCosts.directOtherCosts.insurances },
                    // { category: "Kabels & leidingen", value: this.otherCosts.directOtherCosts.cablesPipes },
                    // { category: "Planschade", value: this.otherCosts.directOtherCosts.damages },
                    // { category: "Algemene kosten (O)", value: this.otherCosts.indirectOtherCosts.generalCost },
                    // { category: "Risico & winst (O)", value: this.otherCosts.indirectOtherCosts.riskProfit },
                ].filter(d => d.value > 0)
            },
            {
                category: "Vastgoed",
                value: this.realEstateCosts.totalRealEstateCosts,
                children: [
                    // { category: "Direct benoemd", value: this.realEstateCosts.directBenoemdCost },
                    // { category: "Direct niet benoemd", value: this.realEstateCosts.directNietBenoemdCost },
                    // { category: "Indirect", value: this.realEstateCosts.indirectCost },
                    // { category: "Risico", value: this.realEstateCosts.riskCost },
                ].filter(d => d.value > 0)
            },
        ].filter(d => d.value > 0);
    }
}
