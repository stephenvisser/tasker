'use strict';

angular.module('trelloApp')
  .controller('ColumnCtrl', function ($scope, $element) {

  	function getHeight(el) {
  		return parseInt(el.style['height'], 10);
  	}

    $scope.locationFromRow = function(rowNum) {
    	var aggregateHeight=0, el = $element[0].firstElementChild, i=0;

    	while (i < rowNum) {
    		aggregateHeight += getHeight(el);
    		el = el.nextElementSibling;
        i++;
    	}

    	var lastHeight = getHeight(el);

    	return (- (aggregateHeight - ((100 - lastHeight) / 2))) + '%';
    }

  });
