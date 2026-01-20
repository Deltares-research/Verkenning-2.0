import { ModelBase, serializable } from "@vertigis/web/models";

export interface StructureAttributes {
    type: string;
    depth: number;
}

@serializable
export default class CostModel extends ModelBase {
    title: string;

    status: string;
    resultUrl: string;
    errorMessage: string;
    
    map: any;
    view: any;

    // Construction parameters
    complexityTypes: string[] = [
        "makkelijke maatregel",
        "gemiddelde maatregel",
        "moeilijke maatregel",
    ];
    complexity: string = "makkelijke maatregel";
    depth: number = 5;

}
