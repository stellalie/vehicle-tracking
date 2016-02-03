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
                header: "Devices & Settings",
                collapsed: true,
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
            };
        }

    });
});
