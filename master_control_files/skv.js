function offset(img, x, y) {
  return 4 * (y * img.width + x);
}

// function linearWrapIndex(img, x, y) {
//   var w = img.width;
//   var h = img.height;
//   return (x + (y * w)) % (w * h);
// }

function luminance(img, offset) {
  var lum = 0;
  for (var i = 0 ; i < 3 ; i++) {
    lum += img.data[offset + i];
  }

  return lum / 3;
}

function imgBufSize(img) {
  return img.width * img.height * 4;
}

function doPixels(img, func) {
  for (var y = 0; y < img.height; y++) {
    for (var x = 0; x < img.width; x++) {
      func(img, x, y);
    }
  }
}

function histogram(image, count) {
  var histo = {};

  doPixels(image, function(img, x, y) {
    var key = offsetToKey(img, offset(img, x, y));
    if (key in histo) {
      histo[key] += 1;
    } else {
      histo[key] = 1;
    }
  });

  return histo;
}

var hsl = false;

function offsetToKey(img, offset) {
  var r = img.data[offset + 0] & 0xff;
  var g = img.data[offset + 1] & 0xff;
  var b = img.data[offset + 2] & 0xff;
  var a = img.data[offset + 3] & 0xff;

  var hsl = rgbToHsl(r, g, b);

  //return r << 24 | g << 16 | b << 8 | a;
  if (hsl) {
    return hsl[0] << 24 | hsl[1] << 16 | hsl[2] << 8 | a;
  } else {
    return hsl[1] << 24 | hsl[0] << 16 | hsl[2] << 8 | a;
  }
}

function keyToColor(key) {
  // (really hsl)
  var r,g,b;
  if (!hsl) {
    g = (key & 0xFF000000) >>> 24;
    r = (key & 0x00FF0000) >>> 16;
    b = (key & 0x0000FF00) >>> 8;
  } else {
    r = (key & 0xFF000000) >>> 24;
    g = (key & 0x00FF0000) >>> 16;
    b = (key & 0x0000FF00) >>> 8;
  }
  var a = (key & 0x000000FF);

  var rgb = hslToRgb(r,g,b);

  return [rgb[0],rgb[1],rgb[2],a];
}

// thanks http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 255, s * 255, l * 255];
}

