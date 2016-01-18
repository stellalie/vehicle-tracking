
/* globals define */
define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    'use strict';

    return Backbone.Model.extend({

        getWebixModel: function () {

            return {

                name: "navbar",
                defaults: {
                    height: 80,
                    css: "navbar",
                    template: "<div class='text'><a class='next' href='{obj.next.name}.html'></a><a class='prev' href='{obj.prev.name}.html'></a><span><a class='webix-btn btn-green btn-wide bigdevice' href='#link#'>Download</a>#text#</span></div>"
                },

                value_setter: function (value) {
                    var index = 0;
                    for (var i = 0; i < this.demos.length; i++)
                        if (this.demos[i].name == value)
                            index = i;

                    this.data = this.demos[index];
                    this.data.next = this.demos[(index + 1) % this.demos.length];
                    this.data.prev = this.demos[(index - 1 + this.demos.length) % this.demos.length];
                },
                demos: [
                    {
                        name: "geo",
                        link: "/download/",
                        text: "It has never been so easy to create rich media apps. With Webix, you have a possibility to embed media content in the library widgets. Besides, the library supports integration with third-party tools that will let you add Google Maps to your apps."
                    }
                ]
            };
        }

    });
});
