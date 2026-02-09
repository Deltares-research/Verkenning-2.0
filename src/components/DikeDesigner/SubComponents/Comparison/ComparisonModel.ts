import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Mesh from "@arcgis/core/geometry/Mesh";

export interface SnapshotLayerSet {
    ruimtebeslag2d?: GraphicsLayer;
    design3d?: GraphicsLayer;
    constructionLine?: GraphicsLayer;
    mesh?: GraphicsLayer;
    meshGeometry?: Mesh;
}

export interface LayerVisibilityState {
    ruimtebeslag2d: boolean;
    design3d: boolean;
    constructionLine: boolean;
    mesh: boolean;
}

export default class ComparisonModel {
    snapshotLayers: Record<string, SnapshotLayerSet> = {};
    layerVisibility: Record<string, LayerVisibilityState> = {};
}
