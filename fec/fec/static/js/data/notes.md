# Data Sources

* US states
    * Build from Census data using https://github.com/mbostock/us-atlas

* FIPS state codes
    * https://www2.census.gov/geo/docs/reference/state.txt

# Updating district map

### Prerequisites 
For the create_districts_topo.sh script you need the following npm packages: shapefile, ndjson-cli, topojson-simplify,  topojson-server, topojson-client 

`npm install -g shapefile`
`npm install  -g ndjson-cli`
`npm install -g topojson-simplify`
`npm install -g topojson-server`
`npm install -g topojson-client`

### With National Shape File 
1. Download the latest Congressional district shape files from the census. For example: https://www2.census.gov/geo/tiger/TIGER2016/CD/tl_2016_us_cd115.zip.
2. Unzip the shapefiles to a subdirectory called `src/` in this directory
3. Ensure that the variable SOURCE_FILE is set to the name of your shape file in `create_districts_topo.sh`
4. Run `./create_districts_topo.sh` to create a new `districts.json`. You might have to make the script executable first: `chmod +x create_districts_topo.sh`.

### With Geodatabase 
1. Install the GDAL library: `brew install gdal`
2. Download latest geodatabase from the Census website. [example](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-geodatabase-file.html)
3. Run the following command: `ogr2ogr -f "ESRI Shapefile" "{folder to put shp files}" "{name of geodatabase}.gdb"` This will generate a folder with shape files. 
4. Move all "current_congressional_districts" files to a subdirectory called `src/` in this directory. There should be a .prj file, .dbf file, .shx file, and .shp file. 
5. Open file create_districts_topo.sh
* ensure that the variable SOURCE_FILE is set to the name of your shape file from step 4. 
6. Run `./create_districts_topo.sh` to create a new `districts.json`.
