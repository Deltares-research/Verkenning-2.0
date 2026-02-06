import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";

export function initializeChart(model, activeTab, refs: { chartContainerRef; seriesRef; elevationSeriesRef; userSeriesRef }): () => void {
    if (activeTab !== 0 || !model.chartData || !refs.chartContainerRef.current) {
        console.log(activeTab, model.chartData, refs.chartContainerRef.current, "Chart not initialized");
        return
    }

    model.chartRoot = am5.Root.new(refs.chartContainerRef.current);
    const root = model.chartRoot as am5.Root;
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
            panX: false,
            panY: false,
            wheelX: "panX",
            wheelY: "zoomX",
            pinchZoomX: false,
        })
    );

    // Prevent default browser context menu on the chart container
    if (refs.chartContainerRef.current) {
        refs.chartContainerRef.current.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
        });
    }

    try {
        root._logo.dispose();
    } catch {
        // Handle error if logo is not present
    }

    const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererX.new(root, {}),
            tooltip: am5.Tooltip.new(root, {}),
        })
    );

    const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, {}),
            tooltip: am5.Tooltip.new(root, {}),
        })
    );

    const series = chart.series.push(
        am5xy.LineSeries.new(root, {
            name: "Hoogte vs Afstand",
            xAxis: xAxis as any,
            yAxis: yAxis as any,
            valueYField: "hoogte",
            valueXField: "afstand",
            tooltip: am5.Tooltip.new(root, {
                labelText: "{valueY}",
            }),
        })
    );

    series.data.setAll(model.chartData);
    refs.seriesRef.current = series

    series.strokes.template.setAll({
        strokeWidth: 2,
    });

    // Store bullet references for highlighting
    const bulletCircles = [];

    // Add draggable bullets with snapping logic
    series.bullets.push((root, series, dataItem) => {
        const circle = am5.Circle.new(root, {
            radius: 5,
            fill: root.interfaceColors.get("background"),
            stroke: series.get("fill"),
            strokeWidth: 2,
            draggable: true,
            interactive: true,
            cursorOverStyle: "pointer",
        });

        // Store reference to this bullet circle
        bulletCircles.push(circle);

        // Snap the coordinates to the nearest 0.5 meter
        const snapToGrid = (value: number, gridSize: number) => Math.round(value / gridSize) * gridSize;

        circle.events.on("click", (ev) => {
            model.selectingDwpLocation = true;

            const clickedOid = dataItem.dataContext["oid"];

            const pointIndex = model.chartData.findIndex(
                (d) => d.oid === clickedOid
            );

            // Reset all bullets to default appearance
            bulletCircles.forEach((bulletCircle) => {
                if (bulletCircle !== circle) {
                    bulletCircle.set("fill", root.interfaceColors.get("background"));
                    bulletCircle.set("stroke", series.get("fill"));
                    bulletCircle.set("strokeWidth", 2);
                    bulletCircle.set("radius", 5);
                }
            });

            // Highlight the selected bullet
            circle.set("fill", am5.color(0xff6b35)); // Orange fill
            circle.set("stroke", am5.color(0xffffff)); // White border
            circle.set("strokeWidth", 3);
            circle.set("radius", 8);

            // get location of point and set in dropdown
            const pointLocation = model.chartData[pointIndex].locatie;
            console.log("Point location:", pointLocation);
            model.selectedDwpLocation = pointLocation;
            model.selectedPointIndex = pointIndex;

            // console.log("Selected point:", model.chartData[pointIndex]);
            // console.log("Selected DWP location set to:", model.selectedDwpLocation);

        });

        // Add right-click context menu
        circle.events.on("rightclick", (ev) => {
            const clickedOid = dataItem.dataContext["oid"];
            const pointIndex = model.chartData.findIndex(
                (d) => d.oid === clickedOid
            );

            if (pointIndex === -1) return;

            // Get the click position relative to the plot container
            const point = chart.plotContainer.toLocal(ev.point);
            const chartX = point.x;
            const chartY = point.y;

            console.log("Right-click at chart position:", chartX, chartY);

            // Create amCharts-style button directly in the chart
            const deleteButton = am5.Button.new(root, {
                label: am5.Label.new(root, { 
                    text: "Verwijder profielpunt", 
                    fontSize: 12 
                }),
                x: chartX + 10,
                y: chartY - 10,
                centerX: am5.p0,
                centerY: am5.p100,
            });

            chart.plotContainer.children.push(deleteButton);

            console.log("Delete button created at:", chartX, chartY);

            deleteButton.events.on("click", () => {
                console.log("Delete button clicked for OID:", clickedOid);
                
                // Remove from chartData
                model.chartData.splice(pointIndex, 1);
                model.chartData = [...model.chartData]; // Force reactivity
                
                // Update allChartData if needed
                if (model.allChartData && model.activeSheet) {
                    model.allChartData[model.activeSheet] = [...model.chartData];
                }
                
                // Remove graphic from map
                const graphic = model.graphicsLayerProfile.graphics.items.find(g => g.attributes.oid === clickedOid);
                if (graphic) {
                    model.graphicsLayerProfile.remove(graphic);
                }
                
                // Update series data
                series.data.setAll(model.chartData);
                
                // Remove the button itself
                chart.plotContainer.children.removeValue(deleteButton);
                deleteButton.dispose();
                
                console.log(`Deleted point with OID ${clickedOid}`);
            });

            // Auto-remove button after 5 seconds or when clicking elsewhere
            const removeButton = () => {
                if (chart.plotContainer.children.contains(deleteButton)) {
                    chart.plotContainer.children.removeValue(deleteButton);
                    deleteButton.dispose();
                    console.log("Delete button removed");
                }
            };

            setTimeout(removeButton, 5000);

            // Remove on next chart interaction
            const clickHandler = () => {
                removeButton();
                chart.plotContainer.events.off("click", clickHandler);
            };
            chart.plotContainer.events.on("click", clickHandler);
        });

        circle.events.on("dragstop", () => {
            // Calculate new positions
            const newY = yAxis.positionToValue(
                yAxis.coordinateToPosition(circle.y())
            );
            const newX = xAxis.positionToValue(
                xAxis.coordinateToPosition(circle.x())
            );

            // Snap to nearest 0.5 meter grid
            const snappedX = snapToGrid(newX, 0.5);
            const snappedY = snapToGrid(newY, 0.5);

            // Update chart
            dataItem.set("valueY", snappedY);
            dataItem.set("valueX", snappedX);

            // Update model.chartData
            const index = model.chartData.findIndex(
                (d) => d.afstand === dataItem.dataContext["afstand"]
            );

            if (index !== -1) {
                model.chartData[index].hoogte = snappedY;
                model.chartData[index].afstand = snappedX;


                model.chartData = [...model.chartData]; // Force reactivity
                model.allChartData[model.activeSheet] = [...model.chartData];

                // replace point in graphics layer
                const graphic = model.graphicsLayerProfile.graphics.items.find(g => g.attributes.oid === dataItem.dataContext["oid"]);
                if (graphic) {
                    graphic.attributes.hoogte = snappedY;
                    graphic.attributes.afstand = snappedX;
                    // Optionally update geometry if needed
                    let closestPoint = model.chartDataElevation[0];
                    let minDistance = Math.abs(closestPoint.afstand - snappedX);
                    model.chartDataElevation.forEach(dataPoint => {
                        const distance = Math.abs(dataPoint.afstand - snappedX);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestPoint = dataPoint;
                        }
                    });

                    // Create the map point using the closest elevation data point
                    const cursorPoint = new Point({
                        x: closestPoint.x,
                        y: closestPoint.y,
                        spatialReference: new SpatialReference({
                            wkid: 3857
                        })
                    });
                    graphic.geometry = cursorPoint;
                }

            }
        });

        return am5.Bullet.new(root, {
            sprite: circle,
        });
    });

    const elevationSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
            name: "Hoogte vs Afstand",
            xAxis: xAxis as any,
            yAxis: yAxis as any,
            valueYField: "hoogte",
            valueXField: "afstand",
            tooltip: am5.Tooltip.new(root, {
                labelText: "Grond hoogte: {valueY}",
            }),
            stroke: am5.color(0xff9900),
        })
    );

    elevationSeries.data.setAll(model.chartDataElevation);
    refs.elevationSeriesRef.current = elevationSeries

    elevationSeries.strokes.template.setAll({
        strokeWidth: 3,
    });

    const userSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
            name: "User Drawn Line",
            xAxis: xAxis as any,
            yAxis: yAxis as any,
            valueYField: "hoogte",
            valueXField: "afstand",
            stroke: am5.color(0x800080), // purple
            tooltip: am5.Tooltip.new(root, {
                labelText: "{valueY}",
            }),
        })
    );

    // Store the userSeries reference
    refs.userSeriesRef.current = userSeries;
    model.userSeries = userSeries; // Store on model for external access

    // Initialize userLinePoints if it doesn't exist
    if (!model.userLinePoints) {
        model.userLinePoints = [];
    }

    // Set initial data for userSeries
    userSeries.data.setAll(model.userLinePoints);

    // Add bullets (markers) at each clicked point
    userSeries.bullets.push((root, series, dataItem) => (
        am5.Bullet.new(root, {
            sprite: am5.Circle.new(root, {
                radius: 6,
                fill: am5.color(0x800080), // purple fill
                stroke: am5.color(0xffffff),
                strokeWidth: 2,
            })
        })
    ));

    userSeries.strokes.template.setAll({
        stroke: am5.color(0x800080), // purple
        strokeWidth: 2,
    });

    chart.plotContainer.events.on("click", (ev) => {

        model.selectedPointIndex = null;
        model.selectedDwpLocation = null;
        model.selectingDwpLocation = false;

        // Convert pixel coordinates to axis values
        const point = chart.plotContainer.toLocal(ev.point);
        const afstand = Math.round(xAxis.positionToValue(xAxis.coordinateToPosition(point.x)) * 10) / 10; // round to one decimal
        const hoogte = Math.round(yAxis.positionToValue(yAxis.coordinateToPosition(point.y)) * 10) / 10; // round to one decimal

        if (model.isPlacingDwpProfile) {

            const newRow = {
                oid: model.chartData.length + 1,
                locatie: model.selectedDwpLocation || "",
                afstand,
                hoogte,
            };
            model.chartData = [...model.chartData, newRow];

            // Find the corresponding point on the ground profile
            if (model.chartDataElevation && model.chartDataElevation.length > 0) {
                // Find the closest point in the elevation data based on afstand
                let closestPoint = model.chartDataElevation[0];
                let minDistance = Math.abs(closestPoint.afstand - afstand);
                model.chartDataElevation.forEach(dataPoint => {
                    const distance = Math.abs(dataPoint.afstand - afstand);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPoint = dataPoint;
                    }
                });

                console.log("Found closest elevation point:", closestPoint, "Distance:", minDistance);

                // Create the map point using the closest elevation data point
                const cursorPoint = new Point({
                    x: closestPoint.x,
                    y: closestPoint.y,
                    spatialReference: new SpatialReference({
                        wkid: 3857
                    })
                });

                // Create new graphic and add to graphics layer
                const graphic = new Graphic({
                    geometry: cursorPoint,
                    symbol: model.dwpPointSymbol,
                    attributes: {
                        afstand,
                        hoogte,
                        locatie: "",
                        oid: newRow.oid
                    }
                });

                // Add to the profile graphics layer
                if (model.graphicsLayerProfile) {
                    model.graphicsLayerProfile.add(graphic);
                }

                console.log("Added graphic to map at coordinates:", cursorPoint.x, cursorPoint.y);
                console.log(model.userLinePoints, "Current user line points after adding DWP point");
                // Don't modify user series when placing profile points
            } else {
                console.warn("No cross section chart data available for point mapping");
            }
        } else if (model.isDrawingTaludlijn) {
            // Only draw taludlijn if mode is explicitly enabled
            model.userLinePoints.push({ afstand, hoogte });
            updateSlopeLabels({ model, root, chart, xAxis, yAxis });
            userSeries.data.setAll(model.userLinePoints);
        }
        // If neither mode is active, do nothing on click

    });

    chart.events.on("boundschanged", () => {
        updateSlopeLabels({ model, root, chart, xAxis, yAxis });
    });

    xAxis.on("start", () => {
        console.log("X Axis end event triggered");
        updateSlopeLabels({ model, root, chart, xAxis, yAxis });
    });

    yAxis.on("start", () => {
        updateSlopeLabels({ model, root, chart, xAxis, yAxis });
    });

    userSeries.strokes.template.setAll({
        stroke: am5.color(0x00cc00),
        strokeWidth: 2,
    });

    chart.set("cursor", am5xy.XYCursor.new(root, {}));
    let cursor = chart.get("cursor");

    cursor.events.on("cursormoved", (ev) => {
        if (elevationSeries.data.length) {
            const positionX = ev.target.getPrivate("positionX");
            const x = xAxis.toAxisPosition(positionX);
            const item = xAxis.getSeriesItem(elevationSeries, x);

            const cursorPoint = new Point({
                x: item.dataContext["x"],
                y: item.dataContext["y"],
                spatialReference: new SpatialReference({
                    wkid: 3857
                })
            })

            // console.log(cursorPoint, "Cursor point on ground profile");

            // self.activeWorkspace.tempCrossSectionData.cursorLocationLayer.graphics.items[0].geometry = cursorPoint
            model.cursorLocationLayer.graphics.items[0].geometry = cursorPoint
        }



    });


    chart.events.on("pointerover", (ev) => {
        model.cursorLocationLayer.visible = true
    });
    chart.events.on("pointerout", (ev) => {
        model.cursorLocationLayer.visible = false
    });

    return () => {
        // Clean up context menu listener on disposal
        if (refs.chartContainerRef.current) {
            refs.chartContainerRef.current.removeEventListener('contextmenu', (e: MouseEvent) => {
                e.preventDefault();
            });
        }
        root.dispose();
    };
}
export function initializeCrossSectionChart(model, crossSectionChartContainerRef, refs: { chartSeriesRef: any; meshSeriesRef: any; userSeriesRef: any }): () => void {
    const { chartSeriesRef, meshSeriesRef, userSeriesRef } = refs;

    if (!model.crossSectionChartData || !crossSectionChartContainerRef?.current) {
        console.log(model.crossSectionChartData, crossSectionChartContainerRef?.current, "Chart not initialized");
        return
    }


    model.crossSectionChartRoot = am5.Root.new(crossSectionChartContainerRef.current);
    const root = model.crossSectionChartRoot as am5.Root;
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
            panX: true,
            panY: true,
            wheelX: "panX",
            wheelY: "zoomX",
            pinchZoomX: true,
        })
    );

    try {
        root._logo.dispose();
    } catch {
        // Handle error if logo is not present
    }

    const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererX.new(root, {}),
            tooltip: am5.Tooltip.new(root, {}),
        })
    );

    const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, {}),
            tooltip: am5.Tooltip.new(root, {}),
        })
    );

    const elevationSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
            name: "Hoogte vs Afstand",
            xAxis: xAxis as any,
            yAxis: yAxis as any,
            valueYField: "hoogte",
            valueXField: "afstand",
            tooltip: am5.Tooltip.new(root, {
                labelText: "Grond hoogte: {valueY}",
            }),
            stroke: am5.color(0xff9900),
        })
    );

    elevationSeries.data.setAll(model.crossSectionChartData);
    chartSeriesRef.current = elevationSeries

    elevationSeries.strokes.template.setAll({
        strokeWidth: 3,
    });

    const meshSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
            name: "Mesh Hoogte vs Afstand",
            xAxis: xAxis as any,
            yAxis: yAxis as any,
            valueYField: "hoogte",
            valueXField: "afstand",
            tooltip: am5.Tooltip.new(root, {
                labelText: "Ontwerp hoogte: {valueY}",
            }),
            stroke: am5.color(0x888888)
        })
    );

    if (model.meshSeriesData?.length) {
        meshSeries.data.setAll(model.meshSeriesData);
        console.log(model.meshSeriesData, "Mesh series data has been set");
    }

    meshSeriesRef.current = meshSeries;
    meshSeries.strokes.template.setAll({
        strokeWidth: 3,
    });

    const userSeries = chart.series.push(
        am5xy.LineSeries.new(root, {
            name: "User Drawn Line",
            xAxis: xAxis as any,
            yAxis: yAxis as any,
            valueYField: "hoogte",
            valueXField: "afstand",
            stroke: am5.color(0x800080), // purple
            tooltip: am5.Tooltip.new(root, {
                labelText: "{valueY}",
            }),
        })
    );

    // Store the userSeries reference
    refs.userSeriesRef.current = userSeries;
    model.userSeries = userSeries; // Store on model for external access

    // Set initial data for userSeries
    model.userLinePoints = [];


    // Set initial data for userSeries
    userSeries.data.setAll(model.userLinePoints);

    // Add bullets (markers) at each clicked point
    userSeries.bullets.push((root, series, dataItem) => (
        am5.Bullet.new(root, {
            sprite: am5.Circle.new(root, {
                radius: 6,
                fill: am5.color(0x800080), // purple fill
                stroke: am5.color(0xffffff),
                strokeWidth: 2,
            })
        })
    ));

    userSeries.strokes.template.setAll({
        stroke: am5.color(0x800080), // purple
        strokeWidth: 2,
    });

    chart.plotContainer.events.on("click", (ev) => {
        // Convert pixel coordinates to axis values
        const point = chart.plotContainer.toLocal(ev.point);
        const afstand = xAxis.positionToValue(xAxis.coordinateToPosition(point.x));
        const hoogte = yAxis.positionToValue(yAxis.coordinateToPosition(point.y));

        // Add the new point to the array
        model.userLinePoints.push({ afstand, hoogte });
        // model.setUserLinePoints([...userLinePoints]); // For React state, or just update the array if not using React

        // Update the series data
        userSeries.data.setAll(model.userLinePoints);
        updateSlopeLabels({ model, root, chart, xAxis, yAxis });
    });

    chart.events.on("boundschanged", () => {
        updateSlopeLabels({ model, root, chart, xAxis, yAxis });
    });

    xAxis.on("start", () => {
        console.log("X Axis end event triggered");
        updateSlopeLabels({ model, root, chart, xAxis, yAxis });
    });

    yAxis.on("start", () => {
        updateSlopeLabels({ model, root, chart, xAxis, yAxis });
    });

    userSeries.strokes.template.setAll({
        stroke: am5.color(0x00cc00),
        strokeWidth: 2,
    });

    chart.set("cursor", am5xy.XYCursor.new(root, {}));
    let cursor = chart.get("cursor");
    cursor.events.on("cursormoved", (ev) => {
        if (elevationSeries.data.length) {
            const positionX = ev.target.getPrivate("positionX");
            const x = xAxis.toAxisPosition(positionX);
            const item = xAxis.getSeriesItem(elevationSeries, x);

            const cursorPoint = new Point({
                x: item.dataContext["x"],
                y: item.dataContext["y"],
                spatialReference: new SpatialReference({
                    wkid: 3857
                })
            })

            // console.log(cursorPoint, "Cursor point on ground profile");

            // self.activeWorkspace.tempCrossSectionData.cursorLocationLayer.graphics.items[0].geometry = cursorPoint
            model.cursorLocationLayer.graphics.items[0].geometry = cursorPoint
        }



    });


    chart.events.on("pointerover", (ev) => {
        model.cursorLocationLayer.visible = true
    });
    chart.events.on("pointerout", (ev) => {
        model.cursorLocationLayer.visible = false
    });

    return () => {
        root.dispose();
    };
}

