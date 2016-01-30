/* globals define */
define([
    'underscore',
    'jquery',
    'backbone',
    'models/GoogleMapModel',
    'utils/dateUtil',
    'webix'
], function (_,
             $,
             Backbone,
             GoogleMapModel) {
    'use strict';

    return Backbone.View.extend({

        devicesPanel: {
            header: "Devices & Settings",
            body: {
                rows: [
                    {
                        view: "form",
                        id: "deviceAddForm",
                        width: 300,
                        elements: [
                            {
                                cols: [
                                    { view: "text", placeholder: "Thing ID", name: "thingId" },
                                    { view: "text", type: "text", placeholder: "Item Key", name:"itemKey" },
                                    { view: "button", value: "Add", name: "addButton", type: "form", width: 80 }
                                ]
                            }
                        ],
                        rules: {
                            "thingId": webix.rules.isNotEmpty,
                            "itemKey": webix.rules.isNotEmpty
                        }
                    },
                    {
                        id: "deviceList",
                        view: "list",
                        template: "#thingId# - #itemKey#",
                        data: [],
                        yCount: 3,
                        autoheight: true
                    }
                ]
            }
        },

        coordinatePanel: {
            header: "Coordinates",
            body: {
                rows: [
                    {
                        view: "form",
                        id: "filterForm",
                        elements: [
                            {
                                cols: [
                                    { view: "datepicker", label: 'Start Time', timepicker: true },
                                    { view: "datepicker", label: 'End Time', timepicker: true },
                                    { view: "button", value: "Filter", name: "filterButton", type: "form" }
                                ]
                            }
                        ]
                    },
                    {
                        id: "coordinates",
                        view: "datatable",
                        columns: [],
                        select: "row",
                        multiselect: true,
                        clipboard: "copy",
                        scrollX: false
                    }
                ]
            }
        },

        googleMap: {
            id: "map",
            view: "google-map",
            zoom: 15
        },

        render: function () {
            // Custom Webix View
            // TODO: Dodgy way of including it :/
            var googleMapModel = new GoogleMapModel();
            webix.protoUI(googleMapModel.getWebixModel(), webix.ui.view);

            // Render Webix layout
            webix.ui({
                type: "wide",
                rows: [
                    this.googleMap,
                    { view: "resizer" },
                    {
                        height: 300,
                        cols: [
                            this.devicesPanel,
                            this.coordinatePanel
                        ]
                    }
                ]
            });

            this.updateView();

            $$("deviceAddForm").elements["addButton"].attachEvent("onItemClick", function () {
            }.bind(this));
        },

        updateView: function () {
            var form = $$("deviceAddForm");

            // Form validation
            //if (!form.validate()) {
            //    webix.message("Neither form values can't be empty");
            //    return;
            //}

            // Try to load data via Thingosity API
            var formValues = form.getValues();
            var thingId = formValues.thingId;
            var itemKey = formValues.itemKey;

            var thingId = 'frank-test-1';
            var coordinateItemKey = 'coords1';

            var result = this.getData("http://localhost:1337/things/api/data/" + thingId);
            var config = this.getData("http://localhost:1337/things/api/config/" + thingId);
            if (!result || !config) {
                return;
            }

            // Add devices onto the deviceList view
            $$("deviceList").add({
                thingId: thingId,
                itemKey: coordinateItemKey
            });

            // Update points on map
            var groupedAggregatedData = this.aggregateData(this.groupData(result.data, config.data), config.data);
            var coordinateData = this.buildCoordinateData(groupedAggregatedData, coordinateItemKey);
            var tableData = this.buildTableData(groupedAggregatedData, config.data);
            var tableColumns = this.buildTableColumn(config.data);

            $$("map").loadCoordinates(coordinateData);
            $$("coordinates").refreshColumns(tableColumns);
            $$("coordinates").parse(tableData);
            $$("coordinates").attachEvent("onAfterSelect", function () {
                $$("map").showCoordinateOnMap(this.getSelectedItem(), config.data, coordinateItemKey);
            })
        },

        // @ref: http://stackoverflow.com/questions/23763996/group-by-timestamp-with-aggregation-framework-in-mongodb
        // Group by the hour
        groupData: function (result, config) {
            var groupedData = {};

            for (var itemKey in result) {
                // Also ignore thoes data that does not exists in config (??)
                if (!result.hasOwnProperty(itemKey) || !config.hasOwnProperty(itemKey)) {
                    continue;
                }
                var isCoords = config[itemKey].type === 'geolocation';
                var itemKeyData = result[itemKey].data;
                var itemKeyDataLength = isCoords ? itemKeyData.X.length : itemKeyData.length;

                for (var i = 0; i < itemKeyDataLength; i++) {
                    var timestamp,
                        datapoint;
                    if (isCoords) {
                        timestamp = itemKeyData.Y[i][0];
                        // Lat = Y Long = X
                        datapoint = {
                            lat: itemKeyData.Y[i][1],
                            lng: itemKeyData.X[i][1]
                        };
                    } else {
                        timestamp = itemKeyData[i][0];
                        datapoint = itemKeyData[i][1];
                    }
                    var groupedTimestamp = timestamp - timestamp % (1000 * 60 * 60);
                    // TODO: I don't know how to nicely do this
                    if (_.isUndefined(groupedData[groupedTimestamp])) {
                        groupedData[groupedTimestamp] = {};
                    }
                    if (_.isUndefined(groupedData[groupedTimestamp][itemKey])) {
                        groupedData[groupedTimestamp][itemKey] = [];
                    }
                    groupedData[groupedTimestamp][itemKey].push(datapoint);
                }
            }
            return groupedData
        },

        aggregateData: function (result, config) {
            var aggregatedData = {};
            for (var timestamp in result) {
                if (!result.hasOwnProperty(timestamp)) {
                    continue;
                }
                var timestampData = result[timestamp];
                for (var itemKey in timestampData) {
                    if (!timestampData.hasOwnProperty(itemKey)) {
                        continue;
                    }
                    var itemKeyData = timestampData[itemKey];
                    var itemKeyType = config[itemKey].type;
                    var aggregatedItemKeyData = this.aggregateDataByType(itemKeyData, itemKeyType);
                    if (_.isUndefined(aggregatedData[timestamp])) {
                        aggregatedData[timestamp] = {};
                    }
                    aggregatedData[timestamp][itemKey] = aggregatedItemKeyData;
                }
            }
            return aggregatedData;
        },

        aggregateDataByType: function (itemKeyData, itemKeyType) {
            if (itemKeyType === 'number' || itemKeyType === 'dimmer') {
                return this.calculateAverage(itemKeyData);
            } else if (itemKeyType === 'switch') {
                return this.calculateMedian(itemKeyData);
            } else if (itemKeyType === 'geolocation') {
                return {
                    lat: this.calculateAverage(_.pluck(itemKeyData, 'lat')),
                    lng: this.calculateAverage(_.pluck(itemKeyData, 'lng'))
                };
            }
            throw 'Item type ' + itemKeyType + ' not supported for aggregation';
        },

        calculateAverage: function (data) {
            var sum = data.reduce(function(pv, cv) { return pv + cv; }, 0);
            return sum / data.length;
        },

        // @ref https://gist.github.com/caseyjustus/1166258
        calculateMedian: function (data) {
            data.sort(function (a, b) {
                return a - b;
            });
            var half = Math.floor(data.length / 2);
            if (data.length % 2)
                return data[half];
            else
                return (data[half - 1] + data[half]) / 2.0;
        },

        getData: function (url) {
            try {
                var response = webix.ajax().sync().get(url);
                var result = JSON.parse(response.responseText);
            } catch (e) {
                webix.message(e.message);
                return false;
            }
            // Try validate the response data
            if (response.status !== 200 || _.isUndefined(result.data)) {
                webix.message("Unable to retrive data from " . url);
                return false;
            }
            return result;
        },

        buildCoordinateData: function (data, coordinateItemKey) {
            var coordinates = [];
            for (var timestamp in data) {
                if (!data.hasOwnProperty(timestamp)) {
                    continue;
                }
                var timestampData = data[timestamp][coordinateItemKey];
                // Make sure location exists
                if (!_.isUndefined(timestampData)) {
                    coordinates.push({
                        lat: timestampData.lat,
                        lng: timestampData.lng,
                        timestamp: timestamp
                    });
                }
            }
            return coordinates;
        },

        buildTableData: function (data, config) {
            var tableData = [];
            for (var timestamp in data) {
                if (!data.hasOwnProperty(timestamp)) {
                    continue;
                }
                var timestampData = data[timestamp];
                var rowData = {
                    timestamp: timestamp
                };
                for (var itemKey in timestampData) {
                    if (!timestampData.hasOwnProperty(itemKey)) {
                        continue;
                    }
                    var isCoords = config[itemKey].type === 'geolocation';
                    var itemKeyData = timestampData[itemKey];
                    if (isCoords) {
                        rowData[itemKey + 'lat'] = itemKeyData.lat;
                        rowData[itemKey + 'lng'] = itemKeyData.lng;
                    } else {
                        rowData[itemKey] = itemKeyData;
                    }
                }
                tableData.push(rowData);
            }
            return tableData;
        },

        buildTableColumn: function (config) {
            var columns = [
                {map: "#timestamp#", header: "DateTime", css: "date", fillspace: 1.3, format: function (timestamp) {
                    // TODO: Make it nicer :/
                    var newDate = new Date();
                    newDate.setTime(timestamp);
                    return newDate.toUTCString();
                }}
            ];
            _.each(config, function (element, itemKey) {
                if (element.type == 'geolocation') {
                    this.push({
                        map: "#" + itemKey + "lat#",
                        header: element.name + " (Lat)",
                        fillspace: 1, css: "number"
                    });
                    this.push({
                        map: "#" + itemKey + "lng#",
                        header: element.name + " (Lng)",
                        fillspace: 1, css: "number"
                    });
                } else {
                    this.push({
                        map: "#" + itemKey + "#",
                        header: element.name,
                        fillspace: 1, css: "number"
                    })
                }
            }, columns);
            return columns;
        }
    });
});
