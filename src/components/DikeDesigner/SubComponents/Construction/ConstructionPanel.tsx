import EditIcon from "@mui/icons-material/Edit";
import ClearIcon from "@mui/icons-material/Clear";
import AddLocationIcon from "@mui/icons-material/AddLocation";
import TouchAppIcon from "@mui/icons-material/TouchApp";

import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import FormLabel from "@vertigis/web/ui/FormLabel";
import FormControl from "@vertigis/web/ui/FormControl";
import Select from "@vertigis/web/ui/Select";
import MenuItem from "@vertigis/web/ui/MenuItem";
import TextField from "@vertigis/web/ui/Input";
import Divider from "@vertigis/web/ui/Divider";

import React from "react";

import { stackStyle } from "../../../styles";
import { useWatchAndRerender } from "@vertigis/web/ui";

interface ConstructionPanelProps {
    model: any;
}

const ConstructionPanel: React.FC<ConstructionPanelProps> = ({ model }) => {
    
    useWatchAndRerender(model, "constructionModel");
    useWatchAndRerender(model.constructionModel, "drawnConstructionLine");
    useWatchAndRerender(model.constructionModel, "structureType");
    useWatchAndRerender(model.constructionModel, "depth");
    useWatchAndRerender(model.constructionModel, "xLocation");

    const handleCreateLine = () => {
        model.constructionModel.startDrawingLine();
    };

    const handleClearLine = () => {
        model.constructionModel.clearLine();
    };

    const handleClickLineMethod = () => {
        // Enable click mode to select a line and assign attributes
        model.constructionModel.enableLineSelection(
            model.constructionModel.structureType, 
            model.constructionModel.depth
        );
    };

    const handleCrossSectionMethod = () => {
        // Create 2D line segment based on x-location
        model.constructionModel.createStructureAtLocation(
            model.constructionModel.xLocation, 
            model.constructionModel.structureType, 
            model.constructionModel.depth
        );
    };

    const hasConstructionLine = model.constructionModel.drawnConstructionLine != null;

    return (
        <Stack spacing={1}>
            <Stack spacing={1.5} sx={stackStyle}>
                <FormLabel>Stap 1: Constructielijn bepalen</FormLabel>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <Button
                        disabled={!model.sketchViewModel}
                        color="primary"
                        onClick={handleCreateLine}
                        startIcon={<EditIcon />}
                        variant="contained"
                        size="medium"
                        sx={{ flex: 1 }}
                    >
                        Teken lijn
                    </Button>
                    <Button
                        disabled={!hasConstructionLine}
                        color="secondary"
                        onClick={handleClearLine}
                        startIcon={<ClearIcon />}
                        variant="contained"
                        size="medium"
                        sx={{ flex: 1 }}
                    >
                        Wis lijn
                    </Button>
                </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5} sx={stackStyle}>
                <FormLabel>Stap 2: Constructie parameters</FormLabel>
                
                <FormControl fullWidth>
                    <FormLabel>Type constructie</FormLabel>
                    <Select
                        value={model.constructionModel.structureType}
                        onChange={(e) => model.constructionModel.structureType = e.target.value as string}
                        label="Type constructie"
                    >
                        {model.constructionModel.structureTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <FormLabel>Diepte t.o.v. maaiveld (m)</FormLabel>
                    <TextField
                        type="number"
                        value={model.constructionModel.depth}
                        onChange={(e) => model.constructionModel.depth = parseFloat(e.target.value)}
                        fullWidth
                        inputProps={{ step: 0.5, min: 0 }}
                    />
                </FormControl>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5} sx={stackStyle}>
                <FormLabel>Stap 3: Dimensioneren (kies een methode)</FormLabel>
                
                <Stack spacing={1}>
                    <FormLabel sx={{ fontSize: '0.875rem' }}>Methode 1: Klik op lijn</FormLabel>
                    <Button
                        disabled={!hasConstructionLine}
                        color="primary"
                        onClick={handleClickLineMethod}
                        startIcon={<TouchAppIcon />}
                        variant="contained"
                        fullWidth
                    >
                        Selecteer lijn op kaart
                    </Button>
                </Stack>

                <Stack spacing={1}>
                    <FormLabel sx={{ fontSize: '0.875rem' }}>Methode 2: Dwarsprofiel locatie</FormLabel>
                    <FormControl fullWidth>
                        <FormLabel>X-locatie (m)</FormLabel>
                        <TextField
                            type="number"
                            value={model.constructionModel.xLocation}
                            onChange={(e) => model.constructionModel.xLocation = parseFloat(e.target.value)}
                            fullWidth
                            inputProps={{ step: 1 }}
                        />
                    </FormControl>
                    <Button
                        disabled={!hasConstructionLine}
                        color="primary"
                        onClick={handleCrossSectionMethod}
                        startIcon={<AddLocationIcon />}
                        variant="contained"
                        fullWidth
                    >
                        Maak constructie op locatie
                    </Button>
                </Stack>
            </Stack>
        </Stack>
    );
};

export default ConstructionPanel;
