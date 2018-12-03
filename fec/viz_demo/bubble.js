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

//read data and draw map, call draw_cities to add bubbles
d3.json("us.json").then(function(data){
    svg.selectAll('path')
    .data(data.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', '#58CCE1')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1);

    draw_cities()
});

// draw the bubbles
// each bubble is a circle with attrs 'cx, cy, r
// cx, cy can be calcuated with lon/lat data with projection
// r is defined with 'population' value - need proper tranformation depending on what value is involved.
function draw_cities(){
  d3.json('us-cities.json').then(function(city_data){
    svg.selectAll('circle')
      .data(city_data)
      .enter()
      .append('circle')
      .style('fill', '#808000')
      .style('opacity', 0.8)
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
