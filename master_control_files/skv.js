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
      var offset = 4 * (y * img.width + x);
      func(img, x, y, offset);
    }
  }
}

// Bluttr.addTo([
//   {
//     name: 'lumshift',
//     weight: 10,
//     f: function(img1, img2) {
//       var bufSize = imgBufSize(img1);

//       doPixels(img1, function(img, x, y, offset) {
//         var lum = luminance(img, offset);
//         var newoffset = (offset + lum) % bufSize;
//         if (x == 0 && y % 100 == 0) { console.log(lum + " shifting " + x + "," + y + " (offset " + offset + ") by " + (newoffset - offset)); }
//         for (var i = 0 ; i < 4 ; i++) {
//           img1.data[offset + i] = img2.data[newoffset + i];
//         }
//       });

//       return img1;
//     }
//   }

// ]);

function histogram(image, count) {
  var histo = {};

  doPixels(image, function(img, x, y, offset) {
    var key = offsetToKey(img, offset);
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

function setColor(img, x, y, color) {
  var offset = 4 * (y * img.width + x);
  for (var i = 0 ; i < 4 ; i++) {
    img.data[offset + i] = color[i];
  }
}

/*
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

      doPixels(img2, function(img, x, y, offset) {
        var index = Math.floor(x / step);
        var k = keys[index];
        var color = keyToColor(k);

        for (var i = 0 ; i < 4 ; i++) {
          img2.data[offset + i] = color[i];
        }
      });

      return img2;
    }
  }

]);
*/

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
