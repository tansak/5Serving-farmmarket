const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI === "your_mongodb_atlas_uri_here") {
  console.error("❌  Please set MONGODB_URI in .env.local before running seed.");
  process.exit(1);
}

/* ── Schemas (inline, no ESM imports) ── */
const FarmerSchema = new mongoose.Schema({
  name: String, village: String, district: String,
  state: { type: String, default: "Karnataka" },
  phone: String, crops: [String],
  joined: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const ProduceSchema = new mongoose.Schema({
  farmerId: String, farmerName: String, village: String,
  name: String, category: String, quantity: Number,
  unit: String, price: Number, harvestDate: String,
  organic: Boolean, description: String,
  emoji: { type: String, default: "🌱" },
  available: { type: Boolean, default: true }
}, { timestamps: true });

const CommunitySchema = new mongoose.Schema({
  name: String, location: String,
  members: { type: Number, default: 0 },
  type: { type: String, default: "General" },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const Farmer    = mongoose.model("Farmer",    FarmerSchema);
const Produce   = mongoose.model("Produce",   ProduceSchema);
const Community = mongoose.model("Community", CommunitySchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected to MongoDB");

  await Farmer.deleteMany({});
  await Produce.deleteMany({});
  await Community.deleteMany({});
  console.log("🧹  Cleared existing data");

  const farmers = await Farmer.insertMany([
    { name: "Ramu Gowda",       village: "Channarayapatna", district: "Hassan",    state: "Karnataka",    phone: "9876543210", crops: ["Vegetables", "Grains"] },
    { name: "Savita Devi",      village: "Wai",             district: "Satara",    state: "Maharashtra",  phone: "9823456701", crops: ["Fruits", "Pulses"] },
    { name: "Krishnamurthy R",  village: "Ponneri",         district: "Tiruvallur",state: "Tamil Nadu",   phone: "9765432108", crops: ["Herbs", "Spices"] },
    { name: "Meena Patil",      village: "Hubli",           district: "Dharwad",   state: "Karnataka",    phone: "9741236580", crops: ["Dairy", "Vegetables"] },
  ]);
  console.log(`🌾  Inserted ${farmers.length} farmers`);

  const today = new Date().toISOString().slice(0, 10);

  await Produce.insertMany([
    { farmerId: farmers[0]._id.toString(), farmerName: "Ramu Gowda",      village: "Hassan, Karnataka",      name: "Country Tomatoes",    category: "Vegetables", quantity: 50,  unit: "kg",     price: 28,  organic: true,  emoji: "🍅", harvestDate: today, description: "Fresh country tomatoes from Hassan district." },
    { farmerId: farmers[1]._id.toString(), farmerName: "Savita Devi",     village: "Satara, Maharashtra",    name: "Alphonso Mangoes",    category: "Fruits",     quantity: 100, unit: "kg",     price: 180, organic: true,  emoji: "🥭", harvestDate: today, description: "Sweet Alphonso mangoes from Satara." },
    { farmerId: farmers[0]._id.toString(), farmerName: "Ramu Gowda",      village: "Hassan, Karnataka",      name: "Red Rice",            category: "Grains",     quantity: 200, unit: "kg",     price: 65,  organic: false, emoji: "🌾", harvestDate: today, description: "Traditional red rice from Karnataka." },
    { farmerId: farmers[2]._id.toString(), farmerName: "Krishnamurthy R", village: "Tiruvallur, Tamil Nadu", name: "Fresh Curry Leaves",  category: "Herbs",      quantity: 20,  unit: "kg",     price: 40,  organic: true,  emoji: "🌿", harvestDate: today, description: "Organic curry leaves from Tamil Nadu." },
    { farmerId: farmers[1]._id.toString(), farmerName: "Savita Devi",     village: "Satara, Maharashtra",    name: "Chana Dal",           category: "Pulses",     quantity: 80,  unit: "kg",     price: 90,  organic: false, emoji: "🫘", harvestDate: today, description: "Quality chana dal from Maharashtra." },
    { farmerId: farmers[2]._id.toString(), farmerName: "Krishnamurthy R", village: "Tiruvallur, Tamil Nadu", name: "Red Chilli Powder",   category: "Spices",     quantity: 30,  unit: "kg",     price: 160, organic: true,  emoji: "🌶️", harvestDate: today, description: "Fiery red chilli powder, naturally dried." },
    { farmerId: farmers[3]._id.toString(), farmerName: "Meena Patil",     village: "Dharwad, Karnataka",     name: "Fresh Cow Milk",      category: "Dairy",      quantity: 50,  unit: "litre",  price: 52,  organic: true,  emoji: "🥛", harvestDate: today, description: "Pure cow milk from Dharwad." },
    { farmerId: farmers[0]._id.toString(), farmerName: "Ramu Gowda",      village: "Hassan, Karnataka",      name: "Drumstick (Moringa)", category: "Vegetables", quantity: 30,  unit: "bundle", price: 25,  organic: true,  emoji: "🌿", harvestDate: today, description: "Fresh drumstick from Hassan farms." },
  ]);
  console.log("🥦  Inserted 8 produce items");

  await Community.insertMany([
    { name: "Bengaluru Urban Farmers Hub", location: "Bengaluru, Karnataka",  members: 240, type: "Urban Community" },
    { name: "Pune Organic Collective",     location: "Pune, Maharashtra",      members: 180, type: "Organic Buyers" },
    { name: "Chennai HomeCooks Circle",    location: "Chennai, Tamil Nadu",    members: 320, type: "Home Cooks" },
  ]);
  console.log("🏘️  Inserted 3 communities");

  await mongoose.disconnect();
  console.log("✅  Seed complete. Database disconnected.");
}

seed().catch(err => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
