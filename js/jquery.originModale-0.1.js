jQuery(function($) {
	var num = 0;
	var error = false;
	var body = $('body');
	var rightalign = false;
	var rect = {
		x: false,
		y: false,
		w: false,
		h: false
	};

	var frameRect = {
		x: false,
		y: false,
		w: false,
		h: false
	};
	
	var modal = {
		init: false,
		lockPosition: false,
		showing: false,
		ready: false,
		loading: false,
		transition: false,
		anim: false,
		content: false,
		drawed: false,
		dataReady: false,
		close_btn: '<a href="#" id="omclose">Close</a>'
	};

	// Pointers to gui
	var gui = {
		canvas: false,
		bg: false,
		modal: false,
		loader: false,
		c_holder: false,
		close_btn: false,
		debug: false
	};
	
	
	var config = {
		zIndexStart: 500,
		openSelector: ".originModale",
		removeSelector: ".originModaleHide",
		displayHide: true,
		debug: false,
		framePadding: 10,
		niceOffset: 20,
		triWidth: 10,
		triHeight: 20,
		triOffset: 20,
		frameBackground: '#fff',
		frameStrokeWidth: 2,
		frameStrokeColor: '#ccc',
		frameShadowBackground: '#000',
		frameShadowBlur: 10,
		frameShadowOffsetY: 1,
		frameShadowOffsetX: 1
	};
	
	$.fn.originModale = function(settings) {
		
		if (settings) $.extend(config, settings);
		
		if(!modal.init) {
			initModale();
		}
 		
		this.each(function() {
			$(this).unbind('click.originModale')
			.bind('click.originModale', function(e) {
				debug("click.originModale");
				if(e.isDefaultPrevented())
					return false;
				e.preventDefault();
				if(rect.x == false) {
					rect.x = e.clientX;
					rect.y = e.clientY;
					if(e.clientX > (body.width()/2)) {
						rightalign = true;
					} else {
						rightalign = false;
					}
					
				}
				debug(rect);
				processModal(this);
				return false;
			});
		});
		return this;
	};
	
	function processModal(el) {
		//debug('processModal');
		
		if (modal.loading || modal.transition || modal.anim) {
			return;
			debug('return');
		}
		
		var tmp_url = $(el).attr('href');
		if((typeof tmp_url == 'string') || tmp_url != "") {
			modal.drawed = false;

			if(!modal.showing) {
				showBackground(endBackground);
				modal.lockPosition = false;
			} else {
				modal.lockPosition = true;
				hideContent();
			}

			showLoading();
			loadAjax(tmp_url);
		}
		
	}
	
	function loadAjax(url) {
		debug("loadAjax:" + url);
		//setTimeout( endAjax, 100 );
		$.ajax({
			url: url,
			success: loadedAjax,
			error: loadingError,
			cache: false,
			dataType: 'html'
		});
		//endAjax();
	}
	// Filter an html content to remove the script[src]
	function filterScripts(data) {
		// Removing the body, head and html tag
		if (typeof data == 'string')
			data = data.replace(/<\/?(html|meta|title|head|body)([^>]*)>/gi, '');
		var tmp = new Array();
		$.each($.clean({0:data}, this.ownerDocument), function() {
			if ($.nodeName(this, "script")) {
				if (!this.src || $(this).attr('rel') == 'forceLoad') {
					if ($(this).attr('rev') == 'shown')
						modal.scriptsShown.push(this);
					else
						modal.scripts.push(this);
				}
			} else
				tmp.push(this);
		});
		debug(tmp);
		return tmp;
	}
	
	function loadedAjax(data) {
		debug("endAjax" + this.url);
		modal.content = '<div>'+data+'</div>';

		if (modal.content) {
			modal.dataReady = true;
			showContentOrLoading();
		} else {
			loadingError();
		}
	}
	
	function showContentOrLoading() {
		debug("showContentOrLoading");
		if (modal.ready && !modal.anim) {
			if (modal.dataReady) {
				if (modal.content) {
					//modal.anim = true;
					if(modal.loading) {
						hideLoading(showContent);
					} else {
						showContent();
					}
				}
			} else {
				if(!error) {
					showLoading(showContentOrLoading);
				}
				
			}
		}
	}
	
	function loadingError() {
		debug("loadingError");
		error = true;
	}
	
	function showContent() {
		drawContent();
	}
	
	function hideContent() {
		gui.canvas.fadeOut();
		gui.modal.fadeOut();
	}
	
	function drawContent() {
		
		if(modal.drawed) {
			return;
		}
		modal.drawed = true;
		debug("drawContent");
		gui.c_holder.html("");
		gui.c_holder.append(modal.content);
		
		// Reset both containers 
		gui.c_holder.add(gui.modal).css({
			width: 'auto',
			height: 'auto'
		});
		gui.modal.css({
			opacity: 0
		}).show();
		var width = gui.c_holder.outerWidth(true);
		var height = gui.c_holder.height();
		updateRects(width, height);
		gui.modal.css({
			top: rect.y  + "px",
			left: rect.x + "px"
		});
		
		drawFrame();
		//gui.modal.hide();
		gui.modal.css({
				opacity: 1,
				width: rect.w + "px",
				heigth: rect.h + "px"
			}).hide().fadeIn();
		//modal.content = false;
		$(config.openSelector, gui.c_holder).originModale(config);
		$(config.removeSelector, gui.c_holder).bind('click', hide);
		drawFrame();
	}
	
	function updateRects(width, height) {
		var xAdjust = config.framePadding + config.triWidth + config.niceOffset;
		var yAdjust = config.framePadding - config.triOffset - (config.triHeight/2);
		//var tmprect
		if(!modal.lockPosition) {
			if(rightalign) {
				rect.x = rect.x - width - xAdjust;
			} else {
				rect.x = rect.x + xAdjust;
				
			}
			rect.y = rect.y + yAdjust;
		} else {
			if(rightalign) {
				rect.x = rect.x - (width-rect.w);
			}
		}
		
		rect.w = width;
		rect.h = height

		
		frameRect = {
			x: rect.x - config.framePadding,
			y: rect.y - config.framePadding,
			w: rect.w + (config.framePadding*2),
			h: gui.modal.height() + (config.framePadding*2)
		};
	}
	
	
	function drawFrame() {
		gui.canvas.show();
		var offset = config.triOffset;
		var canvas = document.getElementById('omcanvas');  //$('#mycanvas');
		canvas.width = gui.bg.width();
		canvas.height = gui.bg.height();
		if (canvas.getContext){
			//console.log(canvas);
		    var context = canvas.getContext('2d');

			context.shadowOffsetX = config.frameShadowOffsetX;
			context.shadowOffsetY = config.frameShadowOffsetY;
			context.shadowBlur    = config.frameShadowBlur;
			context.shadowColor   = config.frameShadowBackground;
			if(config.frameStrokeWidth > 0) {
				context.strokeStyle = config.frameStrokeColor;
				context.lineWidth   = config.frameStrokeWidth;
			}
			
			context.fillStyle     = config.frameBackground;
			//context.fillRect(frameRect.x, frameRect.x, frameRect.w, frameRect.h);
			context.beginPath();
			// Start from the top-left point.
			context.moveTo(frameRect.x, frameRect.y);
			
			if(rightalign == false) {
				// left arrow start
				context.lineTo(frameRect.x, (frameRect.y + offset));
				context.lineTo(frameRect.x-config.triWidth, frameRect.y + offset + (config.triHeight/2));
				context.lineTo(frameRect.x, frameRect.y + offset + config.triHeight);
				// left arrow end
			}
			
			context.lineTo(frameRect.x, frameRect.y+frameRect.h);
			context.lineTo(frameRect.x+frameRect.w, frameRect.y+frameRect.h);
			if(rightalign) {
				context.lineTo(frameRect.x+frameRect.w, frameRect.y + config.triHeight + offset);
				context.lineTo(frameRect.x+frameRect.w+config.triWidth, frameRect.y + offset + (config.triHeight/2));
				context.lineTo(frameRect.x+frameRect.w, frameRect.y+offset);
			}
			context.lineTo(frameRect.x+frameRect.w, frameRect.y);
			context.lineTo(frameRect.x, frameRect.y);
			context.fill();
			if(config.frameStrokeWidth > 0) {
				context.shadowOffsetX = 0;
				context.shadowOffsetY = 0;
				context.shadowBlur    = 0;
				context.stroke();
			}
			
			context.closePath();
		}
			
	}
	function canvasClick(e) {
		var tmp_x = e.clientX;
		var tmp_y = e.clientY;
		var hit = false;
		console.log(frameRect);
		console.log(tmp_x + "," + tmp_y);
		if( (tmp_x > frameRect.x && tmp_x < (frameRect.x + frameRect.w)) ) {
			if( (tmp_y > frameRect.y && tmp_y < (frameRect.y + frameRect.h)) ) {
				hit = true;
			}
			
		}
		if(!hit) hide(e);
	}
	
	function initModale() {
		//alert(body);
		debug("initModale");
		var contain = body;
		if(config.debug) {
			contain.append($('<div id="omdebug"></div>'));
			gui.debug = $('#omdebug').css({zIndex: config.zIndexStart + 1}).hide();
		}
		
		contain.append($('<div id="omwrapper"><div id="omholder"></div></div><div id="omloading">Loading..</div><canvas id="omcanvas"></canvas><div id="ombg"></div>').hide());
		gui.bg = $('#ombg').css({zIndex: config.zIndexStart}).hide();
		gui.loader = $('#omloading').css({zIndex: config.zIndexStart + 3}).hide();
		gui.modal = $('#omwrapper').css({zIndex: config.zIndexStart + 4, backgroundColor: '#eee'}).hide();
		gui.canvas = $('#omcanvas').css({zIndex: config.zIndexStart + 2}).hide();
		gui.c_holder = $('#omholder', gui.modal);
		if(config.displayHide) {
			gui.modal.prepend( modal.close_btn );
			gui.close_btn = $('#omclose', gui.modal);
			gui.close_btn.bind('click', hide);
			
		}
		gui.canvas.bind('click', canvasClick);
		gui.modal.bind('click', function() {return false;})
		modal.init = true;
	}
	
	function hide(e) {
		debug("hide");
		e.preventDefault();
		num = 0;
		if(modal.loading) {
			hideLoading();
		} else {
			
			hideContent();
		}
		
		modal.content = false;
		gui.c_holder.html("");
		

		hideBackground()
		
		for (var key in rect) {
		  rect[key] = false;
		}
		return false;
	}
	
	
	function showBackground(callback) {
		debug('showBackground');
		if(config.debug) {
			gui.debug.show();
		}
		modal.showing = true;
		modal.anim = true;
		gui.bg.show().css({opacity:0}).fadeTo(500, 0.75, callback);
	}
	
	function endBackground() {
		debug('endBackground');
		
		modal.ready = true;
		modal.anim = false;
		showContentOrLoading();
	}
	
	function hideBackground() {
		modal.showing = false;
		modal.anim = false;
		modal.ready = false;
		if(config.debug) {
			gui.debug.html("").hide();
		}
		
		gui.bg.fadeOut().hide();
	}
	
	function showLoading(callback) {
		debug("showLoading");
		modal.loading = true;
		gui.loader.show().css({opacity:0}).fadeTo(500, 1, callback);
	}
	function hideLoading(callback) {
		debug("hideLoading");
		if(modal.loading) {
			gui.loader.fadeOut("normal", callback).hide();
			modal.loading = false;
		}
		
	}
	
	
	
	function animateModal() {
		
	}
	
	
	
	
	function debug(msg) {
		num++;
		if(config.debug) {
			if(gui.debug) {
				gui.debug.prepend(num + msg+'<br />');
			} 

			if(console) {
				console.log(msg);
			}
		}
		 
		
	}
 
});