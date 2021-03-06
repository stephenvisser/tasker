'use strict';

angular.module('trelloApp', ['ngResource'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/setup', {
        templateUrl: 'views/board.html',
        controller: 'BoardCtrl'
      })
      .when('/choose', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/', {
        templateUrl: 'views/tasks.html',
        controller: 'TaskCtrl'
      });
  }).run(function($location) {
    if (!localStorage.getItem('board')) {
      $location.path('/choose');
    } else if (!(localStorage.getItem('todo') && localStorage.getItem('inprogress') && localStorage.getItem('completed'))) {
      $location.path('/setup');
    }
  });