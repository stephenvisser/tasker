'use strict';

angular.module('trelloApp')
  .controller('MainCtrl', function ($scope, $resource) {
    var boards = $resource('/api/1/members/me/boards');
    $scope.boards = boards.query();
  });
