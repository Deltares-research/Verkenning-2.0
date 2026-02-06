import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { Dialog } from "@mui/material";
import DialogTitle from "@vertigis/web/ui/DialogTitle";
import DialogContent from "@vertigis/web/ui/DialogContent";
import DialogActions from "@vertigis/web/ui/DialogActions";
import React, { useEffect, useState } from "react";
import Box from "@vertigis/web/ui/Box";
import Button from "@vertigis/web/ui/Button";
import IconButton from "@vertigis/web/ui/IconButton";
import Input from "@vertigis/web/ui/Input";
import FormLabel from "@vertigis/web/ui/FormLabel";
import Stack from "@vertigis/web/ui/Stack";
import Alert from "@vertigis/web/ui/Alert";
import Typography from "@vertigis/web/ui/Typography";

interface DesignNameDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (vak: string, alternatief: string) => void;
    initialVak?: string;
    initialAlternatief?: string;
    title?: string;
}

const DesignNameDialog: React.FC<DesignNameDialogProps> = ({
    open,
    onClose,
    onSave,
    initialVak = "",
    initialAlternatief = "",
    title = "Ontwerp naam instellen",
}) => {
    const [vak, setVak] = useState(initialVak);
    const [alternatief, setAlternatief] = useState(initialAlternatief);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setVak(initialVak);
            setAlternatief(initialAlternatief);
            setError(null);
        }
    }, [open, initialVak, initialAlternatief]);

    const handleSave = () => {
        const trimmedVak = vak.trim();
        const trimmedAlternatief = alternatief.trim();
        if (!trimmedVak || !trimmedAlternatief) {
            setError("Vul zowel vak als alternatief in");
            return;
        }
        onSave(trimmedVak, trimmedAlternatief);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    backgroundColor: "#f3f2f1",
                    borderBottom: "1px solid #e1dfdd",
                }}
            >
                <DialogTitle sx={{ p: 0, fontSize: "18px", fontWeight: 600, color: "#323130" }}>
                    {title}
                </DialogTitle>
                <IconButton onClick={onClose} sx={{ position: "absolute", right: 16, top: 16 }}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent sx={{ pt: 1 }}>
                <Stack spacing={2}>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "14px" }}>
                        Geef uw ontwerp een naam bestaande uit een vak en alternatief
                    </Typography>

                    <Box>
                        <FormLabel sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                            Vak
                        </FormLabel>
                        <Input
                            value={vak}
                            onChange={(e) => setVak(e.target.value)}
                            placeholder="Bijv. Vak 3"
                            fullWidth
                            autoFocus
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleSave();
                                }
                            }}
                            sx={{
                                fontSize: "14px",
                                "& .MuiInputBase-input": {
                                    padding: "12px 14px",
                                },
                            }}
                        />
                    </Box>

                    <Box>
                        <FormLabel sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                            Alternatief
                        </FormLabel>
                        <Input
                            value={alternatief}
                            onChange={(e) => setAlternatief(e.target.value)}
                            placeholder="Bijv. Variant A"
                            fullWidth
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleSave();
                                }
                            }}
                            sx={{
                                fontSize: "14px",
                                "& .MuiInputBase-input": {
                                    padding: "12px 14px",
                                },
                            }}
                        />
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ fontSize: "13px" }}>
                            {error}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ fontSize: "14px", fontWeight: 500 }}>
                    Annuleren
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!vak.trim() || !alternatief.trim()}
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                        fontSize: "14px",
                        color: "white",
                        fontWeight: 600,
                        px: 3,
                        py: 1.2,
                        backgroundColor: "#0078d4",
                        "&:hover": {
                            backgroundColor: "#005a9e",
                        },
                    }}
                >
                    Doorgaan
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DesignNameDialog;
