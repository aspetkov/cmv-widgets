
A javascript library for generating ESRI shapefiles in the client from Arcgis javascript map graphics with supporting a UTF-8 encoding.


Writes a shapefile in pure javascript.

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

    // not referenced

    './JS2Shapefile',

], function (

    ...

       exportShapefile: function () {

            // for longitude and latitude
            var coordSystem = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';

            if (map.graphics.graphics.length > 0) {
                window.JS2Shapefile.createShapeFiles(map.graphics.graphics, 'UTF8', coordSystem);
                return;
            }

        }


OR


<script type="text/javascript" src="../src/JS2Shapefile.js"></script>


...
      require([
...
      ], function(

        window.JS2Shapefile.createShapeFiles(itemsGraphics, 'UTF8', coordSystem);
...
```




[UTF-8 encoder function from:](https://github.com/mathiasbynens/utf8.js)

[dbf file format](http://www.clicketyclick.dk/databases/xbase/format/dbf.html#DBF_NOTE_6_TARGET)

[shapefile format](https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf)

[Upgraded from:](https://code.google.com/archive/p/js2shapefile/)
