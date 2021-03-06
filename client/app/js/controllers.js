'use strict';


angular.module('contactManager.controllers', []).

	controller('MainCtrl', ['$scope', '$route', '$location', '$resource', 'APIServer', 'toaster', 'Utility',
		function ($scope, $route, $location, $resource, APIServer, toaster, Utility) {

			$scope.$route = $route;
			var showError = function() { $scope.showNotification('error', 'Oops. Something went wrong.'); };


			var Contact = $resource(APIServer + '/contacts/:id', {}, {
				create: {method:'POST', isArray:true},
				update: {method:'PUT'}
			});


			/* REST Actions*/

			// Index
			Contact.query(function(data){
				// Create a separate attribute for the phone, which was chosen as default, because
				// there is no way to use a dynamic value in columnDefs for ng-grid.
				angular.forEach(data, function (value, index) {
					var phones = data[index].phones;
					phones.default_phone_value = phones[phones.default_phone || 'cell_phone'];
				});

				$scope.contacts = data;
			}, showError);


			$scope.create = function (record) {
				Contact.create(record, function(data){
					var dbRecord = data[0];
					$scope.setID(record, dbRecord._id);

					$scope.showSuccessNotification(dbRecord, 'create');
				}, showError);
			};


			$scope.update = function (record) {
				record = angular.copy(record);
				var id = record._id;
				delete record._id;

				Contact.update({id:id}, record, function(){
					$scope.showSuccessNotification(record, 'update');
				}, showError);
			};


			$scope.delete = function (record) {
				Contact.delete({id:record._id}, function(){
					$scope.showSuccessNotification(record, 'delete', 'warning');
					$scope.removeContactFromArray(record);
					$scope.selectFirstElement();
				}, showError);
			};


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
				}
			};


			// A workaround. Define emails as an object, because we need to use it in the child controller.
			// And since primitives are assigned by value, it would be redefined instead of setting to the prototype.
			$scope.emails = { model: '' };
			$scope.manual_emails = [];


			// Remember manually typed emails so we won't lose them after selection changed.
			$scope.contactsGridOptions.beforeSelectionChange = function () {
				$scope.manual_emails = Utility.manuallyEnteredAddresseeEmails($scope);
				return true;
			};

			// Merge new selection with manually typed emails.
			$scope.contactsGridOptions.afterSelectionChange = function () {
				$scope.selectedContact = $scope.selectedContacts[0];
				var selected_emails = Utility.selectedFromListAddresseeEmails($scope);
				$scope.emails.model = selected_emails.concat($scope.manual_emails).join(', ');
			};


			$scope.showNotification = function (type, text) {
				toaster.pop(type, '', text);
			};

			$scope.showSuccessNotification = function (contact, action, type) {
				var fullName = [contact.first_name, contact.last_name].join(' ');
				type = type ? type : 'success';
				$scope.showNotification(type, 'The record „' + fullName + '“ has been successfully ' + action + 'd.');
			};

			//Deselect all items but select the first one on data loaded event
			$scope.selectFirstElement = function () {
				$scope.contactsGridOptions.selectAll(false);
				$scope.contactsGridOptions.selectRow(0, true);

				var unregisterListener = $scope.$on('ngGridEventData', function () {
					$scope.contactsGridOptions.selectRow(0, true);
					unregisterListener();
				});
			};



			/* SCRUD Actions */

			// Search
			$scope.$watch('searchQuery', function (searchQuery) {
				$scope.contactsGridOptions.filterOptions.filterText = searchQuery;
			});


			$scope.add = function () {
				//Redirect to the management page
				$location.path('management');

				$scope.selectFirstElement();
				window.scrollTo(0, 0); // Scroll to the top

				var emptyContact = $scope.createEmptyContact();
				$scope.contacts.unshift(emptyContact);

				// Focus first name of newly created element , so it's easier to start filling the form up.
				var firstNameInput = document.getElementById('first-name');
				if (firstNameInput) {
					firstNameInput.focus();
				}

				return emptyContact;
			};


			$scope.save = function () {
				var record = $scope.selectedContact;

				if (record._id) {
					$scope.update(record);
				} else {
					$scope.create(record);
				}
			};


			$scope.destroy = function() {
				if (!confirm('Are you sure you want to delete this contact?')) { return; }
				var record = $scope.selectedContact;

				if (record._id) {
					$scope.delete(record);
				} else {
					$scope.removeContactFromArray(record); // A newly created contact, just remove from the array
				}
			};


			$scope.createEmptyContact = function() {
				return {"first_name": '',
						"last_name": '',
						"email": '',
						"birth_date": '',
						"address": {country: '', state: '', city: '', zip: '', address: ''},
						"phones": {cell_phone: '', work_phone: '', home_phone: '', default_phone: 'cell_phone'}
						};
			};


			$scope.removeContactFromArray = function (record) {
				var index = $scope.contacts.indexOf(record);
				$scope.contacts.splice(index, 1);
				$scope.selectFirstElement();
				return index;
			};


			$scope.setID = function (record, id) {
				var index = $scope.contacts.indexOf(record);
				if (index !== -1) {
					$scope.contacts[index]._id = id;
				}
				return index;
			};

		}]).


	controller('ManagementCtrl', ['$scope', 'Utility', function ($scope, Utility) {
		$scope.$parent.multiSelect = false;
		$scope.selectFirstElement();


		$scope.updateDefaultPhone = function (phone) {
			if (typeof phone !== 'undefined' && thisPhonePresent(phone) && otherPhonesEmpty(phone)) {
				setPhoneAsDefault(phone);
			}
			updatePhoneInGrid();
		};


		var thisPhonePresent = function(phone_type) {
			return $scope.selectedContact.phones[phone_type].length > 0;
		};


		var otherPhonesEmpty = function(phone_type) {
			var all_types = ['cell_phone', 'work_phone', 'home_phone'];

			//Remove the type passed in parameters.
			var index = all_types.indexOf(phone_type);
			all_types.splice(index, 1);

			for (var i = 0; i !== all_types.length; ++i) {
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
		};


		// Setup datapicker plugin to select birth dates more conveniently.
		$('#birth-date').datepicker({
			format: 'yyyy-mm-dd',
			autoclose: true,
			startView: 'decade',
			endDate: new Date(),
			forceParse: false
		})
		.on('changeDate', function(date) {
			$scope.selectedContact.birth_date = date.format();
		});

	}]).


	controller('SelectionCtrl', ['$scope', 'Utility', function ($scope, Utility) {
		$scope.$parent.multiSelect = true;

		$scope.sendMail = function () {
			var subject = $scope.subject ? encodeURIComponent($scope.subject) : '';
			var body = $scope.body ? encodeURIComponent($scope.body) : '';

			// Open the email in client's default mail application.
			var mailWindow = window.open('mailto:' + encodeURIComponent(Utility.allAddresseeEmails($scope)) +
				'?subject=' + subject +	'&body=' + body);

			// Close the tab created by the previous statement.
			setTimeout(function () { mailWindow.close(); }, 0);

			saveNonExistingContacts();
		};


		var saveNonExistingContacts = function() {
			var emails = Utility.notSavedEmails($scope);

			if (emails.length) {
				var emailsList = '\n\n' + emails.join('\n');

				if (confirm('Some of the emails don\'t exists in the contact manager.' +
					' Would you like to save them?' + emailsList)) {

					// Save contacts and POST them to the server.
					angular.forEach(emails, function (email) {
						var newContact = $scope.add();
						var firstName = email.substring(0, email.indexOf('@'));

						newContact.email        = email;
						newContact.first_name   = firstName;

						$scope.create(newContact);
					});
				}
			}
		};

	}]);