'use strict';

 angular.module('trelloApp') .controller('TaskCtrl', function ($scope, $resource, $http, $q, $timeout, trello) {

    function actionInProgress(item) {
        return item.data.listAfter.id === localStorage.getItem('inprogress'); 
    }

    function addSecond() {
        return $timeout(function(){
            if ($scope.elapsedTime) $scope.elapsedTime = $scope.elapsedTime + 1000; 
        }, 1000).then(addSecond);
    }

    //Start a timer; 
    addSecond();
    function timeDiff(a, b) {
        return new Date(a).getTime() - new Date(b).getTime();
    }

    function getTotalTime(card) {
        if (card) {
            return trello.getActionsForCard(card.id).then(function(results){
                if (results.length === 0) {
                    return move(card, 'todo').then(function(){ return move(card, 'inprogress'); }).then(function(){
                        return getTotalTime(card);                        
                    });
                } else {
                    var lastStart = null;
                    $scope.elapsedTime = results.sort(function(a, b){
                        return timeDiff(a.date, b.date);
                    }).reduce(function(aggregate, x) {
                        if (actionInProgress(x)) {
                            lastStart = x;
                        } else if (lastStart) {
                            return aggregate + timeDiff(x.date, lastStart.date);
                            lastStart = null;
                        }
                        return aggregate;
                    }, 0);

                    if (actionInProgress(lastStart)) {
                        $scope.elapsedTime += (new Date().getTime() - new Date(lastStart.date).getTime());
                    }
                }
            });
        }
    }

    var active = $q.when();
    function enqueue(task) {
        active = active.then(task);
    }

    $scope.elapsedTime = null;

    $scope.currentTasks = [];
    $scope.inProgressTasks = [];
    $scope.doneTasks = [];
    $scope.activities = {};
    $scope.cards = [];

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

    function synchronizeList(oldList, newList) {
        var resultingList = [];
        oldList.forEach(function(item){
            var result = extract(item, newList)
            if (result) resultingList.push(result);
        });
        Array.prototype.push.apply(resultingList, newList);
        return resultingList;
    }

    //Kick off a refresh
    enqueue(function() {
        return refresh();
    });

    function refresh() {
        return $q.all([
            trello.getCardsInList(localStorage.getItem('todo')),
            trello.getCardsInList(localStorage.getItem('inprogress')),
            trello.getCardsInList(localStorage.getItem('completed'))
        ]).then(function(array) {
            $scope.currentTasks = synchronizeList($scope.currentTasks, array[1].concat(array[0]));
            $scope.inProgressTasks = array[1];
            $scope.doneTasks = array[2];
            return getTotalTime(array[1][0]);
        });
    }

    $scope.location = {
        rowNum: 1,
        todoIndex: 0,
        activeIndex: 0
    }

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

    function createSummaryTable() {
        return trello.getAllActions().then(function(allActions){
            var last = null;

            $scope.cards.length = 0;
            $scope.activities = {};

            allActions.sort(function(a, b){
                return timeDiff(a.date, b.date);
            }).forEach(function(action) {
                if (last) {
                    var total = timeDiff(action.date, last.date);
                    if ($scope.activities.hasOwnProperty(action.data.card.id)) {
                        $scope.activities[action.data.card.id] += total;
                    } else {
                        $scope.activities[action.data.card.id] = total;
                        $scope.cards.push(action.data.card);
                    }
                    last = null;
                } else if (action.data.listAfter.id === localStorage.getItem('inprogress')) {
                    last = action;
                }
            });

            if (last && actionInProgress(last)) {
                $scope.activities[last.data.card.id] += (new Date().getTime() - new Date(last.date).getTime());
            }
        });
    }

    function stopAllCurrentTasks () {
        return trello.getCardsInList(localStorage.getItem('inprogress')).then(function(result){
            return $q.all(result.map(function(item) {
                return move(item, 'todo');
            })).then(refresh);
        });
    }

    $scope.relax = function() {
        $scope.location.rowNum = 2;

        enqueue(function() {
            return $q.all([
                createSummaryTable(),
                stopAllCurrentTasks()
            ]);
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

        enqueue(function() {
            return trello.getCardsInList(localStorage.getItem('inprogress')).then(function(result){
                if (!result[0] || result.length > 1 || result[0].id !== startWorkingOn.id) {
                    return $q.all(
                        result.map(function(item) {
                            return move(item, 'todo');
                        }).concat(move(startWorkingOn, 'inprogress'))
                    ).then(refresh);
                }
            });
        });
   };

    $scope.finish = function(item) {
        $scope.location.rowNum = $scope.inProgressTasks.some(function(x){return item.id === x.id;}) ? 2 : 1;
        $scope.location.activeIndex--;

    	enqueue(function() {
            return move(item, 'completed').then(refresh);
        });
    };

    $scope.restart = function(item) {
        $scope.location.activeIndex = $scope.currentTasks.length;
        $scope.location.rowNum = 1;

        enqueue(function() {
            trello.getCardsInList(localStorage.getItem('inprogress')).then(function(result){
                return $q.all(
                    result.map(function(item) {
                        return move(item, 'todo');
                    }).concat(move(item, 'inprogress'))
                ).then(refresh);
            });
        });
    };

    $scope.isInProgress = function(candidate, index, list) {
        return $scope.inProgressTasks.some(function(task) {
            return task.id === candidate.id;
        });
    }
  });
