GeoExt.ux.LayersOpacitySlider = Ext.extend(GeoExt.LayerOpacitySlider, {
  layers: [],
  constructor: function(config) {
    config.layers  = config.layers || config.layer ? [config.layer] : [];
    delete config.layer;
    var layers = config.layers;
    if (layers) {
      var layer = null;
      for (var i in layers) {
        layer = this.getLayer(layers[i]);
        this.bind();
        //this.complementaryLayer = this.getLayer(config.complementaryLayer);
        // before we call getOpacityValue inverse should be set
        if (config.inverse !== undefined) {
            this.inverse = config.inverse;
        }
        config.value = (config.value !== undefined) ?
            config.value : this.getOpacityValue(layer);
        delete config.layer;
        this.layers[i] = layer;
      }
    }
    GeoExt.ux.LayersOpacitySlider.superclass.constructor.call(this, config);
  },
  addLayer: function(layer) {
    for (var i = -1, leni = this.layers.length; ++i < leni;) {
      if (this.layers[i] == layer) {
        return;
      }
    }
    this.layers.push(layer);
    this.setLayers(this.layers);
  },
  removeLayer: function(layer) {
    var newLayers = [];
    for (var i = -1, leni = this.layers.length; ++i < leni;) {
      if (this.layers[i] != layer) {
        newLayers.push(this.layers[i]);
      }
    }
    this.setLayers(newLayers);
  },
  bind: function() {
    var layer = null;
    for (var i in this.layers) {
      layer = this.layers[i];
      if (layer && layer.map) {
          layer.map.events.on({
              changelayer: this.update,
              scope: this
          });
      }
    }
  },

  /** private: method[unbind]
   */
  unbind: function() {
    for (var i in this.layers) {
      layer = this.layers[i];
      if (layer && layer.map) {
          layer.map.events.un({
              changelayer: this.update,
              scope: this
          });
      }
    }
  },

  /** private: method[update]
   *  Registered as a listener for opacity change.  Updates the value of the slider.
   */
  update: function(evt) {
      if (evt.property === "opacity" && this.layers.indexOf(evt.layer) != -1) {
          this.setValue(this.getOpacityValue(this.layers[0]));
      }
  },

  setLayers: function(layers) {
    this.layers = layers;
    this.unbind();
    var layer = layers && layers[0] ? this.getLayer(layers[0]) : null;
    if (layer) {
      this.setValue(this.getOpacityValue(layer));
      this.bind();
    }
  },

  setLayer: function(layer) {
    this.setLayers([layer]);
  },
  initComponent: function() {
    GeoExt.LayerOpacitySlider.superclass.initComponent.call(this);
    if (this.changeVisibility && this.layers &&
      (this.layers[0].opacity == 0 ||
      (this.inverse === false && this.value == this.minValue) ||
      (this.inverse === true && this.value == this.maxValue))) {

      for (var i in this.layers) {
        this.layers[i].setVisibility(false);
      }
    }
    /*
    if (this.complementaryLayer &&
      ((this.layer && this.layer.opacity == 1) ||
       (this.inverse === false && this.value == this.maxValue) ||
       (this.inverse === true && this.value == this.minValue))) {
      this.complementaryLayer.setVisibility(false);
    }
    */
    if (this.aggressive === true) {
      this.on('change', this.changeLayerOpacity, this, {
        buffer: this.delay
      });
    } else {
      this.on('changecomplete', this.changeLayerOpacity, this);
    }

    if (this.changeVisibility === true) {
      this.on('change', this.changeLayerVisibility, this, {
        buffer: this.changeVisibilityDelay
      });
    }

    /*
    if (this.complementaryLayer) {
      this.on('change', this.changeComplementaryLayerVisibility, this, {
        buffer: this.changeVisibilityDelay
      });
    }
    */
    this.on("beforedestroy", this.unbind, this);
  },
  changeLayerOpacity: function(slider, value) {
    if (this.layers && this.layers.length > 0) {
      value = value / (this.maxValue - this.minValue);
      if (this.inverse === true) {
        value = 1 - value;
      }
      for (var i = -1, leni = this.layers.length; ++i < leni;) {
        this.layers[i].setOpacity(value);
      }
    }
  },
  changeLayerVisibility: function(slider, value) {
    var currentVisibility = this.layers[0].getVisibility(),
        i, leni;
    if ((this.inverse === false && value == this.minValue) ||
      (this.inverse === true && value == this.maxValue) &&
      currentVisibility === true) {
      for (i = -1, leni = this.layers.length; ++i < leni;) {
        this.layers[i].setVisibility(false);
      }
    } else if ((this.inverse === false && value > this.minValue) ||
      (this.inverse === true && value < this.maxValue) &&
             currentVisibility == false) {
      for (i = -1, leni = this.layers.length; ++i < leni;) {
        this.layers[i].setVisibility(true);
      }
    }
  }
});

