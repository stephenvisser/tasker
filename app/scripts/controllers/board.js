'use strict';

angular.module('trelloApp')
  .controller('BoardCtrl', function ($scope, $routeParams, $resource) {
    $scope.lists = $resource('/api/1/boards/:id/lists').query({id: $routeParams.id});
    $scope.board = $routeParams.id;
  });
