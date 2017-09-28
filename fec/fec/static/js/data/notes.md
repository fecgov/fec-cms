# Data Sources

* US states
    * Build from Census data using https://github.com/mbostock/us-atlas

* FIPS state codes
    * http://www2.census.gov/geo/docs/reference/state.txt

# Updating district maps
1. Download the latest Congressional district shape files from the census. For example: http://www2.census.gov/geo/tiger/TIGER2016/CD/tl_2016_us_cd115.zip.
2. Unzip the shapefiles to a subdirectory called `src/` in this directory
2. Run `./create_districts_topo.sh` to create a new `districts.json`. You might have to make the script executable first: `chmod +x create_districts_topo.sh`.
