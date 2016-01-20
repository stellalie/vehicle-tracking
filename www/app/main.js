require.config({
    'baseUrl': '/app',
    'paths': {
        'jquery': 'vendor/jquery-2.2.0.min',
        'underscore': 'vendor/underscore-min',
        'backbone': 'vendor/backbone-min',
        'json': 'vendor/json',
        'webix': 'vendor/webix/codebase/webix',
        'webix_debug': 'vendor/webix/codebase/webix_debug'
    }
});

require([
    'jquery',
    'appController',
    'webix'
], function ($, AppController, Webix) {

    $(function () {
        webix.ready(function () {
            var app = new AppController({
                el: '#dashboard'
            });
            app.render();
        });
    });

});
