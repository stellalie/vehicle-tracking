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

        configForm: {
            header: "Config",
            body: {
                view: "form",
                id: "configForm",
                width: 300,
                elements: [
                    { view: "text", label: "Thing ID" },
                    { view: "text", type: "text", label: "Item Type" },
                    {
                        cols: [
                            { view: "button", value: "View", type: "form" }
                        ]
                    }
                ]
            }
        },

        coordinateTable: {
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
                            this.configForm,
                            this.coordinateTable
                        ]
                    },
                    { view: "resizer" },
                    this.googleMap
                ]
            });

            // Hack data
            // TODO: Replace this!
            var result = webix.ajax().sync().get("http://localhost:1337/things/api/data/vehicle3");
            var response = JSON.parse(result.responseText);
            var coordinates = this.buildCoordinatesFromRawData(response.data.coords1.data);

            $$("map").loadCoordinates(coordinates);

            $$("coordinates").parse(coordinates);
            $$("coordinates").attachEvent("onAfterSelect", function (){
                $$("map").showCoordinateOnMap(this.getSelectedItem());
            });

            $$("configForm").attachEvent("onChange", function () {
                // TODO: I don't know why this doesnt work!
                debugger;
            });
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
