// Width and height
var chart_width     =   800;
var chart_height    =   600;

//define a projection
var projection = d3.geoAlbersUsa()
    .scale([chart_width])
    .translate([chart_width/2, chart_height/2]);

//define a path
var path = d3.geoPath(projection);

// Create SVG
var svg             =   d3.select("#chart")
    .append("svg")
    .attr("width", chart_width)
    .attr("height", chart_height);

//color: http://colorbrewer2.org
var color = d3.scaleQuantize().range([
      'rgb(255,245,240)',
      'rgb(254,224,210)',
      'rgb(252,187,161)',
      'rgb(252,146,114)',
      'rgb(251,106,74)',
      'rgb(239,59,44)',
      'rgb(203,24,29)',
      'rgb(165,15,21)',
      'rgb(103,0,13)'
    ]);

//read user data, define the domain for your color scale
d3.json("attacks.json").then(function(attacks_data){
  color.domain([
    d3.min(attacks_data, function(d){
      return d.num;
    }),
    d3.max(attacks_data, function(d){
      return d.num;
    })
  ]);

//loop map data and user data to merge them based on state name
d3.json("us.json").then(function(us_data){
  us_data.features.forEach(function(us_e, us_i){
    attacks_data.forEach(function(att_e, att_i){
      if(us_e.properties.name !== att_e.state){
        return null;
      }
      // adding the 'num' value to map data for easy access
      us_data.features[us_i].properties.num = parseFloat(att_e.num)
    });
  });

  //draw the map, fill the color for each state based on 'num' and color scale
  //add a 'tile' element for a quick tooltip in the end
  svg.selectAll('path')
    .data(us_data.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', function (d) {
      var num = d.properties.num;
      return num ? color(num) : '#ddd';
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .append('title')
    .text(function (d) {
      return d.properties.name + '\n' + d.properties.num
    });

    draw_cities()
});
});

function draw_cities(){
  d3.json('us-cities.json').then(function(city_data){
    svg.selectAll('circle')
      .data(city_data)
      .enter()
      .append('circle')
      .style('fill', 'green')
      .style('opacity', 0.5)
      .attr('cx', function(d){
        return projection([d.lon, d.lat])[0]
      })
      .attr('cy', function(d){
        return projection([d.lon, d.lat])[1]
      })
      .attr('r', function(d){
        return Math.sqrt(parseInt( d.population )*0.00005);
      })
      .append('title')
      .text(function(d){
        return d.city
      });
  });
}
