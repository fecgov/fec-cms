import shutil
import geopandas as gpd
import os
import subprocess
from urllib.error import HTTPError
from urllib.request import urlopen
from tempfile import NamedTemporaryFile

MAX_STATE_NUMBER = 79
URL = 'https://www2.census.gov/geo/tiger/TIGER_RD18/LAYER/CD/'
FILE_NAME = 'tl_rd22_{}_cd118'


def GetStateShpFiles():
    shp_file_list = []

    for state_number in range(MAX_STATE_NUMBER):
        try:
            if state_number <= 9:
                TempFileName = FILE_NAME.format('0' + str(state_number))
            else:
                TempFileName = FILE_NAME.format(state_number)

            # get zipped files
            with urlopen(URL + TempFileName + '.zip') as zipresp, NamedTemporaryFile() as tfile:
                tfile.write(zipresp.read())
                tfile.seek(0)

                # unzip files
                shutil.unpack_archive(tfile.name, '/tmp', format='zip')

                CD = gpd.read_file('/tmp/' + TempFileName + '.shp')
                shp_file_list.append(CD)

                print('added ' + FILE_NAME.format(state_number) + '.shp to map')

        except HTTPError as err:
            # ignore 404 errors, there are gaps in state numbering
            if err.code == 404:
                continue
            else:
                raise
    return shp_file_list


if __name__ == "__main__":
    print("This script will scrape the Census Bureau website: ({}) "
          "to combine state shape files into one national file.".format(URL))
    print()

    Map = gpd.pd.concat(GetStateShpFiles())

    if not os.path.exists('src/'):
        os.mkdir('src/')

    Map.to_file("src/districts.shp")

    print()

    print("Calling create_districts_topo.sh to transform shape file into topojson")

    print()

    print(subprocess.run(["./create_districts_topo.sh"], shell=True))

    shutil.rmtree("src/")
