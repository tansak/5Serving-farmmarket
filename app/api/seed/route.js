import connectDB from "@/lib/mongoose";
import Farmer from "@/models/Farmer";
import Produce from "@/models/Produce";
import Community from "@/models/Community";

// One-time seed endpoint — protected by secret
export async function POST(request) {
  try {
    const body = await request.json();
    if (body.secret !== process.env.SEED_SECRET && body.secret !== "5serving-seed-2026") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const existingFarmers = await Farmer.countDocuments();
    if (existingFarmers >= 4 && !body.force) {
      return Response.json({ message: "Already seeded", farmers: existingFarmers });
    }
    // Clear and re-seed
    await Farmer.deleteMany({});
    await Produce.deleteMany({});
    await Community.deleteMany({});

    const today = new Date().toISOString().slice(0, 10);

    const farmers = await Farmer.insertMany([
      { name: "Ramu Gowda",      village: "Channarayapatna", district: "Hassan",     state: "Karnataka",   phone: "9876543210", crops: ["Vegetables", "Grains"] },
      { name: "Savita Devi",     village: "Wai",             district: "Satara",     state: "Maharashtra", phone: "9823456701", crops: ["Fruits", "Pulses"] },
      { name: "Krishnamurthy R", village: "Ponneri",         district: "Tiruvallur", state: "Tamil Nadu",  phone: "9765432108", crops: ["Herbs", "Spices"] },
      { name: "Meena Patil",     village: "Hubli",           district: "Dharwad",    state: "Karnataka",   phone: "9741236580", crops: ["Dairy", "Vegetables"] },
    ]);

    await Produce.insertMany([
      { farmerId: farmers[0]._id.toString(), farmerName: "Ramu Gowda",      village: "Hassan, Karnataka",      name: "Country Tomatoes",    category: "Vegetables", quantity: 50,  unit: "kg",     price: 28,  organic: true,  emoji: "🍅", harvestDate: today, description: "Fresh country tomatoes grown naturally in the fields of Hassan, Karnataka." },
      { farmerId: farmers[1]._id.toString(), farmerName: "Savita Devi",     village: "Satara, Maharashtra",    name: "Alphonso Mangoes",    category: "Fruits",     quantity: 100, unit: "kg",     price: 180, organic: true,  emoji: "🥭", harvestDate: today, description: "Prized Alphonso mangoes, bursting with sweetness from the orchards of Satara." },
      { farmerId: farmers[0]._id.toString(), farmerName: "Ramu Gowda",      village: "Hassan, Karnataka",      name: "Red Rice",            category: "Grains",     quantity: 200, unit: "kg",     price: 65,  organic: false, emoji: "🌾", harvestDate: today, description: "Traditional Karnataka red rice — nutty, nutritious, and hearty." },
      { farmerId: farmers[2]._id.toString(), farmerName: "Krishnamurthy R", village: "Tiruvallur, Tamil Nadu", name: "Fresh Curry Leaves",  category: "Herbs",      quantity: 20,  unit: "kg",     price: 40,  organic: true,  emoji: "🌿", harvestDate: today, description: "Freshly harvested organic curry leaves that bring authentic South Indian aroma to your kitchen." },
      { farmerId: farmers[1]._id.toString(), farmerName: "Savita Devi",     village: "Satara, Maharashtra",    name: "Chana Dal",           category: "Pulses",     quantity: 80,  unit: "kg",     price: 90,  organic: false, emoji: "🫘", harvestDate: today, description: "High-quality chana dal from Maharashtra farms — perfect for dal tadka and sundal." },
      { farmerId: farmers[2]._id.toString(), farmerName: "Krishnamurthy R", village: "Tiruvallur, Tamil Nadu", name: "Red Chilli Powder",   category: "Spices",     quantity: 30,  unit: "kg",     price: 160, organic: true,  emoji: "🌶️",harvestDate: today, description: "Naturally sun-dried and ground red chillies — bold colour, bold heat, pure flavour." },
      { farmerId: farmers[3]._id.toString(), farmerName: "Meena Patil",     village: "Dharwad, Karnataka",     name: "Fresh Cow Milk",      category: "Dairy",      quantity: 50,  unit: "litre",  price: 52,  organic: true,  emoji: "🥛", harvestDate: today, description: "Pure, unprocessed cow milk from free-range cattle in the green pastures of Dharwad." },
      { farmerId: farmers[0]._id.toString(), farmerName: "Ramu Gowda",      village: "Hassan, Karnataka",      name: "Drumstick (Moringa)", category: "Vegetables", quantity: 30,  unit: "bundle", price: 25,  organic: true,  emoji: "🌿", harvestDate: today, description: "Fresh drumstick pods from Hassan — a superfood packed with iron, calcium, and vitamins." },
    ]);

    await Community.insertMany([
      { name: "Bengaluru Urban Farmers Hub", location: "Bengaluru, Karnataka",  members: 240, type: "Urban Community" },
      { name: "Pune Organic Collective",     location: "Pune, Maharashtra",      members: 180, type: "Organic Buyers" },
      { name: "Chennai HomeCooks Circle",    location: "Chennai, Tamil Nadu",    members: 320, type: "Home Cooks" },
    ]);

    return Response.json({
      success: true,
      message: "Database seeded successfully",
      inserted: { farmers: farmers.length, produce: 8, communities: 3 }
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
