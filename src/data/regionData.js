/**
 * Region Data & PIN Code Resolver for Nishchit.
 * Focus Area: Vizianagaram – Thagarapuvalasa – Visakhapatnam Transportation Corridor (Andhra Pradesh, India).
 */

export const SUPPORTED_REGIONS = {
  VISAKHAPATNAM: {
    district: "Visakhapatnam",
    state: "Andhra Pradesh",
    pincodes: {
      "530001": { locality: "Town Hall / Old Post Office", area: "Visakhapatnam City" },
      "530002": { locality: "Maharanipeta / KGH", area: "Visakhapatnam Central" },
      "530003": { locality: "Waltair Uplands / Siripuram", area: "Visakhapatnam Central" },
      "530004": { locality: "Railway New Colony / Daba Gardens", area: "Visakhapatnam Central" },
      "530008": { locality: "Malkapuram / Scindia", area: "Industrial Corridor" },
      "530013": { locality: "Seethammadhara / HB Colony", area: "Visakhapatnam North" },
      "530016": { locality: "Dwaraka Nagar / RTC Complex", area: "Visakhapatnam City Center" },
      "530017": { locality: "MVP Colony / Sector 1-12", area: "Visakhapatnam Coastal" },
      "530022": { locality: "Marripalem / NAD Junction", area: "Visakhapatnam West" },
      "530026": { locality: "Gajuwaka / Auto Nagar", area: "Industrial South" },
      "530027": { locality: "Gopalapatnam / Simhachalam", area: "Visakhapatnam West" },
      "530040": { locality: "Madhurawada / PM Palem / Car Shed", area: "IT & Education Corridor" },
      "530041": { locality: "PM Palem / Cricket Stadium Area", area: "Madhurawada Sub-district" },
      "530045": { locality: "Rushikonda / IT SEZ / GITAM Campus", area: "Coastal Education Zone" },
      "530048": { locality: "Yendada / Gitam Junction", area: "Visakhapatnam Coastal" },
      "530051": { locality: "Pendurthi / Sujatha Nagar", area: "Visakhapatnam Outer" },
      "530052": { locality: "Sheela Nagar / Airport Road", area: "Visakhapatnam South" }
    }
  },
  THAGARAPUVALASA_BHEEMILI: {
    district: "Visakhapatnam / Bheemunipatnam",
    state: "Andhra Pradesh",
    pincodes: {
      "531162": { locality: "Bheemunipatnam / Thagarapuvalasa / Sangivalasa", area: "NH16 Educational Belt" },
      "531163": { locality: "Anandapuram / Gandigundam / Padmanabham", area: "Corridor Junction" }
    }
  },
  VIZIANAGARAM: {
    district: "Vizianagaram",
    state: "Andhra Pradesh",
    pincodes: {
      "535001": { locality: "Vizianagaram Cantonment / Collectorate", area: "Vizianagaram City" },
      "535002": { locality: "Fort Area / Balaji Nagar / Mayuri Junction", area: "Vizianagaram Central" },
      "535003": { locality: "Vizianagaram RTC Complex / Phoolbagh", area: "Vizianagaram East" },
      "535004": { locality: "Railway Colony / Jammu Narayana Puram", area: "Vizianagaram West" },
      "535005": { locality: "Industrial Estate / Kothapet", area: "Vizianagaram Outer" },
      "535183": { locality: "Kothavalasa / Junction", area: "Vizianagaram Outer" },
      "535216": { locality: "Denkada / Chintalavalasa / MVGR Campus", area: "Denkada Education Belt" },
      "535280": { locality: "Korukonda / Sainik School Area", area: "Vizianagaram North" }
    }
  }
};

/**
 * Real Institutions in the Vizianagaram–Thagarapuvalasa–Vizag corridor.
 */
