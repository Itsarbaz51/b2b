import { PrismaClient } from "@prisma/client";
import { CryptoService } from "../src/utils/cryptoService.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting minimal seed...");

  // const statesData = [
  //   {
  //     stateName: "Maharashtra",
  //     stateCode: "27",
  //     cities: ["Mumbai", "Pune"],
  //   },
  // ];

  // const createdStates = {};
  // const createdCities = {};

  // for (const stateData of statesData) {
  //   const state = await prisma.state.upsert({
  //     where: { stateCode: stateData.stateCode },
  //     update: {},
  //     create: {
  //       stateName: stateData.stateName,
  //       stateCode: stateData.stateCode,
  //     },
  //   });
  //   createdStates[state.id] = state;
  //   createdCities[state.id] = [];

  //   for (const cityName of stateData.cities) {
  //     const cityCode = cityName.toUpperCase().replace(/\s+/g, "_");
  //     const city = await prisma.city.upsert({
  //       where: { cityCode },
  //       update: {},
  //       create: {
  //         cityName,
  //         cityCode,
  //       },
  //     });
  //     createdCities[state.id].push(city);
  //   }
  // }

  console.log("\n👥 Creating roles...");

  const roles = [
    {
      name: "ADMIN",
      level: 0,
      type: "business",
      description: "System Administrator",
    },
    {
      name: "STATE HEAD",
      level: 1,
      type: "business",
      description: "State Head",
    },
    {
      name: "MASTER DISTRIBUTOR",
      level: 2,
      type: "business",
      description: "Master Distributor",
    },
    {
      name: "DISTRIBUTOR",
      level: 3,
      type: "business",
      description: "Distributor",
    },
    {
      name: "RETAILER",
      level: 4,
      type: "business",
      description: "Retailer",
    },
    {
      name: "HR",
      level: 5,
      type: "employee",
      description: "Human Resources",
    },
  ];

  const createdRoles = {};

  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { level: role.level },
      update: {
        name: role.name,
        type: role.type,
        description: role.description,
      },
      create: {
        name: role.name,
        level: role.level,
        type: role.type,
        description: role.description,
        createdBy: null, // will be updated later for ADMIN
      },
    });
    createdRoles[role.level] = created;
    console.log(`✅ Role created: ${created.name} (${created.type})`);
  }

  console.log("\n👑 Creating Admin user...");

  const adminPassword = CryptoService.encrypt("Admin@123");
  const adminPin = CryptoService.encrypt("1234");

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      profileImage: "",
      email: "admin@gmail.com",
      phoneNumber: "9999999991",
      password: adminPassword,
      transactionPin: adminPin,
      roleId: createdRoles[0].id,
      hierarchyLevel: 0,
      hierarchyPath: "0",
      status: "ACTIVE",
      isKycVerified: true,
    },
  });

  console.log(`✅ Admin created: ${admin.username}`);

  // Update the ADMIN role with createdBy reference
  await prisma.role.update({
    where: { id: createdRoles[0].id },
    data: {
      createdBy: admin.id,
    },
  });

  const businessUsers = [admin];

  for (const user of businessUsers) {
    // COMMISSION
    await prisma.wallet.upsert({
      where: {
        userId_walletType: {
          userId: user.id,
          walletType: "COMMISSION",
        },
      },
      update: {},
      create: {
        userId: user.id,
        walletType: "COMMISSION",
        balance: BigInt(0),
        holdBalance: BigInt(0),
        currency: "INR",
        isActive: true,
        version: 1,
      },
    });

    // GST
    await prisma.wallet.upsert({
      where: {
        userId_walletType: {
          userId: user.id,
          walletType: "GST",
        },
      },
      update: {},
      create: {
        userId: user.id,
        walletType: "GST",
        balance: BigInt(0),
        holdBalance: BigInt(0),
        currency: "INR",
        isActive: true,
        version: 1,
      },
    });
    // TDS
    await prisma.wallet.upsert({
      where: {
        userId_walletType: {
          userId: user.id,
          walletType: "TDS",
        },
      },
      update: {},
      create: {
        userId: user.id,
        walletType: "TDS",
        balance: BigInt(0),
        holdBalance: BigInt(0),
        currency: "INR",
        isActive: true,
        version: 1,
      },
    });

    console.log(`💳 PRIMARY + COMMISSION wallet created for ${user.username}`);
  }

  console.log("\n🎉 Seeding completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Seeding failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
