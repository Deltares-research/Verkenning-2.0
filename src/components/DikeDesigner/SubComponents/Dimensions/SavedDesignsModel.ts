import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export interface SavedDesign {
    [key: string]: any;
}

export class SavedDesignsModel {
    private designFeatureLayer3dUrl: string | undefined;
    savedDesigns: SavedDesign[] = [];
    selectedDesignIndex: number | null = null;
    isLoading: boolean = false;
    errorMessage: string = "";

    // Columns to hide from the table (case-insensitive)
    private hiddenColumns: string[] = ['objectid', 'globalid', 'SHAPE__Length', 'SHAPE__Area'];

    constructor(designFeatureLayer3dUrl?: string) {
        this.designFeatureLayer3dUrl = designFeatureLayer3dUrl;
    }

    /**
     * Set the feature layer URL
     */
    setDesignFeatureLayer3dUrl(url: string | undefined): void {
        this.designFeatureLayer3dUrl = url;
    }

    /**
     * Fetch all saved designs from the feature layer
     */
    async fetchSavedDesigns(): Promise<SavedDesign[]> {
        this.isLoading = true;
        this.errorMessage = "";
        try {
            if (!this.designFeatureLayer3dUrl) {
                throw new Error("Feature layer URL not configured");
            }

            const featureLayer = new FeatureLayer({
                url: this.designFeatureLayer3dUrl,
            });

            const query = featureLayer.createQuery();
            query.where = "1=1"; // Get all features
            query.outFields = ["*"];

            const result = await featureLayer.queryFeatures(query);
            this.savedDesigns = result.features.map((feature) => feature.attributes);
            this.selectedDesignIndex = null;
            return this.savedDesigns;
        } catch (error) {
            this.errorMessage = `Error loading saved designs: ${error instanceof Error ? error.message : String(error)}`;
            console.error(this.errorMessage);
            this.savedDesigns = [];
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Check if a column should be visible (not in hidden list)
     */
    isColumnVisible(columnName: string): boolean {
        return !this.hiddenColumns.some(
            (col) => col.toLowerCase() === columnName.toLowerCase()
        );
    }

    /**
     * Get visible column names from saved designs
     */
    getVisibleColumns(): string[] {
        if (this.savedDesigns.length === 0) {
            return [];
        }
        return Object.keys(this.savedDesigns[0]).filter((key) =>
            this.isColumnVisible(key)
        );
    }

    /**
     * Get visible data for a specific design row
     */
    getVisibleDesignData(designIndex: number): Record<string, any> {
        if (designIndex < 0 || designIndex >= this.savedDesigns.length) {
            return {};
        }

        const design = this.savedDesigns[designIndex];
        const visibleData: Record<string, any> = {};

        Object.entries(design).forEach(([key, value]) => {
            if (this.isColumnVisible(key)) {
                visibleData[key] = value;
            }
        });

        return visibleData;
    }

    /**
     * Select a design by index
     */
    selectDesign(index: number): void {
        if (index >= 0 && index < this.savedDesigns.length) {
            this.selectedDesignIndex = index;
        }
    }

    /**
     * Get the currently selected design
     */
    getSelectedDesign(): SavedDesign | null {
        if (this.selectedDesignIndex === null || this.selectedDesignIndex < 0) {
            return null;
        }
        return this.savedDesigns[this.selectedDesignIndex] || null;
    }

    /**
     * Clear selection
     */
    clearSelection(): void {
        this.selectedDesignIndex = null;
    }

    /**
     * Clear all data
     */
    clear(): void {
        this.savedDesigns = [];
        this.selectedDesignIndex = null;
        this.errorMessage = "";
    }

    /**
     * Add hidden columns (case-insensitive)
     */
    addHiddenColumns(columns: string[]): void {
        this.hiddenColumns = [
            ...new Set([
                ...this.hiddenColumns,
                ...columns.map((col) => col.toLowerCase()),
            ]),
        ];
    }

    /**
     * Replace hidden columns entirely
     */
    setHiddenColumns(columns: string[]): void {
        this.hiddenColumns = columns.map((col) => col.toLowerCase());
    }
}
