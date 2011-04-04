/*
 * CamanJS event system
 * Events can be subscribed to using Caman.listen() and events
 * can be triggered using Caman.trigger().
 */
 
(function (Caman) {

Caman.events  = {
  types: [ "processStart", "processComplete", "renderFinished" ],
  fn: {
    
    /*
     * Triggers an event with the given target name.
     */
    trigger: function ( target, type, data ) {
      
      var _target = target, _type = type, _data = data;
    
      if ( Caman.events.types.indexOf(target) !== -1 ) {
        _target = this;
        _type = target;
        _data = type;
      }
    
      if ( Caman.events.fn[_type] && Caman.sizeOf(Caman.events.fn[_type]) ) {

        Caman.forEach(Caman.events.fn[_type], function ( obj, key ) {

          obj.call(_target, _data);
        
        });
      }
    },
    
    /*
     * Registers a callback function to be fired when a certain
     * event occurs.
     */
    listen: function ( target, type, fn ) {

      var _target = target, _type = type, _fn = fn;
    
      if ( Caman.events.types.indexOf(target) !== -1 ) {
        _target = this;
        _type = target;
        _fn = type;
      }        

      if ( !Caman.events.fn[_type] ) {
        Caman.events.fn[_type] = [];
      }

      Caman.events.fn[_type].push(_fn);
      
      return true;
    }
  },
  cache: {} 
};
  
Caman.forEach( ["trigger", "listen"], function ( key ) {
  Caman[key] = Caman.events.fn[key];
});
  
})(Caman);