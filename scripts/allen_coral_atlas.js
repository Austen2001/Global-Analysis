// Workshop 4: Allen Coral Atlas
// Author: Austen Wong Won
// Date: 30 July 2026
// Purpose: Find which research station has the most coral
// and algae habitat within snorkelling distance.


// 1. GLOBAL VARIABLES

// Snorkelling distance in metres
var distance = 800;


// 2. RESEARCH STATION LOCATIONS

// Put all research stations into one collection
var field_stations = ee.FeatureCollection([
  Heron,
  Orpheus,
  Hamilton,
  Lizard,
  Daydream,
  Gump,
  CarrieBow,
  CARMABI,
  HIMB
]);

// Check the stations
print('Field stations:', field_stations);
print('Number of stations:', field_stations.size());

// Add stations to the map
Map.addLayer(
  field_stations,
  {color: 'cyan'},
  'Field stations'
);

Map.centerObject(field_stations, 2);


// 3. VECTOR OPERATIONS

// Make an 800 metre buffer around each station
var station_buffers = field_stations.map(
  function(station) {
    return station.buffer(distance);
  }
);

// Check the buffers
print(
  'All station buffers:',
  station_buffers
);

// Add buffers to the map
Map.addLayer(
  station_buffers.style({
    color: 'yellow',
    fillColor: 'ffff0033',
    width: 2
  }),
  {},
  'All 800 metre station buffers'
);


// 4. ALLEN CORAL ATLAS OPERATIONS

// Load the Allen Coral Atlas
var aca = ee.Image(
  'ACA/reef_habitat/v2_0'
);

print('Allen Coral Atlas:', aca);

// Show the benthic habitat layer
var benthicHabitat = aca
  .select('benthic')
  .selfMask();

Map.addLayer(
  benthicHabitat,
  {},
  'ACA benthic habitat'
);

// Keep only coral and algae habitat
var coral = aca
  .select('benthic')
  .eq(15)
  .selfMask();

print('Coral and algae layer:', coral);

Map.addLayer(
  coral,
  {palette: ['magenta']},
  'Coral and algae only'
);

// Calculate coral and algae area around each station
var coral_area = coral
  .multiply(ee.Image.pixelArea())
  .rename('coral_area_m2')
  .reduceRegions({
    collection: station_buffers,
    reducer: ee.Reducer.sum(),
    scale: 5
  });

// Sort stations from most to least coral area
var coral_area_sorted = coral_area.sort(
  'sum',
  false
);

// Show the results
print(
  'Coral area around each station:',
  coral_area_sorted
);

print(
  'Station with the greatest coral area:',
  coral_area_sorted.first()
);


// 5. EXPORTS AND RESULTS

// Export the results as a CSV
Export.table.toDrive({
  collection: coral_area_sorted,
  description: 'Workshop4_Coral_Area',
  fileNamePrefix: 'research_stations_coral_area',
  fileFormat: 'CSV',
  selectors: ['station', 'sum']
});

// Make an export area around Orpheus Island
var export_region = Orpheus.buffer(distance);

// Clip the Atlas to the export area
var export_image = aca.clip(
  export_region
);

Map.addLayer(
  export_image,
  {},
  'ACA export around Orpheus'
);

// Add colours to the habitat classes
var colour_image = aca
  .select('benthic')
  .remap(
    [0, 11, 12, 13, 14, 15, 18],
    [0, 1, 2, 3, 4, 5, 6]
  )
  .clip(export_region)
  .visualize({
    min: 0,
    max: 6,
    palette: [
      '000000',
      'ffffbe',
      'e0d05e',
      'b19c3a',
      '668438',
      'ff6161',
      '9bcc4f'
    ]
  });

Map.addLayer(
  colour_image,
  {},
  'Coloured ACA around Orpheus'
);

// Export the map as a GeoTIFF
Export.image.toDrive({
  image: colour_image,
  description: 'Workshop4_ACA_Orpheus_Colour',
  fileNamePrefix: 'aca_orpheus_colour',
  region: export_region.geometry(),
  scale: 5,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});
