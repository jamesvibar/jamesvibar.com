var JV = {
	Animations:{
		//all animations inside the site
	},
	General:{
		//general functions like preloadhandling
	},
	Globals:{
		//global variables
	}
};

JV.Globals = function(){
	return {
		animationCompleted: true,
		initialLoad: true,
		home: $('jv-home'),
		workMenu: $('#workmenu'),
		borderActive: false,
		tl: new TimelineLite({paused:true}),
		gradients: 4,
		isMobile: false
	}
};

JV.General = (function(){

	function preloadHandler(g, anim){

		var Home = Barba.BaseView.extend({
			namespace: "homepage",
			onEnter: function(){
				anim.randomCardBg();
			},
			onEnterCompleted: function() {
				anim.flipCard();
			},
			onLeave: function() {

			},
			onLeaveCompleted: function() {

			}
		});

		return {
			Home: Home
		}
	}

	return{
		preloadHandler: preloadHandler
	}

})();

JV.Animations = function(g){

	function flipCard(initialLoad){
		var cards = $('.flip-container');

		var tl = new TimelineLite({
			paused: true,
			onComplete: function() {
				cards.addClass('active');
				cards.removeAttr("style");
			}
		});

		tl.add("start")
			.staggerFromTo(cards, 1, {
				y: "10%",
				autoAlpha: 0
			}, {
				y: "0%",
				autoAlpha: 1,
				ease: Power2.easeInOut
			}, 0.1);

		if (initialLoad) {
			tl.play();
		} else {
			cards.addClass('active');
			cards.removeAttr("style");
		}
	}

	function animateStageHome() {
		var sideBar = $('.sidebar'),
			logo = $('.sidebar .header-logo'),
			aboutMe = $('.sidebar .header-about-me'),
			headerDivider = $('.sidebar .header-divider'),
			headerAbout = $('.sidebar .header-about');

		var tl = new TimelineLite({
			paused: true,
			onComplete: function() {
				$(".header-logo, .header-about-me, .header-divider, .header-about").removeAttr("style");
			}
		});

		tl.add("start")
			.staggerFromTo([logo, aboutMe, headerDivider, headerAbout], 1, {
				x: "-20%",
				autoAlpha: 0
			}, {
				x: "0%",
				autoAlpha: 1,
				ease: Power2.easeInOut
			}, 0.2, "+=1.2");
		tl.play();
	}

	function animateBorder() {
		var borderContainer = $('.site-border');
		if(borderContainer.hasClass('load')){
			borderContainer.removeClass('load');
			g.borderActive = false;
		} else{
			borderContainer.addClass('load');
			g.borderActive = true;
		}
	}

	function randomCardBg(g) {
		var cards = document.getElementsByClassName('card--back');

		for(var i = 0; i < cards.length; i++) {
			cards[i].classList.add('bg' + makeUniqueRandoms());
		}

	}

	function makeUniqueRandoms() {
		var uniqueRandoms = [];
		var numRandoms = g.gradients;

		//Refill array if needed
		if(!uniqueRandoms.length) {
			for(let i = 0; i < numRandoms; i++) {
				uniqueRandoms.push(i);
			}
		}

		var index = Math.floor(Math.random() * uniqueRandoms.length);
		var val = uniqueRandoms[index];

		uniqueRandoms.splice(index, 1);

		return val;
	}

	return {
		animateStageHome: animateStageHome,
		animateBorder: animateBorder,
		randomCardBg: randomCardBg,
		flipCard: flipCard
	}

}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function init(g, initialLoad){
	var anim = JV.Animations(g);
	var isMobile = window.matchMedia("only screen and (max-width: 500px)");

	var workMenu = g.workMenu;

	// Set isMobile to true or false on refresh
	if(isMobile.matches) {
		g.isMobile = true;
	} else {
		g.isMobile = false;
	}

	// Randomize Card Backgrounds on initial load.
	if(initialLoad){
		anim.randomCardBg();
	}

	// Listen for scroll event and position: fixed the nav upon reaching the navigation
	if($('.work-container').length > 0 && g.isMobile) {
		var stickyOffset = $('#workmenu').offset().top;

		$(document).on("scroll", debounce(function() {
			if(g.isMobile) {
				var scroll = $(window).scrollTop();

				if (scroll >= stickyOffset) {
					$('#workmenu').addClass('fixed');
				} else {
					$('#workmenu').removeClass('fixed');
				}
			}
		}, 100))
	}

	// $(document).on("scroll", function() {
	// 	if(g.isMobile) {
	// 		var scroll = $(window).scrollTop();

	// 		if (scroll >= stickyOffset) {
	// 			$('#workmenu').addClass('fixed');
	// 		} else {
	// 			$('#workmenu').removeClass('fixed');
	// 		}
	// 	}
	// });

	// Set isMobile to true or false on window resize.
	$(window).on("resize", debounce(function() {
		if(isMobile.matches){
			g.isMobile = true;

			stickyOffset = $('#workmenu').offset().top;

		} else {
			g.isMobile = false;
		}

		// If nav has sticky on resize and its not in mobile, remove it.
		if( $('#workmenu').hasClass('fixed') && !g.isMobile ) {
			$('#workmenu').removeClass('fixed');
		}

	}, 200))

	anim.flipCard(initialLoad);
};

$(function() {

	var g = JV.Globals(),
		anim = JV.Animations(g),
		initialLoad = true,
		transitionsReady = true;

	var pHandler = JV.General.preloadHandler(g, anim);
	init(g, initialLoad);

	if(transitionsReady) {
		Barba.Pjax.init();
		Barba.Prefetch.init();
		Barba.Dispatcher.on('transitionCompleted', function (currentStatus, oldStatus, container) {
			init(g, false);
		});

		var FadeTransition = Barba.BaseTransition.extend({
			start: function() {
				Promise
					.all([this.newContainerLoading, this.scrollUp()])
					.then(this.fade.bind(this))
			},
			scrollUp: function() {
				var _this = this;
				var deferred = Barba.Utils.deferred();
				if ($(window).scrollTop() > 0){
					TweenMax.to($("html,body"), 1, {
						scrollTop: 0,
						ease: Power4.easeInOut,
						onComplete: function() {
							$(_this.oldContainer).css({
								position: "absolute",
								top: 0,
								left: 0,
								right: 0
							});
							TweenMax.to($(_this.oldContainer), .25, { 
								autoAlpha: 0,
								onComplete: function() {
									deferred.resolve();
								}
							});
						}
					});
				} else {
					$(_this.oldContainer).css({
						position: "absolute",
						top: 0,
						left: 0,
						right: 0
					});
					TweenMax.to($(_this.oldContainer), .25, { 
						autoAlpha: 0,
						onComplete: function() {
							deferred.resolve();
						}
					});
				}

				return deferred.promise;
			},
			fade: function() {
				var _this = this;
				TweenMax.set(_this.newContainer, { visibility: 'visible', opacity: 0 });

				TweenMax.fromTo(_this.newContainer, .5, { autoAlpha: 0 }, {
					autoAlpha: 1,
					onComplete: function() {
						_this.done();
					}
				})
			}
		});

		pHandler.Home.init();

		Barba.Pjax.getTransition = function() {
			return FadeTransition;
		}

	} //endif

	//animates the border for the first time
	if(g.initialLoad){
		anim.animateBorder();
		anim.animateStageHome();
		if($(".jv-home").length > 0) {
			
		}
	}

	initialLoad = false;
});