export const REGISTERED_INSTITUTIONS = [
  {
    id: "INST-MVGR",
    name: "MVGR College of Engineering (Autonomous)",
    shortName: "MVGR College",
    campus: "Chintalavalasa Campus, Vizianagaram",
    district: "Vizianagaram",
    pincode: "535216",
    busesCount: 18,
    activeRoutes: ["Route VZ-01", "Route VZ-02", "Route VZ-03", "Route VZ-04"]
  },
  {
    id: "INST-ANITS",
    name: "ANITS (Anil Neerukonda Institute of Tech & Sciences)",
    shortName: "ANITS",
    campus: "Sangivalasa, Thagarapuvalasa, Bheemunipatnam",
    district: "Visakhapatnam",
    pincode: "531162",
    busesCount: 26,
    activeRoutes: ["Route AN-01", "Route AN-02", "Route AN-05", "Route AN-08"]
  },
  {
    id: "INST-GVP",
    name: "Gayatri Vidya Parishad College of Engineering (Autonomous)",
    shortName: "GVPCOE",
    campus: "Madhurawada Campus, Visakhapatnam",
    district: "Visakhapatnam",
    pincode: "530048",
    busesCount: 22,
    activeRoutes: ["Route GVP-01", "Route GVP-03", "Route GVP-07"]
  },
  {
    id: "INST-GITAM",
    name: "GITAM (Deemed to be University)",
    shortName: "GITAM Vizag",
    campus: "Rushikonda Campus, Visakhapatnam",
    district: "Visakhapatnam",
    pincode: "530045",
    busesCount: 35,
    activeRoutes: ["Route GT-02", "Route GT-06", "Route GT-11"]
  },
  {
    id: "INST-RAGHU",
    name: "Raghu Engineering College & Institute of Technology",
    shortName: "Raghu Institutions",
    campus: "Dakamarri, Bheemunipatnam Mandal",
    district: "Visakhapatnam",
    pincode: "531162",
    busesCount: 20,
    activeRoutes: ["Route RG-01", "Route RG-04"]
  },
  {
    id: "INST-DPS",
    name: "Delhi Public School (DPS) Visakhapatnam",
    shortName: "DPS Vizag",
    campus: "Anandapuram Road, Visakhapatnam",
    district: "Visakhapatnam",
    pincode: "531163",
    busesCount: 16,
    activeRoutes: ["Route DPS-01", "Route DPS-02", "Route DPS-04"]
  },
  {
    id: "INST-SAINIK",
    name: "Sainik School Korukonda",
    shortName: "Sainik School",
    campus: "Korukonda, Vizianagaram District",
    district: "Vizianagaram",
    pincode: "535280",
    busesCount: 8,
    activeRoutes: ["Route SK-01", "Route SK-02"]
  },
  {
    id: "INST-TIMPANY",
    name: "Timpany Senior Secondary School",
    shortName: "Timpany School",
    campus: "CBM Compound / Asilmetta, Visakhapatnam",
    district: "Visakhapatnam",
    pincode: "530003",
    busesCount: 12,
    activeRoutes: ["Route TP-01", "Route TP-03"]
  }
];

/**
 * Standard Fleet & Route Database for initial seed and admin control
 */
