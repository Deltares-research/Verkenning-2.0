# Afwegen (Comparison) Panel

## Overview
The Afwegen (Comparison) panel allows users to create snapshots of design alternatives and compare them side-by-side. This enables data-driven decision making when evaluating different dike design solutions.

## Features

### 1. **Snapshot Capture**
- Capture the current design state with one click
- Automatically records all relevant metrics from:
  - Design values (volume, area, length)
  - Costs (direct, indirect, complexity)
  - Effects (intersecting features, environmental impact)
  - Constructions (type, depth, count)
- Snapshots include timestamp for version tracking

### 2. **Import Multiple Saved Designs**
- Load previously saved design files (JSON format) from SaveProjectFunctions
- **Upload Nieuw Alternatief** button allows adding multiple design alternatives
- Each import automatically parses design data and converts to comparison snapshot
- Build comparison sets by adding multiple saved designs
- Success/error notifications for each import

### 3. **Visual Comparison**
- **Card View**: Quick overview of each snapshot with key metrics
- **Table View**: Comprehensive side-by-side comparison organized by category:
  - 📐 Design Values
  - 💰 Costs
  - 🌍 Effects
  - 🏗️ Constructions

### 3. **Data Management**
- **Remove**: Delete individual snapshots from comparison
- **Clear All**: Remove all snapshots at once
- **Export**: Save comparison as JSON file for later review
- **Import**: Load previously saved comparisons

## Usage Guide

### Creating Snapshots
1. Design a dike alternative in the Dimensioneer panel
2. Go to the **Afwegen** tab
3. Click **📸 Snapshot Vastleggen**
4. The snapshot captures all current design parameters

### Importing Saved Designs
1. Go to the **Afwegen** tab
2. Click **📥 Upload Nieuw Alternatief**
3. Select a saved design file (JSON format)
4. The design is automatically added as a snapshot
5. Repeat step 2-4 to add more designs for comparison

### Comparing Designs
1. Create multiple snapshots from different design alternatives
2. View them in the card grid or scroll the comparison table
3. Look for key differences in:
   - Volume changes
   - Cost estimates
   - Environmental impacts
   - Construction requirements

### Exporting Results
1. Click **📤 Exporteren**
2. A JSON file downloads with all snapshot data
3. Share or archive for documentation

### Importing Comparisons
1. Click **📥 Vergelijking Importeren**
2. Select a previously saved comparison JSON file
3. Compare designs from another project session

### Workflow: Multi-Design Comparison
**Scenario**: Compare 3 different design alternatives
1. Save Design A (generates design-A.json)
2. Save Design B (generates design-B.json)
3. Save Design C (generates design-C.json)
4. Go to **Afwegen** tab
5. Click **📥 Upload Nieuw Alternatief** → Select design-A.json
6. Click **📥 Upload Nieuw Alternatief** → Select design-B.json
7. Click **📥 Upload Nieuw Alternatief** → Select design-C.json
8. View all three designs in card grid and comparison table
9. Analyze differences and select best option
10. Click **📤 Exporteren** to save comparison results

## Data Captured in Snapshots

### Design Values
- **Traject Lengte** (m): Total trajectory length
- **Volume Verschil** (m³): Excavation vs fill difference
- **Graafvolume** (m³): Excavation volume
- **Opvulvolume** (m³): Fill volume
- **Oppervlakte 2D** (m²): 2D surface area
- **Oppervlakte 3D** (m²): 3D surface area

### Costs
- **Complexiteit**: Complexity level of construction
- **Diepte** (m): Maximum construction depth
- **Totaal Direct Kosten** (€): Direct material and labor
- **Totaal Indirect Kosten** (€): Indirect costs (engineering, management)
- **Risicoreservering** (€): Risk buffer allocation

### Effects
- **Intersecterende Panden**: Building intersections
- **Intersecterende Bomen**: Tree intersections
- **Intersecterende Percelen**: Parcel intersections
- **Natura 2000**: Protected area overlap
- **GNN**: Nature value areas

### Constructions
- **Structuur Type**: Primary construction method
- **Diepte** (m): Construction depth
- **Aantal Constructies**: Number of structural elements

## Technical Implementation

### Key Components
- `ComparisonPanel.tsx`: Main React component
- `DesignSnapshot` interface: Data structure for snapshots
- Integration with `DikeDesignerModel` for real-time data

### State Management
- Local component state using React hooks
- Snapshots stored in memory during session
- Persistent export/import via JSON files

### Data Flow
```
DikeDesignerModel → Snapshot Capture → DesignSnapshot[]
                                    ↓
                            Visual Display (Cards/Table)
                                    ↓
                            Export JSON → Import JSON
```

## Use Cases

### 1. **Design Evaluation**
Compare multiple design alternatives to select the best approach based on:
- Cost efficiency
- Environmental impact
- Construction complexity

### 2. **Optimization Iteration**
Track improvements across design iterations:
- Snapshot each refined design
- Compare against baseline
- Identify best performing variant

### 3. **Stakeholder Communication**
Export comparisons for presentations:
- Share design trade-offs
- Document decision rationale
- Present cost-benefit analysis

### 4. **Project Documentation**
Maintain design comparison records:
- Archive comparison snapshots
- Track design evolution
- Support project audits

## Future Enhancements
- Database storage for persistent comparisons
- Advanced filtering and sorting
- Trend visualization (e.g., cost vs. volume charts)
- Color-coded metrics for quick identification
- Export to Excel/CSV for further analysis
- Scenario analysis with weighting factors
- Multi-project comparisons
