define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/topic',
    'dojo/_base/Color',
    'dojo/dom-construct',

    'put-selector',

    // mixins & base classes
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',

    './_SelectionLayersMixin',

    // mapping & geo!
    'esri/config',
    'esri/graphic',
    'esri/layers/FeatureLayer',

    'esri/tasks/GeometryService',
    'esri/tasks/DistanceParameters',

    'esri/toolbars/draw',

    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/PictureMarkerSymbol',

    'esri/symbols/TextSymbol',
    'esri/layers/LabelClass',

    'esri/geometry/Point',
    'esri/geometry/Circle',
    'esri/geometry/Polygon',
    'esri/geometry/Polyline',
    'esri/geometry/webMercatorUtils',

    'dojo/on',
    'dojo/Deferred',

    'dstore/Trackable',
    'dgrid/extensions/DijitRegistry',
    'dstore/Memory',

    'dgrid/OnDemandGrid',
    'dgrid/Selection',
    'dgrid/Keyboard',

    'dijit/Dialog',

    'dojo/window',

    '//cdnjs.cloudflare.com/ajax/libs/proj4js/2.3.3/proj4.js',

    // templates & widget css
    'dojo/text!./GoogleNearby/templates/Nearby.html',
    'xstyle/css!./GoogleNearby/css/Nearby.css',
    'xstyle/css!./GoogleNearby/css/CheckedMultiSelect.css',

    // not referenced
    'dijit/form/RadioButton',
    'dijit/form/Button',
    'dijit/form/NumberTextBox',
    'dijit/form/Select',
    'dojox/form/CheckedMultiSelect',

    'dojo/NodeList-dom',
    'gis/plugins/async!//maps.googleapis.com/maps/api/js?libraries=drawing,places&sensor=false"'

], function(
    declare, lang, array, topic, Color, domConstruct,
    put,
    _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    _SelectionLayersMixin,
    esriConfig, Graphic, 
    FeatureLayer,
    GeometryService, DistanceParameters,
    Draw, 
    SimpleFillSymbol, PictureMarkerSymbol, TextSymbol, LabelClass,
    Point, Circle, Polygon, Polyline, webMercatorUtils,
    on, Deferred, 
    Trackable, DijitRegistry, Memory,
    OnDemandGrid, Selection, Keyboard,
    Dialog, win, proj4,
    template
) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _SelectionLayersMixin], {
        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'gis_NearbyDijit',

        // in case this changes some day
        proj4BaseURL: 'http://spatialreference.org/',

        //  options are ESRI, EPSG and SR-ORG
        // See http://spatialreference.org/ for more information
        proj4Catalog: 'EPSG',

        // if desired, you can load a projection file from your server
        // instead of using one from spatialreference.org
        // i.e., http://server/projections/102642.js
        projCustomURL: null,

        placeTypes: [
            '', 'accounting', 'airport', 'amusement_park', 'aquarium', 'art_gallery', 'atm', 'bakery', 'bank', 'bar',
            'beauty_salon', 'bicycle_store', 'book_store', 'bowling_alley', 'bus_station', 'cafe', 'campground',
            'car_dealer', 'car_rental', 'car_repair', 'car_wash', 'casino', 'cemetery', 'church', 'city_hall',
            'clothing_store', 'convenience_store', 'courthouse', 'dentist', 'department_store', 'doctor',
            'electrician', 'electronics_store', 'embassy', 'establishment', 'finance', 'fire_station', 'florist',
            'food', 'funeral_home', 'furniture_store', 'gas_station', 'general_contractor', 'grocery_or_supermarket',
            'gym', 'hair_care', 'hardware_store', 'health', 'hindu_temple', 'home_goods_store', 'hospital', 'insurance_agency',
            'jewelry_store', 'laundry', 'lawyer', 'library', 'liquor_store', 'local_government_office', 'locksmith',
            'lodging', 'meal_delivery', 'meal_takeaway', 'mosque', 'movie_rental', 'movie_theater', 'moving_company',
            'museum', 'night_club', 'painter', 'park', 'parking', 'pet_store', 'pharmacy', 'physiotherapist', 'place_of_worship',
            'plumber', 'police', 'post_office', 'real_estate_agency', 'restaurant', 'roofing_contractor', 'rv_park', 'school',
            'shoe_store', 'shopping_mall', 'spa', 'stadium', 'storage', 'store', 'subway_station', 'synagogue', 'taxi_stand',
            'train_station', 'travel_agency', 'university', 'veterinary_care', 'zoo'
        ],

        postCreate: function() {
            this.inherited(arguments);
            this.nearbyMode = 'distance';
            this.gridPosition = 'floating'; 
            this.gridNode = put('div'); 

            this.createFeatureLayer();

            this.initUI();
            this.geometryService = esriConfig.defaults.geometryService;

            var divGoogle = domConstruct.create('div');
            this.placesService = new google.maps.places.PlacesService(divGoogle);

            // spatialreference.org uses the old
            // Proj4js style so we need an alias
            // https://github.com/proj4js/proj4js/issues/23
            window.Proj4js = proj4;

        },

        initUI: function() {
            this.initDrawTool();
            this.setupConnections();
            this.populatePlaceTypeSelect();
        },

        populatePlaceTypeSelect: function() {
            var options = array.map(this.placeTypes, function(placeType) {
                return {
                    value: placeType,
                    label: placeType
                };
            });

            this.nearbyPlaceTypeSelect.addOption(options);
        },

        initDrawTool: function() {
            this.drawTool = new Draw(this.map);
        },

        setupConnections: function() {
            this.map.graphics.on('click', lang.hitch(this, 'preventMapGraphicsClickStop'));
            this.SearchButton.on('click', lang.hitch(this, 'updateNearby'));
            this.dropPointButton.on('click', lang.hitch(this, 'activateMapPointDrop'));
            this.clearDropButton.on('click', lang.hitch(this, 'clearResults'));
            this.drawTool.on('draw-complete', lang.hitch(this, 'handleDrawEnd'));
        },

        preventMapGraphicsClickStop: function(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            delete evt.graphic; //remove the reference to the graphic so it can be identified
            this.map.emit('click', evt);
        },

        disconnectMapClick: function() {
            topic.publish('mapClickMode/setCurrent', 'draw');
        },

        connectMapClick: function() {
            topic.publish('mapClickMode/setDefault');
        },

        activateMapPointDrop: function() {
            this.disconnectMapClick();
            this.clearResults();
            this.dropPointButton.set('label', 'Waiting for point drop');
            this.dropPointButton.set('disabled', true);
            this.drawTool.activate(Draw.POINT);
        },

        handleDrawEnd: function(evt) {
            this.connectMapClick();
            this.droppedPoint = evt;
            this.drawTool.deactivate();
            this.showPoint(this.droppedPoint.geometry);
            this.dropPointButton.set('label', 'Change point location');
            this.dropPointButton.set('disabled', false);
            put(this.clearDropButton.domNode, '!off');

            // do the analysis
            this.doNearbyAnalysis();
        },

        showPoint: function(geometry) {
            this.clearMapPointDrop();
            var point = new Point(geometry.toJson());
            var pictureMarkerSymbol = new PictureMarkerSymbol(this.getPointSymbolInfo());
            this.pointGraphic = new Graphic(point, pictureMarkerSymbol);

            this.map.graphics.add(this.pointGraphic);
        },

        getPointSymbolInfo: function() {
            return {
                'type': 'esriPMS',
                'url': '',
                'imageData': 'iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozODQzQzc1OTNFOUIxMUUzQTg5MkJGRUVDQUQxNkU3RSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozODQzQzc1QTNFOUIxMUUzQTg5MkJGRUVDQUQxNkU3RSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkY2REQ1M0IyM0U5ODExRTNBODkyQkZFRUNBRDE2RTdFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjM4NDNDNzU4M0U5QjExRTNBODkyQkZFRUNBRDE2RTdFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+3zhYuAAAA29JREFUeNrMmM9rE1EQx2fTbH71R1Laiq3U9iCi4I8WQRA8tBRPCu3Ri6AeBL0U8e9Qbx70YEFpe/FH0SJYSouKglYrtoJUD40hadMkNmnapPmxqTP1rTy3+zbZTYoZ+LKbfbzdz87Mm50XaWtrC6rJbFBlVnVAkvZCe9+NATz0ozpRPTpzplGLqLHA5M2n5TxcL10kDchtR31zp8u3F2S3F/B8x4RsMgq5dAI248t0TmDXrYIJgRDmouzx3vd2dAMedSen4hGQJAlsNXaQUHaHC5TMBiT8s5BLJS4h1FBFgBCmx1YjT7UcPYMPk4WTCUhrdqcbwZwQmZuAgpLrRajpcoEoqQcb2o8Ywogsn0mDkssBzaf7VGqVDTh9rZZvkM+kgM0fqNiyt+Id3u3lzN+RBqKBercdzp/eB2dP7IHWRheEYikYe+eHB5M/IJnK7Vodsotg7lw5Bgfbav9ea2vywNVzh6H3eBtcvvXKCEoSOdNypSbP8DC8HWr3woW+A6L7uVEeTvTbhXKiHMwBNtNAFCYj6z/VIRpqRHmZGsjZqDpULQdIcLLIk7oho5wxMgqfwJpZaEgFpjxKYUeKcxaVYWNKSUBLq5uGUJTgAmvhHqSFyTOYFAPeLDlk4x9XDD1Eq01gar6oOaOeu5hqmSRRkusCjb4JwkJoQ/eJ3wKJ7aUvMAeTrCN1DJh3CiXnUDKdh2t3v1ipQzJ7SRsXKhsngkiKwmVYGAnq3oR/W6KPaxEgPbBVpoJpIIumB6SKcoDeKm3p02HRHIJQURL/QsWKVezd9JDCwVHehFj9gf8FxCdyiHkHqgFoCRVgntp9IOqzNTnE50+G7VDiZhq0z/HFWcswzjof0Hwlsx7WFEB62SDKb7TM9YB607GfpqFUmLXAHKwHv66EPwyPairzOmqBHUtvYXGnEDcL9S/MfDQ8M/xEySQLHAzF8TvLHfM9tRkoHiYZnI+FZ0aeY7gKXLiiqMeoqVKWuWG7iXs0H93I3bS/y9fZrbtR5GFWZkaeIUxW7UpQL1CfSl1RhlvpYlDpRFQEE2Eg71kDVpm9fTGogpLXwlB9eYl6yxqvyv7ZUAyKcusPzOhDTOBxHHtt1EZUHIiHqnF4unIbMX9k9tFgNhmeYG1o2Sba2wtNXX1KNjWUXVs+iTBjlYIR2W8BBgB+dqgi6ZiY/wAAAABJRU5ErkJggg==',
                'contentType': 'image/png',
                'width': 23,
                'height': 23,
                'xoffset': 7,
                'yoffset': 11
            };
        },

        getPolygonSymbolInfo: function() {
            return {
                'type': 'esriSFS',
                'style': 'esriSFSSolid',
                'color': [70, 70, 70, 40],
                'outline': {
                    'type': 'esriSLS',
                    'style': 'esriSLSSolid',
                    'color': [0, 0, 0, 40],
                    'width': 1
                }
            };
        },

        clearMapPointDrop: function() {
            if (this.pointGraphic) {
                this.map.graphics.remove(this.pointGraphic);
                this.pointGraphic = null;
                delete this.pointGraphic;
            }
        },

        clearFeatureLayer: function() {
            if (this.pointFeatures) {
                this.pointFeatures.clear();
            }
        },

        clearNearbyArea: function() {
            if (this.nearbyAreaGraphic) {
                this.map.graphics.remove(this.nearbyAreaGraphic);
                this.nearbyAreaGraphic = null;
                delete this.nearbyAreaGraphic;
            }
        },

        updateNearby: function() {
            this.clearFeatureLayer();
            this.clearResultsGrid();

            if (this.pointGraphic) {
                this.doNearbyAnalysis();
            }
        },

        doNearbyAnalysis: function() {
            // get a geodesic circle
            this.nearbyArea = null;
            // what is the distance radius value?
            this.nearbyArea = new Circle({
                center: this.pointGraphic.geometry,
                geodesic: true,
                radius: this.nearbyValueInput.get('value'),
                radiusUnit: 'esriMeters' 
            });
            this.selectNearbyFeatures();
            this.nearbyResultsNode.innerHTML = '';
        },


        selectNearbyFeatures: function() {
            var place, placeTypes = [];
            var that = this;
            place = this.convertToGoogleCoordinates(this.nearbyArea.center);
            placeTypes.push(this.nearbyPlaceTypeSelect.get('value'));
            this.showNearbyArea();

            var nearbyPlacesRequest = {
                location: place,
                radius: this.nearbyArea.radius,
                keyword: this.nearbyKeywordInput.get('value'),
                name: this.nearbyNameInput.get('value'),
                types: placeTypes
            };

            this.nextResults = 0;
            this.radarSearchResults = [];
            this.resultsObjects = {};
            this.getDetailsResults = [];
            this.selectionResults = [];

            this.placesService.radarSearch(nearbyPlacesRequest, function(resultsRadarSearch, status) {
                if (status !== google.maps.places.PlacesServiceStatus.OK) {
                    console.error(status);
                    var myDialog = new Dialog({
                        title: 'Google Nearby Search',
                        style: 'width: 300px',
                        content: 'Not RESULTS from Google Nearby Search'
                    });
                    myDialog.show();

                    return;
                }
                that.radarSearchResults = resultsRadarSearch;

                if (that.radarSearchResults && that.radarSearchResults.length > 0) {

                    var results = array.map(that.radarSearchResults, lang.hitch(that, function(resultRadarSearch, index) {
                        var def = new Deferred();
                        this.theNext(resultRadarSearch, index, def);
                        return def.promise;
                    }));

                    that.settle(results).then(function(results) {
                        console.log('settle number ' + results.length);
                    });
                }
            });
        },


        settle: function(promises) {
            var d = new Deferred();
            var countdownLatch = promises.length;
            var results = [];
            var that = this;
            promises.forEach(function(p, i) {
                p.then(function(v) {
                    var row = that.pinpointResult(v);
                    that.selectionResults.push(row);
                    that.createGoogleGrid(row);
                    results[i] = { state: 'fulfilled', value: v };
                    countdownLatch--;
                    if (countdownLatch === 0) {
                        d.resolve(results);
                    }
                }, function(err) {
                    results[i] = { state: 'rejected', err: err };
                    countdownLatch--;
                    if (countdownLatch === 0) {
                        d.resolve(results);
                    }
                });
            });
            return d; 
        },

        theNext: function(resultRadarSearch, index, def) {
            this.resultRadarSearch = resultRadarSearch;
            var delay = 2;
            var requestDetails = {
                placeId: resultRadarSearch.place_id
            };
            var that = this;
            this.placesService.getDetails(requestDetails, function(result, status) {

                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    that.getDetailsResults.push(result);
                    var p = result.geometry.location;
                    var lat = p.lat();
                    var lng = p.lng();
                    // Output the data
                    var msg = index + ' name="' + result.name + '" lat=' + lat + ' lng=' + lng + '(delay=' + delay + 'ms)<br>';
                    console.log(msg);
                    def.resolve(result);
                } else {
                    if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                        delay++;

                        setTimeout(function() {
                            that.theNext(resultRadarSearch, index, def);
                        }, delay);
                    } else {
                        var reason = 'Code ' + status;
                        var msg1 = ' name="' + result.name + '" error=' + reason + '(delay=' + delay + 'ms)<br>';
                        console.log(msg1);
                    }
                }
            });
        },


        pinpointResult: function(result) {
            var point = new Point(result.geometry.location.lng(), result.geometry.location.lat());

            var attr = lang.mixin({}, {
                'icon': result.icon,
                'id': result.id,
                'name': result.name,
                'vicinity': result.vicinity,
                'geometryLngLat': parseFloat(result.geometry.location.lng()).toFixed(3) + ' / ' + parseFloat(result.geometry.location.lat()).toFixed(3),
                'types': result.types.join(', ')
            });

            var pointGraphic = new Graphic(point, null, attr);
            this.pointFeatures.add(pointGraphic);
            return pointGraphic;
        },


        updateNearbyFeatures: function() {
            if (this.nearbyArea) {
                this.selectNearbyFeatures();
            }
        },

        showNearbyArea: function() {
            this.clearNearbyArea();
            var nearbyAreaSymbol = new SimpleFillSymbol(this.getPolygonSymbolInfo());
            this.nearbyAreaGraphic = new Graphic(this.nearbyArea, nearbyAreaSymbol);
            this.map.graphics.add(this.nearbyAreaGraphic);
        },

        createGoogleGrid: function(row) {
            this.addDistanceToResult(row).then(lang.hitch(this, function(rowWithDistance) {

                if (!this.resultsStore) {
                    var TrackableMemory = declare([Memory, Trackable]);
                    this.resultsStore = new TrackableMemory();
                    this.resultsStore.add(rowWithDistance);
                } else {
                    this.resultsStore.add(rowWithDistance);
                    if (this.resultsGrid) {
                        this.gridDialog.set('title', 'Nearby Results Number: ' + this.resultsStore.data.length +
                            ' from ' + this.radarSearchResults.length);
                        this.resultsGrid.refresh();
                    }
                }

                if (!this.gridDialog) {
                    this.gridDialog = new Dialog({
                        title: 'Nearby Results Number: 1',
                        'class': 'nearbyNonModal',
                        id: 'nearbyGridDialog',
                        closable: false
                    });
                    var viewport = win.getBox();
                    var posX = viewport.w - 625;
                    var posY = viewport.h - 400;
                    this.gridDialog._relativePosition = {
                        x: posX > 0 ? posX : 0,
                        y: posY > 0 ? posY : 0
                    };
                    this.gridDialog.focus = function() {}; // kill the default focus function
                    // include a dock button on the modal
                    this.dockButton = put(this.gridDialog.closeButtonNode, '+span.dockButton');
                    on(this.dockButton, 'click', lang.hitch(this, 'dockResultsGrid'));
                }

                if (this.gridPosition === 'floating') {
                    this.gridDialog.show();
                } else if (this.gridPosition === 'docked') {
                    this.gridDialog.hide();
                }

                var columnInfo = this.getColumnInfo(rowWithDistance);
                if (!this.resultsGrid) {
                    this.resultsGrid = new(declare([OnDemandGrid, DijitRegistry, Keyboard, Selection]))({
                        selectionMode: 'single',
                        cellNavigation: false,
                        showHeader: true,
                        collection: this.resultsStore,
                        columns: columnInfo,
                        sort: [{
                                attribute: '__distance',
                                descending: false
                            }]
                    }, this.gridNode);
                    this.resultsGrid.startup();
                    this.resultsGrid.on('.dgrid-cell:click', lang.hitch(this, 'selectFeature'));

                } else {
                    this.resultsGrid.set('columns', columnInfo);
                    this.resultsGrid.refresh();
                }

                if (this.gridPosition === 'docked') {
                    put(this.nearbyResultsGrid, this.gridNode);
                    put(this.nearbyResultsGrid, '!off');
                } else if (this.gridPosition === 'floating') {
                    if (this.gridDialog.get('content') === '') {
                        this.gridDialog.set('content', this.resultsGrid);
                    }
                    put(this.nearbyResultsGrid, '.off');
                }

                this.resultsGrid.refresh();
            }));
        },

        changeGridPosition: function() {
            if (this.gridPosition === 'floating') {
                this.gridDialog.show();
            } else if (this.gridPosition === 'docked') {
                this.gridDialog.hide();
            }

            if (this.gridPosition === 'docked') {
                put(this.nearbyResultsGrid, this.gridNode);
                put(this.nearbyResultsGrid, '!off');
            } else if (this.gridPosition === 'floating') {
                if (this.gridDialog.get('content') === '') {
                    this.gridDialog.set('content', this.resultsGrid);
                }
                put(this.nearbyResultsGrid, '.off');
            }

            this.resultsGrid.refresh();
        },

        addDistanceToResult: function(result) {
            var df = new Deferred();
            var dp = new DistanceParameters();
            var selectedUnit = 'esriMeters'; 
            dp.distanceUnit = GeometryService['UNIT_' + selectedUnit];
            dp.geodesic = true;
            dp.geometry1 = result.geometry;
            dp.geometry2 = new Point(this.droppedPoint.geometry);
            if (dp.geometry1.spatialReference.wkid !== dp.geometry2.spatialReference.wkid) {
                if (dp.geometry1.spatialReference.wkid !== 4326) {
                    dp.geometry2 = webMercatorUtils.webMercatorToGeographic(dp.geometry2);
                }
                if (dp.geometry2.spatialReference.wkid !== 4326) {
                    dp.geometry2 = webMercatorUtils.webMercatorToGeographic(dp.geometry2);
                }
            }
            this.geometryService.distance(dp).then(lang.hitch(this, 'distanceSuccess', df, result), lang.hitch(this, 'distanceFailure', df, result));
            return df;
        },
        distanceSuccess: function(df, result, distanceResult) {
            df.resolve(
                lang.mixin({}, {
                    '__distance': parseFloat(distanceResult.toFixed(3)),
                    'id': result.id
                }, result.attributes)
            );
        },
        distanceFailure: function(df, result) {
            df.resolve(
                lang.mixin({}, {
                    '__distance': 0.0,
                    'id': result.id
                }, result.attributes)
            );
        },

        dockResultsGrid: function() {
            this.gridPosition = 'docked';
            this.changeGridPosition();
        },

        undockResultsGrid: function() {
            this.gridPosition = 'floating';
            this.changeGridPosition();
        },

        getColumnInfo: function(result) {
            var columnInfo = {};
            for (var columnName in result) {
                if (result.hasOwnProperty(columnName)) {
                    if (columnName === '__distance') {
                        columnInfo.__distance = {
                            label: 'Distance (m)',
                            formatter: lang.hitch(this, 'numberWithCommas')
                        };
                    } else if (columnName === 'icon') {
                        columnInfo.icon = {
                            label: 'Icon',
                            formatter: lang.hitch(this, 'addIcon')
                        };
                    } else if (columnName !== 'id') {
                        columnInfo[columnName] = columnName;
                    }
                }
            }
            return columnInfo;
        },

        addIcon: function(url) {
            return '<img src="' + url + '" height="42" width="42">';
        },

        // from http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        numberWithCommas: function(value) {
            var parts = value.toString().split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return parts.join('.');
        },

        selectFeature: function(evt) {
            var row = this.resultsGrid.row(evt);

            // zoom to feature
            if (row) {
                var data = row.data;
                if (data) {
                    var selected = array.filter(this.selectionResults, function(selectionResult) {
                        if (selectionResult.attributes.id === data.id) {
                            return true;
                        }
                    });
                    var feature = {},
                        extent = null;
                    if (selected[0].geometry.type === 'point') {
                        feature.geometry = new Point(selected[0].geometry);
                        extent = this.getExtentFromPoint(feature);
                    } else if (selected[0].geometry.type === 'polyline') {
                        feature.geometry = new Polyline(selected[0].geometry);
                        extent = feature.geometry.getExtent();
                    } else if (selected[0].geometry.type === 'polygon') {
                        feature.geometry = new Polygon(selected[0].geometry);
                        extent = feature.geometry.getExtent();
                    }

                    this.zoomToExtent(extent);
                }
            }
        },

        clearResults: function() {
            this.results = null;
            this.nearbyArea = null;
            this.clearFeatureLayer();
            this.clearResultsGrid();
            this.clearMapPointDrop();
            this.clearNearbyArea();
            put(this.clearDropButton.domNode, '.off');
            this.dropPointButton.set('label', 'Ready to drop point!');
        },

        clearResultsGrid: function() {
            if (this.resultsStore) {
                this.resultsStore.setData([]);
            }
            if (this.resultsGrid) {
                this.resultsGrid.refresh();
            }
            put(this.nearbyResultsGrid, '.off');
            if (this.gridDialog) {
                this.gridDialog.hide();
            }
        },

        convertToGoogleCoordinates: function(mapRightClickPoint) {
            var mapPoint = mapRightClickPoint;
            if (!mapPoint) {
                return;
            }
            // convert the map point's coordinate system into lat/long
            var geometry = null,
                wkid = mapPoint.spatialReference.wkid;
            if (wkid === 102100) {
                wkid = 3857;
            }
            var key = this.proj4Catalog + ':' + wkid;
            // only need one projection as we are
            // converting to WGS84 lat/long
            var projPoint = proj4(proj4.defs[key]).inverse([mapPoint.x, mapPoint.y]);
            if (projPoint) {
                geometry = {
                    x: projPoint[0],
                    y: projPoint[1]
                };
            }

            if (geometry) {
                var place = new google.maps.LatLng(geometry.y, geometry.x);
                return place;
            }
        },

        createFeatureLayer: function() {
            var featureCollection = {
                'layerDefinition': null,
                'featureSet': {
                    'features': [],
                    'geometryType': 'esriGeometryPoint'
                }
            };
            featureCollection.layerDefinition = {
                'geometryType': 'esriGeometryPoint',
                'objectIdField': 'ObjectID',
                'drawingInfo': {
                    'renderer': {
                        'type': 'simple',
                        'symbol': {
                            'type': 'esriPMS',
                            'url': '471E7E31',
                            'imageData': 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAKhJREFUGJV1yrEKQVEcgPHvnHui2BjEajRb1H0BT2CwKNGtk9lqV0rXoO4iGyZvoVs2r8CxmCTLvX8LBl2/9fsMb240bAK+wF147mvzlQMwAtrZQSSp9D6zIj+72H6vGkYb4+zAAt/4VgC9vgZBbIAu2XKpl3YMUPozoEjKRqGOgtSzBhEvNopkIug2UPzph9tiuTOVMDqdbd9XMAXdAu5Ks00e6bgByQvXfjU98S9nVAAAAABJRU5ErkJggg==',
                            'contentType': 'image/png',
                            'color': null,
                            'width': 16,
                            'height': 16,
                            'angle': 0,
                            'xoffset': 0,
                            'yoffset': 0
                        }
                    }
                },
                'fields': [{
                    'name': 'ObjectID',
                    'alias': 'ObjectID',
                    'type': 'esriFieldTypeOID'
                }, {
                    'name': 'id',
                    'alias': 'id',
                    'type': 'esriFieldTypeString'
                }, {
                    'name': '__distance',
                    'alias': '__distance',
                    'type': 'esriFieldTypeDouble'
                }, {
                    'name': 'name',
                    'alias': 'name',
                    'type': 'esriFieldTypeString'
                }, {
                    'name': 'vicinity',
                    'alias': 'vicinity',
                    'type': 'esriFieldTypeString'
                }, {
                    'name': 'geometryLngLat',
                    'alias': 'geometryLngLat',
                    'type': 'esriFieldTypeString'
                }, {
                    'name': 'types',
                    'alias': 'types',
                    'type': 'esriFieldTypeString'
                }, {
                    'name': 'icon',
                    'alias': 'icon',
                    'type': 'esriFieldTypeBlob'
                }]
            };

            this.pointFeatures = new FeatureLayer(featureCollection, {
                id: 'nearbyGoogleDrawGraphics_point',
                title: 'Draw Google Graphics'
            });

            var statesColor = new Color('#666');
            var statesLabel = new TextSymbol().setColor(statesColor);
            statesLabel.font.setSize('12pt');
            statesLabel.font.setFamily('arial');
            var json = {
                'labelExpressionInfo': { 'value': '{name}' }
            };
            //create instance of LabelClass (note: multiple LabelClasses can also be passed in as an array)
            this.labelClass = new LabelClass(json);
            this.labelClass.symbol = statesLabel; // symbol also can be set in LabelClass' json
            this.pointFeatures.setLabelingInfo([this.labelClass]);

            this.map.addLayer(this.pointFeatures);

        }
    });
});
