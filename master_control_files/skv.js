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

function offsetToKey(img, offset) {
  var r = img.data[offset + 0] & 0xff;
  var g = img.data[offset + 1] & 0xff;
  var b = img.data[offset + 2] & 0xff;
  var a = img.data[offset + 3] & 0xff;
  return r << 24 | g << 16 | b << 8 | a;
}

function keyToColor(key) {
  var r = (key & 0xFF000000) >>> 24;
  var g = (key & 0x00FF0000) >>> 16;
  var b = (key & 0x0000FF00) >>> 8;
  var a = (key & 0x000000FF);
  return [r,g,b,a];
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

      console.log(keys);
      console.log(histo);

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
