'use strict';

angular.module('contactManager.services', []).
	constant('APIServer', 'http://ec2-54-226-4-45.compute-1.amazonaws.com').
	factory('Utility', function () {
		return {
			allAddresseeEmails: function (scope) {
				// Either comma or space separated
				var emailsArray = scope.emails.model.split(/(,\s*|,?\s+)/);
				// Remove empty elements
				return emailsArray.filter(function(n){return n.match(/\w+/);});
			},


			manuallyEnteredAddresseeEmails: function (scope) {
				var allAddresseeEmails = this.allAddresseeEmails(scope);
				var selectedEmails = this.selectedFromListAddresseeEmails(scope);

				return this.arrayDifference(selectedEmails, allAddresseeEmails);
			},


			notSavedEmails: function(scope) {
				var allAddresseeEmails = this.allAddresseeEmails(scope);
				//Exclude emails, that already exist in our DB.
				return this.inFirstButNotInSecond(allAddresseeEmails, this.emailsFromDB(scope));
			},


			//Emails that are already in the contact manager. Including the ones, which weren't yet POSTed to the server.
			emailsFromDB: function (scope) {
				return this.mapContactsToEmails(scope.contacts);
			},


			selectedFromListAddresseeEmails: function (scope) {
				return this.mapContactsToEmails(scope.selectedContacts);
			},


			mapContactsToEmails: function (contacts) {
				var emails = [];
				angular.forEach(contacts, function (contact, index) {
					emails.push(contact.email);
				});
				return emails;
			},


			// Works like XOR.
			arrayDifference: function (a1, a2) {
				var a = [], diff = [];
				for (var i = 0; i < a1.length; i++)
					a[a1[i]] = true;
				for (i = 0; i < a2.length; i++)
					if (a[a2[i]]) delete a[a2[i]];
					else a[a2[i]] = true;
				for (var k in a)
					diff.push(k);
				return diff;
			},


			inFirstButNotInSecond: function(firstArray, secondArray) {
				return firstArray.filter(function(e){return secondArray.indexOf(e) == -1;});
			},


			formatDate: function(date){
				if(date instanceof Date) {
					var curr_date = date.getDate();
					var curr_month = date.getMonth() + 1; //Months are zero based
					var curr_year = date.getFullYear();
					return curr_year + "-" + curr_month + "-" + curr_date;
				} else {
					return date;
				}
			}
		}
	})

	//Make an element stick to the top of the page while scrolling except when it's higher than viewport.
	.directive('scrollFix', ['$window', function ($window) {
		return {
			link: function (scope, elm, attrs) {
				var viewPort = angular.element($window);
				var element = angular.element(elm);

				viewPort.on('scroll', function() {
					if ( viewPort.height() >= element.height()){
						var topOffset = Math.max(0,77-viewPort.scrollTop());

						element.css('position', 'fixed');
						element.css('right', 0);
						element.css('top', topOffset);
					} else {
						element.css('position', 'static');
					}
				});
			}
		};
	}]);