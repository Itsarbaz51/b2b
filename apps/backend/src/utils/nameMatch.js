export default class NameMatch {
  static normalize(name) {
    return name
      .toUpperCase()
      .replace(/[^A-Z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  static isMatch(panName, aadhaarName) {
    const pan = this.normalize(panName);
    const aadhaar = this.normalize(aadhaarName);

    return pan === aadhaar;
  }
}
