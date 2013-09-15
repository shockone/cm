'use strict';

angular.module('contactManager', [
		'contactManager.services',
		'contactManager.controllers',
		'ngGrid',
		'toaster',
		'$strap.directives']
	).
	value('$strapConfig', {
		datepicker: {
			format: 'yyyy-mm-dd',
			autoclose: true,
			startView: 'decade'
		}
	}).
	config(['$routeProvider', function ($routeProvider) {
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