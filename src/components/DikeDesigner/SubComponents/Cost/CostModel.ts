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
}

export class DirectCostGroundWork {
    opruimenTerrein: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    maaienTerreinen: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    afgravenGrasbekleding: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    afgravenKleilaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    herkeurenKleilaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    aanvullenKern: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    profielerenDijkkern: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    aanbrengenNieuweKleilaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    profielerenVanNieuweKleilaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    hergebruikTeelaarde: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    aanvullenTeelaarde: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    profielerenNieuweGraslaag: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    totaleBDBKGrondwerk: number = 0

    // map API response to class properties
    fromApi(api: Record<string, CostItem | number>) {
        this.opruimenTerrein = api.opruimen_terrein as CostItem ?? this.opruimenTerrein
        this.maaienTerreinen = api.maaien_terreinen as CostItem ?? this.maaienTerreinen
        this.afgravenGrasbekleding = api.afgraven_grasbekleding as CostItem ?? this.afgravenGrasbekleding
        this.afgravenKleilaag = api.afgraven_kleilaag as CostItem ?? this.afgravenKleilaag
        this.herkeurenKleilaag = api.herkeuren_kleilaag as CostItem ?? this.herkeurenKleilaag
        this.aanvullenKern = api.aanvullen_kern as CostItem ?? this.aanvullenKern
        this.profielerenDijkkern = api.profieleren_dijkkern as CostItem ?? this.profielerenDijkkern
        this.aanbrengenNieuweKleilaag = api.aanbregen_nieuwe_kleilaag as CostItem ?? this.aanbrengenNieuweKleilaag
        this.profielerenVanNieuweKleilaag = api.profieleren_vannieuwe_kleilaag as CostItem ?? this.profielerenVanNieuweKleilaag
        this.hergebruikTeelaarde = api.hergebruik_teelaarde as CostItem ?? this.hergebruikTeelaarde
        this.aanvullenTeelaarde = api.aanvullen_teelaarde as CostItem ?? this.aanvullenTeelaarde
        this.profielerenNieuweGraslaag = api.profieleren_nieuwe_graslaag as CostItem ?? this.profielerenNieuweGraslaag
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
            totaleBDBKGrondwerk: this.totaleBDBKGrondwerk,
        }
    }
}


export class DirectCostStructures {
    structureDetails: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    totaleBDBKConstructie: number = 0;

