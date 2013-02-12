// site-wide-stuff.js

LikesView = BackboneKnockoutCollectionView.extend({
  getElementAttsfn: "get_fields_as_object",
  validateBeforeAdd: function(modelToAdd) {
    //expected to be called w/ 'this' referring to the view
    alreadyLiked = this.collection.any(function(m) {
      return (
        m.get("user_id") == Dynamo.CURRENT_USER_ID &&
        m.get_field_value("commented_on_id") == modelToAdd.get_field_value("commented_on_id")
      );
    });
    if (alreadyLiked) { return false; }
    return true;
  }
});

CommentsView =  BackboneKnockoutCollectionView.extend({
  getElementAttsfn: "get_fields_as_object",
  computedElementAtts: {
    user: function(model) {
      var guid = model.get("user_id");
      return function() { return USERS.get(guid).attributes };
    }
  }
});

setSiteWideStuff = function() {

  siteWideLikes = new Dynamo.GroupWideData({
    server_url: Dynamo.TriremeURL,
    xelement_id: LIKES_GUID,
    group_id: Dynamo.CURRENT_GROUP_ID
  });

  siteWideComments = new Dynamo.GroupWideData({
    server_url: Dynamo.TriremeURL,
    xelement_id: COMMENTS_GUID,
    group_id: Dynamo.CURRENT_GROUP_ID
  });

  userSelect = new Dynamo.InputGroupView({
    id: "admin_user_select",
    attributes: {
      class: "admin_dialog"
    },
    getValue: function() {
      return Dynamo.CURRENT_USER_ID
    },
    setValue: function(new_value) {
      Dynamo.CURRENT_USER_ID = new_value;
      this.trigger('value:set');
    },
    responseType: "radio",
    responseValues: [{
      label: "Testy",
      value: "TEST-USER-GUID"
    },{
      label: "foodNinja",
      value: "TEST-USER-GUID-2"
    },{
      label: "violaMars",
      value: "TEST-USER-GUID-3"
    },{
      label: "racer21",
      value: "TEST-USER-GUID-4"
    }]
  });

  userSelect.$el.prependTo('body');
  userSelect.render();

};


initializeLoadAndThen = function(callback) {

  LIKES_GUID = "SOCIAL-NETWORKING-LIKES-GUID"
  COMMENTS_GUID = "SOCIAL-NETWORKING-COMMENTS-GUID"
  Dynamo.CURRENT_USER_ID = 'TEST-USER-GUID';
  Dynamo.CURRENT_GROUP_ID = "3c9b8cae7522f9d0cb7a64b673f50798";

  xel_base_request = $.get( addSessionVarsToUrl(Dynamo.TriremeURL+'/xelements/xelement_base') );
  // -- Global variables that store all of the specific
  //    type of objects fetched from the server.
  
  USERS = new Dynamo.UserCollection();
  USER_GROUPS = new Dynamo.GroupCollection();
  XELEMENTS = new Dynamo.XelementCollection();

  // QUESTIONS = new QuestionCollection();
  // QUESTION_GROUPS = new QuestionGroupCollection();
  // QUESTIONS_ABOUT_DATA = new QuestionAboutDataCollection();


  $.when( xel_base_request ).done(function() {

    XELEMENT_BASE = new Backbone.Model(convertFalses(JSON.parse(JSON.parse(xel_base_request.responseText).xel_data_values.content)));

    // -- Fetch order matters!
    users_fetched = USERS.fetch({ async: false });
    user_groups_fetched = USER_GROUPS.fetch({ async: false });
    xelements_fetched = XELEMENTS.fetch({async: false});

    // questions_fetched = QUESTIONS.fetch({ async: false});
    // question_groups_fetched = QUESTION_GROUPS.fetch({ async: false});
    // questions_about_data_fetched = QUESTIONS_ABOUT_DATA.fetch({ async: false});

    //Hack b/c passing { async:false } in the fetches
    //above alone seems intermittently unreliable
    $.when( users_fetched  ).done(function() {

      $.when( user_groups_fetched ).done(function() {

        $.when( xelements_fetched ).done(function() {


            QUESTIONS = new QuestionCollection(XELEMENTS.map(function(xel) {
              if (xel.get_field_value("xelement_type") == "question") {
                return (new QuestionModel(xel.attributes));
              }
            }));

            QUESTION_GROUPS = new QuestionGroupCollection(XELEMENTS.map(function(xel) {
              if (xel.get_field_value("xelement_type") == "question_group") {
                return (new QuestionGroupModel(xel.attributes))
              };
            }));

            QUESTIONS_ABOUT_DATA = new QuestionAboutDataCollection(XELEMENTS.map(function(xel) {
              if (xel.get_field_value("xelement_type") == "question_about_data") {
                return (new QuestionAboutDataModel(xel.attributes));
              }
            }));

            SLIDES = new SlideCollection(XELEMENTS.chain().map(function(xel) {
              if (xel.get_field_value("xelement_type") == "static_html") {
                return (new SlideModel(xel.attributes))
              };
            }).compact().value());

            // SLIDE_ACTIONS = new SlideActionsCollection(XELEMENTS.map(function(xel) {
            //   if (xel.get_field_value("xelement_type") == "slide_action") {
            //     return (new QuestionAboutDataModel(xel.attributes));
            //   }
            // }));

            GUIDES = new GuideCollection(XELEMENTS.chain().map(function(xel) {
              if (xel.get_field_value("xelement_type") == "guide") {
                return (new GuideModel(xel.attributes))
              };
            }).compact().value());            

              setSiteWideStuff();
              userSelect.on('value:set', callback);
              callback();



        }); // xelements

      }); //groups

    }); //users

  }); // xel_base_request

};



