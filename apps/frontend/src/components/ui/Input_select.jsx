import {
  Linkedin,
  Mail,
  Code,
  Sparkles,
  Cpu,
  Instagram,
  Twitter,
} from "lucide-react";
import { useEffect, useState } from "react";

export const InputSelect = () => {
  const [showPortfolio, setShowPortfolio] = useState(false);
  useEffect(() => {
    let cheatBuffer = "";
    const CHEAT_CODE = "IDDQD";
    let cheatTimeout;

    const handleKeyPress = (event) => {
      // Only allow alphanumeric keys for the cheat code
      if (/^[a-zA-Z0-9]$/.test(event.key)) {
        cheatBuffer += event.key.toUpperCase();

        // Keep buffer from growing too long
        if (cheatBuffer.length > CHEAT_CODE.length) {
          cheatBuffer = cheatBuffer.slice(-CHEAT_CODE.length);
        }

        // Check for cheat code match
        if (cheatBuffer === CHEAT_CODE) {
          setShowPortfolio((prev) => !prev); // toggle portfolio
          cheatBuffer = ""; // reset
        }

        // Reset cheat buffer after 2 seconds of no typing
        clearTimeout(cheatTimeout);
        cheatTimeout = setTimeout(() => {
          cheatBuffer = "";
        }, 2000);
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      clearTimeout(cheatTimeout);
    };
  }, []);

  if (!showPortfolio) return null;

  const developers = [
    {
      name: "ARBAZ KHAN",
      role: "Full Stack Developer",
      phone: "+91-9649730196",
      email: "arbazkayamkhani.dev@gmail.com",
      location: "Jaipur, India",
      bio: "Arbaz completely transformed how we build and present digital products. His engineering work didn't just perform great — it elevated the quality of everything we shipped.",
      img: "https://media.licdn.com/dms/image/v2/D4D03AQEWW3xeVcv51g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1731823810388?e=1764806400&v=beta&t=6j8tgSlpJGDNYEI_r4LIlKx6zpq5eQuR24ujz9aOG6I",
      linkedin: "https://www.linkedin.com/in/arbazkayamkhani",
      instagram: "https://www.instagram.com/its_arbaz____",
      twitter: "https://twitter.com/arbazkyamkhani",
    },
    {
      name: "SAMIR KHAN",
      role: "Full Stack Developer",
      email: "samirkayamkhani.dev@gmail.com",
      location: "Jaipur, India",
      bio: "Samir delivered clean, scalable, and high-performance solutions. His work didn't just impress — it helped us accelerate development significantly.",
      img: "https://media.licdn.com/dms/image/v2/D4E03AQEyrKR6eqkb0A/profile-displayphoto-scale_200_200/B4EZpTKlKyKMAY-/0/1762331876074?e=1764806400&v=beta&t=yzcIlKiKzoExIrWwZzE0QfweaMIGzTZf1ErBeUEFB00",
      linkedin: "https://www.linkedin.com/in/samirkayamkhani",
      instagram: "https://www.instagram.com/its_sameer75",
      twitter: "https://twitter.com/samirkyamkhani",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Development Team
              </h2>
              <p className="text-gray-500 text-sm">
                Crafting digital excellence since 2023
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPortfolio(false)}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center p-12 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full border border-gray-200 shadow-sm mb-6">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700 font-medium">
              Meet Our Developers
            </span>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            We Build
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Digital Future
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Passionate full-stack developers transforming ideas into scalable,
            high-performance digital solutions that make an impact.
          </p>
        </div>

        {/* Testimonial-Style Developer Cards */}
        <div className="p-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {developers.map((dev, idx) => (
              <div
                key={idx}
                className="bg-[#F7F6F4] rounded-3xl p-10 shadow-sm border border-gray-200 hover:shadow-md transition-all"
              >
                {/* Testimonial Text */}
                <p className="text-gray-800 text-lg leading-relaxed">
                  {dev.bio.replace("—", "")}{" "}
                  <span className="text-orange-600 font-semibold">
                    helping us achieve outstanding results.
                  </span>
                </p>

                {/* Profile Footer */}
                <div className="flex items-center gap-4 mt-8">
                  <img
                    src={dev.img}
                    alt={dev.name}
                    className="w-14 h-14 rounded-full object-cover shadow"
                  />
                  <div>
                    <h3 className="text-gray-900 font-bold text-lg">
                      {dev.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{dev.role}</p>
                  </div>
                </div>

                {/* Contact + Social */}
                <div className="mt-4 flex gap-6">
                  <a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2 items-center text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                    LinkedIn
                  </a>
                  <a
                    href={dev.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2 items-center text-gray-700 hover:text-pink-600 transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                    Instagram
                  </a>
                  <a
                    href={dev.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2 items-center text-gray-700 hover:text-blue-400 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                    Twitter
                  </a>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${dev.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2 items-center text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Code className="w-5 h-5" />
              <span className="font-medium">Built with passion • v2.5</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">Press</span>
              <kbd className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-700 font-mono font-medium">
                Ctrl + Shift + D
              </kbd>
              <span className="text-gray-500">to toggle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
