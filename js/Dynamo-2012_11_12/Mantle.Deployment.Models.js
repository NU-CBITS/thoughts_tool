// Mantle.Deployment.Models.js

ApplicationModel = Dynamo.XelementClass.extend({
  //values:
  codeName: "application",
  prettyName: "Project",

  //functions:
  initialize: function () {
    _.bindAll(this);
    var self = this;

    this.initAsXelement();
    this.set_field_value('xelement_type', 'application');

    //pull out important meta-content attributes;
    self.groups = new GroupCollection(this.group_ids());
    self.assessments = new QuestionGroupCollection(this.assessment_ids());
    self.groups_assessments = this.getGroupsAssessments();

    //  Saving an application should update the Application's:
    //  groups, assessments, and assessments-per-group
    //  Achieve this seemlessly by...
    //  Storing original save function, then defining a new one.
    //  new save function saves composite groups; 
    //  On the sync of those groups w/ the server, 
    //  then save this questionGroup.
    this.actualSave = this.save;
    this.save = function() {
      //add before-save callbacks
      self.updateGroups();
      self.updateAssessments();
      self.updateAssessmentGroups();
      self.actualSave();
    };
 
  },

  // defaults: function() { 
  //   return this.defaultsFor('application');
  // },
  
  group_ids: function () {
    return this.metacontent().groups || [] ;
  },

  assessment_ids: function () {
    return this.metacontent().assessments  || [];
  },

  getGroupsAssessments: function() {
    return this.metacontent().groups_assessments || {} ;
  },

  updateGroups: function () {
    var mc = this.metacontent();
    mc.groups = this.groups.map(function(model) { return model.id });
    return this.set_field_value('metacontent_external', mc);
  },

  updateAssessments: function () {
    var mc = this.metacontent();
    mc.assessments = this.assessments.map(function(model) { return model.id });
    return this.set_field_value('metacontent_external', mc);
  },  

  updateAssessmentGroups: function () {
    var mc = this.metacontent();
    mc.groups_assessments = this.groups_assessments;
    return this.set_field_value('metacontent_external', mc);
  },  


  urlRoot: function() { return Dynamo.TriremeURL+'/xelements' },

  viewClass: function() { return showProjectView; },

  editViewClass: function() { return editProjectView; }

});