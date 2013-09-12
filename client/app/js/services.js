'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('contactManager.services', []).
  value('version', '0.1').
  constant('APIServer', 'http://ec2-54-226-4-45.compute-1.amazonaws.com').
	factory('Utility', function () {
		return {

			allEmails: function(scope){
				return scope.emails.split(/,\s*/);
			},

			selectedEmails: function(scope){
				var emails = [];
				angular.forEach(scope.selectedContacts, function(data, index){
					emails.push(data.email);
				});
				return emails;
			},

			manuallyEnteredEmails: function(scope){
				var allEmails = this.allEmails(scope);
				var selectedEmails = this.selectedEmails(scope);

				return this.arrayDifference(selectedEmails, allEmails);
			},

			arrayDifference: function(a1, a2){
				var a=[], diff=[];
				for(var i=0;i<a1.length;i++)
					a[a1[i]]=true;
				for(i=0;i<a2.length;i++)
					if(a[a2[i]]) delete a[a2[i]];
					else a[a2[i]]=true;
				for(var k in a)
					diff.push(k);
				return diff;
			}
		}
	});