    fromApi(api: Record<string, CostItem | number>) {
        this.structureDetails = api.structure_details as CostItem || this.structureDetails;
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
    opbrekenRegionaleWeg: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    leverenEnAanbrengenRegionaleWeg: CostItem = { value: 0, unit_cost: 0, quantity: 0, unit: '' }
    totaleBDBKInfra: number = 0;

    fromApi(api: Record<string, CostItem | number>) {
        this.opbrekenRegionaleWeg = api.opbreken_regionale_weg as CostItem || this.opbrekenRegionaleWeg;
        this.leverenEnAanbrengenRegionaleWeg = api.leveren_en_aanbrengen_regionale_weg as CostItem || this.leverenEnAanbrengenRegionaleWeg;
        this.totaleBDBKInfra = api.totale_BDBK_infra as number ?? 0
    }
    toDict(): Record<string, number> {
        return {
            opbrekenRegionaleWeg: this.opbrekenRegionaleWeg.value,
            leverenEnAanbrengenRegionaleWeg: this.leverenEnAanbrengenRegionaleWeg.value,
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

    fromApi(api: Record<string, any>) {
        this.directeKostenGrondwerk.fromApi(api['Directe kosten grondwerk'] || {});
        this.directeKostenConstructies.fromApi(api['Directe kosten constructies'] || {});
        this.directeKostenInfra.fromApi(api['Directe kosten infra'] || {});
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
    totalIndirectCosts: number = 0;

    fromApi(api: Record<string, number>) {
        this.pmCost = api.pm_kosten as number ?? 0;
        this.generalCost = api.algemene_kosten as number ?? 0;
        this.riskProfit = api.risico_en_winst as number ?? 0;
        this.totalIndirectCosts = api.indirecte_bouwkosten as number ?? 0;
    }
    
    toDict(): Record<string, number> {
        return {
            pmCost: this.pmCost,
            generalCost: this.generalCost,
            riskProfit: this.riskProfit,
            totalIndirectCosts: this.totalIndirectCosts,
        };
    }
}


export class DirectEngineeringCost {
    epkCost: number = 0;
    designCost: number = 0;
    researchCost: number = 0;    
    totalDirectEngineeringCost: number = 0;

    fromApi(api: Record<string, number>) {
        this.epkCost = api.epk_cost as number ?? 0;
        this.designCost = api.design_cost as number ?? 0;
        this.researchCost = api.research_cost as number ?? 0;
        this.totalDirectEngineeringCost = api.total_direct_engineering_cost as number ?? 0;
    }
    toDict(): Record<string, number> {
        return {
            epkCost: this.epkCost,
            designCost: this.designCost,
            researchCost: this.researchCost,
            totalDirectEngineeringCost: this.totalDirectEngineeringCost,
        };
    }
}

export class IndirectEngineeringCosts {
    generalCost: number = 0;
    riskProfit: number = 0
    indirectEngineeringCosts: number = 0;
    fromApi(api: Record<string, number>) {
        this.generalCost = api.general_cost as number ?? 0;
        this.riskProfit = api.risk_profit as number ?? 0;
        this.indirectEngineeringCosts = api.indirect_engineering_costs as number ?? 0;
    }
    toDict(): Record<string, any> {
        return {
            generalCost: this.generalCost,
            riskProfit: this.riskProfit,
            indirectEngineeringCosts: this.indirectEngineeringCosts,
        };
    }   
}
export class EngineeringCost {
    directEngineeringCost: DirectEngineeringCost = new DirectEngineeringCost();
    indirectEngineeringCosts: IndirectEngineeringCosts = new IndirectEngineeringCosts();
    totalEngineeringCosts: number = 0;


  // Map API keys to camelCase properties
  fromApi(api: Record<string, any>) {
    this.directEngineeringCost.fromApi(api['Directe engineeringkosten'] || {});
    this.indirectEngineeringCosts.fromApi(api['Indirecte engineeringkosten'] || {});
    this.totalEngineeringCosts = api.total_engineering_costs as number ?? 0;
  }

  toDict(): Record<string, any> {
    return {
        directEngineeringCost: this.directEngineeringCost.toDict(),
        indirectEngineeringCosts: this.indirectEngineeringCosts.toDict(),
        totalEngineeringCosts: this.totalEngineeringCosts,
    };
  }
}


export class OtherCosts {
  insurances: number = 0;
  cablesPipes: number = 0;
  damages: number = 0;
  directGeneralCosts: number = 0;
  generalCost: number = 0;
  riskProfit: number = 0;
  indirectGeneralCosts: number = 0;
  totalGeneralCosts: number = 0;

  fromApi(api: Record<string, number>) {
    this.insurances = api.insurances || 0;
    this.cablesPipes = api.cables_pipes || 0;
    this.damages = api.damages || 0;
    this.directGeneralCosts = api.direct_general_costs || 0;
    this.generalCost = api.general_cost || 0;
    this.riskProfit = api.risk_profit || 0;
    this.indirectGeneralCosts = api.indirect_general_costs || 0;
    this.totalGeneralCosts = api.total_general_costs || 0;
  }

  toDict(): Record<string, number> {
    return {
      insurances: this.insurances,
      cablesPipes: this.cablesPipes,
      damages: this.damages,
      directGeneralCosts: this.directGeneralCosts,
      generalCost: this.generalCost,
      riskProfit: this.riskProfit,
      indirectGeneralCosts: this.indirectGeneralCosts,
      totalGeneralCosts: this.totalGeneralCosts,
    };
  }
}

export class RealEstateCosts {
  roadCost: number = 0;
  houseCost: number = 0;
  totalRealEstateCosts: number = 0;

  fromApi(api: Record<string, number>) {
    this.roadCost = api.road_cost || 0;
    this.houseCost = api.house_cost || 0;
    this.totalRealEstateCosts = api.total_real_estate_costs || 0;
  }

  toDict(): Record<string, number> {
    return {
      roadCost: this.roadCost,
      houseCost: this.houseCost,
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
    directConstructionCost: DirectConstructionCost = new DirectConstructionCost();
    indirectConstructionCosts: IndirectConstructionCosts = new IndirectConstructionCosts();
    engineeringCosts: EngineeringCost = new EngineeringCost();
    otherCosts: OtherCosts = new OtherCosts();
    realEstateCosts: RealEstateCosts = new RealEstateCosts();
    risicoreservering: number = 0;

    // Converts the model into the API-ready nested dictionary
    toDict(): Record<string, any> {
        return {
            "Directe kosten grondwerk": this.directCostGroundWork.toDict(),
            "Directe kosten constructies": this.directCostStructures.toDict(),
            "Directe kosten infra": this.directCostInfrastructure.toDict(),
            "Directe bouwkosten": this.directConstructionCost.toDict(),
            "Indirecte bouwkosten": this.indirectConstructionCosts.toDict(),
            "Engineeringkosten": this.engineeringCosts.toDict(),
            "Overige bijkomende kosten": this.otherCosts.toDict(),
            "Risicoreservering": this.risicoreservering,
            "Vastgoedkosten": this.realEstateCosts.toDict(),
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
                    { category: "Vergunningen", value: this.otherCosts.insurances },
                    { category: "Kabels & leidingen", value: this.otherCosts.cablesPipes },
                    { category: "Planschade", value: this.otherCosts.damages },
                    { category: "Algemene kosten (O)", value: this.otherCosts.generalCost },
                    { category: "Risico & winst (O)", value: this.otherCosts.riskProfit },
                ].filter(d => d.value > 0)
            },
            {
                category: "Vastgoed",
                value: this.realEstateCosts.totalRealEstateCosts,
                children: [
                    { category: "Wegen", value: this.realEstateCosts.roadCost },
                    { category: "Panden", value: this.realEstateCosts.houseCost },
                ].filter(d => d.value > 0)
            },
        ].filter(d => d.value > 0);
    }
}
