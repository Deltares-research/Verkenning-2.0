import { ModelBase, serializable } from "@vertigis/web/models";

export interface StructureAttributes {
    type: string;
    depth: number;
}

export class DirectCostGroundWork {
    preparationCost: number = 0
    afgravenGrasbekledingCost: number = 0
    afgravenKleilaagCost: number = 0
    herkeurenKleilaagCost: number = 0
    aanvullenKernCost: number = 0
    profielerenDijkkernCost: number = 0
    aanbrengenNieuweKleilaagCost: number = 0
    profielerenVanNieuweKleilaagCost: number = 0
    hergebruikTeelaardeCost: number = 0
    aanvullenTeelaardeCost: number = 0
    profielerenNieuweGraslaagCost: number = 0
    groundworkCost: number = 0

    // map API response to class properties
    fromApi(api: Record<string, number>) {
        this.preparationCost = api.preparation_cost || 0
        this.afgravenGrasbekledingCost = api.afgraven_grasbekleding_cost || 0
        this.afgravenKleilaagCost = api.afgraven_kleilaag_cost || 0
        this.herkeurenKleilaagCost = api.herkeuren_kleilaag_cost || 0
        this.aanvullenKernCost = api.aanvullen_kern_cost || 0
        this.profielerenDijkkernCost = api.profieleren_dijkkern_cost || 0
        this.aanbrengenNieuweKleilaagCost = api.aanbregen_nieuwe_kleilaag_cost || 0
        this.profielerenVanNieuweKleilaagCost = api.profieleren_vannieuwe_kleilaag_cost || 0
        this.hergebruikTeelaardeCost = api.hergebruik_teelaarde_cost || 0
        this.aanvullenTeelaardeCost = api.aanvullen_teelaarde_cost || 0
        this.profielerenNieuweGraslaagCost = api.profieleren_nieuwe_graslaag_cost || 0
        this.groundworkCost = api.groundwork_cost || 0
    }

    toDict(): Record<string, number> {
        return {
            preparationCost: this.preparationCost,
            afgravenGrasbekledingCost: this.afgravenGrasbekledingCost,
            afgravenKleilaagCost: this.afgravenKleilaagCost,
            herkeurenKleilaagCost: this.herkeurenKleilaagCost,
            aanvullenKernCost: this.aanvullenKernCost,
            profielerenDijkkernCost: this.profielerenDijkkernCost,
            aanbrengenNieuweKleilaagCost: this.aanbrengenNieuweKleilaagCost,
            profielerenVanNieuweKleilaagCost: this.profielerenVanNieuweKleilaagCost,
            hergebruikTeelaardeCost: this.hergebruikTeelaardeCost,
            aanvullenTeelaardeCost: this.aanvullenTeelaardeCost,
            profielerenNieuweGraslaagCost: this.profielerenNieuweGraslaagCost,
            groundworkCost: this.groundworkCost,
        }
    }
}

export class ConstructionCostGroundWork {
  groundwork: number = 0;
  directCosts: number = 0;
  pmCost: number = 0;
  generalCost: number = 0;
  riskProfit: number = 0;
  indirectCosts: number = 0;
  totalCosts: number = 0;

  // Map API snake_case keys to camelCase properties
  fromApi(api: Record<string, number>) {
    this.groundwork = api.groundwork || 0;
    this.directCosts = api.direct_costs || 0;
    this.pmCost = api.pm_cost || 0;
    this.generalCost = api.general_cost || 0;
    this.riskProfit = api.risk_profit || 0;
    this.indirectCosts = api.indirect_costs || 0;
    this.totalCosts = api.total_costs || 0;
  }

  // Provide camelCase dictionary for frontend rendering
  toDict(): Record<string, number> {
    return {
      groundwork: this.groundwork,
      directCosts: this.directCosts,
      pmCost: this.pmCost,
      generalCost: this.generalCost,
      riskProfit: this.riskProfit,
      indirectCosts: this.indirectCosts,
      totalCosts: this.totalCosts,
    };
  }
}

export class EngineeringCost {
  epkCost: number = 0;
  designCost: number = 0;
  researchCost: number = 0;
  directEngineeringCost: number = 0;
  generalCost: number = 0;
  riskProfit: number = 0;
  indirectEngineeringCosts: number = 0;
  totalEngineeringCosts: number = 0;

  // Map API keys to camelCase properties
  fromApi(api: Record<string, number>) {
    this.epkCost = api.epk_cost || 0;
    this.designCost = api.design_cost || 0;
    this.researchCost = api.research_cost || 0;
    this.directEngineeringCost = api.direct_engineering_cost || 0;
    this.generalCost = api.general_cost || 0;
    this.riskProfit = api.risk_profit || 0;
    this.indirectEngineeringCosts = api.indirect_engineering_costs || 0;
    this.totalEngineeringCosts = api.total_engineering_costs || 0;
  }

  toDict(): Record<string, number> {
    return {
      epkCost: this.epkCost,
      designCost: this.designCost,
      researchCost: this.researchCost,
      directEngineeringCost: this.directEngineeringCost,
      generalCost: this.generalCost,
      riskProfit: this.riskProfit,
      indirectEngineeringCosts: this.indirectEngineeringCosts,
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
    bouwKostenGrondWerk: ConstructionCostGroundWork = new ConstructionCostGroundWork();
    engineeringKosten: EngineeringCost = new EngineeringCost();
    overigeBijkomendeKosten: OtherCosts = new OtherCosts();
    vastgoedKosten: RealEstateCosts = new RealEstateCosts();
    risicoreservering: number = 0;

    // Converts the model into the API-ready nested dictionary
    toDict(): Record<string, any> {
        return {
            "Directe kosten grondwerk": this.directCostGroundWork.toDict(),
            "Bouwkosten - grondwerk": this.bouwKostenGrondWerk.toDict(),
            "Engineeringkosten": this.engineeringKosten.toDict(),
            "Overige bijkomende kosten": this.overigeBijkomendeKosten.toDict(),
            "Risicoreservering": this.risicoreservering,
            "Vastgoedkosten": this.vastgoedKosten.toDict(),
        }
    }
}
