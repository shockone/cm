'use strict';

/* Controllers */

angular.module('contactManager.controllers', []).

	controller('MainCtrl', ['$scope', '$route', '$http', 'APIServer', 'toaster', 'Utility',
		function ($scope, $route, $http, APIServer, toaster, Utility) {

			//Get contacts JSON from EC2
			$http.get(APIServer + '/contacts').success(function (data) {
				$scope.contacts = data;
			});


			$scope.showNotification = function (type, text) {
				toaster.pop(type, '', text);
			};


			$scope.resetSelection = function () {
				//Deselect all items but select the first one on data loaded event
				$scope.contactsGridOptions.selectAll(false);
				var e = $scope.$on('ngGridEventData', function () {
					$scope.contactsGridOptions.selectRow(0, true);
					e();
				});
			};




			//Setup the grid
			$scope.multiSelect = false;
			$scope.selectedContacts = [];

			var columnDefs = [
				{ field: 'first_name', displayName: 'First Name'},
				{ field: 'last_name', displayName: 'Last Name'},
				{ field: 'email', displayName: 'Email'},
				{ field: 'phones.cell_phone', displayName: 'Cell Phone'}
			];

			$scope.contactsGridOptions = { data: 'contacts',
				enableCellEdit: true,
				selectedItems: $scope.selectedContacts,
				multiSelect: 'multiSelect',
				columnDefs: columnDefs,
				plugins: [new ngGridFlexibleHeightPlugin()],
				filterOptions: {
					filterText: '',
					useExternalFilter: false
				}};

			$scope.$route = $route;

			$scope.$watch('searchQuery', function (searchQuery) {
				$scope.contactsGridOptions.filterOptions.filterText = searchQuery;
			});

			$scope.emails = '';
			var manual_emails = [];
			$scope.contactsGridOptions.beforeSelectionChange = function () {
				manual_emails = Utility.manuallyEnteredEmails($scope);
				return true;
			};

			$scope.contactsGridOptions.afterSelectionChange = function () {
				$scope.selectedContact = $scope.selectedContacts[0];
				var selected_emails = Utility.selectedEmails($scope);
				$scope.emails = selected_emails.concat(manual_emails).join(', ');
			};


		}]).

	controller('ManagementCtrl', ['$scope', '$http', 'APIServer', function ($scope, $http, APIServer) {
		$scope.$parent.multiSelect = false;
		$scope.resetSelection();

		$scope.save = function () {
			var record = $scope.selectedContact;

			if (record._id) {
				$scope.update(record);
			} else {
				$scope.create(record);
			}
		};


		$scope.update = function (record) {
			var recordURI = APIServer + '/contacts/' + record._id;
			delete record._id;
			$http.put(recordURI, record).success(function (data) {
				if (data.msg == 'success') {
					var full_name = [record.first_name, record.last_name].join(' ');
					$scope.showNotification('success', 'The record „' + full_name + '“ has been successfully updated.');
				} else {
					$scope.showNotification('error', 'Oops. Something went wrong.');
				}
			});
		};


		$scope.create = function (record) {
			var recordURI = APIServer + '/contacts/';
			$http.post(recordURI, record).success(function (data, status) {
				if (status == 200) {
					var db_record = data[0];
					replaceContact(record, db_record);

					var full_name = [db_record.first_name, db_record.last_name].join(' ');
					$scope.showNotification('success', 'The record „' + full_name + '“ has been successfully created.');
				} else {
					$scope.showNotification('error', 'Oops. Something went wrong.');
				}
			});
		};


		$scope.delete = function () {
			var record = $scope.selectedContact;
			var recordURI = APIServer + '/contacts/' + record._id;
			$http.delete(recordURI, record).success(function (data) {
				if (data.msg == 'success') {
					var full_name = [record.first_name, record.last_name].join(' ');
					$scope.showNotification('warning', 'The record „' + full_name + '“ has been successfully removed.');
					removeContact(record);
					$scope.resetSelection();
				} else {
					$scope.showNotification('error', 'Oops. Something went wrong.');
				}
			});
		};


		$scope.add = function () {
			var emptyContact = {
				"first_name": '',
				"last_name": '',
				"email": '',
				"birth_date": '',
				"address": {country: '', state: '', city: '', zip: '', address: ''},
				"phones": {cell_phone: '', work_phone: '', home_phone: ''}
			};
			var e = $scope.$on('ngGridEventData', function () {
				$scope.$parent.contactsGridOptions.selectItem(0, true);
				e();
				window.scrollTo(0, 0);
			});

			$scope.$parent.contacts.unshift(emptyContact);
		};


		/* Private functions*/

		var removeContact = function (record) {
			var index = $scope.$parent.contacts.indexOf(record);
			$scope.$parent.contacts.splice(index, 1);
			return index;
		};


		var replaceContact = function (record, replacement) {
			var index = $scope.$parent.contacts.indexOf(record);
			if (index !== -1) {
				$scope.$parent.contacts[index] = replacement;
			}
			return index;
		};
	}]).

	controller('SelectionCtrl', ['$scope', 'Utility', function ($scope, Utility) {
		$scope.$parent.multiSelect = true;

		$scope.sendMail = function () {
			var mailWindow = window.open('mailto:' + encodeURIComponent(Utility.allEmails($scope)) +
				'?subject=' + encodeURIComponent($scope.subject) +
				'&body=' + encodeURIComponent($scope.body));
			setTimeout(function () {
				mailWindow.close();
			}, 1000);

		}
	}]);