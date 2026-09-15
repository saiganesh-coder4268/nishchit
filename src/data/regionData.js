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
    id: "INST-AU",
    institutionId: "INST-AU",
    instituteId: "INST-AU",
    name: "Andhra University",
    shortName: "Andhra University",
    campus: "Waltair Uplands / Siripuram Campus, Visakhapatnam",
    location: "Waltair Uplands, Siripuram",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "530003",
    status: "ACTIVE",
    busesCount: 28,
    activeRoutes: ["ROUTE-AU01", "ROUTE-AU02"],
    createdAt: 1700000000000
  },
  {
    id: "INST-GITAM",
    institutionId: "INST-GITAM",
    instituteId: "INST-GITAM",
    name: "GITAM (Deemed to be University)",
    shortName: "GITAM University",
    campus: "Rushikonda Campus, Visakhapatnam",
    location: "Rushikonda",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "530045",
    status: "ACTIVE",
    busesCount: 35,
    activeRoutes: ["ROUTE-GT02"],
    createdAt: 1700000000000
  },
  {
    id: "INST-MVGR",
    institutionId: "INST-MVGR",
    instituteId: "INST-MVGR",
    name: "MVGR College of Engineering (Autonomous)",
    shortName: "MVGR College",
    campus: "Chintalavalasa Campus, Vizianagaram",
    location: "Chintalavalasa",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    country: "India",
    district: "Vizianagaram",
    pincode: "535216",
    status: "ACTIVE",
    busesCount: 18,
    activeRoutes: ["ROUTE-MVGR01"],
    createdAt: 1700000000000
  }
];

/**
 * Standard Fleet & Route Database for initial seed and admin control
 */
export const INITIAL_VEHICLES = [
  {
    id: "BUS-AU01",
    busId: "BUS-AU01",
    busNumber: "Bus AU-01",
    registrationNumber: "AP 31 AU 1001",
    institutionId: "INST-AU",
    institutionName: "Andhra University",
    capacity: 54,
    routeId: "ROUTE-AU01",
    routeName: "Route AU-01 (Andhra University -> Maddilapalem -> MVP Colony -> Gajuwaka)",
    status: "AVAILABLE",
    latitude: 17.7214,
    longitude: 83.3155,
    accuracy: 6,
    speed: 0,
    lastUpdated: Date.now()
  },
  {
    id: "BUS-AU02",
    busId: "BUS-AU02",
    busNumber: "Bus AU-02",
    registrationNumber: "AP 31 AU 1002",
    institutionId: "INST-AU",
    institutionName: "Andhra University",
    capacity: 54,
    routeId: "ROUTE-AU02",
    routeName: "Route AU-02 (Andhra University -> RTC Complex -> Pendurthi)",
    status: "AVAILABLE",
    latitude: 17.7214,
    longitude: 83.3155,
    accuracy: 6,
    speed: 0,
    lastUpdated: Date.now()
  },
  {
    id: "BUS-GT02",
    busId: "BUS-GT02",
    busNumber: "Bus GT-02",
    registrationNumber: "AP 31 TH 1212",
    institutionId: "INST-GITAM",
    institutionName: "GITAM (Deemed to be University)",
    capacity: 55,
    routeId: "ROUTE-GT02",
    routeName: "Route GT-02 (GITAM University -> MVP Colony)",
    status: "AVAILABLE",
    latitude: 17.7816,
    longitude: 83.3776,
    accuracy: 6,
    speed: 0,
    lastUpdated: Date.now()
  },
  {
    id: "BUS-MVGR01",
    busId: "BUS-MVGR01",
    busNumber: "Bus MV-01",
    registrationNumber: "AP 35 MV 2001",
    institutionId: "INST-MVGR",
    institutionName: "MVGR College of Engineering",
    capacity: 52,
    routeId: "ROUTE-MVGR01",
    routeName: "Route MVGR-01 (Vizianagaram RTC Complex -> MVGR Campus)",
    status: "AVAILABLE",
    latitude: 18.1145,
    longitude: 83.4021,
    accuracy: 8,
    speed: 0,
    lastUpdated: Date.now()
  }
];

