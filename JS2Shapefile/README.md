
A javascript library for generating ESRI shapefiles in the client from Arcgis javascript map graphics with supporting a UTF-8 encoding.


Writes a shapefile in pure javascript.

Export a shapefile as zip with jszip library.

Requires a capable modern browser with Typed Arrays. 

Support Geometries: Point, Line, Polygon.

Samples:

[GoogleNearby](http://aspetkov.github.io/)

[Test_graphics_add](http://aspetkov.github.io/JS2Shapefile/Test_graphics_add.html)

[Test_find_map_datagrid](http://aspetkov.github.io/JS2Shapefile/Test_find_map_datagrid.html)



How to use a library

```
 define([

    ...
    'jszip',

    // not referenced

    './JS2Shapefile',

], function (

    ...

        //from https://github.com/tmcgee/cmv-widgets/blob/master/widgets/Export.js
        downloadFile: function (content, mimeType, fileName, useBlob) {

            mimeType = mimeType || 'application/octet-stream';
            var url;
            var dataURI = 'data:' + mimeType + ',' + content;
            var link = document.createElement('a');
            var blob = new Blob([content], {
                'type': mimeType
            });

            // feature detection
            if (typeof (link.download) !== 'undefined') {
                // Browsers that support HTML5 download attribute
                if (useBlob) {
                    url = window.URL.createObjectURL(blob);
                } else {
                    url = dataURI;
                }
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style = 'visibility:hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return null;

                //feature detection using IE10+ routine
            } else if (navigator.msSaveOrOpenBlob) {
                return navigator.msSaveOrOpenBlob(blob, fileName);
            }

            // catch all. for which browsers?
            window.open(dataURI);
            window.focus();
            return null;
        },

        exportShapefile: function () {

            // for longitude and latitude
            var coordSystem = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';
            var zip = new JSZip();

            if (map.graphics.graphics.length > 0) {
                var outputObject = window.JS2Shapefile.createShapeFiles(map.graphics.graphics, 'UTF8', coordSystem);

                for (var createdFile in outputObject) {
                    if (outputObject[createdFile]['successful']) {
                        for (var fileInShape in outputObject[createdFile]['shapefile']) {
                            zip.file(outputObject[createdFile]['shapefile'][fileInShape]['name'], outputObject[createdFile]['shapefile'][fileInShape]['blob']);
                        }
                    }
                }
                var that = this;
                zip.generateAsync({ type: "arraybuffer" })
                    .then(function (arraybuffer) {
                        that.downloadFile(arraybuffer, 'application/zip', 'GoogleNearbyShapefile.zip', true);
                    });
            }
        }



OR


    <script type="text/javascript" src="jszip.js"></script>
    <script src="https://js.arcgis.com/3.17/"></script>
    <script type="text/javascript" src="./JS2Shapefile.js"></script>


...
      require([
...
      ], function(

        function exportToShapefile() {
            //for Esri
            var coordSystem = 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere", GEOGCS["GCS_WGS_1984", DATUM["D_WGS_1984", SPHEROID["WGS_1984", 6378137.0, 298.257223563]], PRIMEM["Greenwich", 0.0], UNIT["Degree", 0.0174532925199433]], PROJECTION["Mercator_Auxiliary_Sphere"], PARAMETER["False_Easting", 0.0], PARAMETER["False_Northing", 0.0], PARAMETER["Central_Meridian", 0.0], PARAMETER["Standard_Parallel_1", 0.0], PARAMETER["Auxiliary_Sphere_Type", 0.0], UNIT["Meter", 1.0]]';
            var zip = new JSZip();

            if (map.graphics.graphics.length > 0) {
                var outputObject = window.JS2Shapefile.createShapeFiles(map.graphics.graphics, 'UTF8', coordSystem);

                for (var createdFile in outputObject) {
                    if (outputObject[createdFile]['successful']) {
                        for (var fileInShape in outputObject[createdFile]['shapefile']) {
                            zip.file(outputObject[createdFile]['shapefile'][fileInShape]['name'], outputObject[createdFile]['shapefile'][fileInShape]['blob']);
                        }
                    }
                }
                zip.generateAsync({ type: "arraybuffer" })
                    .then(function (arraybuffer) {
                        downloadFile(arraybuffer, 'application/zip', 'GoogleNearbyShapefile.zip', true);
                    });
            }
        }

          //from https://github.com/tmcgee/cmv-widgets/blob/master/widgets/Export.js
          function downloadFile(content, mimeType, fileName, useBlob) {

              mimeType = mimeType || 'application/octet-stream';
              var url;
              var dataURI = 'data:' + mimeType + ',' + content;
              var link = document.createElement('a');
              var blob = new Blob([content], {
                  'type': mimeType
              });

              // feature detection
              if (typeof (link.download) !== 'undefined') {
                  // Browsers that support HTML5 download attribute
                  if (useBlob) {
                      url = window.URL.createObjectURL(blob);
                  } else {
                      url = dataURI;
                  }
                  link.setAttribute('href', url);
                  link.setAttribute('download', fileName);
                  link.style = 'visibility:hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  return null;

                  //feature detection using IE10+ routine
              } else if (navigator.msSaveOrOpenBlob) {
                  return navigator.msSaveOrOpenBlob(blob, fileName);
              }

              // catch all. for which browsers?
              window.open(dataURI);
              window.focus();
              return null;
          }...
```




[UTF-8 encoder function from:](https://github.com/mathiasbynens/utf8.js)

[dbf file format](http://www.clicketyclick.dk/databases/xbase/format/dbf.html#DBF_NOTE_6_TARGET)

[shapefile format](https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf)

[jszip:](http://stuartk.com/jszip)

[Upgraded from:](https://code.google.com/archive/p/js2shapefile/)
