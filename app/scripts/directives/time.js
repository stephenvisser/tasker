'use strict';

angular.module('trelloApp')
  .filter('time', function () {

	var incrementValues = {'Hours': 3600, 'Minutes': 60, 'Seconds': 1};
    return function (milliseconds) {
    	if (milliseconds != null) {
	    	var seconds = milliseconds / 1000;
	    	return ['Hours', 'Minutes', 'Seconds'].map(function(increment) {
	    		var result = Math.floor(seconds / incrementValues[increment]);
	    		seconds = seconds - (result * incrementValues[increment]);
	    		return (result.toString().length === 1 ? '0' : '') + result;
	    	}).join(':');
	    }
    }
});

