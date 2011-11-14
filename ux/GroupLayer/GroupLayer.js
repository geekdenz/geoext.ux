Ext.namespace("GeoExt.tree");
/*
 * @include GeoExt/tree/LayerNode.js
 * @include GeoExt/tree/AsyncTreeNode.js
 */

/** api: This makes a group layer node in an Ext tree panel with an optional
 *  legend beside it.
 *  The group layer has a base layer, e.g. Drainage and sub layers, e.g.
 *  "Very Poorly Drained", "Poorly Drained", ... which each have a class
 *  (e.g. 1, 2, ...). The base layer is then taken and cloned and associated
 *  with each group layer sub tree node. Each of these sub tree nodes then
 *  is bound to a layer from the group and if you turn it on, it will do a
 *  request for each sub layer, which is beneficial for caching, although there
 *  will be more requests than with the "proper" group layer approach.
 *
 *  module = GeoExt.tree
 *  class = GroupLayerNode
 */

/** api: constructor
 *  .. class:: GroupLayerNode
 */

GeoExt.tree.GroupLayerNode = Ext.extend(GeoExt.tree.LayerNode, {
  legendon: false,
  cached: false,
  excludeFromDeselect: false,
  constructor: function(config) {
    /**
     * config.loader substitutes loader object, if not provided in config
     * it overwrites the default behaviour of the LayerNode, which has a
     * single layer and uses the param to fully reload the layer with other
     * params.
     */
    config.loader = config.loader || { // CUSTOM loader OBJECT
      legendon: false,
      layers: new Array(),
      layerIndex: 0,
      createNode: function(attr) {
        if (this.legendon) { // raw legend request
          var layers = attr.layer.params.LAYERS,
              layersClone = [];
          if (!(layers instanceof Array)) {
            layers = layers.split(',');
          }
          for (var i = -1, leni = layers.length; ++i < leni;) {
            if (!layers[i].match(new RegExp('nodata.*'))) { // TODO: to make generic, somehow make this a configuration setting
              layersClone[i] = layers[i]; // ignore "nodata" layer in legend request
            }
          }
          var classLayerLayer = layersClone; 
          if (this.cached) {
            classLayerLayer = layersClone[0]
                .replace(/_g_cache_[A-z0-9]+/, '');
          }
          classLayerLayer += ','+ (parseInt(attr.item.param) - 1);
          var requestObj = {
            REQUEST: "GetLegendGraphic",
            WIDTH: null,
            HEIGHT: null,
            //MAP: attr.layer.params.MAP ? attr.layer.params.MAP : null,
            EXCEPTIONS: "application/vnd.ogc.se_xml",
            LAYER: classLayerLayer,
            LAYERS: null,
            STYLES: null,
            SRS: null,
            FORMAT: 'image/gif',
            MODE: 'legendicon',
            ICON: classLayerLayer//layersClone +','+ (parseInt(attr.item) - 1)
          };
          if (attr.layer.params && attr.layer.params.MAP) {
            requestObj.MAP = attr.layer.params.MAP;
          }
          var legendUrl = attr.layer.getFullRequestString(requestObj);
          /*
          if (this.cached) {
            legendUrl = legendUrl.replace(attr.layer.url, config.legendWmsUrl);
          }
          */
          attr.icon = legendUrl;
        }
        attr.layer = this.layers[this.layerIndex++];
        var ret = GeoExt.tree.LayerParamLoader.prototype.createNode.call(this, attr);
        var thisLoader = this;
        
        ret.on('checkchange', function(node, checked) {
          if (checked) { // only on first event fire, not sure why this fires twice
            if (!node.parentNode.attributes.checked) {
              var checkedNodes = [],
                  childNodes = node.parentNode.childNodes,
                  i, leni;
              for (i = -1, leni = childNodes.length; ++i < leni;) {
                checkedNodes[i] = childNodes[i].attributes.checked;
              }
              thisLoader.checkNode(node.parentNode, true);
              for (i = -1, leni = checkedNodes.length; ++i < leni;) {
                thisLoader.checkNode(childNodes[i], checkedNodes[i]);
              }
            }
          } else {
            var noneChecked = true;
            node.parentNode.eachChild(function(otherNode) {
              if (otherNode.attributes.checked) {
                noneChecked = false;
                return false;
              }
            });
            if (noneChecked && node.parentNode.attributes.checked) {
              thisLoader.checkNode(node.parentNode, false);
            }
          }
          node.layer.setVisibility(checked);
        });
        
        ret.text = attr.item.shortName;
        return ret;
      },
      checkNode: function(node, on) {
        var ui = node.getUI();
        if (ui && ui.checkbox) { // if there is a checkbox
          var state = ui.checkbox.checked;
          if (state && !on) {
            ui.toggleCheck(); // disable
          } else if (!state && on) {
            ui.toggleCheck(); // enable
          }
        }
        node.attributes.checked = !!on; // force boolean
      },
      load: function(node, callback) { // overwritten, called when plus is clicked on group layer node
          if(this.fireEvent("beforeload", this, node)) {
              while (node.firstChild) {
                  node.removeChild(node.firstChild);
              }
              var classes = [],
                  i, leni;
              var paramValue = node.attributes.CLASS;
              if (paramValue) {
                  var items = (paramValue instanceof Array) ?
                      paramValue.slice() :
                      paramValue.split(this.delimiter);

                  Ext.each(items, function(item, index, allItems) {
                      this.addParamNode(item, allItems, node);
                  }, this);
              }

              if(typeof callback == "function"){
                  callback();
              }

              this.fireEvent("load", this, node);
          }
      },
      addParamNode: function(paramItem, allParamItems, node) {
          var child = this.createNode({
              layer: node.layer,
              param: this.param,
              item: paramItem,
              allItems: allParamItems,
              delimiter: this.delimiter//,              listeners: node.attributes.listeners
          });
          node.appendChild(child);
      }
    }; // /CUSTOM loader OBJECT
    config.loader.legendon = config.legendon || this.legendon;
    config.loader.cached = config.cached || this.cached;
    //config.loader.listeners = config.listeners || this.listeners;
    GeoExt.tree.GroupLayerNode.superclass.constructor.apply(this, arguments);
  },
  render: function() {
    var layer = this.layer instanceof OpenLayers.Layer && this.layer,
        i, leni;
    if(!layer) {
        // guess the store if not provided
        if(!this.layerStore || this.layerStore == "auto") {
            this.layerStore = GeoExt.MapPanel.guess().layers;
        }
        // now we try to find the layer by its name in the layer store
        i = this.layerStore.findBy(function(o) {
            return o.get("title") == this.layer;
        }, this);
        if(i != -1) {
            // if we found the layer, we can assign it and everything
            // will be fine
            layer = this.layerStore.getAt(i).getLayer();
        }
    }
    var del = this.attributes.loader.delimiter, // usually ","
        classes = [],
        classAtt = this.attributes.CLASS;
    if (classAtt && classAtt.length > 0) {
      for (i = -1, leni = classAtt.length; ++i < leni;) {
        classes.push(classAtt[i].param);
      }    
    }
    if (classes) {
      var classLayer,
          layerIndex = layer.map.getLayerIndex(layer),
          classLayerMap = layer.map;
      
      for (i = -1, leni = classes.length; ++i < leni;) {
        classLayer = layer.clone();
        var classLayerParams = classLayer.params;
        if (this.attributes.cached) {
          var classLayerLayer = classLayer.params.LAYERS[0].replace('_g_cache', '_class_'+ classes[i] +'_cache');
          classLayerParams.LAYERS = [classLayerLayer];
          delete classLayerParams.CLASS;
        } else {
          classLayerParams.CLASS = classes[i];
        }
        classLayer.mergeNewParams(classLayerParams);
        classLayerMap.addLayer(classLayer);
        classLayer.setVisibility(false);
        classLayerMap.setLayerIndex(classLayer, layerIndex);
        this.attributes.loader.layers[i] = classLayer;
      }
    }
    return GeoExt.tree.GroupLayerNode.superclass.render.apply(this, arguments);
  },
  onCheckChange: function(node, checked) {
    var i, leni, child;
    if (!this.expanded) {
      this.expand();
    }
    for (i = -1, leni = node.childNodes.length; ++i < leni;) {
      child = node.childNodes[i];
      child.getUI().toggleCheck(checked);
    }
  }
});

/** api: xtype = gx_grouplayer */
Ext.tree.TreePanel.nodeTypes.gx_grouplayer = GeoExt.tree.GroupLayerNode;
