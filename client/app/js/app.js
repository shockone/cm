'use strict';


angular.module('contactManager', ['contactManager.filters',
                                  'contactManager.services',
                                  'contactManager.directives',
                                  'contactManager.controllers',
                                  'ui.bootstrap',
																	'ui.utils',
															    'ngGrid',
																	'toaster']
							).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
		    when('/management', {
				    templateUrl: 'partials/management.html',
				    controller: 'ManagementCtrl',
				    activeTab: 'management'
		    }).
		    when('/selection', {
				    templateUrl: 'partials/selection.html',
				    controller: 'SelectionCtrl',
				    activeTab: 'selection'}).
		    otherwise({redirectTo: '/management'});
  }]);