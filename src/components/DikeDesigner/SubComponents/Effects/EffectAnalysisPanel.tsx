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
import { getIntersectingFeatures, getIntersectingArea2dRuimtebeslag } from "../../Functions/EffectFunctions";

interface EffectAnalysisPanelProps {
    model: DikeDesignerModel;
}

const EffectAnalysisPanel: React.FC<EffectAnalysisPanelProps> = ({
    model,

}) => {

    const handleEffectAnalysis = async () => {
        await getIntersectingFeatures(model, "BAG 2D").then((result) => {
            model.intersectingPanden = result;
            console.log("Intersecting panden:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting features:", error);
        });

        await getIntersectingFeatures(model, "Bomenregister 2015").then((result) => {
            model.intersectingBomen = result;
            console.log("Intersecting bomen:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting features:", error);
        });

        await getIntersectingFeatures(model, "DKK - perceel").then((result) => {
            model.intersectingPercelen = result;
            console.log("Intersecting percelen:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting features:", error);
        });

        await getIntersectingArea2dRuimtebeslag(model, "BGT - wegdeel").then((result) => {
            model.intersectingWegdelen2dRuimtebeslag = result;
            console.log("Total 2D intersecting area:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting area:", error);
        });

        await getIntersectingArea2dRuimtebeslag(model, "BGT - wegdeel", "functie='inrit'").then((result) => {
            model.intersectingInritten2dRuimtebeslag = result;
            console.log("Total 2D intersecting area:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting area:", error);
        });

        await getIntersectingFeatures(model, "BGT - wegdeel", "functie='inrit'").then((result) => {
            model.intersectingInritten2dRuimtebeslagCount = result;
            console.log("Intersecting inritten:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting features:", error);
        });

        await getIntersectingArea2dRuimtebeslag(model, "Natura 2000").then((result) => {
            model.intersectingNatura2000 = result;
            console.log("Total Natura 2000 intersecting area:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting area:", error);
        });

        await getIntersectingArea2dRuimtebeslag(model, "Groene Ontwikkelingszone en Gelders NatuurNetwerk").then((result) => {
            model.intersectingGNN = result;
            console.log("Total GNN intersecting area:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting area:", error);
        });

    };

    useWatchAndRerender(model, "intersectingPanden")
    useWatchAndRerender(model, "intersectingBomen")
    useWatchAndRerender(model, "intersectingPercelen")
    useWatchAndRerender(model, "intersectingWegdelen2dRuimtebeslag")
    useWatchAndRerender(model, "intersectingInritten2dRuimtebeslag")
    useWatchAndRerender(model, "intersectingInritten2dRuimtebeslagCount")
    useWatchAndRerender(model, "intersectingNatura2000")
    useWatchAndRerender(model, "intersectingGNN")


    return (
        <Stack spacing={1}>
            <Stack spacing={2} sx={stackStyle}>
                <FormLabel>Effectenanalyse</FormLabel>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AssessmentIcon />}
                    onClick={handleEffectAnalysis}
                    fullWidth
                    disabled={!model.graphicsLayerTemp?.graphics.length}
                >
                    Voer effectenanalyse uit
                </Button>

                {/* Summary Table */}
                <TableContainer component={Paper} sx={{}}>
                    <Table >
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>Onderdeel</TableCell>
                                <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>Waarde</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>BAG panden [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPanden?.length}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Bomen [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingBomen?.length}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Percelen [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPercelen?.length}</TableCell>
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
                                <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Natura 2000 [m2]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingNatura2000?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>GNN [m2]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingGNN?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Beheertypen</TableCell>
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
                                <TableCell sx={{ fontSize: "11px" }}>BGT wegdelen (m2)</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingWegdelen2dRuimtebeslag?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>BGT afritten (m2)</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingInritten2dRuimtebeslag?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>BGT afritten (aantal)</TableCell>
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