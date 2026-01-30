import React from "react";
import AddIcon from "@mui/icons-material/Add";
import HistoryIcon from "@mui/icons-material/History";

import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import Paper from "@vertigis/web/ui/Paper";
import Typography from "@vertigis/web/ui/Typography";
import Box from "@vertigis/web/ui/Box";

interface HomePanelProps {
    onCreateNewDesign: () => void;
    onLoadDesign: () => void;
    designFeatureLayer3dUrl?: string;
}

const HomePanel: React.FC<HomePanelProps> = ({
    onCreateNewDesign,
    onLoadDesign,
    designFeatureLayer3dUrl,
}) => {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "calc(100vh - 200px)",
                backgroundColor: "white",
                p: 4,
            }}
        >
            <Stack spacing={2} sx={{ maxWidth: 600, width: "100%" }}>
                {/* Header */}
                <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Typography
                        sx={{
                            fontWeight: 600,
                            color: "#0078d4",
                            mb: 0.5,
                            fontSize: "20px",
                        }}
                    >
                        Dijkontwerpen
                    </Typography>
                    <Typography
                        sx={{
                            color: "#323130",
                            fontSize: "13px",
                        }}
                    >
                        Kies een optie om te beginnen
                    </Typography>
                </Box>

                {/* Action Cards */}
                <Stack spacing={2}>
                    {/* Create New Design Card */}
                    <Button
                        onClick={onCreateNewDesign}
                        fullWidth
                        variant="outlined"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: 2,
                            p: 2,
                            textTransform: "none",
                            borderColor: "#0078d4",
                            color: "#323130",
                            "&:hover": {
                                borderColor: "#0078d4",
                                backgroundColor: "#f0f6ff",
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: "#0078d4",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <AddIcon
                                sx={{
                                    fontSize: 24,
                                    color: "white",
                                }}
                            />
                        </Box>
                        <Typography
                            sx={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#323130",
                            }}
                        >
                            Nieuw ontwerp maken
                        </Typography>
                    </Button>

                    {/* Load Existing Design Card */}
                    <Button
                        onClick={onLoadDesign}
                        disabled={!designFeatureLayer3dUrl}
                        fullWidth
                        variant="outlined"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: 2,
                            p: 2,
                            textTransform: "none",
                            borderColor: "#0078d4",
                            color: "#323130",
                            "&:hover": {
                                borderColor: "#0078d4",
                                backgroundColor: "#f0f6ff",
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: "#0078d4",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <HistoryIcon
                                sx={{
                                    fontSize: 24,
                                    color: "white",
                                }}
                            />
                        </Box>
                        <Typography
                            sx={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#323130",
                            }}
                        >
                            Ontwerp laden
                        </Typography>
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};

export default HomePanel;
