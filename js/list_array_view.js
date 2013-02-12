listArrayView = Dynamo.listArrayView = (function() {
  
  function listArrayView(container, eventsFn, elementTemplate) {

    $(container).prepend('<div id="array-elements"></div>');
    
    this.container = container;
    this.$el = $(container).find('div#array-elements');

    this.eventsFn = eventsFn;
    this.elementTemplate = elementTemplate;
  };
  
  listArrayView.prototype._elementTemplate = function(data, settings) {
    if (!this.compiled_template) {
      if (!this.elementTemplate) { throw new Error("should define Element Template for listArrayView") }
      this.compiled_template = _.template(this.elementTemplate);
    };
    return this.compiled_template(data, settings);
  },

  listArrayView.prototype.remove = function() {
    this.$el.remove();
  }

  listArrayView.prototype.render = function() {
    var self = this, fields;
    this.$el.empty();

    _.each(this.eventsFn(), function(event) {
      fields = event.get_fields_as_object();
      fields.cid = event.cid;
      fields.id = event.id;
      self.$el.append( self._elementTemplate({item: fields}) );
    });
  
  };
  
  return listArrayView

}) ();