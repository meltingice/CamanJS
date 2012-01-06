// The event system in Caman is responsible for registering and firing events at 
// certain points during the render process. It is fairly straightforward and consists
// of a listen() and trigger() function.
//
// The listen() function takes a type (string describing what event to listen for) and a
// callback that is fired when the event occurs. The trigger() function takes a type 
// (name of the event) and some optional data to pass to the registered callbacks that will be fired.

/*global Caman: true */ 
(function (Caman) {

Caman.events  = {
  types: [ "processStart", "processComplete", "renderFinished" ],
  fn: {
    
    // Triggers an event with the given target name.
    // The target argument can often be omitted if you want
    // to listen to events from all Caman instances on the page.
    trigger: function ( target, type, data ) {
      
      var _target = target, _type = type, _data = data;
    
      // Adjust the arguments if target is omitted.
      if ( Caman.events.types.indexOf(target) !== -1 ) {
        _target = this;
        _type = target;
        _data = type;
      }
    
      if ( Caman.events.fn[_type] && Caman.sizeOf(Caman.events.fn[_type]) ) {
        // Iterate over all of the registered callbacks
        Caman.forEach(Caman.events.fn[_type], function ( obj, key ) {
          // Call the event callback with the context set to the Caman
          // object that fired the event.
          obj.call(_target, _data);
        });
      }
    },
    
    // Registers a callback function to be fired when a certain
    // event occurs.
    listen: function ( target, type, fn ) {

      var _target = target, _type = type, _fn = fn;
    
      // Adjust the arguments if the target is omitted
      if ( Caman.events.types.indexOf(target) !== -1 ) {
        _target = this;
        _type = target;
        _fn = type;
      }        

      // If an event of this type hasn't been defined before, define it now.
      if ( !Caman.events.fn[_type] ) {
        Caman.events.fn[_type] = [];
      }

      // Add the event to the callback array
      Caman.events.fn[_type].push(_fn);
      
      return true;
    }
  },
  cache: {} 
};
  
// Enable easier access to the events system via the main Caman object
Caman.forEach( ["trigger", "listen"], function ( key ) {
  Caman[key] = Caman.events.fn[key];
});
  
})(Caman);