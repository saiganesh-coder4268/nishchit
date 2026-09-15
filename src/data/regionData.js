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
    id: "INST-GITAM",
    institutionId: "INST-GITAM",
    name: "GITAM (Deemed to be University)",
    shortName: "GITAM University",
    campus: "Rushikonda Campus, Visakhapatnam",
    location: "Rushikonda, Visakhapatnam",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "530045",
    status: "ACTIVE",
    busesCount: 35,
    activeRoutes: ["ROUTE-GT02", "ROUTE-GT06"]
  },
  {
    id: "INST-MVGR",
    institutionId: "INST-MVGR",
    name: "MVGR College of Engineering (Autonomous)",
    shortName: "MVGR College",
    campus: "Chintalavalasa Campus, Vizianagaram",
    location: "Chintalavalasa, Vizianagaram",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    country: "India",
    district: "Vizianagaram",
    pincode: "535216",
    status: "ACTIVE",
    busesCount: 18,
    activeRoutes: ["ROUTE-VZ04"]
  },
  {
    id: "INST-ANITS",
    institutionId: "INST-ANITS",
    name: "ANITS (Anil Neerukonda Institute of Tech & Sciences)",
    shortName: "ANITS",
    campus: "Sangivalasa, Thagarapuvalasa, Bheemunipatnam",
    location: "Sangivalasa, Visakhapatnam",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "531162",
    status: "ACTIVE",
    busesCount: 26,
    activeRoutes: ["ROUTE-AN01"]
  },
  {
    id: "INST-GVP",
    institutionId: "INST-GVP",
    name: "Gayatri Vidya Parishad College of Engineering (Autonomous)",
    shortName: "GVPCOE",
    campus: "Madhurawada Campus, Visakhapatnam",
    location: "Madhurawada, Visakhapatnam",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "530048",
    status: "ACTIVE",
    busesCount: 22,
    activeRoutes: ["ROUTE-GVP03"]
  },
  {
    id: "INST-ABC-SCHOOL",
    institutionId: "INST-ABC-SCHOOL",
    name: "ABC International School",
    shortName: "ABC School",
    campus: "Benz Circle Campus, Vijayawada",
    location: "Benz Circle, Vijayawada",
    city: "Vijayawada",
    state: "Andhra Pradesh",
    country: "India",
    district: "Vijayawada / NTR District",
    pincode: "520010",
    status: "ACTIVE",
    busesCount: 24,
    activeRoutes: ["ROUTE-05"]
  },
  {
    id: "INST-RAGHU",
    institutionId: "INST-RAGHU",
    name: "Raghu Engineering College & Institute of Technology",
    shortName: "Raghu Institutions",
    campus: "Dakamarri, Bheemunipatnam Mandal",
    location: "Dakamarri, Visakhapatnam",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "531162",
    status: "COMING_SOON",
    busesCount: 20,
    activeRoutes: []
  },
  {
    id: "INST-DPS",
    institutionId: "INST-DPS",
    name: "Delhi Public School (DPS) Visakhapatnam",
    shortName: "DPS Vizag",
    campus: "Anandapuram Road, Visakhapatnam",
    location: "Anandapuram, Visakhapatnam",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "531163",
    status: "COMING_SOON",
    busesCount: 16,
    activeRoutes: []
  },
  {
    id: "INST-TIMPANY",
    institutionId: "INST-TIMPANY",
    name: "Timpany Senior Secondary School",
    shortName: "Timpany School",
    campus: "CBM Compound / Asilmetta, Visakhapatnam",
    location: "CBM Compound, Visakhapatnam",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "India",
    district: "Visakhapatnam",
    pincode: "530003",
    status: "COMING_SOON",
    busesCount: 12,
    activeRoutes: []
  }
];

/**
 * Standard Fleet & Route Database for initial seed and admin control
 */
export const INITIAL_VEHICLES = [
  {
    id: "BUS-12",
    busNumber: "Bus 12",
    registrationNumber: "AP 31 TH 1212",
    institutionId: "INST-GITAM",
    capacity: 55,
    driverId: "DRV-402",
    driverName: "Srinivas Rao",
    driverPhone: "+91 98480 12345",
    routeId: "ROUTE-GT02",
    routeName: "Route GT-02 (GITAM University -> MVP Colony)",
    status: "ON_TRIP",
    latitude: 17.7910,
    longitude: 83.3720,
    accuracy: 6,
    speed: 34,
    lastUpdated: Date.now()
  },
  {
    id: "BUS-18",
    busNumber: "Bus 18",
    registrationNumber: "AP 31 TD 1818",
    institutionId: "INST-GITAM",
    capacity: 48,
    driverId: "DRV-781",
    driverName: "M. Ramana Murthy",
    driverPhone: "+91 99890 33445",
    routeId: "ROUTE-GT06",
    routeName: "Route GT-06 (GITAM University -> MVP Colony)",
    status: "NOT_STARTED",
    latitude: 17.7816,
    longitude: 83.3776,
    accuracy: 8,
    speed: 0,
    lastUpdated: null
  },
  {
    id: "BUS-24",
    busNumber: "Bus 24",
    registrationNumber: "AP 35 U 2424",
    institutionId: "INST-MVGR",
    capacity: 52,
    driverId: "DRV-901",
    driverName: "S. Venkatesh",
    driverPhone: "+91 98765 43210",
    routeId: "ROUTE-VZ04",
    routeName: "Route 04 (Vizianagaram RTC Complex -> MVGR Campus)",
    status: "NOT_STARTED",
    latitude: 18.1145,
    longitude: 83.4021,
    accuracy: 8,
    speed: 0,
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
    routeName: "Route GVP-03 (Gajuwaka -> GVP Madhurawada)",
    status: "NOT_STARTED",
    latitude: 17.6868,
    longitude: 83.2185,
    accuracy: 12,
    speed: 0,
    lastUpdated: null
  }
];

