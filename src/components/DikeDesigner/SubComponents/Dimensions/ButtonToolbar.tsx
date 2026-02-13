import AdsClickIcon from '@mui/icons-material/AdsClick';
import ChartLineIcon from "@vertigis/react-ui/icons/ChartLine";
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TuneIcon from '@mui/icons-material/Tune';
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import Tooltip from "@mui/material/Tooltip";


import Box from "@vertigis/web/ui/Box";
import Button from "@vertigis/web/ui/Button";
import Menu from "@vertigis/web/ui/Menu";
import MenuItem from "@vertigis/web/ui/MenuItem";

import React, { useState } from "react";

import { locateDwpProfile, clearDwpProfile, setDwpLocation, createCrossSection, createFreeCrossSection } from "../../Functions/DesignFunctions";

interface ButtonToolbarProps {
  model: any;
  handleToggleLengthSlider: () => void;
  handleCreateDesign: () => void;
}

const ButtonToolbar: React.FC<ButtonToolbarProps> = ({
  model,
  handleToggleLengthSlider,
  handleCreateDesign,
}) => {
  const [dwpLocationAnchorEl, setDwpLocationAnchorEl] = useState<null | HTMLElement>(null);
  const dwpLocationOpen = Boolean(dwpLocationAnchorEl);
  
  const [rivierzijdeAnchorEl, setRivierzijdeAnchorEl] = useState<null | HTMLElement>(null);
  const rivierzijdeOpen = Boolean(rivierzijdeAnchorEl);

  // Add state for trek dwarsprofiel menu
  const [trekDwpAnchorEl, setTrekDwpAnchorEl] = useState<null | HTMLElement>(null);
  const trekDwpOpen = Boolean(trekDwpAnchorEl);

  // Add new state for options menu
  const [optionsAnchorEl, setOptionsAnchorEl] = useState<null | HTMLElement>(null);
  const optionsOpen = Boolean(optionsAnchorEl);

  // Add state for profile points menu
  const [profielpuntenAnchorEl, setProfielpuntenAnchorEl] = useState<null | HTMLElement>(null);
  const profielpuntenOpen = Boolean(profielpuntenAnchorEl);

  // Force re-render state
  const [, forceUpdate] = useState({});
  
  const hasReferenceLine = Boolean(model.graphicsLayerLine?.graphics.length);

  const handleDwpLocationMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setDwpLocationAnchorEl(event.currentTarget);
  };

  const handleDwpLocationMenuClose = () => {
    setDwpLocationAnchorEl(null);
  };

  const handleTrekDwpMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setTrekDwpAnchorEl(event.currentTarget);
  };

  const handleTrekDwpMenuClose = () => {
    setTrekDwpAnchorEl(null);
  };

  const handleTrekDwpSelect = (option: 'teken' | 'vrije_lijn' | 'lengte_aanpassen') => {
    if (option === 'teken') {
      locateDwpProfile(model);
    } else if (option === 'vrije_lijn') {
      // Clean up previous graphics
      model.graphicsLayerPoint.removeAll();
      model.graphicsLayerCrossSection.removeAll();
      
      // Create free cross section (user draws any line they want)
      createFreeCrossSection(model);
    } else if (option === 'lengte_aanpassen') {
      handleToggleLengthSlider();
    }
    handleTrekDwpMenuClose();
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

  const handleOptionSelect = (option: 'taludlijn' | 'clear_taludlijn') => {
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
        disableTimetouts: true
      });
    } else if (option === 'clear_taludlijn') {
      model.userLinePoints = [];
      // Update the series data if available
      if (model.userSeries) {
        model.userSeries.data.setAll([]);
      }
      // Remove slope labels
      if (model.slopeLabels) {
        model.slopeLabels.forEach(label => label.dispose());
        model.slopeLabels = [];
      }
      model.messages.commands.ui.displayNotification.execute({
        title: "Taludlijn verwijderd",
        message: "De taludlijn is succesvol verwijderd",
        type: "success",
      });
    }
    
    handleOptionsMenuClose();
  };

  const handleProfielpuntenMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // If placing profile is active, toggle it off instead of opening menu
    if (model.isPlacingDwpProfile) {
      model.isPlacingDwpProfile = false;
      forceUpdate({}); // Force re-render to immediately update button state
    } else {
      setProfielpuntenAnchorEl(event.currentTarget);
    }
  };

  const handleProfielpuntenMenuClose = () => {
    setProfielpuntenAnchorEl(null);
  };

  const handleProfielpuntenSelect = (option: 'teken' | 'verwijder') => {
    if (option === 'teken') {
      model.isPlacingDwpProfile = true;
      model.isDrawingTaludlijn = false; // Deactivate tekenen taludlijn
      model.messages.commands.ui.displayNotification.execute({
        title: "Teken profielpunten",
        message: "Klik op de grafiek om profielpunten te plaatsen",
        type: "info",
        disableTimetouts: true
      });
    } else if (option === 'verwijder') {
      clearDwpProfile(model);
    }
    
    handleProfielpuntenMenuClose();
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
        <Tooltip title="Trek dwarsprofiel" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: '14px' } } }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleTrekDwpMenuClick}
            disabled={model.graphicsLayerLine?.graphics?.length === 0}
            sx={{ height: '40px' }}
          >
            <ChartLineIcon />
          </Button>
        </Tooltip>

        <Tooltip title={model.isPlacingDwpProfile ? "Profiel punten plaatsen..." : "Profielpunten"} placement="bottom" slotProps={{ tooltip: { sx: { fontSize: '14px' } } }}>
          <Button
            variant={model.isPlacingDwpProfile ? "contained" : "outlined"}
            size="large"
            onClick={handleProfielpuntenMenuClick}
            color={model.isPlacingDwpProfile ? "secondary" : "primary"}
            disabled={model.graphicsLayerLine?.graphics?.length === 0}
            sx={{
              height: '40px',
              ...(model.isPlacingDwpProfile ? {
                fontWeight: 'bold',
                boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.3)',
                '&:hover': {
                  boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.4)'
                }
              } : {})
            }}
          >
            <EditIcon />
          </Button>
        </Tooltip>

        <Tooltip title="Benoem locatie" placement="bottom" slotProps={{ tooltip: { sx: { fontSize: '14px' } } }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleDwpLocationMenuClick}
            color={model.selectingDwpLocation ? "secondary" : "primary"}
            disabled={!model.selectingDwpLocation}
            sx={{
              height: '40px',
              ...(model.selectingDwpLocation ? {
                fontWeight: 'bold',
                boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.3)',
                '&:hover': {
                  boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.4)'
                }
              } : {})
            }}
          >
            <LocationOnIcon />
          </Button>
        </Tooltip>

        <Button
          variant="contained"
          size="large"
          startIcon={<PlayCircleFilledWhiteIcon />}
          color="primary"
          onClick={handleCreateDesign}
          disabled={!hasReferenceLine || !model.chartData?.length}
          sx={{ height: '40px' }}
        >
          Opbouwen in 3D
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Tooltip title={model.isDrawingTaludlijn ? "Tekenen taludlijn actief" : "Teken opties"} placement="bottom" slotProps={{ tooltip: { sx: { fontSize: '14px' } } }}>
          <Button
            variant={model.isDrawingTaludlijn ? "contained" : "outlined"}
            size="large"
            onClick={handleOptionsMenuClick}
            color={model.isDrawingTaludlijn ? "secondary" : "primary"}
            sx={{
              height: '40px',
              ...(model.isDrawingTaludlijn ? {
                fontWeight: 'bold',
                boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.3)',
                '&:hover': {
                  boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.4)'
                }
              } : {})
            }}
          >
            <TuneIcon />
          </Button>
        </Tooltip>
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

      {/* Trek Dwarsprofiel Menu */}
      <Menu
        anchorEl={trekDwpAnchorEl}
        open={trekDwpOpen}
        onClose={handleTrekDwpMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          sx: { minWidth: trekDwpAnchorEl?.offsetWidth || 'auto' }
        }}
      >
        <MenuItem onClick={() => handleTrekDwpSelect('teken')}>
          Teken dwarsprofiel (loodrecht)
        </MenuItem>
        <MenuItem onClick={() => handleTrekDwpSelect('lengte_aanpassen')}>
          Dwarsprofiel lengte aanpassen
        </MenuItem>
        <MenuItem onClick={() => handleTrekDwpSelect('vrije_lijn')}>
          Teken vrije lijn
        </MenuItem>
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

      {/* Profile Points Menu */}
      <Menu
        anchorEl={profielpuntenAnchorEl}
        open={profielpuntenOpen}
        onClose={handleProfielpuntenMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          sx: { minWidth: profielpuntenAnchorEl?.offsetWidth || 'auto' }
        }}
      >
        <MenuItem onClick={() => handleProfielpuntenSelect('teken')}>
          Teken profielpunten
        </MenuItem>
        <MenuItem 
          onClick={() => handleProfielpuntenSelect('verwijder')}
          disabled={model.chartData?.length === 0}
        >
          Verwijder profielpunten
        </MenuItem>
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
        <MenuItem onClick={() => handleOptionSelect('taludlijn')}>
          Teken taludlijn
        </MenuItem>
        <MenuItem 
          onClick={() => handleOptionSelect('clear_taludlijn')}
          disabled={!model.userLinePoints || model.userLinePoints.length === 0}
        >
          Verwijder taludlijn
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ButtonToolbar;
