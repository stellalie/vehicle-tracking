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
                markers : {},

                $init: function () {
                    this.$view.innerHTML = "<div class='thingosity_map_content' style='width:100%; height:100%'></div>";
                    this._contentobj = this.$view.firstChild;

                    this.map = null;
                    this.$ready.push(this.render);
                },

                render: function () {
                    this._initMap();
                },

                loadCoordinates: function (coordinates, groupedAggregatedData, config, coordinateItemKey) {
                    var path = new google.maps.Polyline({
                        path: coordinates,
                        geodesic: true,
                        strokeOpacity: 3,
                        strokeColor: '#0000ff',
                        strokeWeight: 2,
                        icons: [
                            {
                                icon: {
                                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                    strokeColor: '#0000ff',
                                    fillColor: '#0000ff',
                                    fillOpacity: 0.5
                                },
                                repeat: '100px',
                                path: []
                            }
                        ]
                    });
                    path.setMap(this.map);

                    // Load markers
                    this.markers = [];
                    _.each(groupedAggregatedData, function (data) {
                        this._loadMarker(data, config, coordinateItemKey);
                    }, this);

                    // Center map
                    var lastCoordinate = coordinates.slice(-1)[0];
                    this.map.setCenter(lastCoordinate);
                },

                _loadMarker: function (data, config, coordinateItemKey) {
                    if (_.isUndefined(data[coordinateItemKey])) {
                        // TODO: Perhaps we need to get data before and after (??)
                        webix.message('Geolocation data is not available for this data point');
                        return false;
                    }

                    var latLng = {
                        lat: data[coordinateItemKey].lat,
                        lng: data[coordinateItemKey].lng
                    };

                    var content = [];
                    for (var itemKey in data) {
                        // TODO: To avoid if its `timestamp` column
                        // TODO: Atm, geolocation data is ignored due to the hacky + 'lng'/'lat' implementation
                        if (!data.hasOwnProperty(itemKey)) {
                            continue;
                        }

                        var itemKeyValue = JSON.stringify(data[itemKey]);
                        var itemKeyConfig = config[itemKey];
                        content.push('<strong>' + itemKeyConfig.name + '</strong>: ' + itemKeyValue);
                    }
                    if (!_.isEmpty(content)) {
                        content = content.join('<br/>');
                    } else {
                        content = 'Not data available';
                    }

                    var marker = new google.maps.Marker({
                        position: latLng,
                        map: this.map
                    });

                    var self = this;
                    marker.addListener('click', function() {
                        self._showInfoWindow(marker, content);
                    });

                    this.markers.push(marker);
                },

                _showInfoWindow: function (marker, content) {
                    // Close existing infoWindow if exists
                    if (!_.isUndefined(this.currentInfoWindow)) {
                        this.currentInfoWindow.close();
                    }
                    // Then, open a new one
                    var infowindow = new google.maps.InfoWindow({ content: content });
                    infowindow.open(this.map, marker);
                    this.currentInfoWindow = infowindow;
                },

                showCoordinateOnMap: function (data, config, coordinateItemKey, directionItemKey) {
                    var lat = data['col_' + coordinateItemKey + '_lat'];
                    var lng = data['col_' + coordinateItemKey + '_lng'];

                    if (_.isUndefined(lat) || _.isUndefined(lng)) {
                        webix.message('Geolocation data is not available for this data point');
                    }

                    if (!_.isEmpty(this.marker)) {
                        this.marker.setMap(null);
                    }

                    var content = [];
                    for (var columnName in data) {
                        // TODO: To avoid if its `timestamp` column
                        // TODO: Atm, geolocation data is ignored due to the hacky + 'lng'/'lat' implementation
                        if (!data.hasOwnProperty(columnName)) {
                            continue;
                        }
                        // TODO: This still won't work if itemkey has `col_` - NEED FIX
                        var itemKey = columnName.replace('col_', '');
                        if (!config.hasOwnProperty(itemKey)) {
                            continue
                        }
                        var itemKeyValue = data[columnName];
                        var itemKeyConfig = config[itemKey];
                        content.push('<strong>' + itemKeyConfig.name + '</strong>: ' + itemKeyValue);
                    }
                    if (!_.isEmpty(content)) {
                        content = content.join('<br/>');
                    } else {
                        content = 'Not data available';
                    }

                    var timestamp = data.timestamp;
                    var latLng = { lat: lat, lng: lng };
                    this.marker = new google.maps.Marker({
                        position: latLng,
                        map: this.map
                    });
                    this._showInfoWindow(this.marker, content);
                    this.map.setCenter(latLng);
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
