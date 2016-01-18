/* globals define */
define([
    'underscore',
    'jquery',
    'backbone',
    'models/NavBarModel',
    'models/GoogleMapModel',
    'webix'
], function (_,
             $,
             Backbone,
             NavBarModel,
             GoogleMapModel) {
    'use strict';

    return Backbone.View.extend({

        initialize: function (options) {
            this.el = options.el;
        },

        render: function () {
            // Render Webix layout

            var navBarModel = new NavBarModel();
            webix.protoUI(navBarModel.getWebixModel(), webix.ui.template);

            var googleMapModel = new GoogleMapModel();
            webix.protoUI(googleMapModel.getWebixModel(), webix.ui.view);

            webix.skin.air.layoutPadding.space = 12;
            webix.skin.air.layoutMargin.space = 12;

            var economic_chart = {
                id: "economic",
                view: "chart",
                type: "bar",
                value: "#sales#",
                color: "#37d67a",
                barWidth: 60,
                radius: 0,

                xAxis: {
                    title: "Sales per year",
                    template: "#year#"
                },
                yAxis: {
                    title: "Sales,million"
                }
            };
            var cities_table = {
                id: "cities",
                view: "datatable",
                columns: [
                    {map: "#cell[0]#", header: "City name", sort: "string", fillspace: true},
                    {map: "#cell[1]#", header: "Population", sort: "int", width: 100, css: "number"},
                    {map: "#cell[2]#", header: "C(n)", sort: "int", width: 50, css: "number"},
                    {map: "#cell[3]#", header: "R(n)", sort: "int", width: 50, css: "number"}
                ],

                select: "cell", multiselect: true,
                blockselect: true, clipboard: "copy",
                scrollX: false
            };
            var countries_table = {
                id: "countries",
                view: "list",
                template: "html->data_template",

                url: "./common/places.xml?4",
                datatype: "xml",
                defaultData: {dsc: ""},

                select: true,
                on: {"onafterselect": country_selected},
                type: {height: 84},
                ready: function () {  //select USA
                    this.select(6);
                }
            };

            var tabbar = {
                view: 'tabview', gravity: 3,
                tabbar: {
                    optionWidth: 150, value: 'map', options: [
                        {value: 'Map', id: 'map'},
                        {value: 'Cities', id: 'cities'},
                        {value: 'Economic', id: 'economic'}
                    ]
                },
                cells: [
                    {id: "map", view: "google-map"},
                    cities_table,
                    economic_chart
                ]
            };

            webix.ready(function () {

                var appui = {
                    type: "space", cols: [
                        {
                            width: 400, css: "bigHeader",
                            header: "Countries", headerHeight: 45,
                            body: countries_table
                        },
                        {view: "resizer"},
                        {
                            margin: 10, rows: [
                            tabbar,
                            {
                                header: "Description",
                                gravity: 2,
                                body: {
                                    id: "dsc",
                                    template: "#dsc#",
                                    scroll: "y"
                                }
                            }]
                        }
                    ]
                };

                webix.ui({
                    rows: [
                        {view: "navbar", value: "geo"},
                        appui
                    ]
                });

                $$("dsc").bind($$('countries'));
            });


            /*! item in list selected*/
            function country_selected(id) {
                var item = $$("countries").getItem(id);
                //show position on map
                show_position(item.lat, item.lng, parseInt(item.zoom));

                //load new data in chart
                $$('economic').clearAll();
                $$('economic').parse(item.chart, "xml");

                //load new data in list
                $$('cities').clearAll();
                $$('cities').parse(item.cities, "legacy");
            }

            function show_position(lat, lng, zoom) {
                if (window.google) { //google api is ready
                    var myLatlng = new google.maps.LatLng(lat, lng);
                    $$('map').map.setOptions({
                        zoom: zoom,
                        center: myLatlng,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    });
                }
            }

        }

    });
});
