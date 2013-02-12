//The purpose of this view is to allow programming that still
//uses backbone for what it is good at:
//separating concerns related to a model and view, 
//and to allow continued use of backbone collections
//
//But to then allow you to seemlessly use Knockout 
//at what it is good at: declarative binding of 
//dom elements to model attributes, with integrated dom manipulation.
BackboneKnockoutModelView = Backbone.View.extend({

  initialize: function() {
    _.bindAll(this);
    _.extend(this, Backbone.Events);
    //b/c knockout will be taking care of syncing model values
    //and dom elements, no need to re-render on model change.
  },

  createKnockoutModel: function() {
    var self = this;
    self.knockoutModel = {};

    _.each(self.model.attributes, function(value, attr_name) {
      
      if (self.options.computedAtts &&
          self.options.computedAtts[attr_name]) {
        var computed_obj = self.options.computedAtts[attr_name];
        if (!computed_obj.owner) { computed_obj.owner = self.knockoutModel };
        self.knockoutModel[attr_name] == ko.computed(computed_obj);
      } else {
        self.createKnockoutModelAttribute(attr_name, value)  
      };

      self.setBackboneAndKnockoutBindings(attr_name);
      
    });

    self.knockoutModel.save = function() {
      self.triggerSave();
    };

    self.knockoutModel.destroy = function() {
      self.triggerDelete();
    };    

    this.model.on('sync', function(syncArg1, syncArg2, syncArg3) {
      console.log("sync callback is passed:", syncArg1, syncArg2, syncArg3);
      alert('Saved.');
    });

  },

  createKnockoutModelAttribute: function(attr, value) {
    var self = this;
    //maybe in the future...
    if ( !_.isArray(value) && 
         !_.isDate(value) &&
          _.isObject(value) ) { 
      throw new Error("Unhandled case: attribute '"+attr+"'\'s value is an object.")
    };

    if ( _.isDate(value) ) {
      var y = value.getFullYear(),
          m = value.getMonth(),
          d = value.getDate(),
          h = value.getHours(),
          min = value.getMinutes();
      self.knockoutModel[attr+"_year"] = ko.observable(y)
      self.knockoutModel[attr+"_month"] = ko.observable(m)
      self.knockoutModel[attr+"_date"] = ko.observable(d)
      self.knockoutModel[attr+"_hour"] = ko.observable(h)
      self.knockoutModel[attr+"_minute"] = ko.observable(min)
      self.knockoutModel[attr] = ko.computed(function() {
        var s = this;
        return new Date(  s[attr+"_year"](), 
                          s[attr+"_month"](), 
                          s[attr+"_date"](), 
                          s[attr+"_hour"](), 
                          s[attr+"_minute"]() );
      }, self.knockoutModel);
    }

    // An array will benefit from having available 
    // add and remove functions.
    if ( _.isArray(value) ) {

      var defaultElValue = self.options.arrayDefaults[attr],
          elConstructor = function(element_value) {
            return {
              value: ko.observable(element_value),
              remove: function() { 
                self.knockoutModel[attr].remove(this)
              }
            }
          };

      self.knockoutModel[attr] = ko.observableArray(
        _.map(value, function(el) { return new elConstructor(el) })
      );

      self.knockoutModel[attr+"_addElement"] = function() {
        self.knockoutModel[attr].push( new elConstructor(defaultElValue) );
      };

    };

    if (  _.isString(value) || 
          _.isFinite(value) ||  
          _.isBoolean(value) 
       ) {
      console.log("setting "+attr+" to "+value);
      this.knockoutModel[attr] = ko.observable(value);
    };

    if ( _.isNull(value) || 
         _.isUndefined(value)
       ) {
      this.knockoutModel[attr] = ko.observable(false);
    };

  },

  setBackboneAndKnockoutBindings: function(attr_name) {
    var self = this;

    //If any change is made to a model attribute (in backbone), 
    //the knockout model needs to be updated accordingly.
    this.model.on('change:'+attr_name, function() { self.updateKnockoutModelAttribute(attr_name) } )

    //Any changes that knockout will make to the view,
    //We want to make to our backbone model.
    //HOWEVER, we cannot trigger a normal change event on the backbone model,
    //or we will enter an infinite loop due to the needed on-change
    //code above.
    //So, instead, we call set with {silent:true} and 
    //trigger a different event on the backbone model - 'change:fromKnockout';
    this.knockoutModel[attr_name].subscribe(function(newValueFromKnockout) {
      var set_obj = {};
      console.log("updating "+attr_name, newValueFromKnockout);
      set_obj[attr_name] = newValueFromKnockout;
      self.model.set(set_obj, { silent:true });
      self.model.trigger("change:fromKnockout");
      self.model.trigger("change:fromKnockout:"+attr_name);
    });
  },

  //a knockout Template is required to 
  //be either passed into the view
  //or defined by the model.
  knockoutTemplate: function() {
    var template = this.options.knockoutTemplate || this.model.get("knockoutTemplate")
    if (template) {
      return template;
    } else {
      throw new Error("No knockout template available.");
    }
  },

  //use the correct Knockout method to make a change
  //to an attribute on the knockout model.
  updateKnockoutModelAttribute: function(attr, value) {
    if (typeof(value) == undefined) { value = this.model.get(attr) };
    var observableFunction = this.knockoutModel[attr];
    observableFunction(value);
  },

  //although rare, it is conceivable we may want to update
  //all Knockout Model attributes under certain conditions.
  updateKnockoutModel: function() {
    var self = this;
    _.each(this.model.attributes), function(val, attr) {
      self.updateKnockoutModelAttribute(key, val);
    };
  },

  //render function is greatly simplified
  //as the supplied template will do all the 
  //heavy lifting!
  render: function() {
    this.$el.html( this.knockoutTemplate() );
    this.createKnockoutModel();
    ko.applyBindings(this.knockoutModel, this.$el.get(0));
    return this;
  },

  triggerSave: function() {
    this.trigger('model:save');
  },

  triggerDelete: function() {
    this.trigger('model:delete');
  }

});