function hslToRgb(h, s, l) {
  h /= 255, s /= 255, l /= 255;

  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t) {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function setColor(img, x, y, colr) {
  var oset = offset(img, x, y);
  for (var i = 0 ; i < 4 ; i++) {
    img.data[oset + i] = colr[i];
  }
}

function getColor(img, x, y) {
  return getColorOS(img, offset(img, x, y));
}

function getColorOS(img, oset) {
  return [img.data[oset + 0],
          img.data[oset + 1],
          img.data[oset + 2],
          img.data[oset + 3]];
}

function toCSSColor(c) {
  return 'rgba(' + c.join(',') + ')';
}

function toDegrees (angle) {
  return angle * (180 / Math.PI);
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}


Bluttr.addTo([
  {
    name: 'spintogram',
    weight: 10,
    f: function(img1, img2) {
      var histo = histogram(img1);
      var keys = Object.keys(histo);
      var keycount = keys.length;
      if (Math.random() > .5) {
        keys.sort(function(a, b) {return a - b;});
      } else {
        keys.sort(function(a, b) {return histo[a] - histo[b];});
      }

      // fill bg with most common color
      var mostpop = keys[0];
      for (var i = 1; i < keycount; i++) {
        var ky = keys[i];
        if (histo[ky] > histo[mostpop]) {
          mostpop = ky;
        }
      }

			var ctx = Bluttr.dataToContext(img1);
      ctx.beginPath();
      ctx.rect(0, 0, img1.width, img1.height);
      ctx.fillStyle = toCSSColor(keyToColor(mostpop));
      ctx.fill();

      var step = 360 / (keycount - 1);
      console.log("step is " + step);
      var pixcount = img1.width * img1.height;
      var vscale = 1.1 * img1.height / Math.log(pixcount);

      var w = Math.ceil(step);
      var xmid = img1.width / 2;
      var ymid = img1.height / 2;

      for (var j = 1; j < keycount; j++) {
        var k = keys[j];
        var color = keyToColor(k);
        var mag = histo[k];

        var r = Math.floor(Math.log(mag) * vscale);
        var theta = toRadians(j * step);

        var x = Math.floor(r * Math.cos(theta));
        var y = Math.floor(r * Math.sin(theta));

        ctx.beginPath();
        ctx.moveTo(xmid, ymid);
        ctx.lineTo(xmid + x, ymid + y);
        if (Math.random() > .5) {
          ctx.lineWidth = 1;
        } else {
          var magpct = mag / pixcount;
          ctx.lineWidth = Math.max (1, magpct / 5);
        }
        ctx.strokeStyle = toCSSColor(color);
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // maybe a circle cap
      var docirc = Math.random();
      if (docirc > .5) {
        ctx.beginPath();
        var circrad = Math.random() * img1.height / 4 + img1.height / 5;
        ctx.arc(xmid, ymid, circrad, 0, Math.PI * 2);
        ctx.fillStyle = toCSSColor(keyToColor(mostpop));
        ctx.fill();
      }

			return ctx.getImageData(0, 0, img1.width, img1.height);
    }
  }
]);

Bluttr.addTo([
  {
    name: 'amptogram',
    weight: 10,
    f: function(img1, img2) {
      var histo = histogram(img1);
      var keys = Object.keys(histo);
      var keycount = keys.length;
      keys.sort(function(a, b) {return a - b;});

      //console.log(histo);

      // fill bg with most common color
      var mostpop = keys[0];
      for (var i = 1; i < keycount; i++) {
        var ky = keys[i];
        if (histo[ky] > histo[mostpop]) {
          mostpop = ky;
        }
      }

      //console.log("most pop color: " + mostpop + ": " + histo[mostpop] + ": " + keyToColor(mostpop));

			var ctx = Bluttr.dataToContext(img1);
      ctx.beginPath();
      ctx.rect(0, 0, img1.width, img1.height);
      ctx.fillStyle = toCSSColor(keyToColor(mostpop));
      ctx.fill();

      var step = img1.width / (keycount - 1);
      console.log("step is " + step);
      var pixcount = img1.width * img1.height;
      var vscale = img1.height / Math.log(pixcount);

      var w = Math.ceil(step);
      var mid = img1.height / 2;

      for (var j = 1; j < keycount; j++) {
        var k = keys[j];
        var color = keyToColor(k);
        var mag = histo[k];

        var x = Math.floor((j - 1) * step);
        var h = Math.floor(Math.log(mag) * vscale);

        ctx.beginPath();
        ctx.rect(x, mid, w, -h/2);
        ctx.fillStyle = toCSSColor(color);
        ctx.fill();

        ctx.beginPath();
        ctx.rect(x, mid, w, h/2);
        ctx.fillStyle = toCSSColor(color);
        ctx.fill();
      }

			return ctx.getImageData(0, 0, img1.width, img1.height);
    }
  }
]);

Bluttr.addTo([
  {
    name: 'lumshift',
    weight: 10,
    f: function(img1, img2) {
      var bufSize = imgBufSize(img1);

      doPixels(img1, function(img, x, y) {
        var oset = offset(img, x, y);
        var lum = Math.floor(luminance(img, oset));
        var newoffset = (oset + lum * 4) % bufSize;
        setColor(img1, x, y, getColorOS(img2, newoffset));
      });

      return img1;
    }
  }
]);

Bluttr.addTo([
  {
    name: 'colorspread',
    weight: 1,
    f: function(img1, img2) {
      var histo = histogram(img1);
      var keys = Object.keys(histo);
      var len = keys.length;

      keys.sort(function(a, b) {return a - b;});

      var step = img2.width / len;

      doPixels(img2, function(img, x, y) {
        var index = Math.floor(x / step);
        var k = keys[index];
        var color = keyToColor(k);

        setColor(img2, x, y, color);
      });

      return img2;
    }
  }
]);

Bluttr.addTo([
  {
    name: 'sortpix',
    weight: 1,
    f: function(img1, img2) {
      var histo = histogram(img1);
      var keys = Object.keys(histo);
      var keycount = keys.length;

      keys.sort(function(a, b) {return a - b;});

      var x = 0;
      var y = 0;

      var destSize = img1.width * img1.height;

      for (var i = 0; i < keycount; i++) {
        var k = keys[i];
        var color = keyToColor(k);
        var runlength = histo[k];
        //console.log(x + "," + y + ": switch to color " + color + " for " + runlength);
        for (var j = 0; j < runlength; j++) {
          setColor(img1, x, y, color);
          x++;
          if (x > img1.width) {
            x = 0;
            y++;
          }
        }
      }

      return img1;
    }
  }
]);

/*
 sort
 circlesort
 starsort
 histo
 thresh
 histo squares
 histo spheres
 sort colors, spin histo
*/
