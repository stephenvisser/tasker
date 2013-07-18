'use strict'

function dateString(date) {
    return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
}

angular.module('trelloApp')
  .service('trello', function ($resource, $q) {

	function makeAPromise(type, options) {
		var deferred = $q.defer();
		type.query(options, function(results){
			deferred.resolve(results);	
		});
		return deferred.promise;
	}

    //The card resource for accessing all cards in a given list
    var now = new Date(),
    	today = dateString(now),
        tomorrow = dateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)),
    	Card = $resource('/api/1/lists/:id/cards'),
    	Actions = $resource('/api/1/cards/:id/actions', {since: today, before: tomorrow}),
    	AllActions = $resource('/api/1/lists/:id/actions', {id: localStorage.getItem('inprogress'), since: today, before: tomorrow});

    return {
    	getCardsInList: function (id) {
	    	return makeAPromise(Card, {id: id});
	    },
	    getActionsForCard: function (id) {
	    	return makeAPromise(Actions, {id: id});
	    },
	    getAllActions: function() {
	    	return makeAPromise(AllActions, {});
	    }
    };
});