'use strict';

/* Controllers */

angular.module('contactManager.controllers', []).

	controller('MainCtrl', ['$scope', '$route', '$http', 'APIServer', function($scope, $route, $http, APIServer) {

//		Get contacts JSON from EC2
		$http.get(APIServer + '/contacts').success(function(data) {
			$scope.contacts = data;
		});

		$scope.$route = $route;
		$scope.selectedContacts = [];

		var columnDefs = [{ field: 'first_name', displayName: 'First Name'},
			{ field: 'last_name', displayName: 'Last Name'},
			{ field: 'email', displayName: 'Email'},
			{ field: 'phones.cell_phone', displayName: 'Cell Phone'}];

		$scope.contactsGridOptions = { data: 'contacts',
			enableCellEdit: true,
			selectedItems: $scope.selectedContacts,
			multiSelect: true,
			columnDefs: columnDefs,
			plugins: [new ngGridFlexibleHeightPlugin()],
			filterOptions: {
				filterText: '',
				useExternalFilter: false
			}};


		$scope.$watch('searchQuery', function(searchQuery){
			$scope.contactsGridOptions.filterOptions.filterText = searchQuery;
		});

		$scope.alerts = [];
//			{ type: 'error', msg: 'Oh snap! Change a few things up and try submitting again.' },
//			{ type: 'success', msg: 'Well done! You successfully read this important alert message.' }
//		];

		$scope.closeAlert = function(index) {
			$scope.alerts.splice(index, 1);
		};

		$scope.resetSelection = function(){
			//Deselect all items
			//TODO: Use selectAll
			angular.forEach($scope.contacts, function(data, index){
				$scope.contactsGridOptions.selectItem(index, false);
			});
			//But select the first one on data loaded event
			var e = $scope.$on('ngGridEventData', function(){
				$scope.contactsGridOptions.selectRow(0, true);
				e();
			});
		};

	}]).

  controller('ManagementCtrl', ['$scope', '$http', 'APIServer', function($scope, $http, APIServer) {
		$scope.resetSelection();

		$scope.contactsGridOptions.multiSelect = false;

		$scope.contactsGridOptions.afterSelectionChange = function(){
			$scope.selectedContact = $scope.selectedContacts[0];
		};

		$scope.save = function(){
			var record = $scope.selectedContact;

			if(record._id){
				$scope.update(record);
			} else {
				$scope.create(record);
			}
		};

		$scope.update = function(record){
			var recordURI = APIServer + '/contacts/' + record._id;
			delete record._id;
			$http.put(recordURI, record).success(function(data){
				if (data.msg == 'success') {
					var full_name = [record.first_name, record.last_name].join(' ');
					$scope.alerts.push({type: 'success', msg: 'The record „' + full_name +	'“ has been successfully updated.'});
				} else {
					$scope.alerts.push({type: 'error', msg: 'Oops. Something went wrong'});
				}
			});
		};

		$scope.create = function(record){
			var recordURI = APIServer + '/contacts/';
			$http.post(recordURI, record).success(function(data, status){
				if (status == 200) {
					var db_record = data[0];
					$scope.replaceContact(record, db_record);

					var full_name = [db_record.first_name, db_record.last_name].join(' ');
					$scope.alerts.push({type: 'success', msg: 'The record „' + full_name +	'“ has been successfully created.'});
				} else {
					$scope.alerts.push({type: 'error', msg: 'Oops. Something went wrong'});
				}
			});
		};


		$scope.delete = function(){
			var record = $scope.selectedContact;
			var recordURI = APIServer + '/contacts/' + record._id;
			$http.delete(recordURI, record).success(function(data){
				if (data.msg == 'success') {
					var full_name = [record.first_name, record.last_name].join(' ');
					$scope.alerts.push({type: 'success', msg: 'The record „' + full_name +	'“ has been successfully removed.'});
					$scope.removeContact(record);
					$scope.resetSelection();
				} else {
					$scope.alerts.push({type: 'error', msg: 'Oops. Something went wrong'});
				}
			});
		};


		$scope.add = function(){
			var emptyContact = {
				"first_name": '',
				"last_name": '',
				"email": '',
				"birth_date": '',
				"address": {country: '', state: '', city:'', zip:'', address:''},
				"phones": {cell_phone:'', work_phone:'', home_phone:''}
			};
			var e = $scope.$on('ngGridEventData', function() {
				$scope.contactsGridOptions.selectItem(0, true);
				e();
				window.scrollTo(0,0);
			});

			$scope.contacts.unshift(emptyContact);
		};

		$scope.removeContact = function(record){
			var index = $scope.contacts.indexOf(record);
			$scope.contacts.splice(index, 1);
			return index;
		};

		$scope.replaceContact = function(record, replacement){
			var index = $scope.contacts.indexOf(record);
			if (index !== -1) {
				$scope.contacts[index] = replacement;
			}
			return index;
		};

  }]).

  controller('SelectionCtrl', ['$scope', 'Utility', function($scope, Utility) {
		$scope.emails = '';
		$scope.contactsGridOptions.multiSelect = true;

		var manual_emails = [];
		$scope.contactsGridOptions.beforeSelectionChange = function(){
			manual_emails = Utility.manuallyEnteredEmails($scope);
			return true;
		};

		$scope.contactsGridOptions.afterSelectionChange = function(){
			var selected_emails = Utility.selectedEmails($scope);
			$scope.emails = selected_emails.concat(manual_emails).join(', ');
		};

		$scope.sendMail = function(){
			var mailWindow =  window.open('mailto:'   + encodeURIComponent(Utility.allEmails($scope)) +
																		'?subject=' + encodeURIComponent($scope.subject) +
																		'&body='    + encodeURIComponent($scope.body));
			setTimeout(function() { mailWindow.close();},1000);

		}
  }]);