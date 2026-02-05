import React, { useState } from "react";
import { Dialog } from "@mui/material";
import DialogTitle from "@vertigis/web/ui/DialogTitle";
import DialogContent from "@vertigis/web/ui/DialogContent";
import DialogActions from "@vertigis/web/ui/DialogActions";
import Box from "@vertigis/web/ui/Box";
import Button from "@vertigis/web/ui/Button";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Typography from "@vertigis/web/ui/Typography";
import Paper from "@vertigis/web/ui/Paper";
import IconButton from "@vertigis/web/ui/IconButton";
import CloseIcon from "@mui/icons-material/Close";

interface LoadOptionDialogProps {
    open: boolean;
    onClose: () => void;
    onLoadFull: () => void;
    onLoadAndRecalculate: () => void;
    isLoading?: boolean;
}

type LoadOption = "full" | "recalculate";

const LoadOptionDialog: React.FC<LoadOptionDialogProps> = ({
    open,
    onClose,
    onLoadFull,
    onLoadAndRecalculate,
    isLoading = false,
}) => {
    const [selectedOption, setSelectedOption] = useState<LoadOption>("full");

    const handleConfirm = () => {
        if (selectedOption === "full") {
            onLoadFull();
        } else {
            onLoadAndRecalculate();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                // Prevent closing on backdrop click or escape key
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                    return;
                }
                onClose();
            }}
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown
            PaperProps={{
                sx: {
                    borderRadius: "8px",
                },
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3, pb: 1 }}>
                <DialogTitle sx={{ p: 0, fontSize: "20px", fontWeight: 600 }}>
                    Alternatief laden
                </DialogTitle>
                <IconButton
                    onClick={onClose}
                    sx={{ position: "absolute", right: 16, top: 16 }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ pt: 2 }}>
                <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
                    Kies hoe je dit alternatief wilt laden:
                </Typography>

                <RadioGroup
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value as LoadOption)}
                >
                    <Paper
                        sx={{
                            p: 2.5,
                            mb: 2,
                            border: selectedOption === "full" ? "2px solid #1565C0" : "1px solid #e0e0e0",
                            backgroundColor: selectedOption === "full" ? "rgba(21, 101, 192, 0.05)" : "transparent",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                borderColor: "#1565C0",
                                backgroundColor: "rgba(21, 101, 192, 0.03)",
                            },
                        }}
                        onClick={() => setSelectedOption("full")}
                    >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                            <FormControlLabel
                                value="full"
                                control={<Radio />}
                                label=""
                                sx={{ mt: 0, mb: 0 }}
                            />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Alles laden
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "13px", lineHeight: 1.5 }}>
                                    Laadt alle waarden uit de JSON:
                                    <br />• Geometrieën (2D &amp; 3D)
                                    <br />• Volumes
                                    <br />• Kosten
                                    <br />• Effecten
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    <Paper
                        sx={{
                            p: 2.5,
                            border: selectedOption === "recalculate" ? "2px solid #1565C0" : "1px solid #e0e0e0",
                            backgroundColor: selectedOption === "recalculate" ? "rgba(21, 101, 192, 0.05)" : "transparent",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                borderColor: "#1565C0",
                                backgroundColor: "rgba(21, 101, 192, 0.03)",
                            },
                        }}
                        onClick={() => setSelectedOption("recalculate")}
                    >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                            <FormControlLabel
                                value="recalculate"
                                control={<Radio />}
                                label=""
                                sx={{ mt: 0, mb: 0 }}
                            />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Herberekenen
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "13px", lineHeight: 1.5 }}>
                                    Laadt alleen kostenlijn en 3D polygoon, daarna herberekent:
                                    <br />• Volumes
                                    <br />• Kosten
                                    <br />• Effecten
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </RadioGroup>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    sx={{ fontSize: "14px", fontWeight: 500 }}
                >
                    Annuleren
                </Button>
                <Button
                    onClick={handleConfirm}
                    color="primary"
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                        fontSize: "14px",
                        fontWeight: 600,
                        px: 3,
                        py: 1.2,
                    }}
                >
                    {isLoading ? "Bezig met laden..." : "Laden"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoadOptionDialog;
