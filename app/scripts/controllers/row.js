'use strict';

angular.module('trelloApp')
  .controller('RowCtrl', function ($scope) {

    $scope.locationFromColumn = function(index, widthAssumption) {
    	return (- (widthAssumption*index - ((100 - widthAssumption) / 2))) + '%';
    }

  });
