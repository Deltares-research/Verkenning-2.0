import AssessmentIcon from "@mui/icons-material/Assessment";
import Stack from "@vertigis/web/ui/Stack"
import Button from "@vertigis/web/ui/Button";
import Table from "@vertigis/web/ui/Table";
import TableBody from "@vertigis/web/ui/TableBody";
import TableCell from "@vertigis/web/ui/TableCell";
import TableContainer from "@vertigis/web/ui/Box";
import TableHead from "@vertigis/web/ui/TableHead";
import TableRow from "@vertigis/web/ui/TableRow";
import Paper from "@vertigis/web/ui/Paper";
import FormLabel from "@vertigis/web/ui/FormLabel";
import { stackStyle } from "../../../styles";

import { useWatchAndRerender } from "@vertigis/web/ui";
import React from "react";

import type DikeDesignerModel from "../../DikeDesignerModel";
import { handleCostCalculation } from "../../Functions/CostFunctions";

interface CostCalculationPanelProps {
    model: DikeDesignerModel;
}

const CostCalculationPanel: React.FC<CostCalculationPanelProps> = ({
    model,

}) => {

    useWatchAndRerender(model, "ground_body_cost")
    useWatchAndRerender(model, "sheetpile_wall_cost")

    return (
        <Stack spacing={1}>
            <Stack spacing={2} sx={stackStyle}>
                <FormLabel>Kosten berekening</FormLabel>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AssessmentIcon />}
                    onClick={() => handleCostCalculation(model)}
                    fullWidth
                    disabled={!model.graphicsLayerTemp?.graphics.length || model.loading}
                >
                    Bereken kosten
                </Button>


            </Stack>


            {/* Summary Table */}
            <TableContainer component={Paper} sx={{}}>
                <Table >
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>1. Direct kosten</TableCell>
                            <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>$$</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ fontSize: "11px" }}>Grondlichaam</TableCell>
                            <TableCell sx={{ fontSize: "11px" }} align="right">{model.ground_body_cost}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontSize: "11px" }}>Constructie </TableCell>
                            <TableCell sx={{ fontSize: "11px" }} align="right">{model.sheetpile_wall_cost}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>



        </Stack>


    );
};

export default CostCalculationPanel;