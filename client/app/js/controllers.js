'use strict';

/* Controllers */

angular.module('contactManager.controllers', []).

	controller('MainCtrl', ['$scope', '$route', function($scope, $route) {
			$scope.$route = $route;

		}]).

  controller('ContactsCtrl', ['$scope', '$http', 'APIServer', function($scope, $http, APIServer) {
    $http.get(APIServer + '/contacts').success(function(data) {
      $scope.contacts = data;
    });


    $scope.selectedContacts = []

    var columnDefs = [{ field: 'first_name', displayName: 'First Name'},
      { field: 'last_name', displayName: 'Last Name'},
      { field: 'email', displayName: 'Email'},
      { field: 'birth_date', displayName: 'Birth Date'}];

    $scope.contactsGrid = { data: 'contacts',
      enableCellEdit: true,
//      enableColumnResize:true,
//      showFilter:true,
//      enableRowSelection: false,
      selectedItems: $scope.selectedContacts,
      multiSelect: false,
      columnDefs: columnDefs,
      plugins: [new ngGridFlexibleHeightPlugin()],
      filterOptions: {
        filterText: '',
        useExternalFilter: false
      }};

    $scope.$watch('searchQuery', function(searchQuery){
      $scope.contactsGrid.filterOptions.filterText = searchQuery;
    })

    $scope.alerts = [
      { type: 'error', msg: 'Oh snap! Change a few things up and try submitting again.' },
      { type: 'success', msg: 'Well done! You successfully read this important alert message.' }
    ];

    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };


  }]).

  controller('MyCtrl2', ['$scope', function($scope) {

  }]);