export const INITIAL_ROUTES = [
  {
    id: "ROUTE-GT02",
    code: "ROUTE GT-02",
    name: "GITAM University -> Rushikonda -> Madhurawada -> MVP Colony",
    routeName: "GITAM University -> Rushikonda -> Madhurawada -> MVP Colony",
    institutionId: "INST-GITAM",
    from: "GITAM University",
    to: "MVP Colony",
    busId: "BUS-12",
    stops: [
      { name: "GITAM University", scheduledTime: "04:10 PM", lat: 17.7816, lng: 83.3776 },
      { name: "Rushikonda", scheduledTime: "04:24 PM", lat: 17.7950, lng: 83.3850 },
      { name: "Madhurawada", scheduledTime: "04:32 PM", lat: 17.8180, lng: 83.3590 },
      { name: "Hanumanthuwaka", scheduledTime: "04:40 PM", lat: 17.7650, lng: 83.3420 },
      { name: "MVP Colony", scheduledTime: "04:48 PM", lat: 17.7450, lng: 83.3410 }
    ],
    reportingTime: "03:50 PM",
    departureTime: "04:10 PM",
    expectedArrival: "04:48 PM"
  },
  {
    id: "ROUTE-GT06",
    code: "ROUTE GT-06",
    name: "GITAM University -> Yendada -> MVP Colony",
    routeName: "GITAM University -> Yendada -> MVP Colony",
    institutionId: "INST-GITAM",
    from: "GITAM University",
    to: "MVP Colony",
    busId: "BUS-18",
    stops: [
      { name: "GITAM University", scheduledTime: "04:55 PM", lat: 17.7816, lng: 83.3776 },
      { name: "Yendada Junction", scheduledTime: "05:08 PM", lat: 17.7720, lng: 83.3610 },
      { name: "Maddilapalem", scheduledTime: "05:22 PM", lat: 17.7394, lng: 83.3289 },
      { name: "MVP Colony", scheduledTime: "05:35 PM", lat: 17.7450, lng: 83.3410 }
    ],
    reportingTime: "04:35 PM",
    departureTime: "04:55 PM",
    expectedArrival: "05:35 PM"
  },
  {
    id: "ROUTE-VZ04",
    code: "ROUTE 04",
    name: "Vizianagaram RTC Complex -> Mayuri -> Chintalavalasa (MVGR)",
    routeName: "Vizianagaram RTC Complex -> Mayuri -> Chintalavalasa (MVGR)",
    institutionId: "INST-MVGR",
    from: "Vizianagaram RTC Complex",
    to: "MVGR College Main Gate",
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
    routeName: "Dwaraka Nagar -> Maddilapalem -> Madhurawada -> Sangivalasa (ANITS)",
    institutionId: "INST-ANITS",
    from: "Dwaraka Bus Station",
    to: "ANITS Campus Sangivalasa",
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
    routeName: "Gajuwaka -> NAD -> MVP Colony -> GVP Madhurawada",
    institutionId: "INST-GVP",
    from: "Gajuwaka Old Bus Stand",
    to: "GVP Engineering College Campus",
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
  },
  {
    id: "ROUTE-05",
    code: "ROUTE 05",
    name: "Route 05 (Benz Circle -> Ramavarappadu -> ABC Campus)",
    routeName: "Route 05 (Benz Circle -> Ramavarappadu -> ABC Campus)",
    institutionId: "INST-ABC-SCHOOL",
    institutionName: "ABC International School",
    from: "Benz Circle",
    to: "ABC College Campus",
    busId: "BUS-12",
    stops: [
      { name: "Benz Circle", scheduledTime: "06:30 AM", lat: 16.5000, lng: 80.6480 },
      { name: "Ramavarappadu Ring", scheduledTime: "06:45 AM", lat: 16.5160, lng: 80.6720 },
      { name: "Enikepadu", scheduledTime: "07:00 AM", lat: 16.5280, lng: 80.6950 },
      { name: "Nidamanuru", scheduledTime: "07:15 AM", lat: 16.5400, lng: 80.7200 },
      { name: "ABC College Campus", scheduledTime: "07:30 AM", lat: 16.5550, lng: 80.7450 }
    ],
    reportingTime: "06:15 AM",
    departureTime: "06:30 AM",
    expectedArrival: "07:30 AM"
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
