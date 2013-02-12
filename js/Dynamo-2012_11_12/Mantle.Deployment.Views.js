// Mantle.Deployment.Views.js


//On instantiation, this view expects:
//1) a model of class Question from which it renders
//2) an optional key 'userResponseModel' whose value is
//   a model onto which it saves 
//   a user's response to this question's responses. 
//   if this key is ommitted, it will create it's own.
showProjectView = Dynamo.BaseUnitaryXelementView.extend({

  initialize: function() {

    _.bindAll(this);
    this.cid = _.uniqueId('showQuestionView-');
    this.subViews = [];
    this.position = this.options.position
    this.model.groups.on("add", this.render);
    this.model.groups.on("remove", this.render);
    this.model.on("change",   this.render);
    this.model.on("destroy",  this.remove);

  },

  addSubView: function(view) {
    this.subViews.push(view);
  },

  attributes: function() {
    return {
      id: "project-"+this.model.cid,
      class: "project" 
    }
  },

  remove: function() {
    this.$el.remove();
    this.removeSubViews();
  },

  removeSubViews: function() {
    _.each(this.subViews, function(sub_view) {
      sub_view.remove();
      sub_view = null;
    });
    this.subViews = [];
  },

  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.show_project;
    };
    return _.template(this._template, data, settings);
  },

  render: function() {

    //render template
    var self, view_class, view;

    alert('in showProjectView render');

    self = this;
    self.$el.html( self.template(this.model.toJSON()) );
    
    return this;
  }
});