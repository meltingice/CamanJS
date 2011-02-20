(function ($, Caman) {

var test_filters = [
	// Standard filters
  {filter: 'brightness', args: [50]},
  {filter: 'clip', args: [30]},
  {filter: 'channels', args: [{red: 20, green: -5, blue: -10}]},
  {filter: 'colorize', args: ['#AF3D15', 20]},
  {filter: 'contrast', args: [20]},
  {filter: 'gamma', args: [2.2]},
  {filter: 'greyscale', args: []},
  {filter: 'hue', args: [10]},
  {filter: 'invert', args: []},
  {filter: 'noise', args: [20]},
  {filter: 'saturation', args: [-50]},
  {filter: 'vibrance', args: [50]},
  {filter: 'sepia', args: [50]},
];

Array.prototype.average = function () {
  var total = 0;
  for (var i = 0; i < this.length; i++) {
    if (typeof(this[i]) === 'number') {
      total += this[i];
    }
  }
  
  return (total / this.length);
};

if (!('console' in window)) {
  window.console = {
    log: function () {},
    info: function () {},
    error: function () {}
  };
}

var benchmark = (function () {
  var results = {},
  isSetup = false;
  
  var control = (function () {
    var current = 0,
    iterations = 1,
    current_iteration = 1,
    last_iteration = 1,
    current_test = null,
    finish_callback = null,
    plot = null;
    
    return {
      setUp: function () {
        // If canvas is already present, then remove it
        if ($('#test-canvas')) {
          $('#image-wrap').empty();
        }
        
        // Create new canvas for testing
        $('<canvas />')
          .attr('id', 'test-canvas')
          .appendTo('#image-wrap');
        
        if (!isSetup) {
          var row, cell, i, j;
          
          for (i = 0; i < iterations; i++) {
            $('<td />')
              .html('Iteration #' + (i+1))
              .appendTo('#test-header');
          }
          
          $('<td />').html('Average').appendTo('#test-header');
          
          for (i = 0; i < test_filters.length; i++) {
            row = $('<tr />');
            
            for (j = 0; j < iterations + 2; j++) {
              cell = $('<td />');
              
              if (j === 0) {
                cell.html(test_filters[i].filter);
              } else if (j === iterations + 1) {
                cell.attr('id', test_filters[i].filter + '_average');
              } else {
                cell.attr('id', test_filters[i].filter + '_' + j);
              }
              
              cell.appendTo(row);
            }
            
            $("#test-results").append(row);
          }
          
          isSetup = true;
        }
      },
      
      next: function () {
        current_test = test_filters[current];
        last_iteration = current_iteration;

        if (current_iteration == iterations) {
          current++;
          current_iteration = 1;
        } else {
          current_iteration++;
        }
        
        return current_test;
      },
      
      hasNext: function () {
        return test_filters[current] != undefined;
      },
      
      setIterations: function (num) {
        iterations = num;
      },
      
      registerFinished: function (callback) {
        finish_callback = callback;
      },
      
      fireFinished: function (results) {
        for (var filter in results) {
          if (results.hasOwnProperty(filter)) {
            results[filter].avg = results[filter].times.average();
          }
        }
        
        var chartData = [];
        var tickNames = [];
        var i = 1;
        $.each(results, function (filter, data) {
        	chartData.push({data: [[i, Math.round(data.avg)]], label: filter});
        	tickNames.push([i, filter]);
        	i++;
        });
        
        if (plot === null) {
        	plot = $.plot($("#test-graph"), chartData,
        	{
        		series: {
        			bars: {show: true, barWidth: 1.0, align: "center"}
        		},
        		xaxis: {
        			ticks: tickNames
        		},
        		legend: {show: false}
        	});
        }
        
        finish_callback(results);
      },
      
      iterationFinished: function (time) {
        $("#" + current_test.filter + "_" + last_iteration).html(time + "ms");
        
        if (current_iteration === 1) {
          this.filterFinished();
        }
      },
      
      filterFinished: function () {
        var filter = test_filters[current - 1].filter,
        avg = Math.round(results[filter].times.average());
        
        $('#' + filter + '_average').html(avg + 'ms');
      }
    };
  }());
  
  return {
    run: function (iterations, finish_callback) {
      var bench = this;
      
      if (finish_callback) {
        control.registerFinished(finish_callback);
      }
      
      if (iterations) {
        control.setIterations(iterations);
      }
      
      control.setUp();

      Caman('benchmark/testimg.jpg', "#test-canvas", function () {
        var test = control.next(),
        start, end;
        
        // Start timer
        start = new Date().getTime();
        
        this[test.filter].apply(this, test.args);
        
        this.render(function () {
          var time;
          
          end = new Date().getTime();
          time = end - start;
          
          if (!results[test.filter]) {
            results[test.filter] = {
              times: []
            };
          }
          
          results[test.filter].times.push(time);
          
          console.log(test.filter + " finished in " + time + "ms");
          control.iterationFinished(time);
          
          if (control.hasNext()) {
            setTimeout(function () {
              bench.run();
            }, 100);
          } else {
            control.fireFinished(results);
          }
        });
      });
    }
  };
}());

window.benchmark = benchmark;

}(jQuery, Caman));