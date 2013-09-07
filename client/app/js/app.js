'use strict';


angular.module('contactManager', ['contactManager.filters',
                                  'contactManager.services',
                                  'contactManager.directives',
                                  'contactManager.controllers',
                                  'ui.bootstrap', 'ui.utils',
  'ngGrid']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
		    when('/contacts', {
				    templateUrl: 'partials/contacts.html',
				    controller: 'ContactsCtrl',
				    activeTab: 'view'
		    }).
		    when('/select', {
				    templateUrl: 'partials/select.html',
				    controller: 'SelectCtrl',
				    activeTab: 'select'}).
		    otherwise({redirectTo: '/contacts'});
  }]);