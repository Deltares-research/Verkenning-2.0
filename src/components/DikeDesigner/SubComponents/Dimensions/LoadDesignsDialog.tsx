import CloseIcon from '@mui/icons-material/Close';
import { Dialog } from "@mui/material";
import DialogTitle from "@vertigis/web/ui/DialogTitle";
import DialogContent from "@vertigis/web/ui/DialogContent";
import DialogActions from "@vertigis/web/ui/DialogActions";

import React, { useState, useEffect } from "react";
import Box from "@vertigis/web/ui/Box";
import Button from "@vertigis/web/ui/Button";
import IconButton from "@vertigis/web/ui/IconButton";
import LinearProgress from "@vertigis/web/ui/LinearProgress";
import Alert from "@vertigis/web/ui/Alert";
import TableContainer from "@vertigis/web/ui/Box";
import Table from "@vertigis/web/ui/Table";
import TableBody from "@vertigis/web/ui/TableBody";
import TableRow from "@vertigis/web/ui/TableRow";
import TableCell from "@vertigis/web/ui/TableCell";
import TableHead from "@vertigis/web/ui/TableHead";
import Paper from "@vertigis/web/ui/Paper";
import Typography from "@vertigis/web/ui/Typography";

import { SavedDesignsModel } from "./SavedDesignsModel";

interface LoadDesignsDialogProps {
    open: boolean;
    onClose: () => void;
    designFeatureLayer3dUrl?: string;
    model?: any;
    onLoadDesign?: (objectId: number) => Promise<void>;
}

const LoadDesignsDialog: React.FC<LoadDesignsDialogProps> = ({
    open,
    onClose,
    designFeatureLayer3dUrl,
    model: dikeDesignerModel,
    onLoadDesign,
}) => {
    const [savedDesignsModel] = useState(() => new SavedDesignsModel(designFeatureLayer3dUrl));
    const [, setRefresh] = useState(0);

    useEffect(() => {
        if (open) {
            savedDesignsModel.fetchSavedDesigns().then(() => setRefresh(prev => prev + 1));
        }
    }, [open, savedDesignsModel]);

    const handleClose = () => {
        savedDesignsModel.clear();
        setRefresh(prev => prev + 1);
        onClose();
    };

    const handleDesignClick = (index: number) => {
        savedDesignsModel.selectDesign(index);
        setRefresh(prev => prev + 1);
    };

    const handleLoadDesign = async () => {
        const selectedDesign = savedDesignsModel.getSelectedDesign();
        if (selectedDesign) {
            try {
                // Get the ObjectID from the selected design
                const objectId = selectedDesign.OBJECTID || selectedDesign.objectid;
                if (objectId) {
                    if (onLoadDesign) {
                        await onLoadDesign(objectId);
                    }
                    handleClose();
                } else {
                    console.error("No ObjectID found in selected design");
                }
            } catch (error) {
                console.error("Error loading design:", error);
            }
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '70vh',
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <DialogTitle sx={{ p: 0, fontSize: '24px', fontWeight: 600 }}>
                    Opgeslagen ontwerpen laden
                </DialogTitle>
                <IconButton
                    onClick={handleClose}
                    sx={{ position: 'absolute', right: 16, top: 16 }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent sx={{ pt: 1 }}>
                {savedDesignsModel.isLoading ? (
                    <LinearProgress />
                ) : savedDesignsModel.savedDesigns.length === 0 ? (
                    <Alert severity="info" sx={{ fontSize: '14px' }}>Geen opgeslagen ontwerpen gevonden</Alert>
                ) : (
                    <Box>
                        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', fontSize: '14px' }}>
                            Klik op een ontwerp om het te selecteren
                        </Typography>
                        <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <Table sx={{ minWidth: 750 }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                        {savedDesignsModel.getVisibleColumns().map((key) => (
                                            <TableCell 
                                                key={key}
                                                sx={{ 
                                                    fontSize: "13px", 
                                                    fontWeight: 600,
                                                    padding: '16px',
                                                    color: '#333',
                                                    textTransform: 'capitalize',
                                                    letterSpacing: '0.5px',
                                                }}
                                            >
                                                {key}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {savedDesignsModel.savedDesigns.map((design, index) => (
                                        <TableRow 
                                            key={index}
                                            onClick={() => handleDesignClick(index)}
                                            selected={savedDesignsModel.selectedDesignIndex === index}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: '#f5f5f5',
                                                },
                                                backgroundColor: savedDesignsModel.selectedDesignIndex === index ? '#e8f5e9' : 'transparent',
                                                transition: 'background-color 0.25s ease',
                                                borderLeft: savedDesignsModel.selectedDesignIndex === index ? '4px solid #4caf50' : '4px solid transparent',
                                            }}
                                        >
                                            {Object.entries(design)
                                                .filter(([key]) => savedDesignsModel.isColumnVisible(key))
                                                .map(([key, value], cellIndex) => (
                                                    <TableCell 
                                                        key={cellIndex}
                                                        sx={{ 
                                                            fontSize: "13px",
                                                            padding: '16px',
                                                            color: '#555',
                                                        }}
                                                    >
                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button 
                    onClick={handleClose} 
                    color="inherit"
                    sx={{ fontSize: '14px', fontWeight: 500 }}
                >
                    Sluiten
                </Button>
                <Button 
                    onClick={handleLoadDesign} 
                    color="primary" 
                    variant="contained"
                    disabled={savedDesignsModel.selectedDesignIndex === null}
                    sx={{ 
                        fontSize: '14px', 
                        fontWeight: 600,
                        px: 3,
                        py: 1.2,
                    }}
                >
                    Ontwerp laden
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoadDesignsDialog;
