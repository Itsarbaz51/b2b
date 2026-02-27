import { PrismaClient } from "@prisma/client";
import { CryptoService } from "../src/utils/cryptoService.js";
import { ServiceProviderService } from "../src/services/service.service.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting minimal seed...");

  const statesData = [
    {
      stateName: "Maharashtra",
      stateCode: "27",
      cities: ["Mumbai", "Pune"],
    },
  ];

  const createdStates = {};
  const createdCities = {};

  for (const stateData of statesData) {
    const state = await prisma.state.upsert({
      where: { stateCode: stateData.stateCode },
      update: {},
      create: {
        stateName: stateData.stateName,
        stateCode: stateData.stateCode,
      },
    });
    createdStates[state.id] = state;
    createdCities[state.id] = [];

    for (const cityName of stateData.cities) {
      const cityCode = cityName.toUpperCase().replace(/\s+/g, "_");
      const city = await prisma.city.upsert({
        where: { cityCode },
        update: {},
        create: {
          cityName,
          cityCode,
        },
      });
      createdCities[state.id].push(city);
    }
  }

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

  console.log("\n👤 Creating State Head user...");

  const shPassword = CryptoService.encrypt("User@123");
  const shPin = CryptoService.encrypt("1234");

  const stateHead = await prisma.user.upsert({
    where: { email: "statehead@gmail.com" },
    update: {},
    create: {
      username: "state_head_1",
      firstName: "State",
      lastName: "Head",
      profileImage: "",
      email: "statehead@gmail.com",
      phoneNumber: "9999999992",
      password: shPassword,
      transactionPin: shPin,
      roleId: createdRoles[1].id,
      hierarchyLevel: 1,
      hierarchyPath: "0/1",
      parentId: admin.id,
      status: "ACTIVE",
      isKycVerified: true,
    },
  });

  console.log(`✅ State Head created: ${stateHead.username}`);

  console.log("\n👨‍💼 Creating HR Employee...");

  const hrPassword = CryptoService.encrypt("Hr@123");
  // Employees don't need transaction pin since they don't have wallets
  const hrPin = CryptoService.encrypt("0000"); // Optional minimal pin

  const hrEmployee = await prisma.user.upsert({
    where: { email: "hr@gmail.com" },
    update: {},
    create: {
      username: "hr_employee",
      firstName: "HR",
      lastName: "Manager",
      profileImage: "",
      email: "hr@gmail.com",
      phoneNumber: "9999999993",
      password: hrPassword,
      transactionPin: hrPin, // Optional for employees
      roleId: createdRoles[5].id, // HR role
      hierarchyLevel: 1,
      hierarchyPath: "0/1",
      parentId: admin.id,
      status: "ACTIVE",
      isKycVerified: true,
    },
  });

  console.log(`✅ HR Employee created: ${hrEmployee.username}`);

  console.log("\n💰 Creating wallets for business users only...");

  // Only create wallets for business users (Admin and State Head)
  const businessUsers = [admin, stateHead];
  for (const user of businessUsers) {
    await prisma.wallet.upsert({
      where: {
        userId_walletType: { userId: user.id, walletType: "PRIMARY" },
      },
      update: {},
      create: {
        userId: user.id,
        walletType: "PRIMARY",
        balance: BigInt(100000),
        availableBalance: BigInt(100000),
        holdBalance: BigInt(0),
        currency: "INR",
        isActive: true,
      },
    });
    console.log(`💳 Wallet created for ${user.username}`);
  }

  console.log("⏭️  Skipping wallet creation for HR employee (employee role)");

  console.log("\n🏢 Creating service providers...");

  const serviceProviders = [
    {
      code: "RAZORPAY",
      name: "Razorpay",
      description: "connect razorpay",
      keyValueInputNumber: 2,
    },
    {
      code: "BBPS_PAYTM",
      name: "PayTM BBPS",
      description: "connect bbps",
      keyValueInputNumber: 4,
    },
    {
      code: "BANK_TRANSFER",
      name: "BANK TRANSFER",
      description: "connect BANK TRANSFER",
      keyValueInputNumber: 0,
      apiIntegrationStatus: true,
      isActive: true,
    },
  ];

  for (const provider of serviceProviders) {
    await ServiceProviderService.create(provider);
    console.log(`✅ Service provider created: ${provider.name}`);
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