function updateSlopeLabels(args: { model: any; root: any; chart: any; xAxis: any; yAxis: any }) {
    // Clear old labels
    args.model.slopeLabels.forEach(label => label.dispose());
    args.model.slopeLabels = [];

    const points = args.model.userLinePoints;
    if (!points || points.length < 2) return;

    for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];

        const deltaX = p2.afstand - p1.afstand;
        const deltaY = p2.hoogte - p1.hoogte;

        let slopeRatio;
        if (deltaY === 0) {
            slopeRatio = "∞";
        } else {
            slopeRatio = (Math.abs(deltaX / deltaY)).toFixed(2);
        }

        const labelText = `1:${slopeRatio}`;

        // Position label halfway between points
        const midX = (p1.afstand + p2.afstand) / 2;
        const midY = (p1.hoogte + p2.hoogte) / 2;

        console.log(midX, midY, "Midpoint coordinates for slope label");

        const label = args.chart.plotContainer.children.push(
            am5.Label.new(args.root, {
                text: labelText,
                x: args.xAxis.get("renderer").positionToCoordinate(args.xAxis.valueToPosition(midX)),
                y: args.yAxis.get("renderer").positionToCoordinate(args.yAxis.valueToPosition(midY)),
                centerX: am5.p50,
                centerY: am5.p50,
                background: am5.Rectangle.new(args.root, {
                    fill: am5.color(0xffffff),
                    fillOpacity: 0.7
                }),
                paddingLeft: 2,
                paddingRight: 2,
                paddingTop: 1,
                paddingBottom: 1,
                fontSize: 14
            })
        );
        console.log(label, "Slope label created: ", labelText)

        args.model.slopeLabels.push(label);
    }
}