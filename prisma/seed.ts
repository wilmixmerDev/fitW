import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const foods = [
  // Proteins
  { name: "Chicken Breast (cooked)", calories: 165, protein: 31, carbs: 0, fat: 3.6, isVerified: true },
  { name: "Chicken Thigh (cooked)", calories: 209, protein: 26, carbs: 0, fat: 10.9, isVerified: true },
  { name: "Ground Beef 80/20 (cooked)", calories: 254, protein: 26, carbs: 0, fat: 17, isVerified: true },
  { name: "Salmon (cooked)", calories: 208, protein: 20, carbs: 0, fat: 13, isVerified: true },
  { name: "Tuna in Water (canned)", calories: 116, protein: 26, carbs: 0, fat: 1, isVerified: true },
  { name: "Egg (whole)", calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: 50, servingName: "1 large egg", isVerified: true },
  { name: "Egg White", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, isVerified: true },
  { name: "Greek Yogurt (0% fat)", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, isVerified: true },
  { name: "Cottage Cheese (1%)", calories: 72, protein: 12, carbs: 2.7, fat: 1, isVerified: true },
  { name: "Tofu (firm)", calories: 76, protein: 8, carbs: 1.9, fat: 4.2, isVerified: true },
  { name: "Turkey Breast (cooked)", calories: 135, protein: 30, carbs: 0, fat: 1, isVerified: true },
  { name: "Shrimp (cooked)", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, isVerified: true },
  { name: "Pork Tenderloin (cooked)", calories: 143, protein: 26, carbs: 0, fat: 3.5, isVerified: true },
  { name: "Tilapia (cooked)", calories: 128, protein: 26, carbs: 0, fat: 2.7, isVerified: true },
  { name: "Whey Protein Powder", calories: 370, protein: 80, carbs: 5, fat: 3, servingSize: 30, servingName: "1 scoop", isVerified: true },
  // Carbs - Grains
  { name: "White Rice (cooked)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, isVerified: true },
  { name: "Brown Rice (cooked)", calories: 123, protein: 2.7, carbs: 26, fat: 1, isVerified: true },
  { name: "Oats (dry)", calories: 389, protein: 17, carbs: 66, fat: 7, isVerified: true },
  { name: "Oatmeal (cooked)", calories: 71, protein: 2.5, carbs: 12, fat: 1.5, isVerified: true },
  { name: "White Bread", calories: 265, protein: 9, carbs: 49, fat: 3.2, servingSize: 28, servingName: "1 slice", isVerified: true },
  { name: "Whole Wheat Bread", calories: 247, protein: 13, carbs: 41, fat: 4.2, servingSize: 28, servingName: "1 slice", isVerified: true },
  { name: "Pasta (cooked)", calories: 158, protein: 5.8, carbs: 31, fat: 0.9, isVerified: true },
  { name: "Quinoa (cooked)", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, isVerified: true },
  { name: "Sweet Potato (baked)", calories: 90, protein: 2, carbs: 21, fat: 0.1, isVerified: true },
  { name: "White Potato (baked)", calories: 93, protein: 2.5, carbs: 21, fat: 0.1, isVerified: true },
  { name: "Corn Tortilla", calories: 218, protein: 5.7, carbs: 46, fat: 2.8, servingSize: 30, servingName: "1 tortilla", isVerified: true },
  // Fruits
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 120, servingName: "1 medium", isVerified: true },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 182, servingName: "1 medium", isVerified: true },
  { name: "Blueberries", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, isVerified: true },
  { name: "Strawberries", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, isVerified: true },
  { name: "Orange", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, servingSize: 131, servingName: "1 medium", isVerified: true },
  // Fats
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: 28, servingName: "1 oz (about 23 almonds)", isVerified: true },
  { name: "Walnuts", calories: 654, protein: 15, carbs: 14, fat: 65, servingSize: 28, servingName: "1 oz", isVerified: true },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fat: 50, servingSize: 32, servingName: "2 tbsp", isVerified: true },
  { name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: 150, servingName: "1 medium", isVerified: true },
  { name: "Olive Oil", calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: 14, servingName: "1 tbsp", isVerified: true },
  { name: "Coconut Oil", calories: 892, protein: 0, carbs: 0, fat: 100, servingSize: 14, servingName: "1 tbsp", isVerified: true },
  // Dairy
  { name: "Whole Milk", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, servingSize: 240, servingName: "1 cup", isVerified: true },
  { name: "Skim Milk", calories: 34, protein: 3.4, carbs: 5, fat: 0.2, servingSize: 240, servingName: "1 cup", isVerified: true },
  { name: "Cheddar Cheese", calories: 402, protein: 25, carbs: 1.3, fat: 33, servingSize: 28, servingName: "1 oz", isVerified: true },
  { name: "Mozzarella", calories: 280, protein: 28, carbs: 2.2, fat: 17, servingSize: 28, servingName: "1 oz", isVerified: true },
  // Vegetables
  { name: "Broccoli (cooked)", calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, isVerified: true },
  { name: "Spinach (raw)", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, isVerified: true },
  { name: "Tomato", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, isVerified: true },
  { name: "Cucumber", calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, isVerified: true },
  { name: "Bell Pepper", calories: 31, protein: 1, carbs: 6, fat: 0.3, isVerified: true },
  { name: "Lettuce (romaine)", calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3, isVerified: true },
  { name: "Asparagus (cooked)", calories: 22, protein: 2.4, carbs: 4.1, fat: 0.2, isVerified: true },
  { name: "Green Beans (cooked)", calories: 35, protein: 1.9, carbs: 8, fat: 0.1, isVerified: true },
  { name: "Mushrooms (cooked)", calories: 28, protein: 2.2, carbs: 5.3, fat: 0.5, isVerified: true },
  // Legumes
  { name: "Black Beans (cooked)", calories: 132, protein: 8.9, carbs: 24, fat: 0.5, isVerified: true },
  { name: "Chickpeas (cooked)", calories: 164, protein: 8.9, carbs: 27, fat: 2.6, isVerified: true },
  { name: "Lentils (cooked)", calories: 116, protein: 9, carbs: 20, fat: 0.4, isVerified: true },
  { name: "Edamame (cooked)", calories: 122, protein: 11, carbs: 8.9, fat: 5.2, isVerified: true },
  // Comunes / procesados
  { name: "Arepa (corn)", calories: 260, protein: 6, carbs: 52, fat: 3, servingSize: 90, servingName: "1 arepa mediana", isVerified: true },
  { name: "White Bread Roll", calories: 270, protein: 9, carbs: 50, fat: 3, servingSize: 50, servingName: "1 pan", isVerified: true },
  { name: "Pizza Margherita", calories: 266, protein: 11, carbs: 33, fat: 10, servingSize: 100, servingName: "1 rebanada aprox", isVerified: true },

  // ── Comida Venezolana / Latina ─────────────────────────────────────────
  // Proteínas
  { name: "Carne Mechada", calories: 185, protein: 28, carbs: 0, fat: 8, isVerified: true },
  { name: "Pollo Guisado", calories: 175, protein: 25, carbs: 3, fat: 7, isVerified: true },
  { name: "Pernil de Cerdo (horneado)", calories: 230, protein: 27, carbs: 0, fat: 13, isVerified: true },
  { name: "Chuleta de Cerdo (a la plancha)", calories: 210, protein: 26, carbs: 0, fat: 12, isVerified: true },
  { name: "Pez Sierra (frito)", calories: 220, protein: 23, carbs: 5, fat: 11, isVerified: true },
  { name: "Atún al Natural (lata)", calories: 116, protein: 26, carbs: 0, fat: 1, isVerified: true },
  { name: "Sardinas en Aceite (lata)", calories: 208, protein: 25, carbs: 0, fat: 11, isVerified: true },
  { name: "Jamón de Pierna", calories: 145, protein: 18, carbs: 3, fat: 6, servingSize: 30, servingName: "1 lonja", isVerified: true },
  { name: "Mortadela", calories: 310, protein: 12, carbs: 3, fat: 28, servingSize: 30, servingName: "1 lonja", isVerified: true },
  // Lácteos / quesos
  { name: "Queso Blanco Llanero", calories: 280, protein: 22, carbs: 2, fat: 20, isVerified: true },
  { name: "Queso de Mano", calories: 260, protein: 20, carbs: 2, fat: 19, isVerified: true },
  { name: "Queso Telita", calories: 240, protein: 18, carbs: 2, fat: 18, isVerified: true },
  { name: "Queso Amarillo (procesado)", calories: 350, protein: 22, carbs: 5, fat: 27, servingSize: 20, servingName: "1 lonja", isVerified: true },
  { name: "Nata (crema de leche)", calories: 195, protein: 2.8, carbs: 3, fat: 20, isVerified: true },
  { name: "Leche Entera", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, servingSize: 240, servingName: "1 vaso", isVerified: true },
  // Carbohidratos / acompañantes
  { name: "Arepa de Maíz Blanco", calories: 220, protein: 5, carbs: 45, fat: 2, servingSize: 80, servingName: "1 arepa", isVerified: true },
  { name: "Arepa de Trigo", calories: 250, protein: 7, carbs: 48, fat: 3, servingSize: 80, servingName: "1 arepa", isVerified: true },
  { name: "Cachapa", calories: 290, protein: 7, carbs: 54, fat: 6, servingSize: 120, servingName: "1 cachapa", isVerified: true },
  { name: "Tajadas (plátano maduro frito)", calories: 150, protein: 1, carbs: 35, fat: 3, isVerified: true },
  { name: "Plátano Maduro (hervido)", calories: 122, protein: 1.3, carbs: 31, fat: 0.4, isVerified: true },
  { name: "Tostones (patacones)", calories: 160, protein: 1.5, carbs: 34, fat: 3, isVerified: true },
  { name: "Yuca Hervida", calories: 160, protein: 1.4, carbs: 38, fat: 0.3, isVerified: true },
  { name: "Yuca Frita", calories: 260, protein: 2, carbs: 45, fat: 8, isVerified: true },
  { name: "Caraotas Negras (guisadas)", calories: 135, protein: 8, carbs: 24, fat: 1.5, isVerified: true },
  { name: "Caraotas Rojas", calories: 132, protein: 8.7, carbs: 24, fat: 0.5, isVerified: true },
  { name: "Lentejas Guisadas", calories: 120, protein: 9, carbs: 20, fat: 1, isVerified: true },
  { name: "Arroz Blanco Cocido", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, isVerified: true },
  { name: "Pasta Cocida", calories: 158, protein: 5.8, carbs: 31, fat: 0.9, isVerified: true },
  { name: "Papa Criolla (hervida)", calories: 80, protein: 2, carbs: 18, fat: 0.1, isVerified: true },
  { name: "Arepita de Anís", calories: 310, protein: 5, carbs: 58, fat: 7, servingSize: 40, servingName: "1 arepita", isVerified: true },
  { name: "Empanada de Carne", calories: 280, protein: 12, carbs: 32, fat: 12, servingSize: 100, servingName: "1 empanada", isVerified: true },
  { name: "Empanada de Queso", calories: 260, protein: 10, carbs: 32, fat: 11, servingSize: 100, servingName: "1 empanada", isVerified: true },
  { name: "Tequeño", calories: 130, protein: 4, carbs: 13, fat: 7, servingSize: 35, servingName: "1 tequeño", isVerified: true },
  { name: "Pan de Jamón (rebanada)", calories: 200, protein: 7, carbs: 28, fat: 7, servingSize: 60, servingName: "1 rebanada", isVerified: true },
  { name: "Hallaca (porción)", calories: 220, protein: 8, carbs: 30, fat: 9, servingSize: 150, servingName: "1 hallaca", isVerified: true },
  { name: "Pabellón Criollo (plato completo)", calories: 550, protein: 38, carbs: 68, fat: 14, servingSize: 400, servingName: "1 plato", isVerified: true },
  // Frutas tropicales
  { name: "Mango (Tommy)", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, servingSize: 200, servingName: "1 mango mediano", isVerified: true },
  { name: "Lechosa (papaya)", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, isVerified: true },
  { name: "Parchita (maracuyá)", calories: 97, protein: 2.2, carbs: 23, fat: 0.7, isVerified: true },
  { name: "Guanábana", calories: 66, protein: 1, carbs: 17, fat: 0.3, isVerified: true },
  { name: "Piña", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, isVerified: true },
  { name: "Cambur (banana pequeño)", calories: 75, protein: 0.9, carbs: 19, fat: 0.3, servingSize: 90, servingName: "1 cambur", isVerified: true },
  { name: "Patilla (sandía)", calories: 30, protein: 0.6, carbs: 7.5, fat: 0.2, isVerified: true },
  { name: "Melón", calories: 34, protein: 0.8, carbs: 8, fat: 0.2, isVerified: true },
  // Bebidas / extras
  { name: "Jugo de Naranja Natural", calories: 45, protein: 0.7, carbs: 10, fat: 0.2, servingSize: 240, servingName: "1 vaso", isVerified: true },
  { name: "Malta (bebida)", calories: 60, protein: 0.9, carbs: 15, fat: 0, servingSize: 330, servingName: "1 lata", isVerified: true },
  { name: "Chicha de Arroz", calories: 95, protein: 1.5, carbs: 22, fat: 0.5, servingSize: 250, servingName: "1 vaso", isVerified: true },
  { name: "Café con leche", calories: 55, protein: 2.5, carbs: 6, fat: 2, servingSize: 200, servingName: "1 taza", isVerified: true },
  { name: "Mantequilla", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, servingSize: 14, servingName: "1 cucharada", isVerified: true },
  { name: "Mayonesa", calories: 680, protein: 1, carbs: 0.6, fat: 75, servingSize: 15, servingName: "1 cucharada", isVerified: true },
]

async function main() {
  console.log("Seeding food database...")
  const existing = await prisma.foodItem.findMany({ select: { name: true } })
  const existingNames = new Set(existing.map((f) => f.name))
  const newFoods = foods.filter((f) => !existingNames.has(f.name))
  if (newFoods.length === 0) {
    console.log(`All ${foods.length} items already in DB. Nothing to add.`)
    return
  }
  await prisma.foodItem.createMany({ data: newFoods })
  console.log(`Added ${newFoods.length} new items (${existing.length} already existed).`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
