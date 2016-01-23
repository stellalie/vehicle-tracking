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
            header: "Devices",
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
                        autoheight:true,
                    }
                ]
            }
        },

        coordinatePanel: {
            header: "Coordinates",
            body: {
                id: "coordinates",
                view: "datatable",
                columns: [
                    {map: "#timestamp#", header: "DateTime", css: "date", fillspace: 1.3, format: function (timestamp) {
                        // TODO: Make it nicer :/
                        var newDate = new Date();
                        newDate.setTime(timestamp);
                        return newDate.toUTCString();
                    }},
                    {map: "#lng#", header: "Latitude", fillspace: 1, css: "number"},
                    {map: "#lat#", header: "Longitude", fillspace: 1, css: "number"}
                ],
                select: "row",
                multiselect: true,
                clipboard: "copy",
                scrollX: false
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
                cols: [
                    {
                        width: 500,
                        rows: [
                            this.devicesPanel,
                            this.coordinatePanel
                        ]
                    },
                    { view: "resizer" },
                    this.googleMap
                ]
            });

            $$("deviceAddForm").elements["addButton"].attachEvent("onItemClick", function () {
                var form = $$("deviceAddForm");

                // Form validation
                if (!form.validate()) {
                    webix.message("Neither form values can't be empty");
                    return;
                }

                // Try to load data via Thingosity API
                var formValues = form.getValues();
                var thingId = formValues.thingId;
                var itemKey = formValues.itemKey;
                try {
                    var url = "http://localhost:1337/things/api/data/" + thingId + "?itemKey=" + itemKey; // TODO: configure localhost URL at config
                    var result = webix.ajax().sync().get(url);
                    var parsedResult = JSON.parse(result.responseText);
                } catch (e) {
                    webix.message(e.message);
                    return;
                }

                // Try validate the response data
                if (result.status !== 200 || _.isUndefined(parsedResult.data)) {
                    webix.message("Unable to retrive data from " . url);
                    return;
                }

                // Add devices onto the deviceList view
                $$("deviceList").add({
                    thingId: thingId,
                    itemKey: itemKey
                });

                // Update points on map
                var rawCoordinates = parsedResult.data[formValues.itemKey].data;
                this.updateMap(rawCoordinates);
            }.bind(this));
        },

        updateMap: function (rawCoordinates) {
            var coordinates = this.buildCoordinatesFromRawData(rawCoordinates);

            $$("map").loadCoordinates(coordinates);
            $$("coordinates").parse(coordinates);
            $$("coordinates").attachEvent("onAfterSelect", function (){
                $$("map").showCoordinateOnMap(this.getSelectedItem());
            })
        },

        buildCoordinatesFromRawData: function (data) {
            var timestamps = _.pluck(data.X, 0);
            var xs = _.pluck(data.X, 1);
            var ys = _.pluck(data.Y, 1);

            var coordinates = [];
            for (var i = 0; i < timestamps.length; i++) {
                // Lat = Y Long = X
                coordinates.push({
                    lat: ys[i],
                    lng: xs[i],
                    timestamp: timestamps[i]
                });
            }
            return coordinates;
        }

    });
});