BackboneKnockoutCollectionView = Backbone.View.extend({

  initialize: function() {
    _.bindAll(this);
    this.collectionAtts = this.options.collectionAtts || this.collectionAtts;
    this.getElementAttsfn = this.options.getElementAttsfn || this.getElementAttsfn;
    this.computedElementAtts = this.options.computedElementAtts || this.computedElementAtts;
    this.validateBeforeAdd = this.options.validateBeforeAdd || this.validateBeforeAdd;
    this.createKnockoutModel();
  },

  customKnockoutModelOptions: function() {
    return (this.getElementAttsfn && this.computedElementAtts);
  },

  validateBeforeAdd: function() {
    return true;
  },

  createKnockoutModel: function() {
    var self = this, objects;
    self.knockoutModel = {};

    // The collection can have properties itself
    // which may be used in the template.
    if (this.collectionAtts) {
      _.each(this.collectionAtts, function(value, attr_name) {
        self.knockoutModel[attr_name] = ko.observable(value);
      });      
    };

    // if we don't need any special options 
    // for knockout's viewModel, 
    if ( !self.customKnockoutModelOptions() ) {
      objects = self.collection.models;
    }
    else {

      objects = self.collection.map(function(model) {

        var object;
        //  Fetching the desired set of attributes
        //  for knockout's viewModel may not require
        //  a simple 'model.attributes' call.
        //  If something more complicated is required,
        //  you can define the method to call on the model
        //  as the view option 'getElementAttsfn', 
        //  whose value is the name of the function (as a string).
        if (self.getElementAttsfn) {
          object = eval("model."+self.getElementAttsfn+"()");
        }
        else {
          object = model.attributes
        };

        //In addition to a custom method to fetch attributes,
        //you may desire that computed observables
        //be a part of each of your collection's element's knockout Model.
        //You can pass into the view an option 'computedElementAtts'
        //whose value is an object where the keys are the 
        //names of the computed observables
        //and the values are a function, which accept the backbone model object
        //and RETURN the function that computes the value of the computed observable.
        if (self.computedElementAtts) {

          _.each(self.computedElementAtts, function(fnThatReturnsComputeFn, key) {

            object[key] = ko.computed(fnThatReturnsComputeFn(model), object);

          });
          
        };
        
        return object
      });


    };

    // After Alll that, we can finally turn this 
    // set of objects into an observableArray
    self.knockoutModel.items = ko.observableArray(objects);
    
    // Add function to allow the collection's knockoutTemplate to 
    // use an 'addElement' function in order to add an
    // element to the backbone collection
    self.knockoutModel.addElement = self.addFromTemplateToCollection;


    // Ideally, we would also like to add a function that allows 
    // the collection's knockoutTemplate to have a 'removeElement' function. 
    // due to possible discrepancies between a knockoutModel's attributes,
    // and the backbone model's (e.g, if not yet saved, no id)
    // no fool-proof way to easily implement seen and therefore
    // not written until we need it.
    // self.items.removeElement = self.removeFromTemplateToCollection

    // If your template for the collection has you displaying individual elements,
    // you have the option of specifying an additional template for the 
    // individual elements in the collection,
    // so that you can refer to this template in your collection's template.
    self.knockoutModel.elementTemplate = function() { return self.options.knockoutElementTemplate };

    
    // If any change is made to the collection in backbone, 
    // the knockout elements array needs to be updated accordingly.
    self.collection.on('add',  self.addElementToKnockout)
    self.collection.on('remove',  self.removeElementFromKnockout)    

  },

  //This function allows any knockoutTemplate to create a proxied
  //to the knockout viewModel object 
  //an element that will be saved and added to both the backbone collection
  //and 
  addFromTemplateToCollection: function(formElementWithBindedSubmit) {
    var self = this;
    var newData = new Dynamo.Data({
      server_url: Dynamo.TriremeURL,
      user_id: Dynamo.CURRENT_USER_ID,
      group_id: Dynamo.CURRENT_GROUP_ID
    });


    $form = $(formElementWithBindedSubmit);
    $inputtedAtts = $form.children('textarea,input');
    $inputtedAtts.each(function(index, input) {

      attr_name = $(input).data('attr-name') || $(input).attr('name');
      attr_type = $(input).data('attr-type') || "string";
      if (_.indexOf(["server_url", "xelement_id", "user_id", "group_id"], attr_name) == -1) {
        newData.set_field( attr_name, attr_type, $(input).val() );
      }
      else {
        newData.set(attr_name, $(input).val() )
      };
      
    });

    // prevent addition if optional method
    //'validateBeforeAdd returns false'
    if ( self.validateBeforeAdd && 
         !self.validateBeforeAdd(newData) ) {
        return false; 
    };


    // on return from a successful save, 
    // this will add the new data to the collection
    // and should also trigger 
    // 'addElementToKnockout' per the event callback above:
    newData.save(null, {
      success: function() {
        self.collection.add(newData)
      }
    });

  },

  // removeFromTemplateToCollection: function(item, clickEvent) {
  //   self.collection
  //   self.items.remove(item);

  // },

  addElementToKnockout: function(addedModel) { 
    var atts;

    if (this.getElementAttsfn) {
      atts = eval("addedModel."+this.getElementAttsfn+"()");
    }
    else {
      atts = addedModel.attributes;
    };

    this.knockoutModel.items.push(atts);
  },

  removeElementFromKnockout: function(removedFromCollectionModel) { 
    this.knockoutModel.items.remove(function(item) { return item.id == removedFromCollectionModel.id });
  },

  //a knockout Template is required to 
  //be either passed into the view or defined in the collection.
  knockoutTemplate: function() {
    var template = this.options.knockoutTemplate || this.collection.knockoutTemplate
    if (template) {
      return template;
    } else {
      throw new Error("No knockout template available.");
    };
  },  

  //render function is greatly simplified
  //as the supplied template will do all the 
  //heavy lifting!
  render: function() {
    this.$el.html( this.knockoutTemplate() );
    ko.applyBindings(this.knockoutModel, this.$el.get(0));
  }

});

