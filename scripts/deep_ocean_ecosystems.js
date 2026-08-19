// DEEP OCEAN ECOSYSTEMS ASSIGNMENT

// Import the ETOPO1 dataset
var etopo1 = ee.Image('NOAA/NGDC/ETOPO1')

// Select the bedrock band
var bedrock = etopo1.select('bedrock')

print('ETOPO1 dataset:', etopo1)
print('Band names:', etopo1.bandNames())

// Display the global elevation and bathymetry
var bedrockVis = {
  min: -10000,
  max: 4000,
  palette: ['081d58', '253494', '2c7fb8', '7fcdbb', 'ffffcc', '8c510a']
}

Map.setCenter(0, 0, 2)

Map.addLayer(
  bedrock,
  bedrockVis,
  'ETOPO1 bedrock'
)

// Map ocean areas deeper than 6000 metres
var hadal = bedrock
  .lt(-6000)
  .selfMask()

Map.addLayer(
  hadal,
  {palette: ['4B0082']},
  'Hadal trenches and troughs'
)

// Map abyssal plains between 3000 and 6000 metres deep
var abyssal = bedrock
  .lt(-3000)
  .and(bedrock.gt(-6000))
  .selfMask()

Map.addLayer(
  abyssal,
  {palette: ['1E90FF']},
  'Abyssal plains'
)

// Map continental and island slopes
// between 250 and 3000 metres deep
var continentalSlopes = bedrock
  .lt(-250)
  .and(bedrock.gt(-3000))
  .selfMask()

Map.addLayer(
  continentalSlopes,
  {palette: ['FF8C00']},
  'Continental and island slopes'
)

// Calculate the slope of the ocean floor
var seafloorTerrain = ee.Terrain.products(bedrock)
var seafloorSlope = seafloorTerrain.select('slope')

// Map areas deeper than 200 metres with slopes above 6 degrees
var submarineCanyons = bedrock
  .lt(-200)
  .and(seafloorSlope.gt(6))
  .selfMask()

Map.addLayer(
  submarineCanyons,
  {palette: ['FFD700']},
  'Submarine canyons'
)
// Import protected areas
var protected_areas = ee.FeatureCollection(
  'WCMC/WDPA/current/polygons'
)

// Select protected areas containing marine habitat
var marineProtectedAreas = protected_areas.filter(
  ee.Filter.gt('GIS_M_AREA', 0)
)

print(
  'Number of marine protected areas:',
  marineProtectedAreas.size()
)

Map.addLayer(
  marineProtectedAreas.style({
    color: '00FFFF',
    fillColor: '00FFFF33',
    width: 1
  }),
  {},
  'Marine protected areas'
)
// Combine all ecosystem types into one categorical map
var ecosystemMap = bedrock
  .multiply(0)
  .where(continentalSlopes, 1)
  .where(abyssal, 2)
  .where(hadal, 3)
  .where(submarineCanyons, 4)
  .rename('ecosystem')
  .selfMask()

var ecosystemVis = {
  min: 1,
  max: 4,
  palette: [
    'F28E2B', // Continental and island slopes
    '4E79A7', // Abyssal plains
    '54278F', // Hadal trenches and troughs
    'FFD92F'  // Submarine canyons
  ]
}

Map.addLayer(
  ecosystemMap,
  ecosystemVis,
  'Deep ocean ecosystems'
)
// Add the map title
var title = ui.Label({
  value: 'Global Deep Ocean Ecosystems',
  style: {
    position: 'top-center',
    fontSize: '22px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '10px'
  }
})

Map.add(title)
// Create the legend panel
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)'
  }
})

legend.add(ui.Label({
  value: 'Legend',
  style: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px 0'
  }
}))

// Function for adding each legend item
function addLegendItem(color, label) {
  var colourBox = ui.Label({
    style: {
      backgroundColor: '#' + color,
      padding: '8px',
      margin: '0 8px 5px 0'
    }
  })

  var description = ui.Label({
    value: label,
    style: {
      margin: '0 0 5px 0'
    }
  })

  legend.add(
    ui.Panel({
      widgets: [colourBox, description],
      layout: ui.Panel.Layout.Flow('horizontal')
    })
  )
}

// Add ecosystem categories
addLegendItem('F28E2B', 'Continental and island slopes')
addLegendItem('4E79A7', 'Abyssal plains')
addLegendItem('54278F', 'Hadal trenches and troughs')
addLegendItem('FFD92F', 'Submarine canyons')
addLegendItem('00FFFF', 'Marine protected areas')

// Add the legend to the map
Map.add(legend)

// Load the uploaded vent data
var hydrothermalVents = ee.FeatureCollection(
  'projects/my-project-503200/assets/hydrothermal_vents_clean'
);

// Make points from the latitude and longitude columns
hydrothermalVents = hydrothermalVents.map(
  function(vent) {
    return vent.setGeometry(
      ee.Geometry.Point([
        vent.getNumber('Longitude'),
        vent.getNumber('Latitude')
      ])
    );
  }
);

// Add the vents to the map
Map.addLayer(
  hydrothermalVents.style({
    color: 'red',
    pointSize: 5
  }),
  {},
  'Hydrothermal vents'
);
