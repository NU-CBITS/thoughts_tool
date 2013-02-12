switchViews = function(options) {
  // alert("This widget would go to '"+options.to+"'");
  // var new_element;
  // DynamoViewsContainer().html("");
  // new_element = Xelements().get(options.to);
  // window.location.hash = "page" + options.to;
  // makePrimaryView(new_element);
  // delete options.from;
};

BasicView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this);
    console.log("BasicView#initialize for", this.model);
    console.log("template: ", this.model.metacontent().template);
    this.model.bind("change", this.render);
    this.model.bind("destroy", this.remove);
    return true;
  },
  _template: function() {
    if (!this.compiled_template) {
      if (this.template) {
        this.compiled_template = _.template(this.template);
      } else {
        this.compiled_template = _.template(this.model.metacontent().template);
      }
    }
    return this.compiled_template(arguments[0], arguments[1]);
  },
  render: function() {
    console.log("BasicView#render for ", this.model);
    this.$el.html(this._template({ model: this.model.toJSON() }));
    return this;
  }
});

WidgetView = BasicView.extend({
  className: "widget-container",

  events: {
    "click .widget": "goToNextView"
  },

// widget_area
// widget
// tasks_incomplete
// to_do
// information
// progression_information

  template: ""+
  "<div id='<%= id %>' class='<%= spanClass %>' data-mode='<%= data_mode %>' data-delay='<%= data_delay %>'>" +
    "<div class='<%= cssClass %> widget-inner-container'>"+
      "<div class='badge-container'><%= badge_text %></div>"+
      "<div class='widget-text'>"+
          // "<div class='badge'>1</div>"+
          // "<img src='star.png' class='star'/>"+
        // "<h2><%= information_text %></h2>"+
        // "<h3><%= progression_information_text %></h3>"+
        "<h1><%= widget_title %></h1>"+
      "</div>"+
    "</div>"+
  "</div>",
  buildImage: function(image_uri) {
    if (image_uri.indexOf("icon-") !== -1) {
      // icon
      return "<i class='"+image_uri+"'></i>"
    } else {
      // image
      var src;
      src = image_cdn + image_uri;
      return "<img src='"+src+" '/>"
    }
  },
  collection: function() {
    return user_data("collection", current_user, this.model.id);
  },
  goToNextView: function() {
    return switchViews({
      from: this,
      to: this.points_to_xelement
    });
  },
  render: function() {
    console.log("WidgetView#render for ", this.model.id);
    // var badge_content, information_text_content, 
    // progression_information_text_content, 
    // title_content, widget_style_classes_content;
    // title_content = this.model.metacontent().title;
    // badge_content = this.buildImage(this.model.metacontent().badge);
    // information_text_content = this.model.metacontent().information_text;
    // progression_information_text_content = this.model.metacontent().progression_information_text;
    // widget_style_classes_content = this.model.metacontent().style_classes;
    this.points_to_xelement = this.model.metacontent().points_to_xelement;
    console.log(this.next_view);
    console.log(this.model.get('cssClass'))
    this.$el.html(this._template({
      id: this.model.cid || "",
      guid: this.model.guid || "",
      cssClass: this.model.get('cssClass') || "",
      spanClass: this.model.get('spanClass') || "",
      widget_title: this.model.metacontent().title,
      badge_text: this.buildImage(this.model.metacontent().badge),
      information_text: this.model.metacontent().information_text,
      progression_information_text: this.model.metacontent().progression_information_text,
      data_mode: this.model.metacontent().data_mode || "",
      data_delay: this.model.metacontent().data_delay || ""
    }));
    return this;
  }
});