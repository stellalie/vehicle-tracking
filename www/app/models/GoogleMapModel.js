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
                name: "google-map",
                defaults: {
                    zoom: 15,
                    center: [39.5, -98.5],
                    mapType: "ROADMAP"
                },
                $init: function () {
                    this.$view.innerHTML = "<div class='thingosity_map_content' style='width:100%;height:100%'></div>";
                    this._contentobj = this.$view.firstChild;

                    this.map = null;
                    this.$ready.push(this.render);
                },
                render: function () {
                    this._initMap();
                },
                loadCoordinates: function (coordinates) {
                    var path = new google.maps.Polyline({
                        path: coordinates,
                        geodesic: true,
                        strokeColor: '#FF0000',
                        strokeOpacity: 1.0,
                        strokeWeight: 2
                    });
                    path.setMap(this.map);

                    // Center map
                    var lastCoordinate = coordinates.slice(-1)[0];
                    this.map.setCenter(lastCoordinate);
                },
                _initMap: function () {
                    var c = this.config;

                    this.map = new google.maps.Map(this._contentobj, {
                        zoom: c.zoom,
                        center: new google.maps.LatLng(c.center[0], c.center[1]),
                        mapTypeId: google.maps.MapTypeId[c.mapType]
                    });
                    webix._ldGMap = null;
                }
            };
        }

    });
});
