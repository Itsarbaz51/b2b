export default class SurchargeEngine {
  static async calculate({ baseAmount, rule }) {
    let surcharge = 0;

    if (rule.type === "PERCENTAGE") {
      surcharge = (baseAmount * Number(rule.value)) / 100;
    } else {
      surcharge = Number(rule.value);
    }

    let gst = 0;

    if (rule.applyGST && rule.gstPercent) {
      gst = (surcharge * Number(rule.gstPercent)) / 100;
    }

    return {
      surcharge,
      gst,
      total: surcharge + gst,
    };
  }
}
