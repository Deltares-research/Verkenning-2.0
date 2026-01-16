import ClearIcon from "@mui/icons-material/Clear";
import TouchAppIcon from "@mui/icons-material/TouchApp";

import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import FormLabel from "@vertigis/web/ui/FormLabel";
import FormControl from "@vertigis/web/ui/FormControl";
import Select from "@vertigis/web/ui/Select";
import MenuItem from "@vertigis/web/ui/MenuItem";
import TextField from "@vertigis/web/ui/Input";
import Divider from "@vertigis/web/ui/Divider";
import Checkbox from "@vertigis/web/ui/Checkbox";
import FormControlLabel from "@vertigis/web/ui/FormControlLabel";

import React from "react";

import { stackStyle } from "../../../styles";
import { useWatchAndRerender } from "@vertigis/web/ui";

interface ConstructionPanelProps {
    model: any;
}

const ConstructionPanel: React.FC<ConstructionPanelProps> = ({ model }) => {
    
    useWatchAndRerender(model, "constructionModel");
    useWatchAndRerender(model.constructionModel, "drawnConstructionLine");
    useWatchAndRerender(model.constructionModel, "selectedLine");
    useWatchAndRerender(model.constructionModel, "structureType");
    useWatchAndRerender(model.constructionModel, "depth");
    useWatchAndRerender(model.constructionModel, "useOffset");
    useWatchAndRerender(model.constructionModel, "offsetDistance");
    useWatchAndRerender(model.constructionModel, "offsetSide");
    useWatchAndRerender(model, "loading");

    const handleSelectLine = () => {
        // Enable click mode to select any line from the map
        model.constructionModel.selectLineFromMap();
    };

    const handleCreateConstruction = () => {
        // Create construction from selected line with current parameters
        model.constructionModel.createConstruction();
    };

    const handleClearLine = () => {
        model.constructionModel.clearLine();
    };

    const hasConstructionLine = model.constructionModel.drawnConstructionLine != null;
    const hasSelectedLine = model.constructionModel.selectedLine != null;

    return (
        <Stack spacing={1}>
            <Stack spacing={1.5} sx={stackStyle}>
                <FormLabel>Stap 1: Selecteer lijn op de kaart</FormLabel>
                
                <Button
                    color="primary"
                    onClick={handleSelectLine}
                    startIcon={<TouchAppIcon />}
                    variant="contained"
                    fullWidth
                >
                    Selecteer lijn op de kaart
                </Button>
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

                <FormControl fullWidth>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={model.constructionModel.useOffset}
                                onChange={(e) => model.constructionModel.useOffset = e.target.checked}
                            />
                        }
                        label="Gebruik offset"
                    />
                </FormControl>

                {model.constructionModel.useOffset && (
                    <>
                        <FormControl fullWidth>
                            <FormLabel>Offset afstand (m)</FormLabel>
                            <TextField
                                type="number"
                                value={model.constructionModel.offsetDistance}
                                onChange={(e) => model.constructionModel.offsetDistance = parseFloat(e.target.value)}
                                fullWidth
                                inputProps={{ step: 0.5, min: 0 }}
                            />
                        </FormControl>

                        <FormControl fullWidth>
                            <FormLabel>Offset zijde</FormLabel>
                            <Select
                                value={model.constructionModel.offsetSide}
                                onChange={(e) => model.constructionModel.offsetSide = e.target.value as 'left' | 'right'}
                            >
                                <MenuItem value="left">Links</MenuItem>
                                <MenuItem value="right">Rechts</MenuItem>
                            </Select>
                        </FormControl>
                    </>
                )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5} sx={stackStyle}>
                <FormLabel>Stap 3: Maak constructie</FormLabel>
                
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <Button
                        disabled={!hasSelectedLine}
                        color="primary"
                        onClick={handleCreateConstruction}
                        variant="contained"
                        size="medium"
                        sx={{ flex: 1 }}
                    >
                        Maak constructie
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
        </Stack>
    );
};

export default ConstructionPanel;
