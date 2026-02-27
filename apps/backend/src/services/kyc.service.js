import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";
import Helper from "../utils/helper.js";
import { CryptoService } from "../utils/cryptoService.js";
import AuditLogService from "./auditLog.service.js";

class KycServices {
  static async indexUserKyc(
    params,
    currentUserId = null,
    req = null,
    res = null
  ) {
    const {
      userId,
      status = "ALL",
      page = 1,
      limit = 10,
      sort = "desc",
      search,
    } = params;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    // --- Fetch from DB
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        children: { select: { id: true } },
      },
    });

    if (!user) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_LIST_RETRIEVAL_FAILED",
        entityType: "KYC",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "USER_NOT_FOUND",
          requestedBy: currentUserId,
          targetUserId: userId,
        },
      });
      throw ApiError.notFound("User not found");
    }

    let targetUserIds = [];

    // Modified logic: ADMIN aur EMPLOYEE ko saare users, others ko apne created users
    if (
      user.role.name.toUpperCase() === "ADMIN" ||
      user.role.type === "employee"
    ) {
      // ADMIN aur EMPLOYEE ke liye saare users
      const allUsers = await Prisma.user.findMany({
        select: { id: true },
      });
      targetUserIds = allUsers.map((user) => user.id);
    } else {
      // Other users ke liye sirf apne created users
      targetUserIds = user.children.map((child) => child.id);
    }

    if (targetUserIds.length === 0) {
      const emptyResult = {
        data: [],
        meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
      };
      return emptyResult;
    }

    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId: { in: targetUserIds },
      ...(status &&
        status.toUpperCase() !== "ALL" && { status: status.toUpperCase() }),
      ...(search && {
        user: {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phoneNumber: { contains: search } },
          ],
        },
      }),
    };

    const kycs = await Prisma.userKyc.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: {
        user: {
          include: {
            parent: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        address: {
          select: {
            address: true,
            pinCode: true,
            city: true,
            state: true,
          },
        },
        piiConsents: true,
      },
    });

    const total = await Prisma.userKyc.count({ where });

    const frontendData = kycs.map((kyc) => {
      const pii = kyc.piiConsents.map((p) => {
        const decrypted = CryptoService.decrypt(p.piiHash);
        if (p.piiType === "PAN") {
          return {
            type: "PAN",
            value: decrypted.slice(0, 2) + "-XXX-XXX-" + decrypted.slice(-2),
          };
        }
        if (p.piiType === "AADHAAR") {
          return {
            type: "AADHAAR",
            value: "XXXX-XXXX-" + decrypted.slice(-4),
          };
        }
        return { type: p.piiType, value: "******" };
      });

      return {
        id: kyc.id,
        profile: {
          name: `${kyc.user.firstName} ${kyc.user.lastName}`,
          userId: kyc.userId,
          email: kyc.user.email,
          phone: kyc.user.phoneNumber,
          photo: kyc.photo || null,
          username: kyc.user.username,
        },
        parent: {
          username: kyc.user.parent?.username || "N/A",
          name: kyc.user.parent
            ? `${kyc.user.parent.firstName} ${kyc.user.parent.lastName}`
            : "N/A",
        },
        documents: pii,
        location: {
          city: kyc.address?.city?.cityName || "-",
          state: kyc.address?.state?.stateName || "-",
          address: kyc.address?.address || "-",
          pinCode: kyc.address?.pinCode || "-",
        },
        type: kyc.type,
        status: kyc.status,
        createdAt: kyc.createdAt,
      };
    });

    const result = {
      data: frontendData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        userRole: user.role.name,
        userRoleType: user.role.type,
        isEmployeeViewingAllData: user.role.type === "employee",
      },
    };

    return result;
  }

  static async showUserKyc(id, requestingUser) {
    const kyc = await Prisma.userKyc.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: {
        address: {
          select: {
            id: true,
            address: true,
            pinCode: true,
            city: { select: { cityName: true } },
            state: { select: { stateName: true } },
          },
        },
        user: {
          select: {
            email: true,
            phoneNumber: true,
            username: true,
            parent: {
              select: {
                phoneNumber: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                hierarchyPath: true,
                hierarchyLevel: true,
              },
            },
          },
        },
        piiConsents: { select: { piiType: true, piiHash: true } },
      },
    });

    if (!kyc) {
      return;
    }

    const kycWithRelations = kyc;

    const isOwner = requestingUser && kyc.userId === requestingUser.id;
    const isAdmin = requestingUser && requestingUser.role === "ADMIN";

    const pii = await Promise.all(
      kycWithRelations.piiConsents.map(async (p) => {
        try {
          const decryptedValue = await CryptoService.decrypt(p.piiHash);
          if (isAdmin || isOwner) {
            if (p.piiType === "AADHAAR" && decryptedValue.length === 12) {
              return {
                type: p.piiType,
                value: `${decryptedValue.slice(0, 4)}-${decryptedValue.slice(4, 8)}-${decryptedValue.slice(8)}`,
              };
            }
            return { type: p.piiType, value: decryptedValue };
          } else {
            let masked = "******";
            if (p.piiType === "PAN")
              masked = `${decryptedValue.slice(0, 2)}XXXX${decryptedValue.slice(-3)}`;
            else if (p.piiType === "AADHAAR")
              masked = `${decryptedValue.slice(0, 2)}XX-XXXX-${decryptedValue.slice(-4)}`;
            return { type: p.piiType, value: masked };
          }
        } catch (error) {
          return {
            type: p.piiType,
            value:
              isAdmin || isOwner
                ? `[Encrypted Data - ${p.piiHash.slice(0, 8)}...]`
                : "******",
          };
        }
      })
    );

    const result = {
      id: kyc.id,
      profile: {
        name: `${kycWithRelations?.firstName || ""} ${kycWithRelations?.lastName || ""}`.trim(),
        userId: kyc.userId,
        gender: kyc.gender || null,
        dob: kyc.dob || null,
        fatherName: kyc.fatherName || "-",
        email: kyc.user.email || "-",
        phone: kyc.user.phoneNumber || "-",
      },
      parent: {
        username: kyc.user.parent?.username || "N/A",
        name: kyc.user.parent
          ? `${kyc.user.parent.firstName} ${kyc.user.parent.lastName}`
          : "N/A",
        hierarchyLevel: kyc.user.parent?.hierarchyLevel,
        hierarchyPath: kyc.user.parent?.hierarchyPath || "N/A",
        email: kyc.user.parent?.email || "N/A",
        phone: kyc.user.parent?.phoneNumber || "N/A",
      },
      documents: pii,
      location: {
        id: kycWithRelations.address?.id || null,
        city: kycWithRelations.address?.city?.cityName || "-",
        state: kycWithRelations.address?.state?.stateName || "-",
        address: kycWithRelations.address?.address || "-",
        pinCode: kycWithRelations.address?.pinCode || "-",
      },
      status: kyc.status,
      files: {
        photo: kyc.photo,
        panFile: kyc.panFile,
        aadhaarFile: kyc.aadhaarFile,
        addressProofFile: kyc.addressProofFile,
      },
      rejectReason: kyc.kycRejectionReason || null,
      createdAt: kyc.createdAt,
      updatedAt: kyc.updatedAt,
    };

    return result;
  }

  static async storeUserKyc(payload, req = null, res = null) {
    let currentUserId = req.user.id;
    try {
      const userExists = await Prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!userExists) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "USER_NOT_FOUND",
            roleName: req.user.role,
            targetUserId: payload.userId,
            createdBy: currentUserId,
          },
        });
        throw ApiError.notFound("User not found");
      }

      const existingKyc = await Prisma.userKyc.findFirst({
        where: { userId: payload.userId },
      });

      if (existingKyc) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          entityId: existingKyc.id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "KYC_ALREADY_EXISTS",
            targetUserId: payload.userId,
            roleName: req.user.role,
            existingKycId: existingKyc.id,
            createdBy: currentUserId,
          },
        });
        throw ApiError.conflict("KYC already exists for this user");
      }

      const addressExists = await Prisma.address.findUnique({
        where: { id: payload.addressId },
        select: { id: true },
      });

      if (!addressExists) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "ADDRESS_NOT_FOUND",
            roleName: req.user.role,
            addressId: payload.addressId,
            createdBy: currentUserId,
          },
        });
        throw ApiError.notFound("Address not found");
      }

      const panUrl = await S3Service.upload(payload.panFile.path, "user-kyc");
      const photoUrl = await S3Service.upload(payload.photo.path, "user-kyc");
      const aadhaarUrl = await S3Service.upload(
        payload.aadhaarFile.path,
        "user-kyc"
      );
      const addressProofUrl = await S3Service.upload(
        payload.addressProofFile.path,
        "user-kyc"
      );

      if (!panUrl || !photoUrl || !aadhaarUrl || !addressProofUrl) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "FILE_UPLOAD_FAILED",
            panUploaded: !!panUrl,
            photoUploaded: !!photoUrl,
            aadhaarUploaded: !!aadhaarUrl,
            roleName: req.user.role,
            addressProofUploaded: !!addressProofUrl,
            createdBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to upload one or more KYC documents");
      }

      const createdKyc = await Prisma.userKyc.create({
        data: {
          userId: payload.userId,
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          fatherName: payload.fatherName.trim(),
          dob: new Date(payload.dob),
          gender: payload.gender,
          addressId: addressExists.id,
          panFile: panUrl,
          aadhaarFile: aadhaarUrl,
          addressProofFile: addressProofUrl,
          photo: photoUrl,
        },
      });

      if (!createdKyc) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "DATABASE_CREATION_FAILED",
            roleName: req.user.role,
            createdBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to create user kyc");
      }

      await Prisma.piiConsent.deleteMany({
        where: {
          userId: payload.userId,
          scope: "KYC_VERIFICATION",
        },
      });

      const createdPii = await Prisma.piiConsent.createMany({
        data: [
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            piiType: "PAN",
            piiHash: CryptoService.encrypt(payload.panNumber.toUpperCase()),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            scope: "KYC_VERIFICATION",
          },
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            piiType: "AADHAAR",
            piiHash: CryptoService.encrypt(payload.aadhaarNumber),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            scope: "KYC_VERIFICATION",
          },
        ],
      });

      if (!createdPii) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          entityId: createdKyc.id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "PII_CREATION_FAILED",
            roleName: req.user.role,
            createdBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to create user kyc Pii");
      }

      // Audit log for successful KYC creation
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_CREATED",
        entityType: "KYC",
        entityId: createdKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          targetUserId: payload.userId,
          userEmail: userExists.email,
          roleName: req.user.role,
          piiTypes: ["PAN", "AADHAAR"],
          createdBy: currentUserId,
        },
      });

      return {
        ...createdKyc,
        gender: createdKyc.gender,
        kycRejectionReason: createdKyc.kycRejectionReason ?? "",
      };
    } catch (error) {
      throw ApiError.internal("storeUserKyc failed:", error.message);
    } finally {
      const allFiles = [
        payload.panFile?.path,
        payload.photo?.path,
        payload.aadhaarFile?.path,
        payload.addressProofFile?.path,
      ].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath);
      }
    }
  }

  static async updateUserKyc(id, payload, req = null, res = null) {
    let currentUserId = req.user.id;
    try {
      const existingKyc = await Prisma.userKyc.findUnique({
        where: { id: id },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!existingKyc) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_UPDATE_FAILED",
          entityType: "KYC",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "KYC_NOT_FOUND",
            roleName: req.user.role,
            updatedBy: currentUserId,
          },
        });
        throw ApiError.notFound("KYC not found");
      }

      if (payload.userId && existingKyc.userId !== payload.userId) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_UPDATE_FAILED",
          entityType: "KYC",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "UNAUTHORIZED_ACCESS",
            kycUserId: existingKyc.userId,
            requestingUserId: payload.userId,
            roleName: req.user.role,
            updatedBy: currentUserId,
          },
        });
        throw ApiError.forbidden(
          "Access denied - you can only update your own KYC"
        );
      }

      const updates = {};
      const updatedFields = [];

      if (payload.firstName) {
        updates.firstName = payload.firstName.trim();
        updatedFields.push("firstName");
      }
      if (payload.lastName) {
        updates.lastName = payload.lastName.trim();
        updatedFields.push("lastName");
      }
      if (payload.fatherName) {
        updates.fatherName = payload.fatherName.trim();
        updatedFields.push("fatherName");
      }
      if (payload.gender) {
        updates.gender = payload.gender;
        updatedFields.push("gender");
      }
      if (payload.dob) {
        updates.dob = new Date(payload.dob);
        updatedFields.push("dob");
      }

      if (existingKyc.status === "REJECT") {
        updates.status = "PENDING";
        updates.kycRejectionReason = null;
        updatedFields.push("status", "kycRejectionReason");
      } else {
        if (payload.status) {
          updates.status = payload.status;
          updatedFields.push("status");
        }
        if (payload.kycRejectionReason !== undefined) {
          updates.kycRejectionReason = payload.kycRejectionReason;
          updatedFields.push("kycRejectionReason");
        }
      }

      const uploadTasks = [];
      const fileFields = [
        ["panFile", "panFile"],
        ["photo", "photo"],
        ["aadhaarFile", "aadhaarFile"],
        ["addressProofFile", "addressProofFile"],
      ];

      for (const [fileField, dbField] of fileFields) {
        const file = payload[fileField];
        if (file && typeof file === "object" && "path" in file) {
          uploadTasks.push(
            (async () => {
              const newUrl = await S3Service.upload(file.path, "user-kyc");
              if (newUrl) {
                const oldUrl = existingKyc[dbField];
                if (oldUrl) {
                  await S3Service.delete({ fileUrl: oldUrl });
                }
                updates[dbField] = newUrl;
                updatedFields.push(dbField);
              }
              return newUrl;
            })()
          );
        }
      }

      if (uploadTasks.length > 0) await Promise.all(uploadTasks);

      updates.updatedAt = new Date();

      const updatedKyc = await Prisma.userKyc.update({
        where: { id },
        data: updates,
      });

      if (!updatedKyc) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_UPDATE_FAILED",
          entityType: "KYC",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "DATABASE_UPDATE_FAILED",
            roleName: req.user.role,
            updatedBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to update user kyc");
      }

      // Audit log for successful KYC update
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_UPDATED",
        entityType: "KYC",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          updatedFields: updatedFields,
          previousStatus: existingKyc.status,
          newStatus: updatedKyc.status,
          roleName: req.user.role,
          userEmail: existingKyc.user.email,
          updatedBy: currentUserId,
        },
      });

      return {
        ...updatedKyc,
        gender: updatedKyc.gender,
        kycRejectionReason: updatedKyc.kycRejectionReason ?? "",
      };
    } catch (error) {
      console.error("updateUserKyc failed:", error);
      throw error;
    } finally {
      const allFiles = [
        payload.panFile?.path,
        payload.photo?.path,
        payload.aadhaarFile?.path,
        payload.addressProofFile?.path,
      ].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath);
      }
    }
  }

  static async verifyUserKyc(payload, req = null, res = null) {
    let currentUserId = req.user.id;

    const existingKyc = await Prisma.userKyc.findFirst({
      where: { id: payload.id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingKyc) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: payload.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "KYC_NOT_FOUND",
          roleName: req.user.role,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.notFound("KYC not found");
    }

    const enumStatus = payload.status;

    if (!enumStatus) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: existingKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "INVALID_STATUS",
          providedStatus: payload.status,
          roleName: req.user.role,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.badRequest("Invalid status value");
    }

    if (enumStatus === "REJECT" && !payload.kycRejectionReason) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: existingKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "MISSING_REJECTION_REASON",
          roleName: req.user.role,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.badRequest(
        "Rejection reason is required when status is REJECTED"
      );
    }

    const updateVerify = await Prisma.userKyc.update({
      where: { id: existingKyc.id },
      data: {
        status: { set: enumStatus },
        ...(enumStatus === "REJECT"
          ? { kycRejectionReason: payload.kycRejectionReason || null }
          : { kycRejectionReason: null }),
      },
    });

    if (!updateVerify) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: existingKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "DATABASE_UPDATE_FAILED",
          roleName: req.user.role,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.internal("Failed to verify user KYC");
    }

    const updatedUser = await Prisma.user.update({
      where: { id: existingKyc.userId },
      data: {
        ...(enumStatus === "VERIFIED"
          ? { isKycVerified: true }
          : { isKycVerified: false }),
      },
    });

    if (!updatedUser) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: existingKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "USER_UPDATE_FAILED",
          roleName: req.user.role,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.internal("Failed to update user KYC status");
    }

    // Audit log for successful KYC verification
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: `KYC_${enumStatus}`,
      entityType: "KYC",
      entityId: existingKyc.id,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req ? Helper.generateCommonMetadata(req, res) : {}),
        previousStatus: existingKyc.status,
        newStatus: enumStatus,
        roleName: req.user.role,
        rejectionReason: payload.kycRejectionReason || null,
        userEmail: existingKyc.user.email,
        verifiedBy: currentUserId,
      },
    });

    return {
      ...updateVerify,
      gender: updateVerify.gender,
      kycRejectionReason: updateVerify.kycRejectionReason ?? "",
    };
  }
}

export default KycServices;
