import type { ProjectJSON } from "../../Functions/SaveProjectFunctions";

export interface DesignSnapshot {
    id: string;
    name: string;
    timestamp: string;
    projectJSON: ProjectJSON;
    recalculated?: boolean; // Flag to track if this snapshot has been recalculated in current session
}

export const createSnapshot = (projectData: ProjectJSON, recalculated: boolean = false): DesignSnapshot => {
    const designName = projectData.metadata.vak && projectData.metadata.alternatief
        ? `${projectData.metadata.vak} - ${projectData.metadata.alternatief}`
        : `Design ${Date.now()}`;

    return {
        id: Date.now().toString(),
        name: designName,
        timestamp: new Date().toLocaleString("nl-NL"),
        projectJSON: projectData,
        recalculated,
    };
};
