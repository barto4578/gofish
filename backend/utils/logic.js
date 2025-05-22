
function getSeasonalFliesForMcKenzie() {
  const month = new Date().getMonth(); // 0 = January

  if (month >= 0 && month <= 2) {
    return [
      'Blue-winged Olive Parachute',
      'Pheasant Tail Nymph',
      'Black Elk Hair Caddis',
      'Sparkle Dun'
    ];
  }

  if (month >= 3 && month <= 6) {
    return [
      'Yellow Stimulators',
      'Turck’s Tarantula',
      'Sofa Pillows',
      'Hairwing Drake'
    ];
  }

  if (month >= 4 && month <= 7) {
    return [
      'Elk Hair Caddis',
      'Yellow Stimulators',
      'Sparkle Dun',
      'Large Yellow Comparadun'
    ];
  }

  if (month >= 7 && month <= 10) {
    return [
      'Blue-winged Olive Parachute',
      'Pheasant Tail Nymph',
      'Humpy’s',
      'Adams'
    ];
  }

  return ['Pheasant Tail Nymph', 'Adams']; // fallback
}

function recommendFlySetup(river = 'mckenzie_hayden') {
  const method = 'Dry/Dropper';

  const flies = river === 'mckenzie_hayden'
    ? getSeasonalFliesForMcKenzie()
    : ['Woolly Bugger', 'Beadhead Prince', 'Zebra Midge'];

  const tip = river === 'mckenzie_hayden'
    ? 'Fish riffles and tailouts during warmer parts of the day.'
    : 'Focus on deep seams and slow eddies.';

  return { method, flies, tip };
}

module.exports = { recommendFlySetup };
