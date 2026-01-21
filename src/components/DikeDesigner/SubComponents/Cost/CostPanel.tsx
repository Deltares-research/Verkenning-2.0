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
import FormControl from "@vertigis/web/ui/FormControl";
import Select from "@vertigis/web/ui/Select";
import MenuItem from "@vertigis/web/ui/MenuItem";
import { stackStyle } from "../../../styles";

import { useWatchAndRerender } from "@vertigis/web/ui";
import React from "react";

import type DikeDesignerModel from "../../DikeDesignerModel";
import { handleCostCalculation } from "../../Functions/CostFunctions";
import CostPieChart from "./CostPieChart";
import CostRangeStackedBar from "./CostRangeStackedBar"; 


interface CostCalculationPanelProps {
    model: DikeDesignerModel;
}

const CostCalculationPanel: React.FC<CostCalculationPanelProps> = ({
    model,

}) => {
    useWatchAndRerender(model, "total_direct_cost")
    useWatchAndRerender(model, "preparation_cost")
    useWatchAndRerender(model, "ground_body_cost")
    useWatchAndRerender(model, "sheetpile_wall_cost")
    useWatchAndRerender(model, "engineering_cost")

    const pieData = [
    { category: "Voorbereiding", value: model.preparation_cost },
    { category: "Grondlichaam", value: model.ground_body_cost },
    { category: "Constructie", value: model.sheetpile_wall_cost },
    { category: "Engineering", value: model.engineering_cost }
    ].filter(d => d.value > 0);

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


            <FormControl fullWidth>
                <FormLabel>Complexiteit maatregel</FormLabel>
                <Select
                                    value={model.costModel.complexity}
                                    onChange={(e) => model.costModel.complexity = e.target.value as string}
                                    label="Complexiteit maatregel"
                                >
                                    {model.costModel.complexityTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                </Select>
            </FormControl>




            {/* Summary Table */}
            <TableContainer component={Paper} sx={{}}>
                <Table >
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>1. Direct kosten</TableCell>
                            <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>{model.total_direct_cost}€</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                         <TableRow>
                            <TableCell sx={{ fontSize: "11px" }}>Voorbereiding</TableCell>
                            <TableCell sx={{ fontSize: "11px" }} align="right">{model.preparation_cost}€</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontSize: "11px" }}>Grondlichaam</TableCell>
                            <TableCell sx={{ fontSize: "11px" }} align="right">{model.ground_body_cost}€</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontSize: "11px" }}>Constructie </TableCell>
                            <TableCell sx={{ fontSize: "11px" }} align="right">{model.sheetpile_wall_cost}€</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Engineering */}
            <TableContainer component={Paper} sx={{}}>
                <Table >
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>2. Engineering kosten</TableCell>
                            <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>{model.engineering_cost}€</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                         <TableRow>
                            <TableCell sx={{ fontSize: "11px" }}>Engineering kosten</TableCell>
                            <TableCell sx={{ fontSize: "11px" }} align="right">{model.engineering_cost}€</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pie Chart */}
            <Paper sx={{ height: 280, padding: 1 }}>
                <CostPieChart data={pieData} />
            </Paper>


            <CostRangeStackedBar
                preparation={model.preparation_cost || 0}
                groundBody={model.ground_body_cost || 0}
                construction={model.sheetpile_wall_cost || 0}
                engineering={model.engineering_cost || 0}
            />



        </Stack>


    );
};

export default CostCalculationPanel;