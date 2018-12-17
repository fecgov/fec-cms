put fec visualization demo code here.

to run the demo:

1. start a simple web server - we are using python http simple server as our example

>> python -m http.server

2. go to your favorite browser and go to:

- localhost:8000/index.html: 
  basic map visualiztion(state level choropleth and 
  bubble map demo)

- localhost:8000/dsitrict_index.html:
  a dsitrict level choropleth map

- localhost:8000/zoom_index.html:
  a zoomable map using d3.zoom