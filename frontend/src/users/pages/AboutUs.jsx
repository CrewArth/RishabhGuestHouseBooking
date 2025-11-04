import React from 'react';

const AboutUs = () => {
  const stats = [
    { value: '25+', label: 'Years of Excellence' },
    { value: '800+', label: 'Professionals' },
    { value: '1400+', label: 'Solutions Delivered' },
    { value: '25+', label: 'Countries Served' }
  ];

  const locations = [
    { region: 'India', offices: ['Vadodara (HQ)', 'Ahmedabad', 'Pune', 'Hyderabad', 'Bengaluru'] },
    { region: 'International', offices: ['United States', 'United Kingdom', 'Australia'] }
  ];

  const businessAreas = [
    { name: 'Engineering', icon: '⚙️' },
    { name: 'IT Solutions', icon: '💻' },
    { name: 'Education', icon: '🎓' },
    { name: 'BPO', icon: '📞' },
    { name: 'Innovation & Technology', icon: '🚀' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">About Rishabh Software</h1>
          <p className="text-xl text-blue-100">Empowering Businesses Through Innovation Since 2000</p>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Our Story</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Established in <span className="font-semibold text-blue-600">2000</span> by <span className="font-semibold">Mr. Raju Shah</span>, 
              Rishabh Software began with a vision to deliver exceptional values to our global clients.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              For over 25 years, we've helped businesses across 25+ countries build agile, customer-centric 
              foundations with a focus on trust, transparency, and long-term value.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Today, with a workforce of 800+ professionals across 8 locations, we have successfully delivered 
              1400+ solutions, establishing ourselves as a trusted technology partner worldwide.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-8">
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business Areas */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Our Business Areas</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {businessAreas.map((area, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-blue-600 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl mb-3">{area.icon}</div>
                <div className="text-gray-800 font-semibold">{area.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Presence */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Global Presence</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {locations.map((loc, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-8 shadow-md">
                <h3 className="text-2xl font-bold text-blue-600 mb-4">{loc.region}</h3>
                <ul className="space-y-2">
                  {loc.offices.map((office, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                      {office}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white text-center">
          <h2 className="text-4xl font-bold mb-6">WE CARE</h2>
          <p className="text-xl leading-relaxed max-w-4xl mx-auto">
            At Rishabh Software, we are committed to empowering our clients to achieve their goals and 
            unlock new growth opportunities. Through innovative technology solutions and a customer-first 
            approach, we help you reimagine your business through a digital lens.
          </p>
        </div>

        {/* Values */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🤝</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Trust</h3>
            <p className="text-gray-600">Building lasting relationships through reliability and integrity</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👁️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Transparency</h3>
            <p className="text-gray-600">Clear communication and honest collaboration at every step</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📈</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Long-term Value</h3>
            <p className="text-gray-600">Creating sustainable solutions that drive continuous growth</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;