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

//read data and draw map
d3.json("us.json").then(function(data){
    svg.selectAll('path')
    .data(data.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', '#58CCE1')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1);
});
