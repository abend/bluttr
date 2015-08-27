//TODO probably should have some kind of garbage collection of all the canvases thrown around etc.  :/

var Bluttr = {
	//this is meant to ultimately be set to final product dimensions, so it can just be "trusted" as law
	//  should be landscape-mode, they say
	width: 1125,
	height: 825,

	munge: [],

	_mungePush: function(obj) {
		//TODO sanity/syntax check
		console.info('adding to munge functions: %s', obj.name);
		this.munge.push(obj);

		var ev = document.createEvent('HTMLEvents');
		ev.initEvent('bluttr:function:added', true, true);
		ev.bluttrFunction = obj;
		window.dispatchEvent(ev);
	},

	//can add a single object, or array of objects
	addTo: function(objs) { 
		if (Array.isArray(objs)) {
			for (var i = 0 ; i < objs.length ; i++) {
				this._mungePush(objs[i]);
			}
		} else {
			this._mungePush(objs);
		}
	},

	dataToContext: function(imgd) {
		var cvs = document.createElement('canvas');
		cvs.width = imgd.width;
		cvs.height = imgd.height;
		var ctx = cvs.getContext('2d');
		ctx.putImageData(imgd, 0, 0);
		return ctx;
	},

	//utility to generate a new canvas of the right size
	createCanvas: function() {
		var c = document.createElement('canvas');
		c.width = this.width;
		c.height = this.height;
		return c;
	},

	//callback will get passed the canvas with the image in it
	//NOTE: due to crossdomain security problems, unless you have CORS headers set where the image lives, these must be on url hosting this js
	urlToContext: function(url, callback) {
		var i = new Image();
		var c = document.createElement('canvas');
		var ctx = c.getContext('2d');
		i.onload = function() {
			ctx.drawImage(this, 0, 0);
			callback(ctx);
		}
		i.src = url;
	},

	randomRGB: function() {
		var c = [];
		for (var i = 0 ; i < 3 ; i++) {
			c.push(Math.floor(Math.random() * 256));
		}
		return c;
	},
	randomRGBA: function() {
			var c = this.randomRGB();
			c.push(Math.floor(Math.random() * 256));
			return c;
	},
	randomRGBStyle: function() {
		return 'rgb(' + this.randomRGB().join(',') + ')';
	},
	randomRGBAStyle: function() {
		return 'rgba(' + this.randomRGBA().join(',') + ')';
	},

	//returns 0-n (for n functions), randomly but weighted
	getMungeIndex: function() {
		var offsets = [];
		for (var i = 0 ; i < this.munge.length ; i++) {
			if (this.munge[i].weight == undefined) this.munge[i].weight = 5;
			if (this.munge[i].weight <= 0) continue;
			for (var j = 0 ; j < this.munge[i].weight ; j++) {
				offsets.push(i);
			}
		}
		//console.log('offsets %o', offsets);
		return offsets[Math.floor(Math.random() * offsets.length)];
	},

	uuid: function() {   //  h/t https://stackoverflow.com/a/105074/1525311
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	},


//////////////////// from here these are more internal/experimental. or probably not very useful? or boring? /////////////////////////////

	//meant to find functions and apply them
	mix: function(imgd1, imgd2, callback) {
		var i = Bluttr.getMungeIndex();
		console.info('applying %s [rnd=%d]', Bluttr.munge[i].name, i);
		//we can handle straight up return value or callback
		var rtn = Bluttr.munge[i].f(imgd1, imgd2, callback);
		if ((typeof rtn == 'object') && (rtn.constructor == ImageData)) {
			callback(rtn);
		}
	},

};



//my own sort of playground of testing out functions.  these are decidedly not art. or are they?
Bluttr.addTo([
/*
	{
		f: function(c1, c2) {
			return c1;
		},
		name: 'naught-e'
	},
*/
	// {
	// 	f: function(imgd) {
	// 		var d = imgd.data;
	// 		for (var i = 0 ; i < d.length ; i++) {
	// 			if (i % 4 == 3) continue;  //skip the alpha
	// 			d[i] = 255 - d[i];
	// 		}
	// 		return imgd;
	// 	},
	// 	name: 'inverse'
	// },

/*
	{
		f: function(i1, i2) {
			var d1 = i1.data;
			var d2 = i2.data;
			var dout = new ImageData(i1.data, i1.width, i1.height);
			for (var i = 0 ; i < d1.length ; i++) {
				if (i % 4 == 3) continue;  //skip the alpha
				dout.data[i] = (d1[i] * d2[i]) / 255;
//if (i % 500 == 0) console.log('%d) (%o - %o) -> %d', i, d1[i], d2[i], dout.data[i]);
			}
			return dout;
		},
		name: 'multiply'
	},
*/

	{
		f: function(imgd) {
			var ctx = Bluttr.dataToContext(imgd);
			ctx.beginPath();
			var r = Math.random() * 20 + 10;
			var cx = Math.random() * (imgd.width - r*2) + r;
			var cy = Math.random() * (imgd.height - r*2) + r;
			ctx.arc(cx, cy, r, 0, 2*Math.PI);
			ctx.strokeStyle = 'blue';
			ctx.fillStyle = 'green';
			ctx.fill();
			ctx.lineWidth = 5;
			ctx.stroke();
			return ctx.getImageData(0, 0, imgd.width, imgd.height);
		},
		name: 'circly'
	},
]);