export const INITIAL_VEHICLES = [
  {
    id: "BUS-24",
    busNumber: "Bus 24",
    registrationNumber: "AP 35 U 2424",
    institutionId: "INST-MVGR",
    capacity: 52,
    driverId: "DRV-901",
    driverName: "Rajesh Kumar",
    driverPhone: "+91 98765 43210",
    routeId: "ROUTE-VZ04",
    routeName: "Route 04 (Vizianagaram RTC Complex -> Mayuri -> MVGR Campus)",
    status: "NOT_STARTED",
    latitude: 18.1067,
    longitude: 83.3956,
    accuracy: 8,
    lastUpdated: null
  },
  {
    id: "BUS-12",
    busNumber: "Bus 12",
    registrationNumber: "AP 31 TH 1212",
    institutionId: "INST-ANITS",
    capacity: 55,
    driverId: "DRV-402",
    driverName: "Srinivas Rao",
    driverPhone: "+91 98480 12345",
    routeId: "ROUTE-AN01",
    routeName: "Route AN-01 (Dwaraka Nagar -> Madhurawada -> ANITS Sangivalasa)",
    status: "NOT_STARTED",
    latitude: 17.7289,
    longitude: 83.3031,
    accuracy: 10,
    lastUpdated: null
  },
  {
    id: "BUS-07",
    busNumber: "Bus 07",
    registrationNumber: "AP 39 VZ 0707",
    institutionId: "INST-GVP",
    capacity: 50,
    driverId: "DRV-305",
    driverName: "K. Appa Rao",
    driverPhone: "+91 94401 56789",
    routeId: "ROUTE-GVP03",
    routeName: "Route GVP-03 (Gajuwaka -> Scindia -> MVP Colony -> GVP Madhurawada)",
    status: "NOT_STARTED",
    latitude: 17.6868,
    longitude: 83.2185,
    accuracy: 12,
    lastUpdated: null
  },
  {
    id: "BUS-18",
    busNumber: "Bus 18",
    registrationNumber: "AP 31 TD 1818",
    institutionId: "INST-DPS",
    capacity: 42,
    driverId: "DRV-781",
    driverName: "M. Ramana Murthy",
    driverPhone: "+91 99890 33445",
    routeId: "ROUTE-DPS02",
    routeName: "Route DPS-02 (Seethammadhara -> Yendada -> DPS Anandapuram)",
    status: "NOT_STARTED",
    latitude: 17.7447,
    longitude: 83.3243,
    accuracy: 9,
    lastUpdated: null
  }
];

export const INITIAL_ROUTES = [
  {
    id: "ROUTE-VZ04",
    code: "ROUTE 04",
    name: "Vizianagaram RTC Complex -> Mayuri -> Chintalavalasa (MVGR)",
    institutionId: "INST-MVGR",
    busId: "BUS-24",
    stops: [
      { name: "Vizianagaram RTC Complex (Platform 4)", scheduledTime: "07:15 AM", lat: 18.1145, lng: 83.4021 },
      { name: "Mayuri Junction / Balaji Nagar", scheduledTime: "07:25 AM", lat: 18.1102, lng: 83.3980 },
      { name: "Cantonment RDO Office", scheduledTime: "07:35 AM", lat: 18.1189, lng: 83.4120 },
      { name: "Kothapeta Arch", scheduledTime: "07:45 AM", lat: 18.1050, lng: 83.3890 },
      { name: "Denkada Junction (NH16)", scheduledTime: "08:00 AM", lat: 18.0820, lng: 83.4250 },
      { name: "MVGR College Main Gate", scheduledTime: "08:15 AM", lat: 18.0645, lng: 83.4390 }
    ],
    reportingTime: "06:50 AM",
    departureTime: "07:15 AM",
    expectedArrival: "08:15 AM"
  },
  {
    id: "ROUTE-AN01",
    code: "ROUTE AN-01",
    name: "Dwaraka Nagar -> Maddilapalem -> Madhurawada -> Sangivalasa (ANITS)",
    institutionId: "INST-ANITS",
    busId: "BUS-12",
    stops: [
      { name: "Dwaraka Bus Station (RTC Complex)", scheduledTime: "07:05 AM", lat: 17.7289, lng: 83.3031 },
      { name: "Maddilapalem Junction", scheduledTime: "07:18 AM", lat: 17.7394, lng: 83.3289 },
      { name: "Hanumanthawaka Junction", scheduledTime: "07:30 AM", lat: 17.7650, lng: 83.3420 },
      { name: "Madhurawada Car Shed Junction", scheduledTime: "07:45 AM", lat: 17.8180, lng: 83.3590 },
      { name: "Anandapuram Toll Gate", scheduledTime: "08:02 AM", lat: 17.8920, lng: 83.3850 },
      { name: "ANITS Campus Sangivalasa", scheduledTime: "08:20 AM", lat: 17.9250, lng: 83.4210 }
    ],
    reportingTime: "06:40 AM",
    departureTime: "07:05 AM",
    expectedArrival: "08:20 AM"
  },
  {
    id: "ROUTE-GVP03",
    code: "ROUTE GVP-03",
    name: "Gajuwaka -> NAD -> MVP Colony -> GVP Madhurawada",
    institutionId: "INST-GVP",
    busId: "BUS-07",
    stops: [
      { name: "Gajuwaka Old Bus Stand", scheduledTime: "06:55 AM", lat: 17.6868, lng: 83.2185 },
      { name: "NAD 'X' Road Junction", scheduledTime: "07:15 AM", lat: 17.7420, lng: 83.2350 },
      { name: "Gurudwara / RTC Complex", scheduledTime: "07:30 AM", lat: 17.7310, lng: 83.3080 },
      { name: "MVP Colony Sector 3", scheduledTime: "07:45 AM", lat: 17.7450, lng: 83.3410 },
      { name: "GVP Engineering College Campus", scheduledTime: "08:15 AM", lat: 17.8220, lng: 83.3540 }
    ],
    reportingTime: "06:30 AM",
    departureTime: "06:55 AM",
    expectedArrival: "08:15 AM"
  }
];

