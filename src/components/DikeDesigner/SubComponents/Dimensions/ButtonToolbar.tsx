import AdsClickIcon from '@mui/icons-material/AdsClick';
import ControlPointIcon from '@mui/icons-material/ControlPoint';
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TuneIcon from '@mui/icons-material/Tune';


import Box from "@vertigis/web/ui/Box";
import Button from "@vertigis/web/ui/Button";
import Menu from "@vertigis/web/ui/Menu";
import MenuItem from "@vertigis/web/ui/MenuItem";

import React, { useState } from "react";

import { locateDwpProfile, clearDwpProfile, setDwpLocation } from "../../Functions/DesignFunctions";

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

  // Add new state for options menu
  const [optionsAnchorEl, setOptionsAnchorEl] = useState<null | HTMLElement>(null);
  const optionsOpen = Boolean(optionsAnchorEl);

  // Force re-render state
  const [, forceUpdate] = useState({});

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

  const handleOptionsMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // If taludlijn is active, toggle it off instead of opening menu
    if (model.isDrawingTaludlijn) {
      model.isDrawingTaludlijn = false;
      forceUpdate({}); // Force re-render to immediately update button state
    } else {
      setOptionsAnchorEl(event.currentTarget);
    }
  };

  const handleOptionsMenuClose = () => {
    setOptionsAnchorEl(null);
  };

  const handleOptionSelect = (option: 'taludlijn' | 'dwp_length') => {
    // Reset all drawing modes
    model.isDrawingTaludlijn = false;
    
    // Enable selected mode
    if (option === 'taludlijn') {
      model.isDrawingTaludlijn = true;
      model.isPlacingDwpProfile = false; // Deactivate teken profielpunten
      model.userLinePoints = []; // Reset points when starting new taludlijn
      model.messages.commands.ui.displayNotification.execute({
        title: "Teken taludlijn",
        message: "Klik op de grafiek om taludlijn te tekenen",
        type: "info",
      });
    } else if (option === 'dwp_length') {
      handleToggleLengthSlider();
    }
    
    handleOptionsMenuClose();
  };

  const handleTekenProfielpunten = () => {
    model.isPlacingDwpProfile = !model.isPlacingDwpProfile;
    
    if (model.isPlacingDwpProfile) {
      model.isDrawingTaludlijn = false; // Deactivate tekenen taludlijn
      model.messages.commands.ui.displayNotification.execute({
        title: "Teken profielpunten",
        message: "Klik op de grafiek om profielpunten te plaatsen",
        type: "info",
      });
    }
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
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flex: 1 }}>
        <Button
          variant="contained"
          size="medium"
          startIcon={<AdsClickIcon />}
          color="primary"
          onClick={() => locateDwpProfile(model)}
          disabled={model.graphicsLayerLine?.graphics?.length === 0}
        >
          1 Trek dwarsprofiel
        </Button>

        <Button
          variant="contained"
          size="medium"
          startIcon={<ControlPointIcon />}
          color={model.isPlacingDwpProfile ? "secondary" : "primary"}
          onClick={handleTekenProfielpunten}
          disabled={model.graphicsLayerLine?.graphics?.length === 0}
          sx={model.isPlacingDwpProfile ? {
            fontWeight: 'bold',
            boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.3)',
            '&:hover': {
              boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.4)'
            }
          } : {}}
        >
          2 Teken profielpunten
        </Button>

        <Button
          variant="contained"
          size="medium"
          startIcon={<RemoveCircleOutlineIcon />}
          color="primary"
          onClick={() => clearDwpProfile(model)}
          disabled={model.chartData?.length === 0}
        >
          3 Verwijder profielpunten
        </Button>

        <Button
          variant="contained"
          size="medium"
          startIcon={<LocationOnIcon />}
          onClick={handleDwpLocationMenuClick}
          color={model.selectingDwpLocation ? "secondary" : "primary"}
          disabled={!model.selectingDwpLocation}
          sx={model.selectingDwpLocation ? {
            fontWeight: 'bold',
            boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.3)',
            '&:hover': {
              boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.4)'
            }
          } : {}}
        >
          4 Benoem locatie: {model.selectedDwpLocation ? model.selectedDwpLocation.replace(/_/g, ' ') : 'Selecteer...'}
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Button
          variant={model.isDrawingTaludlijn ? "contained" : "outlined"}
          size="medium"
          startIcon={<TuneIcon />}
          onClick={handleOptionsMenuClick}
          color={model.isDrawingTaludlijn ? "secondary" : "primary"}
          sx={model.isDrawingTaludlijn ? {
            fontWeight: 'bold',
            boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.3)',
            '&:hover': {
              boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.4)'
            }
          } : {}}
        >
          {model.isDrawingTaludlijn ? "Tekenen taludlijn" : "Teken opties"}
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

      {/* Options Menu */}
      <Menu
        anchorEl={optionsAnchorEl}
        open={optionsOpen}
        onClose={handleOptionsMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          sx: { minWidth: optionsAnchorEl?.offsetWidth || 'auto' }
        }}
      >
        <MenuItem onClick={() => handleOptionSelect('dwp_length')}>
          DWP lengte aanpassen
        </MenuItem>
        <MenuItem onClick={() => handleOptionSelect('taludlijn')}>
          Teken taludlijn
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ButtonToolbar;
