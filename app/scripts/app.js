'use strict';

angular.module('trelloApp', ['ngResource'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/board/:id', {
        templateUrl: 'views/board.html',
        controller: 'BoardCtrl'
      })
      .when('/tasks/:id', {
        templateUrl: 'views/tasks.html',
        controller: 'TaskCtrl'
      })
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
