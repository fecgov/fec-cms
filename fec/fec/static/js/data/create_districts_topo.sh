SOURCE_FILE=src/tl_2016_us_cd115.shp # unzipped http://www2.census.gov/geo/tiger/TIGER2016/CD/tl_2016_us_cd115.zip to ./src/
OUT_FILE=districts.json
SIMP_PARAM=0.015 # lower value = more simplification, ref: https://github.com/topojson/topojson-simplify/blob/master/README.md#toposimplify_spherical_quantile
QUANTIZE_PARAM=1e5
PATH=$(npm bin):$PATH

# Process based on https://medium.com/@mbostock/command-line-cartography-part-3-1158e4c55a1e

set -eu

shp2json $SOURCE_FILE | \
  # convert to ndjson
  ndjson-split 'd.features' | \
  # Only keep features that have strictly numeric GEOID props
  # because some of them have "ZZ" in their GEOID
  ndjson-filter '/^\d+$/.test(d.properties.GEOID)' | \
  # assign integer id based on the original GEOID string
  ndjson-map 'd.id = parseInt(d.properties.GEOID, 10), d' | \
  # remove all properties
  ndjson-map 'd.properties = {}, d' > .tmp.ndjson

# covert to topojson and simplify + quantize
geo2topo -n districts=.tmp.ndjson | \
  toposimplify -S $SIMP_PARAM -f | \
  topoquantize $QUANTIZE_PARAM > $OUT_FILE

rm .tmp.ndjson
ls -alh $OUT_FILE
