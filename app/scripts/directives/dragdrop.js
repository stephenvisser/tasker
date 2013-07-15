'use strict';

angular.module('trelloApp')
  .directive('dragdrop', function ($resource) {
  	var list = $resource('/api/1/lists/:id', null, {get: {method: 'GET', cache : true}});

  	return {
  		scope: true,
  		link: function (scope, el, attrs, ctrl){
	  		Hammer(el[0]).on('drag', function(event){
	  			el.css({
	  				top: event.gesture.deltaY + 'px',
	  				left: event.gesture.deltaX + 'px'
	  			});
	  			console.log('moving');
	  		}).on('dragend', function(event){
	  			el.css({
	  				position: 'static'
	  			});
	  			var destController = angular.element(document.elementFromPoint(event.gesture.center.pageX, event.gesture.center.pageY)).controller('dragdrop');
	  			scope.$apply(function(){
		  			if (destController) scope.id = destController.swapId(scope.id);
			  	});
	  			console.log('end');
	  		}).on('dragstart', function(event) {
	  			if (scope.id) {
					el.css({
		  				position: 'relative'
		  			});	  				
	  			}
	  			console.log('start');
	  		});

	  		scope.$watch('id', function(newVal, oldVal) {
	  			if (newVal) {
		  			list.get({id: newVal}, function (list) {
		  				el.text(list.name);
		  			});
		  			if (attrs.persistanceProperty) localStorage.setItem(attrs.persistanceProperty, newVal);
		  		}

		  		el.text(attrs.defaultText || '');
	  		});

  			scope.id = scope.$eval(attrs.dragdrop);
	  	},
	  	controller: function($scope, $attrs) {
	  		this.swapId = function(newId) {
	  			var tmp = $scope.id;
	  			$scope.id = newId;
	  			return tmp;
	  		};
	  	}
	}
});
