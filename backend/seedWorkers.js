const mongoose = require('mongoose');
require('dotenv').config();
const FieldWorker = require('./models/FieldWorker');

const workers = [
  // WATER DEPT
  { name: "Rajesh Kumar", employeeId: "FW-W01", phone: "9876543210", department: "water", sectors: ["Civil Lines", "Main Tank Area", "Model Town"] },
  { name: "Priya Sharma", employeeId: "FW-W02", phone: "9123456780", department: "water", sectors: ["Ward 2", "River Bank", "Ashok Nagar"] },
  
  // ROAD DEPT
  { name: "Amit Yadav", employeeId: "FW-R01", phone: "9345678901", department: "road", sectors: ["MG Road", "Bridge Colony", "Station Road"] },
  { name: "Suresh Meena", employeeId: "FW-R02", phone: "9456789012", department: "road", sectors: ["Industrial Hub", "Outer Ring Road", "Sector 12"] },
  
  // ELECTRICAL DEPT
  { name: "Deepak Verma", employeeId: "FW-E01", phone: "9567890123", department: "electrical", sectors: ["Power Grid A", "Residential Block", "Substation 4"] },
  { name: "Arjun Singh", employeeId: "FW-E02", phone: "9678901234", department: "electrical", sectors: ["Main Market", "Ward 5", "Indraprastha"] },
  
  // SANITATION DEPT
  { name: "Sunita Devi", employeeId: "FW-S01", phone: "9789012345", department: "sanitation", sectors: ["Green Park", "Dumping Ground Z", "Lake View"] },
  { name: "Vijay Solanki", employeeId: "FW-S02", phone: "9890123456", department: "sanitation", sectors: ["Civic Center", "Old City", "Sector 8"] }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Seeding...");
    
    // Clear existing active workers first for clean demo state
    await FieldWorker.deleteMany({});
    console.log("Cleared existing workers.");

    await FieldWorker.insertMany(workers);
    console.log(`Successfully seeded ${workers.length} Personnel across all Strategic Departments.`);
    
    process.exit(0);
  } catch (err) {
    console.error("Seeding Failed:", err);
    process.exit(1);
  }
}

seed();
