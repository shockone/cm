'use strict';

/* Controllers */

angular.module('contactManager.controllers', []).

	controller('MainCtrl', ['$scope', '$route', '$http', 'APIServer', function($scope, $route, $http, APIServer) {

//		Get contacts JSON from EC2
		$http.get(APIServer + '/contacts').success(function(data) {
			$scope.contacts = data;
		});

		$scope.$route = $route;
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
			multiSelect: true,
			columnDefs: columnDefs,
			plugins: [new ngGridFlexibleHeightPlugin()],
			filterOptions: {
				filterText: '',
				useExternalFilter: false
			}};


		$scope.$watch('searchQuery', function(searchQuery){
			$scope.contactsGrid.filterOptions.filterText = searchQuery;
		})

//		$scope.alerts = [
//			{ type: 'error', msg: 'Oh snap! Change a few things up and try submitting again.' },
//			{ type: 'success', msg: 'Well done! You successfully read this important alert message.' }
//		];

		$scope.closeAlert = function(index) {
			$scope.alerts.splice(index, 1);
		};

	}]).

  controller('ContactsCtrl', ['$scope', '$http', 'APIServer', function($scope, $http, APIServer) {
//		Deselect all items
		angular.forEach($scope.contacts, function(data, index){
				$scope.contactsGrid.selectItem(index, false);
		});
//		But select the first one on data loaded event
		$scope.$on('ngGridEventData', function(){
			$scope.contactsGrid.selectRow(0, true);
		});

		$scope.contactsGrid.multiSelect = false;

  }]).

  controller('SelectCtrl', ['$scope', 'Utility', function($scope, Utility) {
		$scope.emails = '';
		$scope.contactsGrid.multiSelect = true;

		var manual_emails = []
		$scope.contactsGrid.beforeSelectionChange = function(person, event){
			manual_emails = Utility.manuallyEnteredEmails($scope);
			return true;
		};

		$scope.contactsGrid.afterSelectionChange = function(){
			var selected_emails = Utility.selectedEmails($scope);
			$scope.emails = selected_emails.concat(manual_emails).join(', ');
		};
  }]);