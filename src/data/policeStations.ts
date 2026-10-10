import type { PoliceStation } from '../types'

/**
 * DEMO DATA - NOT REAL CRIME INFORMATION.
 *
 * Fictional police station records (names follow conventional Puducherry
 * locality naming but no operational details are asserted). Replace with a
 * FastAPI + PostGIS station endpoint in a future release.
 */
export const POLICE_STATIONS: PoliceStation[] = [
  {
    id: 'PS-01',
    name: 'Mission Street Police Station',
    lat: 11.927,
    lng: 79.8325,
    area: 'Mission Street',
    jurisdiction: ['Mission Street', 'Muthialpet', 'Saram'],
    isDemo: true,
  },
  {
    id: 'PS-02',
    name: 'White Town Police Station',
    lat: 11.9335,
    lng: 79.8262,
    area: 'White Town',
    jurisdiction: ['White Town', 'Orleanpet'],
    isDemo: true,
  },
  {
    id: 'PS-03',
    name: 'Muthialpet Police Station',
    lat: 11.9248,
    lng: 79.8305,
    area: 'Muthialpet',
    jurisdiction: ['Muthialpet', 'Manakuppam'],
    isDemo: true,
  },
  {
    id: 'PS-04',
    name: 'Mudaliarpet Police Station',
    lat: 11.9183,
    lng: 79.8114,
    area: 'Mudaliarpet',
    jurisdiction: ['Mudaliarpet', 'Gorimedu', 'Nehru Street'],
    isDemo: true,
  },
  {
    id: 'PS-05',
    name: 'Lawspet Police Station',
    lat: 11.9545,
    lng: 79.8336,
    area: 'Lawspet',
    jurisdiction: ['Lawspet', 'Keezhmedu'],
    isDemo: true,
  },
  {
    id: 'PS-06',
    name: 'Oulgaret Police Station',
    lat: 11.957,
    lng: 79.8135,
    area: 'Oulgaret',
    jurisdiction: ['Oulgaret', 'Isukapatti', 'Ariyankuppam'],
    isDemo: true,
  },
  {
    id: 'PS-07',
    name: 'Nellithope Police Station',
    lat: 11.9322,
    lng: 79.8099,
    area: 'Nellithope',
    jurisdiction: ['Nellithope', 'Solai Nagar'],
    isDemo: true,
  },
  {
    id: 'PS-08',
    name: 'Thattanchavady Police Station',
    lat: 11.9447,
    lng: 79.8055,
    area: 'Thattanchavady',
    jurisdiction: ['Thattanchavady', 'Kuruvinatham'],
    isDemo: true,
  },
  {
    id: 'PS-09',
    name: 'Villianur Police Station',
    lat: 11.9138,
    lng: 79.7556,
    area: 'Villianur',
    jurisdiction: ['Villianur'],
    isDemo: true,
  },
  {
    id: 'PS-10',
    name: 'Bahour Police Station',
    lat: 11.9255,
    lng: 79.7768,
    area: 'Bahour',
    jurisdiction: ['Bahour'],
    isDemo: true,
  },
  {
    id: 'PS-11',
    name: 'Ariyankuppam Police Station',
    lat: 11.8954,
    lng: 79.807,
    area: 'Ariyankuppam',
    jurisdiction: ['Ariyankuppam', 'Kuruvinatham'],
    isDemo: true,
  },
]
