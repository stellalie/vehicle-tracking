/* globals define */
define([
    'underscore',
    'backbone',
    'https://maps.googleapis.com/maps/api/js?key=AIzaSyDaMxM2Kuk2Ei0Oo82StL66ve3fr826AX0',
    'webix'
], function (_, Backbone) {
    'use strict';

    return Backbone.Model.extend({

        getWebixModel: function () {
            return {
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
                            resizeColumn:true
                        }
                    ]
                }
            };
        }

    });
});
