'use strict';

angular.module('trelloApp')
  .controller('TaskCtrl', function ($scope, $resource, $http, $q, $timeout) {

    function actionInProgress(item) {
        return item.data.listAfter.id === localStorage.getItem('inprogress');
    }

    function addSecond() {
        return $timeout(function(){
            if ($scope.elapsedTime) $scope.elapsedTime = $scope.elapsedTime + 1000;
        }, 1000).then(addSecond);
    }

    function dateString(date) {
        return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
    }

    function getTotalTime(card) {
        if (card) {
            var today = new Date(),
                tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

            Actions.query({id: card.id, since: dateString(today), before: dateString(tomorrow)}, function(results){
                var lastStart = null;

                $scope.elapsedTime = results.sort(function(a, b){
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                    }).reduce(function(aggregate, x) {
                    if (actionInProgress(x)) {
                        lastStart = x;
                    } else if (lastStart) {
                        return aggregate + new Date(x.date).getTime() - new Date(lastStart.date).getTime();
                        lastStart = null;
                    }
                    return aggregate;
                }, 0);

                if (actionInProgress(lastStart)) {
                    $scope.elapsedTime += (new Date().getTime() - new Date(lastStart.date).getTime());
                }
            });
        }
    }
    $scope.elapsedTime = null;
    addSecond(); 
    //The card resource for accessing all cards in a given list
    var Card = $resource('/api/1/lists/:id/cards');

    var Actions = $resource('/api/1/cards/:id/actions');

    var AllActions = $resource('/api/1/lists/:id/actions', {id: localStorage.getItem('inprogress')});

    //Perform the fetches
    $scope.currentTasks = Card.query({id: localStorage.getItem('todo')}, function(){
        $scope.inProgressTasks = Card.query({id: localStorage.getItem('inprogress')}, function(current){
            Array.prototype.unshift.apply($scope.currentTasks, current);
            getTotalTime(current[0]);
        });
    });

    $scope.doneTasks = Card.query({id: localStorage.getItem('completed')});

    function remove(item, list) {
        var index = list.indexOf(item);
        list.splice(index, 1);
    }

    function move(item, label) {
    	return $http.put('/api/1/cards/' + item.id , {idList: localStorage.getItem(label)})
    }

    function extract(item, list) {
        var index = -1;
        list.some(function(candidate, i){ 
            if( candidate.id === item.id ) { 
                index = i; 
                return true; 
            } 
        });
        return list.splice(index, 1)[0];
    }

    function refresh() {
        $scope.elapsedTime = null;
        Card.query({id: localStorage.getItem('completed')}, function(completed){
            $scope.doneTasks = completed;
        });

        var todoPromise = $q.defer(),
            inProgressPromise = $q.defer();

        Card.query({id: localStorage.getItem('todo')}, function(items){
            todoPromise.resolve(items);
        });
        Card.query({id: localStorage.getItem('inprogress')}, function(current){
            inProgressPromise.resolve(current);
        });

        $q.all([todoPromise.promise, inProgressPromise.promise]).then(function(lists){
            $scope.inProgressTasks = lists[1];
            getTotalTime($scope.inProgressTasks[0]);

            var allItemsArray = Array.prototype.concat.apply([], lists),
                newList = [];
            $scope.currentTasks.forEach(function(item){
                var result = extract(item, allItemsArray)
                if (result) newList.push(result);
            });
            Array.prototype.push.apply(newList, allItemsArray);

            $scope.currentTasks = newList;
        });
    }

    $scope.location = {
        rowNum: 1,
        todoIndex: 0,
        activeIndex: 0
    }

    $scope.activities = {};
    $scope.cards = [];

    $scope.empty = function(item) {
        return Object.keys(item).length === 0;
    }

    $scope.total = function(list) {
        return Object.keys(list).reduce(function(total, card){
            return list[card] + total;
        }, 0);
    };

    $scope.getPosition = function(index) {
        var total = $scope.total($scope.activities);
        return {
            left: ($scope.cards.slice(0, index).reduce(function(total, card){
                        return total + $scope.activities[card.id];
                    }, 0) * 100 / total) + '%',
            width: ($scope.activities[$scope.cards[index].id] * 100 / total) + '%'
        };
    }

    $scope.relax = function() {
        $scope.location.rowNum = 2;
        Card.query({id: localStorage.getItem('inprogress')}, function(result){
            $q.all(result.map(function(item) {
                return move(item, 'todo');
            })).then(refresh);
        });

        var today = new Date(),
            tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        AllActions.query({since: dateString(today), before: dateString(tomorrow), limit: 200}, function(result){
            var last = null;

            $scope.cards.length = 0;
            $scope.activities = result.sort(function(a, b){
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            }).reduce(function(hash, action) {

                if (last) {
                    var total = new Date(action.date).getTime() - new Date(last.date).getTime();
                    if (hash.hasOwnProperty(action.data.card.id)) {
                        hash[action.data.card.id] += total;
                    } else {
                        hash[action.data.card.id] = total;
                        $scope.cards.push(action.data.card);
                    }
                    last = null;
                } else if (action.data.listAfter.id === localStorage.getItem('inprogress')) {
                    last = action;
                }
                return hash;
            }, {});

            if (last && actionInProgress(last)) {
                $scope.activities[last.data.card.id] += (new Date().getTime() - new Date(last.date).getTime());
            }
        });
    };

    var currentTimeout;
    $scope.viewTask = function(index) {
        $scope.location.todoIndex = index;
        $scope.location.rowNum = 0;

        $timeout.cancel(currentTimeout);
        currentTimeout = $timeout(function(){
            $scope.location.rowNum = 1;
        }, 5000);
    };

    $scope.nextTask = function() {
        $scope.startTask($scope.location.activeIndex + 1);
    };

    $scope.prevTask = function() {
        $scope.startTask($scope.location.activeIndex - 1);
    };

    $scope.nextTodo = function() {
        $scope.viewTask($scope.location.todoIndex + 1);
    };

    $scope.prevTodo = function() {
        $scope.viewTask($scope.location.todoIndex - 1);
    };

    $scope.startTask = function(index) {
        var startWorkingOn = $scope.currentTasks[index];

        $scope.location.activeIndex = index;
        $scope.location.rowNum = 1;

        Card.query({id: localStorage.getItem('inprogress')}, function(result){

            if (result.every(function(item) { return item.id !== startWorkingOn.id; })) {

                $q.all(result.map(function(item) {
                    return move(item, 'todo');
                })).then(function() {
                    return move(startWorkingOn, 'inprogress').then(refresh);
                });
            }
        });
   };

    $scope.finish = function(item) {
        $scope.location.rowNum = $scope.inProgressTasks.some(function(x){return item.id === x.id;}) ? 2 : 1;
        $scope.location.activeIndex--;

    	move(item, 'completed').then(refresh);
    };

    $scope.restart = function(item) {
        $scope.location.activeIndex = $scope.currentTasks.length;
        $scope.location.rowNum = 1;

        Card.query({id: localStorage.getItem('inprogress')}, function(result){
            $q.all(result.map(function(item) {
                return move(item, 'todo');
            })).then(function(){
                move(item, 'inprogress').then(refresh);
            });
        });
    };

    $scope.isInProgress = function(candidate, index, list) {
        return $scope.inProgressTasks.some(function(task) {
            return task.id === candidate.id;
        });
    }
  });