export const INITIAL_ROUTES = [
  {
    id: "ROUTE-AU01",
    routeId: "ROUTE-AU01",
    code: "ROUTE AU-01",
    name: "Andhra University -> Maddilapalem -> MVP Colony -> Gajuwaka",
    routeName: "Andhra University -> Maddilapalem -> MVP Colony -> Gajuwaka",
    institutionId: "INST-AU",
    institutionName: "Andhra University",
    from: "Andhra University Siripuram",
    to: "Gajuwaka Old Bus Stand",
    busId: "BUS-AU01",
    stops: [
      { name: "Andhra University Siripuram", scheduledTime: "04:30 PM", lat: 17.7214, lng: 83.3155 },
      { name: "Maddilapalem Junction", scheduledTime: "04:45 PM", lat: 17.7394, lng: 83.3289 },
      { name: "MVP Colony Sector 1", scheduledTime: "05:00 PM", lat: 17.7450, lng: 83.3410 },
      { name: "Gajuwaka Old Bus Stand", scheduledTime: "05:30 PM", lat: 17.6868, lng: 83.2185 }
    ],
    reportingTime: "04:15 PM",
    departureTime: "04:30 PM",
    expectedArrival: "05:30 PM"
  },
  {
    id: "ROUTE-AU02",
    routeId: "ROUTE-AU02",
    code: "ROUTE AU-02",
    name: "Andhra University -> RTC Complex -> Pendurthi",
    routeName: "Andhra University -> RTC Complex -> Pendurthi",
    institutionId: "INST-AU",
    institutionName: "Andhra University",
    from: "Andhra University Siripuram",
    to: "Pendurthi Junction",
    busId: "BUS-AU02",
    stops: [
      { name: "Andhra University Siripuram", scheduledTime: "04:35 PM", lat: 17.7214, lng: 83.3155 },
      { name: "RTC Complex / Dwaraka Nagar", scheduledTime: "04:50 PM", lat: 17.7289, lng: 83.3031 },
      { name: "Pendurthi Junction", scheduledTime: "05:35 PM", lat: 17.8250, lng: 83.2010 }
    ],
    reportingTime: "04:20 PM",
    departureTime: "04:35 PM",
    expectedArrival: "05:35 PM"
  },
  {
    id: "ROUTE-GT02",
    routeId: "ROUTE-GT02",
    code: "ROUTE GT-02",
    name: "GITAM University -> Rushikonda -> MVP Colony",
    routeName: "GITAM University -> Rushikonda -> MVP Colony",
    institutionId: "INST-GITAM",
    institutionName: "GITAM (Deemed to be University)",
    from: "GITAM University Main Gate",
    to: "MVP Colony",
    busId: "BUS-GT02",
    stops: [
      { name: "GITAM University Main Gate", scheduledTime: "04:10 PM", lat: 17.7816, lng: 83.3776 },
      { name: "Rushikonda Beach Road", scheduledTime: "04:25 PM", lat: 17.7950, lng: 83.3850 },
      { name: "MVP Colony", scheduledTime: "04:50 PM", lat: 17.7450, lng: 83.3410 }
    ],
    reportingTime: "03:50 PM",
    departureTime: "04:10 PM",
    expectedArrival: "04:50 PM"
  },
  {
    id: "ROUTE-MVGR01",
    routeId: "ROUTE-MVGR01",
    code: "ROUTE MVGR-01",
    name: "Vizianagaram RTC Complex -> Mayuri -> MVGR Campus",
    routeName: "Vizianagaram RTC Complex -> Mayuri -> MVGR Campus",
    institutionId: "INST-MVGR",
    institutionName: "MVGR College of Engineering",
    from: "Vizianagaram RTC Complex",
    to: "MVGR College Main Gate",
    busId: "BUS-MVGR01",
    stops: [
      { name: "Vizianagaram RTC Complex", scheduledTime: "07:15 AM", lat: 18.1145, lng: 83.4021 },
      { name: "Mayuri Junction", scheduledTime: "07:30 AM", lat: 18.1102, lng: 83.3980 },
      { name: "MVGR College Main Gate", scheduledTime: "08:15 AM", lat: 18.0645, lng: 83.4390 }
    ],
    reportingTime: "06:50 AM",
    departureTime: "07:15 AM",
    expectedArrival: "08:15 AM"
  }
];

