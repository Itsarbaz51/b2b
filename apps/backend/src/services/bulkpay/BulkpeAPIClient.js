import axios from "axios";
import FormData from "form-data";
import { ApiError } from "../../utils/ApiError.js";

export class BulkpeAPIClient {
   constructor() {
    this.baseURL = "https://api.bulkpe.in/client/cc";
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = process.env.BULKPE_API_TOKEN;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw ApiError.badRequest(
            error.response.data?.message || "Bulkpe API error",
            error.response.status,
            error.response.data?.errors
          );
        } else if (error.request) {
          throw ApiError.internal("Bulkpe API unavailable");
        } else {
          throw ApiError.internal("Internal server error");
        }
      }
    );
  }

  async createSender(
    payload
  ) {
    const response = await this.client.post("/createSender", payload);

    if (!response.data.status) {
      throw ApiError.internal(
        response.data.message || "Failed to create sender"
      );
    }

    return response.data.data;
  }

  async uploadCardImage(
    senderId,
    cardImageType,
    file
  ) {
    const formData = new FormData();
    formData.append("senderId", senderId);
    formData.append("cardImageType", cardImageType);
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await this.client.post("/uploadCreditcard", formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if (!response.data.status) {
      throw ApiError.badRequest(
        response.data.message || "Failed to upload card image"
      );
    }

    return response.data.data;
  }

  async listSenders(query) {
    const response = await this.client.post("/listSenders", query);

    if (!response.data.status) {
      throw ApiError.badRequest(
        response.data.message || "Failed to list senders"
      );
    }

    return response.data;
  }

  async createBeneficiary(
    payload
  ) {
    const response = await this.client.post("/createBeneficiary", payload);

    if (!response.data.status) {
      throw ApiError.badRequest(
        response.data.message || "Failed to create beneficiary"
      );
    }

    return response.data.data;
  }

  async listBeneficiaries(query) {
    const response = await this.client.post("/listBeneficiary", query);

    if (!response.data.status) {
      throw ApiError.badRequest(
        response.data.message || "Failed to list beneficiaries"
      );
    }

    return response.data;
  }

  async createCollection(
    payload
  ) {
    const response = await this.client.post(
      "/createCardCollectionUrl",
      payload
    );

    if (!response.data.status) {
      throw ApiError.badRequest(
        response.data.message || "Failed to create collection"
      );
    }

    return response.data.data;
  }

  async listCollections(query) {
    const response = await this.client.post("/listCardCollection", query);

    if (!response.data.status) {
      throw ApiError.badRequest(
        response.data.message || "Failed to list collections"
      );
    }

    return response.data;
  }
}
