'use strict';

[
	'swipeup',
	'swipedown',
	'swipeleft',
	'swiperight',
	'tap'
].forEach(function(name){

	var fullQualifiedName = 'hmr' + name[0].toUpperCase() + name.slice(1);

	angular.module('trelloApp')
	  .directive(fullQualifiedName, function () {
	  	return function(scope, el, attrs) {
	     	Hammer(el[0]).on(name, function(){
	     		scope.$apply(function(){
	     			scope.$eval(attrs[fullQualifiedName]);
	     		});
	     	});
		};
	});
});