export const INITIAL_JOBS = [
  {
    id: "JOB-101",
    institutionId: "INST-ABC-SCHOOL",
    institutionName: "ABC International School",
    institutionLogo: "🏫",
    title: "School Bus Driver",
    salaryRange: "₹25,000 – ₹28,000 / month",
    minSalary: 25000,
    maxSalary: 28000,
    jobType: "Full-time",
    location: "Benz Circle, Vijayawada",
    district: "Vijayawada",
    minExperience: 3,
    vehicleType: "School Bus (Heavy Passenger)",
    schedule: "Morning & Afternoon Runs (6:00 AM – 4:30 PM)",
    description: "Looking for an experienced school bus driver with clean driving record and background verification for Benz Circle to Campus route.",
    requirements: ["Heavy Passenger Vehicle License", "Minimum 3 years bus driving experience", "Clean police verification"],
    applicantsCount: 2,
    status: "OPEN",
    createdAt: Date.now() - 3 * 86400000
  },
  {
    id: "JOB-102",
    institutionId: "INST-ABC-COLLEGE",
    institutionName: "ABC Degree & Engineering College",
    institutionLogo: "🎓",
    title: "College Bus Driver (Route 05)",
    salaryRange: "₹27,000 – ₹30,000 / month",
    minSalary: 27000,
    maxSalary: 30000,
    jobType: "Full-time",
    location: "Vijayawada → Enikepadu Campus",
    district: "Vijayawada",
    minExperience: 5,
    vehicleType: "Heavy Passenger Bus",
    schedule: "7:00 AM – 5:30 PM (Mon–Sat)",
    description: "Operate 52-seater college bus on Vijayawada urban corridor to Enikepadu campus. Route includes Benz Circle and Ramavarappadu.",
    requirements: ["Valid HMV / Transport endorsement", "5+ years educational institute experience", "Punctual and reliable"],
    applicantsCount: 3,
    status: "OPEN",
    createdAt: Date.now() - 2 * 86400000
  },
  {
    id: "JOB-103",
    institutionId: "INST-GITAM",
    institutionName: "GITAM (Deemed to be University)",
    institutionLogo: "🏛️",
    title: "Campus Corridor Shuttle Driver",
    salaryRange: "₹28,000 – ₹32,000 / month",
    minSalary: 28000,
    maxSalary: 32000,
    jobType: "Full-time",
    location: "Rushikonda Campus, Visakhapatnam",
    district: "Visakhapatnam",
    minExperience: 4,
    vehicleType: "Heavy Passenger AC Bus",
    schedule: "Shift duty (6:30 AM – 3:30 PM)",
    description: "Operating staff & student transit between MVP Colony / Madhurawada and GITAM Rushikonda campus.",
    requirements: ["Valid commercial heavy vehicle license", "Defensive driving certification preferred"],
    applicantsCount: 1,
    status: "OPEN",
    createdAt: Date.now() - 5 * 86400000
  }
];

