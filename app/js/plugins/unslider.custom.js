/**
 *   Unslider by @idiot and @damirfoy
 *   Contributors:
 *   - @ShamoX
 *
 */

(function($, f) {
	var Unslider = function() {
    //  Object clone
		var _ = this;

		//  Set some options
		_.o = {
			speed: 500,     // animation speed, false for no transition (integer or boolean)
			delay: 3000,    // delay between slides, false for no autoplay (integer or boolean)
			init: 0,        // init delay, false for no delay (integer or boolean)
			pause: !f,      // pause on hover (boolean)
			loop: !f,       // infinitely looping (boolean)
			keys: f,        // keyboard shortcuts (boolean)
			dots: f,        // display dots pagination (boolean)
			arrows: f,      // display prev/next arrows (boolean)
			fluid: f,       // is it a percentage width? (boolean)
			starting: f,    // invoke before animation (function with argument)
			complete: f,    // invoke after animation (function with argument)
			items: '>ul',   // slides container selector
			item: '>li',    // slidable items selector
      pages: '.page',
      pagesActiveClass: 'active',
      pageTpl: '<li></li>',
      next: '',
      prev: '',
      delegateEvents: true,
      prevText: '&larr;', // text or html inside prev button (string)
      nextText: '&rarr;', // same as for prev option
			easing: 'ease',// easing function to use for animation
			autoplay: false  // enable autoplay on initialisation
		};

    var cssPrefixString = {};
    var cssPrefix = function(propertie) {
      if (cssPrefixString[propertie] || cssPrefixString[propertie] === '') return cssPrefixString[propertie] + propertie;
      var e = document.createElement('div');
      var prefixes = ['', 'Moz', 'Webkit', 'O', 'ms', 'Khtml']; // Various supports...
      for (var i in prefixes) {
        if (typeof e.style[prefixes[i] + propertie] !== 'undefined') {
          cssPrefixString[propertie] = prefixes[i];
          return prefixes[i] + propertie;
        }
      }
      return false;
    };

    var getDOMIndex = function ($items, $search) {
      for (var index = 0, length = $items.length; index < length; index++) {
        if ($items.eq(index).is($search)) {
          return index;
        }
      }

      return -1;
    };

    //  Create dots and arrows
    _.initPages = function (name, html) {
      _.pages = $(_.o.pages);

      _.pages.each(function (i, container) {
        var $container = $(container);

        var html = '<ol>';
        $.each(_.li, function(index) {
          html +=
            '<li>'+
              '<a href="#" class="' + (index === _.i ? _.o.pagesActiveClass : '') + '">'+
                (++index) +
              '</a>' +
            '</li>';
        });
        html += '</ol>';

        var $links = $container.html(html).find('a');
        $links.on('click', function (e) {
          e.preventDefault();
          var $link = $(this);

          $container.find('.'+ _.o.pagesActiveClass).removeClass(_.o.pagesActiveClass);
          $link.addClass(_.o.pagesActiveClass);
          _.stop().to(getDOMIndex($links, $link));
        });
      });

      //if (name == 'dot') {
      //  html = '<ol class="dots">';
      //  $.each(_.li, function(index) {
      //    html += '<li class="' + (index === _.i ? name + ' active' : name) + '">' + ++index + '</li>';
      //  });
      //  html += '</ol>';
      //} else {
      //  html = '<div class="';
      //  html = html + name + 's">' + html + name + ' prev">' + _.o.prevText + '</div>' + html + name + ' next">' + _.o.nextText + '</div></div>';
      //};
      //
      //_.el.addClass('has-' + name + 's').append(html).find('.' + name).click(function() {
      //  var me = $(this);
      //  me.hasClass('dot') ? _.stop().to(me.index()) : me.hasClass('prev') ? _.prev() : _.next();
      //});
    };


    _.init = function(el, o) {
			//  Check whether we're passing any options in to Unslider
			_.o = $.extend(_.o, o);

			_.el = el;
			_.ul = el.find(_.o.items);
			_.max = [el.outerWidth() | 0, el.outerHeight() | 0];
			_.li = _.ul.find(_.o.item).each(function(index) {
				var me = $(this),
					width = me.outerWidth(),
					height = me.outerHeight();

				//  Set the max values
				if (width > _.max[0]) _.max[0] = width;
				if (height > _.max[1]) _.max[1] = height;
			});



			//  Cached vars
			var o = _.o,
				ul = _.ul,
				li = _.li,
				len = li.length;

			//  Current indeed
			_.i = 0;

			//  Set the main element
			el.css({width: _.max[0], height: li.first().outerHeight(), overflow: 'hidden'});

			//  Set the relative widths
			ul.css({position: 'relative', left: 0, width: (len * 100) + '%'});
			if(o.fluid) {
				li.css({'float': 'left', width: (100 / len) + '%'});
			} else {
				li.css({'float': 'left', width: (_.max[0]) + 'px'});
			}

			//  Autoslide
			o.autoplay && setTimeout(function() {
				if (o.delay | 0) {
					_.play();

					if (o.pause) {
						el.on('mouseover mouseout', function(e) {
							_.stop();
							e.type === 'mouseout' && _.play();
						});
					};
				};
			}, o.init | 0);

			//  Keypresses
			if (o.keys) {
				$(document).keydown(function(e) {
					switch(e.which) {
						case 37:
							_.prev(); // Left
							break;
						case 39:
							_.next(); // Right
							break;
						case 27:
							_.stop(); // Esc
							break;
					};
				});
			};

			//  Dot pagination
			//o.dots && nav('dot');
      o.pages && _.initPages();
			//  Arrows support
			o.arrows && nav('arrow');

			//  Patch for fluid-width sliders. Screw those guys.
			o.fluid && $(window).resize(function() {
				_.r && clearTimeout(_.r);

				_.r = setTimeout(function() {
					var styl = {height: li.eq(_.i).outerHeight()},
						width = el.outerWidth();

					ul.css(styl);
					styl['width'] = Math.min(Math.round((width / el.parent().width()) * 100), 100) + '%';
					el.css(styl);
					li.css({ width: width + 'px' });
				}, 50);
			}).resize();

			//  Move support
			if ($.event.special['move'] || $.Event('move')) {
				el.on('movestart', function(e) {
					if ((e.distX > e.distY && e.distX < -e.distY) || (e.distX < e.distY && e.distX > -e.distY)) {
						e.preventDefault();
					}else{
						el.data("left", _.ul.offset().left / el.width() * 100);
					}
				}).on('move', function(e) {
					var left = 100 * e.distX / el.width();
				        var leftDelta = 100 * e.deltaX / el.width();
					_.ul[0].style.left = parseInt(_.ul[0].style.left.replace("%", ""))+leftDelta+"%";

					_.ul.data("left", left);
				}).on('moveend', function(e) {
					var left = _.ul.data("left");
					if (Math.abs(left) > 30){
						var i = left > 0 ? _.i-1 : _.i+1;
						if (i < 0 || i >= len) i = _.i;
						_.to(i);
					}else{
						_.to(_.i);
					}
				});
			};

			return _;
		};

		//  Move Unslider to a slide index
		_.to = function(index, callback) {
			if (_.t) {
				_.stop();
				_.play();
	                }
			var o = _.o,
				el = _.el,
				ul = _.ul,
				li = _.li,
				current = _.i,
				target = li.eq(index);

			$.isFunction(o.starting) && !callback && o.starting(el, li.eq(current));

			//  To slide or not to slide
			if ((!target.length || index < 0) && o.loop === f) return;

			//  Check if it's out of bounds
			if (!target.length) index = 0;
			if (index < 0) index = li.length - 1;
			target = li.eq(index);

			var speed = callback ? 5 : o.speed | 0,
				easing = o.easing,
				obj = {height: target.outerHeight()};

      if (!ul.queue('fx').length) {
				//  Handle those pesky dots
        _.pages.each(function (i, page) {
          var $page = $(page);
          var $links = $page.find('a');

          $links.filter('.'+ _.o.pagesActiveClass).removeClass(_.o.pagesActiveClass);
          $links.eq(index).addClass(_.o.pagesActiveClass);
        });

        _.i = index;
        _.animatedIndex = index;

        var styles = obj;
        var transition = _.getTransition(styles, speed, easing);
        if (transition) {
          el
              .css(transition)
              .css(styles);

          styles = $.extend({left: '-' + index + '00%'}, styles);
          if ($.support.transition && $.support.transition.end) {
            ul.one($.support.transition.end, function() {
              $.isFunction(o.complete) && !callback && o.complete(el, target);
            })
          }
          ul
            .css(_.getTransition(styles, speed, easing))
            .css(styles);
        } else {
          el.animate(obj, speed, easing) && ul.animate($.extend({left: '-' + index + '00%'}, obj), speed, easing, function(data) {
          _.animatedIndex = false;
          	$.isFunction(o.complete) && !callback && o.complete(el, target);
          });
        }
			}
		};

    _.getTransition = function (obj, speed, easing) {
      var cssTransition = cssPrefix('Transition');
      if (cssTransition) {
        var css = {};
        var tmp = [];
        $.each(obj || {}, function (property, value) {
          tmp.push(
              property +' '+ (speed / 1000) +'s '+ easing
          );
        });

        tmp = tmp.join(', ');
        css[cssTransition] = tmp;

        return css;
      }

      return false;
    };

		//  Autoplay functionality
		_.play = function() {
			_.t = setInterval(function() {
				_.to(_.i + 1);
			}, _.o.delay | 0);
		};

		//  Stop autoplay
		_.stop = function() {
      _.el.stop(false, true);
			_.t = clearInterval(_.t);
			return _;
		};

		//  Move to previous/next slide
		_.next = function() {
			return _.stop().to(_.i + 1);
		};

		_.prev = function() {
			return _.stop().to(_.i - 1);
		};

    //  Create dots and arrows
    function nav(name, html) {
      if (name == 'dot') {
        html = '<ol class="dots">';
        $.each(_.li, function(index) {
          html += '<li class="' + (index === _.i ? name + ' active' : name) + '">' + ++index + '</li>';
        });
        html += '</ol>';
      } else {
        html = '<div class="';
        html = html + name + 's">' + html + name + ' prev">' + _.o.prev + '</div>' + html + name + ' next">' + _.o.next + '</div></div>';
      };

      _.el.addClass('has-' + name + 's').append(html).find('.' + name).click(function() {
        var me = $(this);
        me.hasClass('dot') ? _.stop().to(me.index()) : me.hasClass('prev') ? _.prev() : _.next();
      });
    };
	};

	//  Create a jQuery plugin
	$.fn.unslider = function(o) {
		var len = this.length;

		//  Enable multiple-slider support
		return this.each(function(index) {
			//  Cache a copy of $(this), so it
			var me = $(this),
				key = 'unslider' + (len > 1 ? '-' + ++index : ''),
				instance = (new Unslider).init(me, o);

			//  Invoke an Unslider instance
			me.data(key, instance).data('key', key);
		});
	};

	Unslider.version = "1.0.0";
})(jQuery, false);
