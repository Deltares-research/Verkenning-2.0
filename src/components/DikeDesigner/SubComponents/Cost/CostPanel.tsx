import React from "react";
import AssessmentIcon from "@mui/icons-material/Assessment";

import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import FormLabel from "@vertigis/web/ui/FormLabel";
import FormControl from "@vertigis/web/ui/FormControl";
import Select from "@vertigis/web/ui/Select";
import MenuItem from "@vertigis/web/ui/MenuItem";
import { stackStyle } from "../../../styles";
import { useWatchAndRerender } from "@vertigis/web/ui";

import type DikeDesignerModel from "../../DikeDesignerModel";
import { handleCostCalculation } from "../../Functions/CostFunctions";

interface CostCalculationPanelProps {
  model: DikeDesignerModel;
}

const CostCalculationPanel: React.FC<CostCalculationPanelProps> = ({ model }) => {
  useWatchAndRerender(model.costModel, "directCostGroundWork");
  useWatchAndRerender(model.costModel, "directCostStructures");
  useWatchAndRerender(model.costModel, "bouwKostenGrondWerk");
  useWatchAndRerender(model.costModel, "engineeringKosten");
  useWatchAndRerender(model.costModel, "overigeBijkomendeKosten");
  useWatchAndRerender(model.costModel, "vastgoedKosten");

  return (
    <Stack spacing={1}>
      <Stack spacing={2} sx={stackStyle}>
        <FormLabel>Kosten berekening</FormLabel>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AssessmentIcon />}
          onClick={async () => {
            model.costPanelVisible = true;
            await handleCostCalculation(model);
          }}
          fullWidth
          disabled={!model.graphicsLayerTemp?.graphics.length || model.loading}
        >
          Bereken kosten
        </Button>
      </Stack>

      <FormControl fullWidth>
        <FormLabel>Complexiteit maatregel</FormLabel>
        <Select
          value={model.costModel.complexity}
          onChange={(e) => (model.costModel.complexity = e.target.value as string)}
          label="Complexiteit maatregel"
        >
          {model.costModel.complexityTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        color="primary"
        onClick={() => {
          model.costPanelVisible = true;
        }}
        fullWidth
        sx={{ mt: 2 }}
      >
        Toon kostenoverzicht & grafieken
      </Button>
    </Stack>
  );
};

export default CostCalculationPanel;
