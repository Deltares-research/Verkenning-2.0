import AssessmentIcon from "@mui/icons-material/Assessment";
import Stack from "@vertigis/web/ui/Stack"
import Button from "@vertigis/web/ui/Button";
import Alert from "@vertigis/web/ui/Alert";
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
import { handleEffectAnalysis } from "../../Functions/EffectFunctions";

interface EffectAnalysisPanelProps {
    model: DikeDesignerModel;
}

const EffectAnalysisPanel: React.FC<EffectAnalysisPanelProps> = ({
    model
}) => {

    useWatchAndRerender(model, "effectsCalculated")
    useWatchAndRerender(model, "intersectingPanden")
    useWatchAndRerender(model, "intersectingPandenArea")
    useWatchAndRerender(model, "intersectingPandenBuffer")
    useWatchAndRerender(model, "intersectingPandenBufferArea")
    useWatchAndRerender(model, "intersectingBomen")
    useWatchAndRerender(model, "intersectingPercelen")
    useWatchAndRerender(model, "intersectingPercelenArea")
    useWatchAndRerender(model, "intersectingWegdelen2dRuimtebeslag")
    useWatchAndRerender(model, "intersectingInritten2dRuimtebeslag")
    useWatchAndRerender(model, "intersectingInritten2dRuimtebeslagCount")
    useWatchAndRerender(model, "intersectingNatura2000")
    useWatchAndRerender(model, "intersectingGNN")
    useWatchAndRerender(model, "intersectingBeheertypen")
    useWatchAndRerender(model, "intersectingBeheertypeArea")
    useWatchAndRerender(model, "intersectingPandenBuffer")
    useWatchAndRerender(model, "intersectingPandenBufferArea")
    useWatchAndRerender(model, "intersectingErven")
    useWatchAndRerender(model, "intersectingErvenArea")
    useWatchAndRerender(model, "loading");



    return (
        <Stack spacing={1}>
            <Stack spacing={2} sx={stackStyle}>
                <FormLabel>Effectenanalyse</FormLabel>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AssessmentIcon />}
                    onClick={() => handleEffectAnalysis(model)}
                    fullWidth
                    disabled={!model.graphicsLayerRuimtebeslag?.graphics.length}
                >
                    Voer effectenanalyse uit
                </Button>

                {!model.effectsCalculated && (
                    <Alert severity="warning" sx={{ fontSize: "13px" }}>
                        Effecten zijn nog niet berekend. Voer alstublieft de effectenanalyse uit om de resultaten weer te geven.
                    </Alert>
                )}

                {/* Summary Table */}
                <TableContainer component={Paper} sx={{}}>
                    <Table >
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>1. Wonen en leefomgeving</TableCell>
                                <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>Aantal</TableCell>
                                <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>Oppervlakte [m²]</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>BAG panden</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPanden?.length}</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPandenArea.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Invloedzone BAG panden ({model.pandenBufferDistance} m)</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPandenBuffer?.length}</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPandenBufferArea.toFixed(2)}</TableCell>
                            </TableRow>
                            {/* <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Bomen [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingBomen?.length}</TableCell>
                            </TableRow> */}
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Percelen geen eigendom Waterschap [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPercelen?.length}</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPercelenArea.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Erven [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingErven?.length}</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingErvenArea.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                
                {/* Natuur Table */}
                <TableContainer component={Paper} sx={{}}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>2. Natuur</TableCell>
                                <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>Oppervlakte [m²]</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Natura 2000 [m²]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingNatura2000?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>GNN [m²]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingGNN?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>NBP beheertype [m²]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingBeheertypeArea?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Beheertypen [naam]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingBeheertypen?.map((item) => item).join(", ")}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Verkeer Table */}
                <TableContainer component={Paper} sx={{}}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>3. Verkeer</TableCell>
                                <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>BGT wegdelen [m²]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingWegdelen2dRuimtebeslag?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>BGT afritten [m²]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingInritten2dRuimtebeslag?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>BGT afritten [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingInritten2dRuimtebeslagCount?.length}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>
        </Stack>
    );
};

export default EffectAnalysisPanel;