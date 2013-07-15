'use strict';

angular.module('trelloApp')
  .controller('BoardCtrl', function ($scope, $resource) {
    $scope.lists = $resource('/api/1/boards/:id/lists').query({id: localStorage.getItem('board')});
  });
