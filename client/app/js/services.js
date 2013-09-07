'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('contactManager.services', []).
  value('version', '0.1').
  constant('APIServer', 'http://ec2-54-226-4-45.compute-1.amazonaws.com');
