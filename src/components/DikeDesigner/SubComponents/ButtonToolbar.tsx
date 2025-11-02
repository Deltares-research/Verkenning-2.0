import AdsClickIcon from '@mui/icons-material/AdsClick';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import {
  Box,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import React, { useState } from "react";

import { locateDwpProfile, clearDwpProfile, setDwpLocation } from "../Functions/DesignFunctions";

interface ButtonToolbarProps {
  model: any;
  handleToggleLengthSlider: () => void;
}

const ButtonToolbar: React.FC<ButtonToolbarProps> = ({
  model,
  handleToggleLengthSlider,
}) => {
  const [dwpLocationAnchorEl, setDwpLocationAnchorEl] = useState<null | HTMLElement>(null);
  const dwpLocationOpen = Boolean(dwpLocationAnchorEl);
  
  const [rivierzijdeAnchorEl, setRivierzijdeAnchorEl] = useState<null | HTMLElement>(null);
  const rivierzijdeOpen = Boolean(rivierzijdeAnchorEl);

  const handleDwpLocationMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDwpLocationAnchorEl(event.currentTarget);
  };

  const handleDwpLocationMenuClose = () => {
    setDwpLocationAnchorEl(null);
  };

  const handleDwpLocationSelect = (location: string) => {
    model.selectedDwpLocation = location;
    setDwpLocation(model);
    handleDwpLocationMenuClose();
  };

  const handleRivierzijdeMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setRivierzijdeAnchorEl(event.currentTarget);
  };

  const handleRivierzijdeMenuClose = () => {
    setRivierzijdeAnchorEl(null);
  };

  const handleRivierzijdeSelect = (value: 'rechts' | 'links') => {
    model.rivierzijde = value;
    handleRivierzijdeMenuClose();

    model.messages.commands.ui.displayNotification.execute({
      title: "Rivierzijde gewijzigd",
      message: `Rivierzijde ingesteld op: ${value}`,
      type: "info",
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        gap: 1,
        p: 1,
        backgroundColor: "#fafafa",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        position: 'relative',
        overflowX: 'auto',
        scrollbarWidth: 'thin'
      }}
    >
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Button
          variant="contained"
          size="medium"
          startIcon={<AdsClickIcon />}
          color="primary"
          onClick={() => locateDwpProfile(model)}
          disabled={model.graphicsLayerLine?.graphics?.length === 0}
        >
          Genereer dwarsprofiel
        </Button>

        <Button
          variant="outlined"
          size="medium"
          onClick={handleToggleLengthSlider}
          sx={{ minWidth: '160px' }}
        >
          DWP-lengte: {model.crossSectionLength}m
        </Button>

        <Button
          variant="contained"
          size="medium"
          startIcon={<ControlPointIcon />}
          color={model.isPlacingDwpProfile ? "secondary" : "primary"}
          onClick={() => {
            model.isPlacingDwpProfile = !model.isPlacingDwpProfile;
          }}
          disabled={model.graphicsLayerLine?.graphics?.length === 0 || !model.chartDataElevation?.length}
        >
          Teken profielpunten {model.isPlacingDwpProfile ? "(Actief)" : ""}
        </Button>

        <Button
          variant="contained"
          size="medium"
          startIcon={<RemoveCircleOutlineIcon />}
          color="primary"
          onClick={() => clearDwpProfile(model)}
          disabled={model.chartData?.length === 0}
        >
          Verwijder profielpunten
        </Button>

        <Button
          variant="contained"
          size="large"
          onClick={handleDwpLocationMenuClick}
          color="secondary"
          disabled={!model.selectingDwpLocation}
        >
          Locatie: {model.selectedDwpLocation ? model.selectedDwpLocation.replace(/_/g, ' ') : 'Selecteer...'}
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={handleRivierzijdeMenuClick}
        >
          Rivierzijde: {model.rivierzijde || 'rechts'}
        </Button>
      </Box>

      {/* DWP Location Menu */}
      <Menu
        anchorEl={dwpLocationAnchorEl}
        open={dwpLocationOpen}
        onClose={handleDwpLocationMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          sx: { minWidth: dwpLocationAnchorEl?.offsetWidth || 'auto' }
        }}
      >
        {model.dwpLocations.map((location) => (
          <MenuItem key={location} onClick={() => handleDwpLocationSelect(location as string)}>
            {location.replace(/_/g, ' ')}
          </MenuItem>
        ))}
      </Menu>

      {/* Rivierzijde Menu */}
      <Menu
        anchorEl={rivierzijdeAnchorEl}
        open={rivierzijdeOpen}
        onClose={handleRivierzijdeMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          sx: { minWidth: rivierzijdeAnchorEl?.offsetWidth || 'auto' }
        }}
      >
        <MenuItem onClick={() => handleRivierzijdeSelect('rechts')}>Rechts</MenuItem>
        <MenuItem onClick={() => handleRivierzijdeSelect('links')}>Links</MenuItem>
      </Menu>
    </Box>
  );
};

export default ButtonToolbar;
