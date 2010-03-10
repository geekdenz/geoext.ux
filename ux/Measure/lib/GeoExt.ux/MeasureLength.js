/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 * 
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

Ext.namespace("GeoExt.ux")

/*
 * @requires GeoExt.ux/Measure.js
 */

/** api: (define)
 *  module = GeoExt.ux.MeasureLength
 *  class = MeasureLength
 */

/** api: constructor
 *  .. class:: MeasureLength
 * 
 *      Creates a GeoExt.Action for length measurements.
 *
 *  JSBuild: OpenLayers/Handler/Path.js must be included.
 */
GeoExt.ux.MeasureLength = Ext.extend(GeoExt.ux.Measure, {
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        config = Ext.apply({
            handlerClass: OpenLayers.Handler.Path,
            iconCls: 'gx-map-measurelength',
            tooltip: "Length measurement",
            template: '<p>{[values.measure.toFixed(this.decimals)]}&nbsp;'+
                '{units}</p>'
        }, config);
        arguments.callee.superclass.constructor.call(this, config);
    }
});
