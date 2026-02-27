import React, { useState } from "react";
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Users,
  Database,
  Bell,
  Globe,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Mail,
} from "lucide-react";

const sections = [
  {
    id: 1,
    icon: <FileText className="w-6 h-6 text-indigo-600" />,
    title: "Information We Collect",
    content: [
      {
        subtitle: "Personal Information",
        text: "We collect personal information that you provide to us including name, email address, phone number, date of birth, PAN number, Aadhaar details, and banking information necessary for credit card payout processing.",
      },
      {
        subtitle: "Transaction Information",
        text: "We collect details about the transactions you make through our service, including credit card details, payout amounts, transaction history, and merchant information.",
      },
      {
        subtitle: "Device & Usage Information",
        text: "We automatically collect information about your device, IP address, browser type, operating system, and how you interact with our services through cookies and similar technologies.",
      },
    ],
  },
  {
    id: 2,
    icon: <Database className="w-6 h-6 text-purple-600" />,
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Service Delivery",
        text: "We use your information to process credit card payouts, manage your account, and provide customer support.",
      },
      {
        subtitle: "Security & Fraud Prevention",
        text: "To protect your account and prevent fraudulent activities, we use your information to verify your identity, monitor suspicious activities, and ensure compliance with financial regulations.",
      },
      {
        subtitle: "Improvement & Analytics",
        text: "We analyze usage patterns to improve our services, develop new features, and enhance user experience. This includes performance monitoring and bug fixing.",
      },
      {
        subtitle: "Communication",
        text: "We use your contact information to send transaction confirmations, account updates, promotional offers, and important service announcements.",
      },
    ],
  },
  {
    id: 3,
    icon: <Users className="w-6 h-6 text-pink-600" />,
    title: "Information Sharing & Disclosure",
    content: [
      {
        subtitle: "With Your Consent",
        text: "We share your information when you explicitly give us permission to do so.",
      },
      {
        subtitle: "Service Providers",
        text: "We share necessary information with third-party service providers who help us operate our business, including payment processors, banks, KYC verification services, and cloud hosting providers.",
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose your information to comply with laws, regulations, court orders, or governmental requests. This includes cooperation with law enforcement and regulatory authorities.",
      },
      {
        subtitle: "Business Transfers",
        text: "In case of merger, acquisition, or sale of assets, your information may be transferred to the new entity, subject to the same privacy protections.",
      },
    ],
  },
  {
    id: 4,
    icon: <Lock className="w-6 h-6 text-blue-600" />,
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        text: "We protect all sensitive data with 256-bit SSL encryption. All credit card information is encrypted during transmission and storage.",
      },
      {
        subtitle: "Access Controls",
        text: "We implement strict access controls and only authorized personnel can access your personal information on a need-to-know basis.",
      },
      {
        subtitle: "Regular Audits",
        text: "We conduct regular security audits, penetration testing, and vulnerability assessments to ensure the highest level of data protection.",
      },
      {
        subtitle: "PCI DSS Compliance",
        text: "We are PCI DSS Level 1 compliant, meeting the highest security standards for processing credit card information.",
      },
    ],
  },
  {
    id: 5,
    icon: <Eye className="w-6 h-6 text-green-600" />,
    title: "Your Rights & Choices",
    content: [
      {
        subtitle: "Access & Correction",
        text: "You have the right to access, update, or correct your personal information at any time through your account settings or by contacting us.",
      },
      {
        subtitle: "Data Portability",
        text: "You can request a copy of your personal data in a structured, machine-readable format.",
      },
      {
        subtitle: "Deletion",
        text: "You can request deletion of your account and personal information, subject to legal retention requirements for financial records.",
      },
      {
        subtitle: "Marketing Opt-out",
        text: "You can opt-out of promotional emails and notifications, but important service-related communications will still be delivered.",
      },
      {
        subtitle: "Cookie Management",
        text: "You can control cookie preferences through your browser settings, though this may affect functionality of our services.",
      },
    ],
  },
  {
    id: 6,
    icon: <Globe className="w-6 h-6 text-yellow-600" />,
    title: "Data Retention & International Transfers",
    content: [
      {
        subtitle: "Retention Period",
        text: "We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Transaction records are kept for 7 years as per RBI guidelines.",
      },
      {
        subtitle: "International Transfers",
        text: "Your data may be transferred to and processed in countries outside India. We ensure appropriate safeguards are in place through standard contractual clauses and adequate data protection measures.",
      },
    ],
  },
  {
    id: 7,
    icon: <Bell className="w-6 h-6 text-red-600" />,
    title: "Cookies & Tracking Technologies",
    content: [
      {
        subtitle: "Types of Cookies",
        text: "We use essential cookies for functionality, analytics cookies to understand usage patterns, and marketing cookies for targeted advertising.",
      },
      {
        subtitle: "Third-party Cookies",
        text: "We may allow third-party analytics and advertising partners to place cookies on our website. You can opt-out through your browser settings.",
      },
    ],
  },
];

