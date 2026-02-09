import React, { useState } from "react";
import { Dialog } from "@mui/material";
import DialogTitle from "@vertigis/web/ui/DialogTitle";
import DialogContent from "@vertigis/web/ui/DialogContent";
import DialogActions from "@vertigis/web/ui/DialogActions";
import Button from "@vertigis/web/ui/Button";
import FormControl from "@vertigis/web/ui/FormControl";
import FormLabel from "@vertigis/web/ui/FormLabel";
import Select from "@vertigis/web/ui/Select";
import MenuItem from "@vertigis/web/ui/MenuItem";
import Checkbox from "@vertigis/web/ui/Checkbox";
import ListItemText from "@vertigis/web/ui/ListItemText";
import Input from "@vertigis/web/ui/Input";
import Stack from "@vertigis/web/ui/Stack";
import Alert from "@vertigis/web/ui/Alert";
import Box from "@vertigis/web/ui/Box";

interface DownloadDialogProps {
    open: boolean;
    onClose: () => void;
    onDownload: (selectedDownloads: string[], designName: string) => void;
    selectedDownloads: string[];
    setSelectedDownloads: (downloads: string[]) => void;
    downloadOptions: Array<{ value: string; label: string; disabled: boolean }>;
    initialDesignName?: string;
}

const DownloadDialog: React.FC<DownloadDialogProps> = ({
    open,
    onClose,
    onDownload,
    selectedDownloads,
    setSelectedDownloads,
    downloadOptions,
    initialDesignName = "",
}) => {
    const [designName, setDesignName] = useState(initialDesignName);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setDesignName(initialDesignName);
            setError(null);
        }
    }, [open, initialDesignName]);

    const handleDownloadChange = (event) => {
        const value = event.target.value;
        setSelectedDownloads(typeof value === 'string' ? value.split(',') : value);
    };

    const handleDownload = () => {
        if (!designName.trim()) {
            setError("Vul een ontwerp naam in");
            return;
        }
        onDownload(selectedDownloads, designName.trim());
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{ p: 2, backgroundColor: '#f3f2f1', borderBottom: '1px solid #e1dfdd' }}>
                <DialogTitle sx={{ p: 0, fontSize: '18px', fontWeight: 600, color: '#323130' }}>
                    Download bestanden
                </DialogTitle>
            </Box>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}
                    
                    <FormControl fullWidth>
                        <FormLabel sx={{ mb: 1, fontWeight: 600, fontSize: '13px', color: '#323130' }}>Ontwerp naam</FormLabel>
                        <Input
                            value={designName}
                            onChange={(e) => setDesignName(e.target.value)}
                            placeholder="Bijv. Dijkversterking 2026"
                            fullWidth
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && designName.trim() && selectedDownloads.length > 0) {
                                    handleDownload();
                                }
                            }}
                        />
                    </FormControl>

                <FormControl fullWidth size="small">
                    <FormLabel sx={{ mb: 1, fontWeight: 600, fontSize: '13px', color: '#323130' }}>Selecteer data om te downloaden</FormLabel>
                    <Select
                        multiple
                        value={selectedDownloads}
                        onChange={handleDownloadChange}
                        renderValue={(selected) => (selected as string[]).map(val => 
                            downloadOptions.find(opt => opt.value === val)?.label
                        ).join(', ')}
                    >
                        {downloadOptions.map((option) => (
                            <MenuItem 
                                key={option.value} 
                                value={option.value}
                                disabled={option.disabled}
                            >
                                <Checkbox checked={selectedDownloads.indexOf(option.value) > -1} />
                                <ListItemText primary={option.label} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ fontSize: '14px', fontWeight: 500 }}>
                    Annuleer
                </Button>
                <Button 
                    onClick={handleDownload} 
                    variant="contained"
                    disabled={selectedDownloads.length === 0 || !designName.trim()}
                    sx={{ 
                        fontSize: '14px', 
                        fontWeight: 600,
                        px: 3,
                        py: 1.2,
                        backgroundColor: '#0078d4',
                        color: '#ffffff',
                        '&:hover': {
                            backgroundColor: '#005a9e',
                        }
                    }}
                >
                    Download ({selectedDownloads.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DownloadDialog;
