//SPRITE
function Sprite(images, width, height) {
	this.images = images;
	this.debug = false;
	this.updateRect(0,0,width,height);
	this.elapsedTime = 0;
	this.currentImageIndex = 0;
	this.millisPerImage = 36;
	this.type = 'crop';
}

Sprite.prototype = {
	updateRect: function(x,y,width,height){
		this.rect = {x:x, y:y, width:width, height:height};
	},

	draw: function(ctx, elapsedTime){
		var rect = this.rect;
		var dest = {x:rect.x, y:rect.y, w:rect.width, h:rect.height};
		var image = this.images[this.currentImageIndex];
		switch(this.type) {
			case 'deform':
				ctx.drawImage(image, dest.x, dest.y, dest.w, dest.h);
			break;
			case 'crop':
				var src = {
					x:(image.width-dest.w)/2, 
					y:(image.height-dest.h)/2, 
					w:dest.w, 
					h:dest.h
				};
				ctx.drawImage(image, src.x, src.y, src.w, src.h, dest.x, dest.y, dest.w, dest.h);
			break;
			case 'repeat':
				var timesX = dest.w/image.width;
				var timesY = dest.h/image.height;
				for(var i = 0; i < timesX; i++) {
					for(var j = 0; j < timesY; j++) {
						var w = image.width;
						var h = image.height;
						if(timesX - i < 1) {
							w *= (timesX - i);
						}
						if(timesY - j < 1) {
							h *= (timesY - j);
						}
						ctx.drawImage(image, 0, 0, w, h, dest.x+i*image.width, dest.y+j*image.height, w, h);
					}	
				}
			break;
		}
		this.elapsedTime += elapsedTime;
		if(this.elapsedTime > this.millisPerImage) {
			this.currentImageIndex++;
			this.elapsedTime = 0;
			if(this.currentImageIndex == this.images.length) {
				this.currentImageIndex = 0;
			}
		}
		if(this.debug) {
			ctx.strokeStyle="rgb(255,0,0)";
			ctx.strokeRect(rect.x,rect.y,rect.width,rect.height);
		}
	},

	enableDebug: function(enable) {
		this.debug = enable;
	},

	move: function(x,y) {
		this.updateRect(x,y,this.rect.width, this.rect.height);
	},

	scaleType: function(type) {
		if(type == 'crop' || type == 'deform' || type == 'repeat') {
			this.type = type;
		}
	}
}

//ASSETS
function Assets(){
	this.allImages = [];
	this.toLoad = [];
}

Assets.prototype = {
	load: function(loading, load) {
		var count = this.toLoad.length;
		var remaining = count;
		var self = this;

		loading(0, count);
		self.toLoad.forEach(function(element, index, array){
			var image = new Image();
			image.src = element.src;
			image.onload = function() {
				self.allImages[element.name] = image;
				loading(count-remaining+1, array.length);
				remaining--;
				if(remaining == 0){
					load();
					self.toLoad = [];
				}
			}
		});
	},

	add: function(name, src) {
		this.toLoad.push({name:name, src:src});
	},

	get: function(name) {
		return this.allImages[name];
	}
}