export const INITIAL_STUDENTS = [
  {
    id: "STU-101",
    rollNo: "22331A0589",
    name: "Aarav Varma",
    studentClass: "B.Tech CSE - 3rd Year",
    institutionId: "INST-MVGR",
    busId: "BUS-24",
    routeId: "ROUTE-VZ04",
    stopName: "Mayuri Junction / Balaji Nagar",
    parentName: "Suresh Varma",
    parentEmail: "parent@nishchit.app",
    parentPhone: "+91 91234 56789"
  },
  {
    id: "STU-102",
    rollNo: "23A51A0412",
    name: "Pooja Reddy",
    studentClass: "B.Tech ECE - 2nd Year",
    institutionId: "INST-ANITS",
    busId: "BUS-12",
    routeId: "ROUTE-AN01",
    stopName: "Madhurawada Car Shed Junction",
    parentName: "M. K. Reddy",
    parentEmail: "parent2@nishchit.app",
    parentPhone: "+91 98490 88776"
  },
  {
    id: "STU-103",
    rollNo: "DPS-VIII-24",
    name: "Rohan Patnaik",
    studentClass: "Class 8 - Section B",
    institutionId: "INST-DPS",
    busId: "BUS-18",
    routeId: "ROUTE-DPS02",
    stopName: "Seethammadhara",
    parentName: "Alok Patnaik",
    parentEmail: "parent.rohan@nishchit.app",
    parentPhone: "+91 97000 11223"
  }
];

/**
 * Resolve PIN Code for the corridor
 */
export function resolvePinCode(pin) {
  const cleanPin = String(pin || "").trim();
  if (!/^\d{6}$/.test(cleanPin)) {
    return {
      success: false,
      error: "Please enter a valid 6-digit Indian Postal PIN code."
    };
  }

  for (const [regionKey, regionData] of Object.entries(SUPPORTED_REGIONS)) {
    if (regionData.pincodes[cleanPin]) {
      const pinDetails = regionData.pincodes[cleanPin];
      const matchingInstitutions = REGISTERED_INSTITUTIONS.filter(inst => {
        if (inst.pincode === cleanPin) return true;
        if (regionKey === "VIZIANAGARAM" && inst.district === "Vizianagaram") return true;
        if ((regionKey === "VISAKHAPATNAM" || regionKey === "THAGARAPUVALASA_BHEEMILI") && inst.district.includes("Visakhapatnam")) return true;
        return false;
      });

      return {
        success: true,
        available: true,
        pincode: cleanPin,
        locality: pinDetails.locality,
        area: pinDetails.area,
        district: regionData.district,
        state: regionData.state,
        corridorZone: "Vizianagaram – Thagarapuvalasa – Visakhapatnam Operational Belt",
        matchingInstitutions
      };
    }
  }

  // Not in the initial pilot corridor
  return {
    success: true,
    available: false,
    pincode: cleanPin,
    message: "Nishchit is currently active exclusively in the Vizianagaram – Thagarapuvalasa – Visakhapatnam educational corridor. We are expanding to other districts soon!"
  };
}
