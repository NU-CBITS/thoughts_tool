FilterSet = (function() {

  function FilterSet() {
    this.filters = [];
  };

  // Each filter will EITHER 
  // Be a function, 
  //   which will accept an element of the collection and return true or false,
  // OR 
  // Be an object, with the following keys:
  //  attribute: 
  //   string name of the attribute on an element to which the filter applies;
  //   if ommitted, the pass function will be applied to the whole element.
  //  currentFilterValuesFn: returns the array of the filter's values that are currently selected
  //  type: "inclusive" or "exclusive" -- whether an attribute matching the filter
  // Optionally with:
  //  accessor_function - function to call on the element and pass the attribute name into.
  FilterSet.prototype.add = function(filterObjOrFn) {

    if ( _.isFunction(filterObjOrFn) || _.isObject(filterObjOrFn) ) { 
      this.filters.push(filterObjOrFn);
    } else {
      throw new Error("filter should be a function or an object"); 
    };

  };

  FilterSet.prototype.elementPasses = function(element) {

    return _.all(this.filters, function(filter) {

        var currentFilterValues;
        var currentAttributeValue;

        if ( _.isFunction(filter) ) { return filter(element) };

        // Filter is an object

        // Get current values of the Filter
        currentFilterValues = filter.currentFilterValuesFn();
        


        // If none of these FilterSet are currently selected, 
        // assume that this filter does not currently apply and 
        // return true;
        if ( _.isEmpty(currentFilterValues) ) { return true };

        // find the current value of the attribute;
        if (filter.accessor_function) {
          var attributeAccessorFn = eval("element."+filter.accessor_function);
          currentAttributeValue = attributeAccessorFn(filter.attribute);
        } else {
          currentAttributeValue = _.result(element, filter.attribute);
        };

        // If it currentFilterValues contain the currentAttributeValue (or one of the currentAttributeValues), 
        // then return true if not an 'exclusive' filter, false otherwise:
        var result;
        if (_.isArray(currentAttributeValue)) {
          result =  ( (!_.isEmpty( _.intersection(currentFilterValues, currentAttributeValue) )) && (filter.type != "exclusive") );
        } else {        
          result = ( _.contains(currentFilterValues, currentAttributeValue) && (filter.type != "exclusive") );
        };



        console.log("Testing Element", JSON.stringify(element.get_fields_as_object()), "attribute ", filter.attribute,
                    "Current Value:", currentAttributeValue, " -- against filter ", 
                    currentFilterValues, filter.currentFilterValuesFn, filter,
                    "Result: ", result
                    )

        debugger;        

        return result;


    });
  };  

  FilterSet.prototype.getFilters = function() {
    return this.filters;
  };

  // collection: Array or array-like object
  // getElementsFnName: 
  //  function that can be called on collection and will return elements as an array.
  //  if not provided, will attempt to use _.each directly on collection;
  FilterSet.prototype.filter = function(elements) {
    var self = this;
    
    if ( elements instanceof Backbone.Collection) {
      return elements.chain().filter(function(el) { return self.elementPasses(el) }).compact().value();
    } else {
      return _.compact(_.filter(elements, function(el) { return self.elementPasses(el) }));  
    };
    
  };

  return FilterSet;
}) ();