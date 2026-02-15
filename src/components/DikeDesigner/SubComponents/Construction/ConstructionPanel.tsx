import ClearIcon from "@mui/icons-material/Clear";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import EditIcon from "@mui/icons-material/Edit";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Tooltip from "@mui/material/Tooltip";

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

import React, { useEffect, useState } from "react";

import { stackStyle } from "../../../styles";
import { useWatchAndRerender } from "@vertigis/web/ui";

interface ConstructionPanelProps {
    model: any;
    onCreateConstruction?: () => void;
    onClearConstruction?: () => void;
}

const ConstructionPanel: React.FC<ConstructionPanelProps> = ({ model, onCreateConstruction, onClearConstruction }) => {
    
    useWatchAndRerender(model, "constructionModel");
    useWatchAndRerender(model.constructionModel, "drawnConstructionLine");
    useWatchAndRerender(model.constructionModel, "selectedLine");
    useWatchAndRerender(model.constructionModel, "structureType");
    useWatchAndRerender(model.constructionModel, "depth");
    useWatchAndRerender(model.constructionModel, "useOffset");
    useWatchAndRerender(model.constructionModel, "offsetDistance");
    useWatchAndRerender(model.constructionModel, "offsetSide");
    useWatchAndRerender(model, "loading");

    const [depthInput, setDepthInput] = useState(() => {
        const depth = model.constructionModel.depth;
        return depth === null || depth === undefined || Number.isNaN(depth) ? "" : String(depth);
    });
    const [offsetDistanceInput, setOffsetDistanceInput] = useState(() => {
        const offset = model.constructionModel.offsetDistance;
        return offset === null || offset === undefined || Number.isNaN(offset) ? "" : String(offset);
    });

    useEffect(() => {
        const depth = model.constructionModel.depth;
        setDepthInput(depth === null || depth === undefined || Number.isNaN(depth) ? "" : String(depth));
    }, [model.constructionModel.depth]);

    useEffect(() => {
        const offset = model.constructionModel.offsetDistance;
        setOffsetDistanceInput(offset === null || offset === undefined || Number.isNaN(offset) ? "" : String(offset));
    }, [model.constructionModel.offsetDistance]);

    const commitNumberInput = (rawValue: string, setter: (value: number | null) => void) => {
        const trimmed = rawValue.trim();
        if (!trimmed) {
            setter(null);
            return;
        }

        const parsed = Number.parseFloat(trimmed);
        setter(Number.isNaN(parsed) ? null : parsed);
    };

    const handleDrawLine = () => {
        // Start drawing a line directly in the construction layer
        model.constructionModel.drawLine();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            model.constructionModel.uploadGeoJSON(file);
        }
        // Reset input so the same file can be uploaded again if needed
        event.target.value = '';
    };

    const handleSelectLine = () => {
        // Enable click mode to select any line from the map
        model.constructionModel.selectLineFromMap();
    };

    const handleCreateConstruction = () => {
        // Use the callback if provided, otherwise create construction directly
        if (onCreateConstruction) {
            onCreateConstruction();
        } else {
            model.constructionModel.createConstruction();
        }
    };

    const handleClearLine = () => {
        model.constructionModel.clearLine();
        // Call callback to update chart
        if (onClearConstruction) {
            onClearConstruction();
        }
    };

    const hasConstructionLine = model.constructionModel.drawnConstructionLine != null;
    const hasSelectedLine = model.constructionModel.selectedLine != null;

    return (
        <Stack spacing={1}>
            <Stack spacing={1.5} sx={stackStyle}>
                <FormLabel>Stap 1: constructielijn bepalen (kies een van de drie)</FormLabel>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <Tooltip title="Teken lijn" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: '14px' } } }}>
                        <Button
                            disabled={!model.sketchViewModel}
                            color="primary"
                            onClick={handleDrawLine}
                            variant="contained"
                            size="large"
                            sx={{ flex: 1, height: '56px' }}
                        >
                            <EditIcon sx={{ fontSize: '28px' }} />
                        </Button>
                    </Tooltip>
                    <Tooltip title="Upload GeoJSON" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: '14px' } } }}>
                        <Button
                            color="primary"
                            onClick={() => document.getElementById('construction-geojson-upload')?.click()}
                            variant="contained"
                            disabled={!model.map}
                            size="large"
                            sx={{ flex: 1, height: '56px' }}
                        >
                            <UploadFileIcon sx={{ fontSize: '28px' }} />
                        </Button>
                    </Tooltip>
                    <Tooltip title="Selecteer uit kaart" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: '14px' } } }}>
                        <Button
                            color="primary"
                            onClick={handleSelectLine}
                            variant="contained"
                            disabled={!model.map}
                            size="large"
                            sx={{ flex: 1, height: '56px' }}
                        >
                            <TouchAppIcon sx={{ fontSize: '28px' }} />
                        </Button>
                    </Tooltip>
                </Stack>
                <input
                    id="construction-geojson-upload"
                    type="file"
                    accept=".geojson,.json"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5} sx={stackStyle}>
                <FormLabel>Stap 2: constructie parameters</FormLabel>
                
                <FormControl fullWidth>
                    <FormLabel>Type constructie</FormLabel>
                    <Select
                        value={model.constructionModel.structureType}
                        onChange={(e) => model.constructionModel.structureType = e.target.value as string}
                        displayEmpty
                    >
                        <MenuItem value="" disabled>
                            <em>Selecteer een type constructie</em>
                        </MenuItem>
                        {model.constructionModel.structureTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <FormLabel>Onderkant constructie t.o.v. NAP (m)</FormLabel>
                    <TextField
                        type="number"
                        value={depthInput}
                        onChange={(e) => setDepthInput(e.target.value)}
                        onBlur={() => commitNumberInput(depthInput, (value) => { model.constructionModel.depth = value; })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                commitNumberInput(depthInput, (value) => { model.constructionModel.depth = value; });
                            }
                        }}
                        fullWidth
                        inputProps={{ step: 0.5, min: -Infinity }}
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
                                value={offsetDistanceInput}
                                onChange={(e) => setOffsetDistanceInput(e.target.value)}
                                onBlur={() => commitNumberInput(offsetDistanceInput, (value) => { model.constructionModel.offsetDistance = value ?? 0; })}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        commitNumberInput(offsetDistanceInput, (value) => { model.constructionModel.offsetDistance = value ?? 0; });
                                    }
                                }}
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
                <FormLabel>Stap 3: maak constructie</FormLabel>
                
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <Button
                        disabled={!hasSelectedLine || !model.constructionModel.structureType || model.constructionModel.depth === null || isNaN(model.constructionModel.depth)}
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
                        Verwijder constructie
                    </Button>
                </Stack>
            </Stack>
        </Stack>
    );
};

export default ConstructionPanel;
