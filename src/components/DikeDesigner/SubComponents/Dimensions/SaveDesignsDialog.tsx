import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { Dialog } from "@mui/material";
import DialogTitle from "@vertigis/web/ui/DialogTitle";
import DialogContent from "@vertigis/web/ui/DialogContent";
import DialogActions from "@vertigis/web/ui/DialogActions";

import React, { useState } from "react";
import Box from "@vertigis/web/ui/Box";
import Button from "@vertigis/web/ui/Button";
import IconButton from "@vertigis/web/ui/IconButton";
import Input from "@vertigis/web/ui/Input";
import FormLabel from "@vertigis/web/ui/FormLabel";
import Stack from "@vertigis/web/ui/Stack";
import Alert from "@vertigis/web/ui/Alert";
import Typography from "@vertigis/web/ui/Typography";

interface SaveDesignsDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (designName: string) => Promise<void>;
    initialDesignName?: string;
}

const SaveDesignsDialog: React.FC<SaveDesignsDialogProps> = ({
    open,
    onClose,
    onSave,
    initialDesignName = "",
}) => {
    const [designName, setDesignName] = useState(initialDesignName);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setDesignName(initialDesignName);
            setError(null);
        }
    }, [open, initialDesignName]);

    const handleClose = () => {
        if (!saving) {
            setDesignName("");
            setError(null);
            onClose();
        }
    };

    const handleSave = async () => {
        if (!designName.trim()) {
            setError("Vul een ontwerp naam in");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await onSave(designName.trim());
            setDesignName("");
            onClose();
        } catch (err) {
            setError(`Fout bij opslaan: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#f3f2f1', borderBottom: '1px solid #e1dfdd' }}>
                <DialogTitle sx={{ p: 0, fontSize: '18px', fontWeight: 600, color: '#323130' }}>
                    Ontwerp opslaan
                </DialogTitle>
                <IconButton
                    onClick={handleClose}
                    disabled={saving}
                    sx={{ position: 'absolute', right: 16, top: 16 }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent sx={{ pt: 1 }}>
                <Stack spacing={2}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '14px' }}>
                        Geef uw ontwerp een naam om het op te slaan
                    </Typography>
                    
                    <Box>
                        <FormLabel sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
                            Ontwerp naam
                        </FormLabel>
                        <Input
                            value={designName}
                            onChange={(e) => setDesignName(e.target.value)}
                            placeholder="bijv. Dijk Sectie A - Versterking 2026"
                            fullWidth
                            disabled={saving}
                            autoFocus
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && designName.trim()) {
                                    handleSave();
                                }
                            }}
                            sx={{
                                fontSize: '14px',
                                '& .MuiInputBase-input': {
                                    padding: '12px 14px',
                                }
                            }}
                        />
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ fontSize: '13px' }}>
                            {error}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button 
                    onClick={handleClose}
                    disabled={saving}
                    color="inherit"
                    sx={{ fontSize: '14px', fontWeight: 500 }}
                >
                    Annuleren
                </Button>
                <Button 
                    onClick={handleSave}
                    disabled={saving || !designName.trim()}
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ 
                        fontSize: '14px', 
                        fontWeight: 600,
                        px: 3,
                        py: 1.2,
                        backgroundColor: '#0078d4',
                        '&:hover': {
                            backgroundColor: '#005a9e',
                        }
                    }}
                >
                    {saving ? "Opslaan..." : "Opslaan"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SaveDesignsDialog;
