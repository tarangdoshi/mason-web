export const complianceLibrary = {
  medicalDisclaimer:
    "Mason Company bathroom safety upgrades are preventive support measures. They are not a substitute for diagnosis, treatment, or personalized medical advice.",
  outcomeDisclaimer:
    "Safety outcomes vary by individual mobility, existing conditions, and home layout. No incident-free outcome can be guaranteed.",
  doctorAttestationUse:
    "Doctor attestations are educational and should be presented as professional observations, not treatment directives.",
  testimonialUse:
    "Testimonials represent individual experiences and should not be presented as guaranteed results.",
  paymentClarity:
    "Always state final payable amount, payment mode selected, and accepted collection methods (Cash/UPI/POS) before installation.",
  otpClarity:
    "OTP must be shared only with the verified household member at arrival and completion checkpoints.",
  grievanceClarity:
    "Every grievance response must include ticket reference and expected next update timeline."
} as const;

export const mandatoryComplianceNotes: string[] = [
  complianceLibrary.medicalDisclaimer,
  complianceLibrary.outcomeDisclaimer,
  complianceLibrary.paymentClarity,
  complianceLibrary.otpClarity
];
