'use strict';

/* Controllers */

angular.module('contactManager.controllers', []).

	controller('MainCtrl', ['$scope', '$route', '$location', '$http', 'APIServer', 'toaster', 'Utility',
		function ($scope, $route, $location, $http, APIServer, toaster, Utility) {

			//Get contacts from EC2
			$http.get(APIServer + '/contacts').success(function (data) {
				//Choose the default phone number
				angular.forEach(data, function (value, index) {
					var p = data[index].phones;
					p.default_phone_value = p[p.default_phone || 'cell_phone']
				});

				$scope.contacts = data;
			});


			//Setup the grid
			$scope.multiSelect = false;
			$scope.selectedContacts = [];

			var columnDefs = [
				{ field: 'first_name', displayName: 'First Name'},
				{ field: 'last_name', displayName: 'Last Name'},
				{ field: 'email', displayName: 'Email'},
				{ field: 'phones.default_phone_value', displayName: 'Phone'}
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

			// A workaround. Define it as an object, because strings are assigned by value and therefore it would be
			// redefined in the child controller.
			$scope.emails = { model: '' };
			var manual_emails = [];

			$scope.contactsGridOptions.beforeSelectionChange = function () {
				manual_emails = Utility.manuallyEnteredEmails($scope);
				return true;
			};

			$scope.contactsGridOptions.afterSelectionChange = function () {
				$scope.selectedContact = $scope.selectedContacts[0];
				var selected_emails = Utility.selectedEmails($scope);
				$scope.emails.model = selected_emails.concat(manual_emails).join(', ');
			};


			$scope.showNotification = function (type, text) {
				toaster.pop(type, '', text);
			};


			$scope.resetSelection = function () {
				//Deselect all items but select the first one on data loaded event
				$scope.contactsGridOptions.selectAll(false);
				$scope.contactsGridOptions.selectRow(0, true);

				var e = $scope.$on('ngGridEventData', function () {
					$scope.contactsGridOptions.selectRow(0, true);
					e();
				});
			};


			$scope.add = function () {
				$location.path('management');
				var emptyContact = {
					"first_name": '',
					"last_name": '',
					"email": '',
					"birth_date": '',
					"address": {country: '', state: '', city: '', zip: '', address: ''},
					"phones": {cell_phone: '', work_phone: '', home_phone: ''}
				};
				var e = $scope.$on('ngGridEventData', function () {
					$scope.contactsGridOptions.selectItem(0, true);
					e();
					window.scrollTo(0, 0);
				});

				$scope.contacts.unshift(emptyContact);
			};
		}]).

	controller('ManagementCtrl', ['$scope', '$http', 'APIServer', 'Utility', function ($scope, $http, APIServer, Utility) {
		$scope.$parent.multiSelect = false;
		$scope.resetSelection();

		$scope.save = function () {
			var record = $scope.selectedContact;
			record.birth_date = Utility.formatDate(record.birth_date);

			if (record._id) {
				$scope.update(record);
			} else {
				$scope.create(record);
			}
		};


		$scope.update = function (record) {
			record = angular.copy(record);
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
			if (!confirm('Are you sure you want to delete this contact?')) return;

			var record = $scope.selectedContact;
			var id = record._id;
			if (id) {
				var recordURI = APIServer + '/contacts/' + id;
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
			} else { // A newly created contact, just remove from the array
				removeContact(record);
			}
		};


		$scope.updatePhone = function (phone) {
			if (typeof phone != 'undefined' && thisPhonePresent(phone) && otherPhonesEmpty(phone)) {
				setPhoneAsDefault(phone);
			}
			updatePhoneInGrid();
		};


		/* Private functions */

		var removeContact = function (record) {
			var index = $scope.$parent.contacts.indexOf(record);
			$scope.$parent.contacts.splice(index, 1);
			return index;
		};


		var replaceContact = function (record, replacement) {
			var index = $scope.contacts.indexOf(record);
			if (index !== -1) {
				$scope.contacts[index]._id = replacement._id;
			}
			return index;
		};


		var thisPhonePresent = function(phone_type) {
			return $scope.selectedContact.phones[phone_type].length > 0;
		};


		var otherPhonesEmpty = function(phone_type) {
			var all_types = ['cell_phone', 'work_phone', 'home_phone'];

			//Remove the type passed in parameters.
			var index = all_types.indexOf(phone_type);
			all_types.splice(index, 1);

			for (var i = 0; i != all_types.length; ++i) {
				if ($scope.selectedContact.phones[all_types[i]].length > 0) {
					return false;
				}
			}
			return true;

		};


		var setPhoneAsDefault = function(phone_type){
			$scope.selectedContact.phones.default_phone = phone_type;
		};


		var updatePhoneInGrid = function(){
			var c = $scope.selectedContact;
			c.phones.default_phone_value = c.phones[c.phones.default_phone];
		}

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