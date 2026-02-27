import {
  CreditCard,
  Shield,
  Zap,
  Users,
  Globe,
  Award,
  TrendingUp,
  CheckCircle,
  Target,
  Heart,
  Lightbulb,
} from "lucide-react";

const stats = [
  { value: "500+", label: "Happy Customers" },
  { value: "₹1000+", label: "Payouts Processed" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support Available" },
];

const services = [
  {
    icon: <CreditCard className="w-8 h-8 text-indigo-600" />,
    title: "Credit Card Payouts",
    desc: "Instant payouts directly to credit cards with zero hassle and maximum security.",
  },
  {
    icon: <Zap className="w-8 h-8 text-purple-600" />,
    title: "Lightning Fast",
    desc: "Process transactions in seconds, not days. Get your money when you need it.",
  },
  {
    icon: <Shield className="w-8 h-8 text-blue-600" />,
    title: "Bank-Level Security",
    desc: "256-bit encryption and PCI DSS compliance to keep your data safe.",
  },
  {
    icon: <Globe className="w-8 h-8 text-pink-600" />,
    title: "Global Reach",
    desc: "Send payouts to credit cards across 150+ countries seamlessly.",
  },
];

const values = [
  {
    icon: <Target className="w-12 h-12 text-indigo-600" />,
    title: "Mission",
    desc: "To revolutionize digital payments by providing the fastest and most secure credit card payout service in India.",
    bg: "bg-indigo-50",
  },
  {
    icon: <Heart className="w-12 h-12 text-pink-600" />,
    title: "Values",
    desc: "Trust, transparency, and customer satisfaction are at the core of everything we do.",
    bg: "bg-pink-50",
  },
  {
    icon: <Lightbulb className="w-12 h-12 text-purple-600" />,
    title: "Innovation",
    desc: "Continuously pushing boundaries to deliver cutting-edge payment solutions for modern businesses.",
    bg: "bg-purple-50",
  },
];

const timeline = [
  {
    year: "2020",
    title: "Founded",
    desc: "Started with a vision to simplify credit card payouts in India.",
  },
  {
    year: "2021",
    title: "First 10K Users",
    desc: "Achieved our first major milestone with 10,000 satisfied customers.",
  },
  {
    year: "2022",
    title: "Series A Funding",
    desc: "Raised ₹50 crores to expand our services nationwide.",
  },
  {
    year: "2023",
    title: "500K+ Customers",
    desc: "Became India's leading credit card payout service provider.",
  },
  {
    year: "2024",
    title: "Global Expansion",
    desc: "Expanded services to 150+ countries worldwide.",
  },
];

const features = [
  "Instant credit card payouts",
  "No hidden charges",
  "24/7 customer support",
  "Automated reconciliation",
];

function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              India's Most Trusted <br />
              <span className="text-yellow-300">
                Credit Card Payout Service
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              We offer instant payouts to your credit card — fast, secure, and
              completely hassle-free.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg">
                Get Started
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-indigo-600 transition">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-4">
                About Mahi Pay
              </p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Direct Payout to Credit Card — In Just 5 Minutes
              </h2>
              <p className="text-gray-600 mb-4 text-lg leading-relaxed">
                Mahi Pay is India’s most trusted credit card payout service. We
                enable instant credit card payouts for businesses and
                individuals without any hassle.
              </p>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Whether you’re a freelancer, business owner, or anyone looking
                for fast and secure payouts — we’re here for you. Our advanced
                technology and dedicated support team ensure every transaction
                is smooth and reliable.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
                  alt="Credit Card"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">98%</div>
                    <div className="text-sm text-gray-500">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-4">
              Our Services
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Mahi Pay?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We don’t just provide payout services — we help your business
              grow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, idx) => (
              <div
                key={idx}
                className={`${value.bg} p-8 rounded-2xl text-center hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-700">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-4">
              Our Journey
            </p>
            <h2 className="text-4xl font-bold text-gray-900">
              Our Growth Story
            </h2>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-indigo-200"></div>

            <div className="space-y-12">
              {timeline.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center ${
                    idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  } gap-8`}
                >
                  <div className="flex-1 text-right md:text-left">
                    {idx % 2 === 0 && (
                      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
                        <div className="text-2xl font-bold text-indigo-600 mb-2">
                          {item.year}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    )}
                  </div>

                  <div className="hidden md:flex w-12 h-12 bg-indigo-600 rounded-full items-center justify-center z-10 flex-shrink-0">
                    <Award className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    {idx % 2 !== 0 && (
                      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
                        <div className="text-2xl font-bold text-indigo-600 mb-2">
                          {item.year}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-4">
            Our Team
          </p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Meet The Experts Behind Mahi Pay
          </h2>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            A passionate team of fintech experts, developers, and customer
            success managers dedicated to your success.
          </p>

          <div className="flex items-center justify-center space-x-4 text-gray-600">
            <Users className="w-8 h-8 text-indigo-600" />
            <span className="text-xl">
              <span className="font-bold text-indigo-600">150+</span> Team
              members working to serve you better.
            </span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Start Instant Credit Card Payouts Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 500K+ happy customers already using Mahi Pay for fast and
            secure payouts.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg text-lg">
              Sign Up Now
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-indigo-600 transition text-lg">
              Contact Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