const quickLinks = [
  { name: "Information Collection", id: 1 },
  { name: "Data Usage", id: 2 },
  { name: "Information Sharing", id: 3 },
  { name: "Security Measures", id: 4 },
  { name: "Your Rights", id: 5 },
  { name: "Data Retention", id: 6 },
  { name: "Cookies Policy", id: 7 },
];

function PrivacyPolicy() {
  const [expandedSections, setExpandedSections] = useState([1]);

  const toggleSection = (id) => {
    setExpandedSections((prev) =>
      prev.includes(id)
        ? prev.filter((sectionId) => sectionId !== id)
        : [...prev, id]
    );
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!expandedSections.includes(id)) {
        setExpandedSections((prev) => [...prev, id]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Shield className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-4">
            Your privacy is our priority
          </p>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Last Updated: January 25, 2025
          </p>
        </div>
      </section>

      {/* Quick Info Banner */}
      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <Lock className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Bank-Grade Security
                </p>
                <p className="text-sm text-gray-600">256-bit encryption</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">PCI DSS Compliant</p>
                <p className="text-sm text-gray-600">Level 1 certified</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <CheckCircle className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  Your Data, Your Control
                </p>
                <p className="text-sm text-gray-600">Full transparency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 sticky top-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                  Quick Navigation
                </h3>
                <nav className="space-y-2">
                  {quickLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="block w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition text-sm"
                    >
                      {link.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {/* Introduction */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Monks Pay Privacy Policy
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Monks Pay ("we," "us," or "our") takes your privacy seriously.
                  This Privacy Policy explains how we collect, use, share, and
                  protect your personal information when you use our credit card
                  payout services.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  By using Monks Pay services, you agree to the collection and
                  use of information in accordance with this policy.
                </p>
                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded">
                  <p className="text-sm text-indigo-900">
                    <strong>Important:</strong> Please read this policy
                    carefully. If you do not agree with any terms, please do not
                    use our services.
                  </p>
                </div>
              </div>

              {/* Expandable Sections */}
              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    id={`section-${section.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-6"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {section.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-left">
                          {section.title}
                        </h3>
                      </div>
                      {expandedSections.includes(section.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    {expandedSections.includes(section.id) && (
                      <div className="px-6 pb-6 space-y-6">
                        {section.content.map((item, idx) => (
                          <div key={idx}>
                            <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                              {item.subtitle}
                            </h4>
                            <p className="text-gray-700 leading-relaxed">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Additional Sections */}
              <div className="mt-8 space-y-8">
                {/* Children's Privacy */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Children's Privacy
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Our services are not directed at individuals under the age
                    of 18. We do not knowingly collect personal information from
                    children under 18. If you are a parent or guardian and
                    discover your child has provided us with personal data,
                    please contact us.
                  </p>
                </div>

                {/* Changes to Policy */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Changes to This Privacy Policy
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We may update our Privacy Policy from time to time. Any
                    changes will be posted on this page, and we may notify you
                    via email or through a prominent notice on our services.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    We recommend reviewing this Privacy Policy periodically.
                    Changes become effective once posted on this page.
                  </p>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Contact Us About Privacy
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    If you have any questions or concerns about this Privacy
                    Policy, please contact us:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-indigo-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Email</p>
                        <p className="text-gray-700">privacy@monkspay.com</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-indigo-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Data Protection Officer
                        </p>
                        <p className="text-gray-700">dpo@monkspay.com</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Globe className="w-5 h-5 text-indigo-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Address</p>
                        <p className="text-gray-700">
                          123 Business Tower, Jaipur, Rajasthan 302001, India
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Your Trust, Our Responsibility
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Your privacy and security are our top priorities. Choose Monks Pay
            for safe and secure payments.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg">
              Start Using Monks Pay
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-indigo-600 transition">
              Contact Support
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PrivacyPolicy;
