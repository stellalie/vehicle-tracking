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

        initialize: function (options) {
            this.el = options.el;
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
        },

        render: function () {
            // Custom Webix View
            var googleMapModel = new GoogleMapModel();
            webix.protoUI(googleMapModel.getWebixModel(), webix.ui.view);

            // Render Webix layout
            webix.ui({
                rows: [
                    {
                        type: "wide",
                        cols: [
                            {
                                width: 500,
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
                            {
                                view: "resizer"
                            },
                            {
                                margin: 10,
                                rows: [
                                    {
                                        id: "map",
                                        view: "google-map",
                                        zoom: 15
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            // Hack data
            var result = webix.ajax().sync().get("http://localhost:1337/things/api/data/vehicle3");
            var response = JSON.parse(result.responseText);
            var coordinates = this.buildCoordinatesFromRawData(response.data.coords1.data);

            $$("coordinates").parse(coordinates);
            $$("map").loadCoordinates(coordinates);
        }

    });
});
