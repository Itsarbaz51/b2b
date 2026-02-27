const ZodErrorCatch = (error) => {
  const apiMessage = error.response?.data?.message || "Something went wrong";
  const fieldErrors = error.response?.data?.errors || [];

  // Agar koi field-level error ho to unka message join kar lo
  const fieldMessages = fieldErrors.map((err) => err.message).join(", ");

  // Dono combine karke final error bana lo
  const finalError = fieldMessages ? ` ${fieldMessages}` : apiMessage;

  return finalError;
};

export default ZodErrorCatch;
