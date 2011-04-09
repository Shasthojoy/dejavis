// Visualization
// --------------

// Map property keys to colors
_.propertyColors = function(properties) {
  return d3.scale.ordinal().domain(properties).range(['#8DB5C8', '#90963C', '#B16649', '#A2C355', '#93BAA1', '#808E89', '#86A2A9']);
};

var Visualization = Backbone.View.extend({
  events: {
    'change #group_key': 'updateGroupKey',
    'click .property.add': 'addProperty',
    'click .property.remove': 'removeProperty'    
  },
  el: '#visualization',
  
  initialize: function() {
    // Default properties
    this.properties = new Data.Hash({});
    
    this.groupKey = [this.groupKeys()[0].key];
    this.compute();
    
    // Color scale for properties
    this.propertyColors = _.propertyColors(this.selectableProperties().keys());
    
    // Initialize visualizatoin instance
    this.visualization = new Barchart('#canvas', {});
  },
  
  updateGroupKey: function() {
    this.groupKey = [$('#group_key').val()];
    this.compute();
    this.render();
    return false;
  },
  
  addProperty: function(e) {
    this.properties.set($(e.currentTarget).attr('property'), {aggregator: Data.Aggregators.SUM});
    this.compute();
    this.render();
    return false;
  },
  
  removeProperty: function(e) {
    this.properties.del($(e.currentTarget).attr('property'));
    this.compute();
    this.render();
    return false;
  },
  
  availableProperties: function() {
    return this.model.properties().select(function(p) {
      return p.expectedTypes[0] === 'number' && p.unique === true
    });
  },
  
  selectableProperties: function() {
    var that = this;
    return this.availableProperties().select(function(p) {
      return !that.properties.get(p.key);
    });
  },
  
  selectedProperties: function() {
    var that = this;
    return this.availableProperties().select(function(p) {
      return that.properties.get(p.key);
    });
  },
  
  // Extract group keys
  groupKeys: function() {
    return this.model.properties().select(function(p) {
      return p.expectedTypes[0] === 'string'
    });
  },
  
  compute: function() {
    if (this.groupKey.length > 0) {
      this.groupedItems = this.model.group(this.groupKey, this.properties.toJSON());
    } else {
      this.groupedItems = this.model;
    }
  },
  
  // Update collection
  update: function(collection) {
    this.model = collection;
    this.compute();
  },
  
  render: function() {
    $(this.el).html(_.tpl('visualization', {
      selectable_properties: this.selectableProperties(),
      selected_properties: this.selectedProperties(),
      properties: this.availableProperties(),
      propertyColors: this.propertyColors,
      group_keys: this.groupKeys(),
      group_key: this.groupKey
    }));
    
    // Render visualization
    if (this.groupedItems && this.properties.keys().length > 0) {
      this.visualization.update({
        collection: this.groupedItems,
        properties: this.properties.keys(),
        propertyColors: this.propertyColors,
        id: this.groupKey
      });
    } else {
      this.$('#canvas').html('<div class="info"><h2>Please choose some properties on the right tab.</h2></div>');
    }
    
    this.delegateEvents();
    return this;
  }
});