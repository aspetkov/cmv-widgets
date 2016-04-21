# Google nearby widget



Use by adding the following to viewer.js config file.

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

The results from query is up to 200 objects.

Screen from Sample page:
![Screenshot](https://github.com/aspetkov/cmv-widgets/blob/master/screenshot.PNG)

Zoom to object:
![Screenshot](https://github.com/aspetkov/cmv-widgets/blob/master/zoomto.PNG)  

If you add and StreetView widget, then remove  
'gis/plugins/async!//maps.google.com/maps/api/js?v=3&sensor=false'  
from streetview.js.
Because Google API can load only one time.

Using:  
https://github.com/BrianBunker/cmv-widgets/tree/master//Nearby  
and many sources from http://stackoverflow.com  
