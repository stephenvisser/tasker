'use strict';

angular.module('trelloApp')
  .filter('lookup', function () {

    return function (value, parameter) {
    	return parameter[value];
    }
});