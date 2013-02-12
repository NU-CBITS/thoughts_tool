//eventFilters
//instance shared across Activity Calendar & Thoughts Tool.
//Depends on definition of FilterSet in 'our_filter_class.js'

eventFilters = new FilterSet();

eventFilters.add(function (event) {
  var timeFilters = selectedValues("#time-filters");
  // debugger
  if ( _.isEmpty(timeFilters) ) { return true };

  //if not empty, gotta figure out if event fits filters;
  var eventStart = event.get_field_value('start'),
      eventEnd = event.get_field_value('end');

  var earliestAcceptableStartTime = null, 
      latestAcceptableEndTime = null;

  if ( _.contains(timeFilters, "mornings") ) {
    earliestAcceptableStartTime = 5;
    latestAcceptableEndTime = 12
  }

  if ( _.contains(timeFilters, "afternoons") ) { 
    if (earliestAcceptableStartTime == null) {
      earliestAcceptableStartTime = 12;
    };
    latestAcceptableEndTime = 12 + 6;
  };

  if ( _.contains(timeFilters, "evenings") ) { 
    if (earliestAcceptableStartTime == null) {
      earliestAcceptableStartTime = 12+6;
    };
    latestAcceptableEndTime = 23;
  };

  if (eventStart.getHours() < earliestAcceptableStartTime) { return false }
  if ( (eventEnd.getHours() < 5) || (eventEnd.getHours() > latestAcceptableEndTime) ) { return false }

  return true;
});

eventFilters.add({
  attribute:"tags",
  accessor_function:"get_field_value",
  type: "inclusive",
  currentFilterValuesFn: function() { return selectedValues("#topic-filters") }
});

eventFilters.add({
  attribute:"emotion",
  accessor_function:"get_field_value",
  type: "inclusive",
  currentFilterValuesFn: function() { return selectedValues("#emotion-filters") }
});