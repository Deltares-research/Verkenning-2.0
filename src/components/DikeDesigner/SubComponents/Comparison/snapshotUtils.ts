import type { ProjectJSON } from "../../Functions/SaveProjectFunctions";

export interface DesignSnapshot {
    id: string;
    name: string;
    timestamp: string;
    projectJSON: ProjectJSON;
}

export const createSnapshot = (projectData: ProjectJSON): DesignSnapshot => {
    const designName = projectData.metadata.vak && projectData.metadata.alternatief
        ? `${projectData.metadata.vak} - ${projectData.metadata.alternatief}`
        : `Design ${Date.now()}`;

    return {
        id: Date.now().toString(),
        name: designName,
        timestamp: new Date().toLocaleString("nl-NL"),
        projectJSON: projectData,
    };
};
