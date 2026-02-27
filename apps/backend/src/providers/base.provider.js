export default class BaseProvider {
  async verifyAadhaar() {
    throw new Error("verifyAadhaar not implemented");
  }

  async verifyPan() {
    throw new Error("verifyPan not implemented");
  }
}
