import React from "react";
import Box from "@vertigis/web/ui/Box";
import ComparisonAlternativesPanel from "./ComparisonAlternativesPanel";
import type DikeDesignerModel from "../../DikeDesignerModel";

interface ComparisonChartAndTablePanelProps {
    model: DikeDesignerModel;
    onLoadDesign?: () => void;
}

const ComparisonChartAndTablePanel: React.FC<ComparisonChartAndTablePanelProps> = ({ model, onLoadDesign }) => {
    return (
        <Box style={{ height: "100%", overflow: "hidden" }}>
            <ComparisonAlternativesPanel model={model} onLoadDesign={onLoadDesign} />
        </Box>
    );
};

export default ComparisonChartAndTablePanel;