export const INITIAL_VERIFIED_DRIVERS = [
  {
    id: "DRV-RAVI-KUMAR",
    uid: "DRV-RAVI-KUMAR",
    fullName: "Ravi Kumar",
    name: "Ravi Kumar",
    phone: "+91 98481 23456",
    email: "ravi.driver@nishchit.app",
    experienceYears: 8,
    rating: 4.8,
    tripsCompleted: 640,
    vehicleCategories: ["School Bus", "College Transport", "Heavy Passenger"],
    preferredLocations: ["Vijayawada", "Guntur", "Mangalagiri"],
    expectedSalary: "₹26,000 – ₹30,000",
    availability: "AVAILABLE",
    verificationStatus: "approved",
    isPlatformVerified: true,
    hiredByInstitutionId: "INST-ABC-SCHOOL",
    hiredByInstitutionName: "ABC International School",
    assignedBusId: "BUS-12",
    assignedRouteId: "ROUTE-05",
    assignedBusNumber: "Bus 12",
    assignedRouteName: "Route 05 (Vijayawada → Campus)",
    licenseNumber: "AP-16-2015-0048291",
    licenseExpiry: "2029-08-15",
    documents: {
      licenseVerified: true,
      identityVerified: true,
      policeVerificationPassed: true
    },
    bio: "Experienced educational bus driver with 8 years of safe, incident-free driving across school and college routes in Vijayawada.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces"
  },
  {
    id: "DRV-SRINIVAS-RAO",
    uid: "DRV-SRINIVAS-RAO",
    fullName: "Srinivas Rao",
    name: "Srinivas Rao",
    phone: "+91 98480 12345",
    email: "srinivas.rao@nishchit.app",
    experienceYears: 10,
    rating: 4.9,
    tripsCompleted: 820,
    vehicleCategories: ["School Bus", "College Transport", "Inter-City Heavy"],
    preferredLocations: ["Visakhapatnam", "Bheemunipatnam", "Madhurawada"],
    expectedSalary: "₹28,000 – ₹32,000",
    availability: "AVAILABLE",
    verificationStatus: "approved",
    isPlatformVerified: true,
    hiredByInstitutionId: "INST-GITAM",
    hiredByInstitutionName: "GITAM University",
    assignedBusId: "BUS-12",
    assignedRouteId: "ROUTE-GT02",
    assignedBusNumber: "Bus 12",
    assignedRouteName: "Route GT-02 (GITAM University -> MVP Colony)",
    licenseNumber: "AP-31-2013-0091823",
    licenseExpiry: "2028-11-20",
    documents: {
      licenseVerified: true,
      identityVerified: true,
      policeVerificationPassed: true
    },
    bio: "Dedicated corridor pilot with 10 years experience serving GITAM and coastal educational belt.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces"
  },
  {
    id: "DRV-K-APPA-RAO",
    uid: "DRV-K-APPA-RAO",
    fullName: "K. Appa Rao",
    name: "K. Appa Rao",
    phone: "+91 94401 56789",
    email: "appa.rao@nishchit.app",
    experienceYears: 6,
    rating: 4.7,
    tripsCompleted: 410,
    vehicleCategories: ["College Transport", "School Bus"],
    preferredLocations: ["Gajuwaka", "Visakhapatnam", "Madhurawada"],
    expectedSalary: "₹25,000 – ₹28,000",
    availability: "AVAILABLE",
    verificationStatus: "approved",
    isPlatformVerified: true,
    hiredByInstitutionId: "INST-GVP",
    hiredByInstitutionName: "GVPCOE Visakhapatnam",
    assignedBusId: "BUS-07",
    assignedRouteId: "ROUTE-GVP03",
    licenseNumber: "AP-31-2017-0038472",
    licenseExpiry: "2030-04-10",
    documents: {
      licenseVerified: true,
      identityVerified: true,
      policeVerificationPassed: true
    },
    bio: "Specialist in southern industrial and educational transit routes with stellar safety audit history."
  },
  {
    id: "DRV-M-SURESH",
    uid: "DRV-M-SURESH",
    fullName: "M. Suresh",
    name: "M. Suresh",
    phone: "+91 99890 54321",
    email: "suresh.m@nishchit.app",
    experienceYears: 5,
    rating: 4.6,
    tripsCompleted: 290,
    vehicleCategories: ["School Bus", "Mini Bus", "Heavy Vehicle"],
    preferredLocations: ["Vijayawada", "Benz Circle", "Gannavaram"],
    expectedSalary: "₹24,000 – ₹27,000",
    availability: "AVAILABLE",
    verificationStatus: "approved",
    isPlatformVerified: true,
    hiredByInstitutionId: null,
    hiredByInstitutionName: null,
    assignedBusId: null,
    assignedRouteId: null,
    licenseNumber: "AP-16-2018-0072819",
    licenseExpiry: "2031-01-25",
    documents: {
      licenseVerified: true,
      identityVerified: true,
      policeVerificationPassed: true
    },
    bio: "Independent verified heavy passenger driver available for school or college bus contracts in Vijayawada."
  }
];

export const INITIAL_STUDENTS = [
  {
    id: "STU-101",
    rollNo: "22331A0589",
    name: "Aarav Varma",
    studentClass: "B.Tech CSE - 3rd Year",
    institutionId: "INST-AU",
    institutionName: "Andhra University",
    busId: "BUS-AU01",
    busNumber: "Bus AU-01",
    routeId: "ROUTE-AU01",
    routeName: "Route AU-01 (Andhra University -> Maddilapalem -> MVP Colony -> Gajuwaka)",
    stopName: "MVP Colony Sector 1",
    parentName: "Suresh Varma",
    parentEmail: "parent@nishchit.app",
    parentPhone: "+91 91234 56789"
  },
  {
    id: "STU-102",
    rollNo: "23A51A0412",
    name: "Pooja Reddy",
    studentClass: "B.Tech ECE - 2nd Year",
    institutionId: "INST-GITAM",
    institutionName: "GITAM (Deemed to be University)",
    busId: "BUS-GT02",
    busNumber: "Bus GT-02",
    routeId: "ROUTE-GT02",
    routeName: "Route GT-02 (GITAM University -> MVP Colony)",
    stopName: "Rushikonda Beach Road",
    parentName: "M. K. Reddy",
    parentEmail: "parent2@nishchit.app",
    parentPhone: "+91 98490 88776"
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
