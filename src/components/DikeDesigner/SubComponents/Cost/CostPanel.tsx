import React from "react";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import Alert from "@vertigis/web/ui/Alert";
import FormLabel from "@vertigis/web/ui/FormLabel";
import FormControl from "@vertigis/web/ui/FormControl";
import Select from "@vertigis/web/ui/Select";
import MenuItem from "@vertigis/web/ui/MenuItem";
import { stackStyle } from "../../../styles";
import { useWatchAndRerender } from "@vertigis/web/ui";

import type DikeDesignerModel from "../../DikeDesignerModel";
import { downloadCostTableExcel, handleCostCalculation } from "../../Functions/CostFunctions";

interface CostCalculationPanelProps {
  model: DikeDesignerModel;
  onDownloadDatasets?: () => void;
}

const CostCalculationPanel: React.FC<CostCalculationPanelProps> = ({ model, onDownloadDatasets }) => {
  useWatchAndRerender(model, "effectsCalculated");
  useWatchAndRerender(model, "costsCalculated");
  useWatchAndRerender(model.costModel, "directCostGroundWork");
  useWatchAndRerender(model.costModel, "directCostStructures");
  useWatchAndRerender(model.costModel, "indirectConstructionCosts");
  useWatchAndRerender(model.costModel, "engineeringCosts");
  useWatchAndRerender(model.costModel, "otherCosts");
  useWatchAndRerender(model.costModel, "realEstateCosts");
  useWatchAndRerender(model.constructionModel, "drawnConstructionLine");

  const hasGrondlichaam = model.graphicsLayerRuimtebeslag?.graphics.length > 0;
  const hasConstructie = !!model.constructionModel?.drawnConstructionLine;

  return (
    <Stack spacing={1}>
      <Stack spacing={2} sx={stackStyle}>
        <FormLabel>Kosten berekening</FormLabel>

        {(hasGrondlichaam || hasConstructie) && (
          <Alert severity="info" sx={{ fontSize: "12px", py: 0.5 }}>
            Berekening omvat:{" "}
            {hasGrondlichaam && <strong>Grondlichaam</strong>}
            {hasGrondlichaam && hasConstructie && " + "}
            {hasConstructie && <strong>Constructie (buffer {model.constructieBufferDistance || 10}m)</strong>}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          startIcon={<AssessmentIcon />}
          onClick={async () => {
            model.costPanelVisible = true;
            await handleCostCalculation(model);
          }}
          fullWidth
          disabled={(!model.graphicsLayerRuimtebeslag?.graphics.length && !model.constructionModel?.drawnConstructionLine) || model.loading || !model.effectsCalculated}
        >
          Bereken kosten
        </Button>

        {!model.effectsCalculated && (
          <Alert severity="error" sx={{ fontSize: "13px" }}>
            Effecten moeten eerst worden berekend voordat kosten kunnen worden berekend.
          </Alert>
        )}

        {model.effectsCalculated && !model.costsCalculated && (
          <Alert severity="warning" sx={{ fontSize: "13px" }}>
            Kosten zijn nog niet berekend. Voer alstublieft de kostenberekening uit om de resultaten weer te geven.
          </Alert>
        )}
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

      <Button
        variant="outlined"
        color="primary"
        startIcon={<CloudDownloadIcon />}
        onClick={() => downloadCostTableExcel(model)}
        fullWidth
        sx={{ mt: 1 }}
        disabled={!model.costsCalculated || model.loading}
      >
        Download kostenoverzicht (Excel)
      </Button>


      <Button
          variant="outlined"
          color="primary"
          startIcon={<CloudDownloadIcon />}
          onClick={onDownloadDatasets}
          fullWidth
          sx={{ mt: 1 }}
        >
          Download kentallen (.csv)
      </Button>
    </Stack>
  );
};

export default CostCalculationPanel;
