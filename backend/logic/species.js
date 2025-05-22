function getTargetSpecies(riverKey) {
  const speciesMap = {
    mckenzie_hayden: ['Rainbow Trout', 'Cutthroat Trout', 'Whitefish'],
    willamette_eugene: ['Rainbow Trout', 'Cutthroat Trout', 'Steelhead']
  };

  return speciesMap[riverKey.toLowerCase()] || ['Trout'];
}

module.exports = { getTargetSpecies };
