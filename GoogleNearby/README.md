# Google nearby widget


#### [Try The Demo](http://aspetkov.github.io/)  

  

  

####Settings
In index.html  
dojoConfig must add last two rows for dgrid and dstore

```
        var dojoConfig = {
            async: true, 
            packages: [{
                name: 'viewer',
                location: location.pathname.replace(/[^\/]+$/, '') + 'js/viewer'
            },{
                name: 'config',
                location: location.pathname.replace(/[^\/]+$/, '') + 'js/config'
            },{
                name: 'gis',
                location: location.pathname.replace(/[^\/]+$/, '') + 'js/gis'
            }, {
              name: 'dgrid',
              location: '//cdn.rawgit.com/SitePen/dgrid/v0.4.0'
            }, {
              name: 'dstore',
              location: '//cdn.rawgit.com/SitePen/dstore/v1.0.1'
            }]
        };

```


Adding the following to viewer.js config file.

javascript  
```
//add showLabels: true to mapOptions
mapOptions: {  
    basemap: 'streets',  
    center: [-96.573, 39.185],  
    zoom: 14,  
    sliderStyle: 'small',  
    showLabels: true  
},

...
//add to widgets
googleNearby: {
  include: true,
  id: 'nearby',
  type: 'titlePane',
  canFloat: true,
  path: 'gis/dijit/GoogleNearby',
  title: 'Google Nearby',
  open: false,
  position: 10,
  options: {
    map: true,
    mapClickMode: true
  }
},


```

### Query string from Google database:  
**distance** AND **name** AND **keyword** AND **type**

**distance** - distance from the objects to the point in straight line (in meters)  
**name** - search only in the name of the objects  
**keyword** - search in any text related to the objects  
**type** - select from Google's list  

The results from query is up to 200 objects.

Screen from Sample page:
![Screenshot](https://github.com/aspetkov/cmv-widgets/blob/master/GoogleNearby/screenshot.PNG)

Zoom to object:
![Screenshot](https://github.com/aspetkov/cmv-widgets/blob/master/GoogleNearby/zoomto.PNG)  

If you add and StreetView widget, then remove  
'gis/plugins/async!//maps.google.com/maps/api/js?v=3&sensor=false' and   
'gis/plugins/async!//maps.googleapis.com/maps/api/js?libraries=drawing,places&sensor=false"'
from streetview.js and GoogleNearby.js   

and add  
'gis/plugins/async!//maps.googleapis.com/maps/api/js?libraries=drawing,places&sensor=false"'
to viewer.js config file.  
Because Google API can load only one time.

Using:  
https://github.com/BrianBunker/cmv-widgets/tree/master//Nearby  
and many sources from http://stackoverflow.com  
