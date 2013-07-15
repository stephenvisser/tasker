'use strict';

angular.module('trelloApp')
  .controller('MainCtrl', function ($scope, $resource, $location) {
    $scope.boards = $resource('/api/1/members/me/boards').query();

    $scope.choose = function(board) {
    	localStorage.setItem('board', board.id);
    	$location.path('/setup');
    };

  });
