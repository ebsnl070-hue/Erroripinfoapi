const axios = require('axios');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: '❌ Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  try {
    // Get IP from query parameter or use requester's IP
    let ip = req.query.ip;
    
    if (!ip) {
      // Get client IP from headers
      ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           '8.8.8.8'; // Default to Google DNS
      
      // Clean up the IP (remove port if present)
      ip = ip.split(',')[0].trim();
      ip = ip.replace(/::ffff:/, '');
    }

    // Validate IP format
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({ 
        error: '❌ Invalid IP address format',
        tip: 'Please provide a valid IPv4 address like 8.8.8.8',
        example: 'https://your-api.vercel.app/api/ipinfo?ip=8.8.8.8'
      });
    }

    console.log(`🔍 Fetching info for IP: ${ip}`);

    // Get IP information from free API
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    const ipData = response.data;

    if (ipData.status !== 'success') {
      return res.status(400).json({
        error: '❌ Failed to fetch IP information',
        message: ipData.message || 'Unknown error'
      });
    }

    // Compile the 10-step information
    const completeInfo = {
      success: true,
      message: "🎉 IP information retrieved successfully!",
      requested_ip: ip,
      timestamp: new Date().toISOString(),
      api_version: "1.0",
      
      steps: {
        "1️⃣ 🌍 Basic IP Information": {
          ip: ip,
          status: "✅ Valid IPv4 Address",
          version: "IPv4",
          type: getIPType(ip),
          reverse_dns: ipData.reverse || "Not available",
          query_status: ipData.status
        },

        "2️⃣ 📍 Geolocation Details": {
          country: `${ipData.country} ${getCountryFlag(ipData.countryCode)}`,
          country_code: ipData.countryCode,
          region: ipData.regionName,
          city: ipData.city,
          zip_code: ipData.zip,
          coordinates: {
            latitude: ipData.lat,
            longitude: ipData.lon,
            accuracy: "City level",
            map_url: `https://maps.google.com/?q=${ipData.lat},${ipData.lon}`
          },
          continent: getContinent(ipData.countryCode)
        },

        "3️⃣ 🕒 Timezone Information": {
          timezone: ipData.timezone,
          current_time: new Date().toLocaleString("en-US", { timeZone: ipData.timezone }),
          utc_offset: ipData.offset,
          is_dst: ipData.dst ? "Yes" : "No",
          timezone_emoji: getTimezoneEmoji(ipData.timezone)
        },

        "4️⃣ 🛡️ Security Assessment": {
          threat_level: "🟡 Medium (Public IP)",
          is_private: isPrivateIP(ip) ? "✅ Yes" : "❌ No",
          is_reserved: isReservedIP(ip) ? "✅ Yes" : "❌ No",
          is_bogon: isBogonIP(ip) ? "✅ Yes" : "❌ No",
          risk_assessment: assessRisk(ip),
          recommendations: getSecurityRecommendations(ip)
        },

        "5️⃣ 🌐 Network Information": {
          asn: ipData.as || "Not available",
          organization: ipData.org || "Unknown",
          isp: ipData.isp || "Unknown",
          service_type: classifyISP(ipData.isp),
          network_range: ipData.as ? ipData.as.split(' ')[0] : "Unknown"
        },

        "6️⃣ 🏢 ISP & Organization": {
          internet_service_provider: ipData.isp,
          organization_name: ipData.org,
          autonomous_system: ipData.as,
          network_type: classifyNetwork(ip),
          mobile_carrier: isMobileCarrier(ipData.isp),
          hosting_provider: isHostingProvider(ipData.isp)
        },

        "7️⃣ 💰 Regional Info": {
          continent: getContinent(ipData.countryCode),
          languages: getLanguages(ipData.countryCode),
          currency: getCurrencyInfo(ipData.countryCode),
          calling_code: getCallingCode(ipData.countryCode),
          regional_emoji: getRegionalEmoji(ipData.countryCode)
        },

        "8️⃣ 📊 Technical Analysis": {
          ip_class: getIPType(ip),
          estimated_users: estimateUsers(ipData.as),
          network_size: classifyNetworkSize(ip),
          routing_status: "Global internet routing",
          special_notes: getSpecialNotes(ip, ipData)
        },

        "9️⃣ 🎯 Distance & Location": {
          distance_from_equator: calculateDistanceFromEquator(ipData.lat),
          hemisphere: getHemisphere(ipData.lat),
          famous_landmarks: getFamousLandmarks(ipData.country, ipData.city),
          climate_zone: getClimateZone(ipData.lat)
        },

        "🔟 💡 Fun Facts & Trivia": [
          `📍 Located in ${ipData.city}, ${ipData.country} ${getCountryFlag(ipData.countryCode)}`,
          `🌐 ISP: ${ipData.isp || 'Unknown'}`,
          `🕒 Timezone: ${ipData.timezone}`,
          `🏢 Organization: ${ipData.org || 'Not specified'}`,
          `📡 Network: ${ipData.as || 'Unknown'}`,
          "💡 IP addresses route internet traffic globally!",
          "🔒 Always protect your IP address for security",
          "🌍 This IP is in the " + getHemisphere(ipData.lat) + " hemisphere",
          getRandomFunFact(ipData)
        ]
      },

      summary: {
        location: `${ipData.city || 'Unknown'}, ${ipData.country || 'Unknown'} ${getCountryFlag(ipData.countryCode)}`,
        isp: ipData.isp || 'Unknown',
        coordinates: `${ipData.lat}, ${ipData.lon}`,
        timezone: ipData.timezone,
        security_level: assessRisk(ip),
        status: "✅ Analysis complete - 10 steps detailed"
      },

      quick_links: {
        view_on_map: `https://maps.google.com/?q=${ipData.lat},${ipData.lon}`,
        whois_lookup: `https://whois.domaintools.com/${ip}`,
        speed_test: "https://speedtest.net"
      }
    };

    res.status(200).json(completeInfo);

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: '🚨 Failed to fetch IP information',
      message: error.message,
      tip: 'Please check the IP address and try again',
      support: 'Use format: ?ip=8.8.8.8 or no parameter for your IP'
    });
  }
};

// Helper functions
function getCountryFlag(countryCode) {
  if (!countryCode) return '🏴';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    return '🏴';
  }
}

function getIPType(ip) {
  const firstOctet = parseInt(ip.split('.')[0]);
  if (firstOctet <= 127) return 'Class A 🏢 (Large networks)';
  if (firstOctet <= 191) return 'Class B 🏢 (Medium networks)';
  if (firstOctet <= 223) return 'Class C 🏠 (Small networks)';
  if (firstOctet <= 239) return 'Class D 📡 (Multicast)';
  return 'Class E 🔧 (Experimental)';
}

function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
  return parts[0] === 10 ||
         (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
         (parts[0] === 192 && parts[1] === 168);
}

function isReservedIP(ip) {
  const parts = ip.split('.').map(Number);
  return parts[0] === 0 || parts[0] >= 224;
}

function isBogonIP(ip) {
  const parts = ip.split('.').map(Number);
  return parts[0] === 127 || 
         (parts[0] === 169 && parts[1] === 254);
}

function assessRisk(ip) {
  if (isPrivateIP(ip)) return '🟢 Safe (Private Network)';
  if (isReservedIP(ip)) return '🟡 Caution (Reserved IP)';
  if (isBogonIP(ip)) return '🟡 Warning (Bogon IP)';
  return '🟡 Moderate (Public IP)';
}

function getSecurityRecommendations(ip) {
  if (isPrivateIP(ip)) return ['✅ Safe for internal networks'];
  if (isReservedIP(ip)) return ['⚠️ This IP range is reserved'];
  return ['🔒 Use firewall protection', '🛡️ Enable security monitoring', '🌐 Use VPN for privacy'];
}

function classifyISP(isp) {
  if (!isp) return 'Unknown';
  const ispLower = isp.toLowerCase();
  if (ispLower.includes('mobile') || ispLower.includes('wireless')) return '📱 Mobile Carrier';
  if (ispLower.includes('comcast') || ispLower.includes('att') || ispLower.includes('verizon')) return '🏠 Residential ISP';
  if (ispLower.includes('google') || ispLower.includes('aws') || ispLower.includes('azure')) return '☁️ Cloud Provider';
  if (ispLower.includes('host') || ispLower.includes('server')) return '🏢 Hosting Provider';
  if (ispLower.includes('education') || ispLower.includes('university')) return '🎓 Educational';
  if (ispLower.includes('government') || ispLower.includes('gov')) return '🏛️ Government';
  return '🌐 Internet Service Provider';
}

function isMobileCarrier(isp) {
  if (!isp) return 'Unknown';
  const mobileKeywords = ['mobile', 'wireless', 'cellular', 'vodafone', 't-mobile', 'verizon wireless'];
  return mobileKeywords.some(keyword => isp.toLowerCase().includes(keyword)) ? '📱 Yes' : '❌ No';
}

function isHostingProvider(isp) {
  if (!isp) return 'Unknown';
  const hostingKeywords = ['host', 'server', 'data center', 'cloud', 'amazon', 'google cloud', 'digitalocean', 'vultr'];
  return hostingKeywords.some(keyword => isp.toLowerCase().includes(keyword)) ? '🏢 Yes' : '❌ No';
}

function getContinent(countryCode) {
  const continents = {
    'US': 'North America 🇺🇸', 'CA': 'North America 🇨🇦', 'MX': 'North America 🇲🇽',
    'GB': 'Europe 🇬🇧', 'DE': 'Europe 🇩🇪', 'FR': 'Europe 🇫🇷', 'IT': 'Europe 🇮🇹', 'ES': 'Europe 🇪🇸',
    'CN': 'Asia 🇨🇳', 'JP': 'Asia 🇯🇵', 'IN': 'Asia 🇮🇳', 'KR': 'Asia 🇰🇷', 'SG': 'Asia 🇸🇬',
    'BR': 'South America 🇧🇷', 'AR': 'South America 🇦🇷', 'CL': 'South America 🇨🇱',
    'AU': 'Oceania 🇦🇺', 'NZ': 'Oceania 🇳🇿',
    'ZA': 'Africa 🇿🇦', 'EG': 'Africa 🇪🇬', 'NG': 'Africa 🇳🇬', 'KE': 'Africa 🇰🇪'
  };
  return continents[countryCode] || 'Unknown 🌍';
}

function getLanguages(countryCode) {
  const languages = {
    'US': 'English 🇺🇸', 'GB': 'English 🇬🇧', 'CN': 'Chinese 🇨🇳', 'JP': 'Japanese 🇯🇵', 
    'DE': 'German 🇩🇪', 'FR': 'French 🇫🇷', 'ES': 'Spanish 🇪🇸', 'IT': 'Italian 🇮🇹',
    'IN': 'Hindi, English 🇮🇳', 'BR': 'Portuguese 🇧🇷', 'RU': 'Russian 🇷🇺',
    'KR': 'Korean 🇰🇷', 'AR': 'Arabic 🇸🇦', 'NL': 'Dutch 🇳🇱'
  };
  return languages[countryCode] || 'Various languages';
}

function getCurrencyInfo(countryCode) {
  const currencies = {
    'US': 'USD 💵', 'GB': 'GBP 💷', 'EU': 'EUR 💶', 
    'JP': 'JPY 💴', 'CN': 'CNY 💰', 'IN': 'INR 💸',
    'CA': 'CAD 💵', 'AU': 'AUD 💵', 'CH': 'CHF 💵',
    'BR': 'BRL 💵', 'RU': 'RUB 💵', 'KR': 'KRW 💵'
  };
  return currencies[countryCode] || 'Local currency 💵';
}

function getCallingCode(countryCode) {
  const codes = {
    'US': '+1', 'GB': '+44', 'CN': '+86', 'JP': '+81', 'IN': '+91',
    'DE': '+49', 'FR': '+33', 'IT': '+39', 'ES': '+34', 'BR': '+55'
  };
  return codes[countryCode] || 'Unknown';
}

function getRegionalEmoji(countryCode) {
  const emojis = {
    'US': '🗽', 'GB': '👑', 'CN': '🐉', 'JP': '🗾', 'IN': '🐘',
    'FR': '🥖', 'IT': '🍕', 'DE': '🍺', 'BR': '💃', 'AU': '🦘'
  };
  return emojis[countryCode] || '🌍';
}

function estimateUsers(asn) {
  if (!asn) return 'Unknown';
  if (asn.includes('AS15169')) return 'Millions 👑 (Google)';
  if (asn.includes('AS32934')) return 'Millions 👑 (Facebook)';
  if (asn.includes('AS8075')) return 'Millions 👑 (Microsoft)';
  if (asn.includes('AS4134')) return 'Millions 👑 (China Telecom)';
  return 'Thousands to Millions 👥';
}

function classifyNetwork(ip) {
  const firstOctet = parseInt(ip.split('.')[0]);
  if (firstOctet <= 127) return 'Large network 🏢 (16M+ hosts)';
  if (firstOctet <= 191) return 'Medium network 🏢 (65K hosts)';
  return 'Small network 🏠 (254 hosts)';
}

function classifyNetworkSize(ip) {
  const firstOctet = parseInt(ip.split('.')[0]);
  if (firstOctet === 10) return 'Very Large 🏢 (Private)';
  if (firstOctet <= 127) return 'Massive 🌐 (16M hosts)';
  if (firstOctet <= 191) return 'Large 🏢 (65K hosts)';
  return 'Small 🏠 (254 hosts)';
}

function getTimezoneEmoji(timezone) {
  if (!timezone) return '🕒';
  if (timezone.includes('Pacific')) return '🌊';
  if (timezone.includes('America')) return '🇺🇸';
  if (timezone.includes('Europe')) return '🇪🇺';
  if (timezone.includes('Asia')) return '🌏';
  if (timezone.includes('Australia')) return '🇦🇺';
  return '🕒';
}

function calculateDistanceFromEquator(lat) {
  if (!lat) return 'Unknown';
  const distance = Math.abs(lat);
  if (distance < 10) return 'Near equator 🌴';
  if (distance < 30) return 'Tropical zone ☀️';
  if (distance < 60) return 'Temperate zone 🌸';
  return 'Polar zone ❄️';
}

function getHemisphere(lat) {
  if (!lat) return 'Unknown';
  return lat >= 0 ? 'Northern 🌎' : 'Southern 🌍';
}

function getClimateZone(lat) {
  if (!lat) return 'Unknown';
  const absLat = Math.abs(lat);
  if (absLat < 23.5) return 'Tropical 🌴';
  if (absLat < 35) return 'Subtropical ☀️';
  if (absLat < 60) return 'Temperate 🌸';
  return 'Polar ❄️';
}

function getFamousLandmarks(country, city) {
  if (!country) return 'Unknown';
  
  const landmarks = {
    'United States': ['Statue of Liberty 🗽', 'Golden Gate Bridge 🌉', 'White House 🏛️'],
    'France': ['Eiffel Tower 🗼', 'Louvre Museum 🎨', 'Notre Dame Cathedral ⛪'],
    'China': ['Great Wall 🐉', 'Forbidden City 🏯', 'Terracotta Army ⚔️'],
    'Japan': ['Mount Fuji 🗻', 'Tokyo Tower 🗼', 'Fushimi Inari Shrine ⛩️'],
    'India': ['Taj Mahal 🕌', 'Gateway of India 🏛️', 'Red Fort 🏰'],
    'United Kingdom': ['Big Ben 🕰️', 'London Eye 🎡', 'Buckingham Palace 👑'],
    'Italy': ['Colosseum 🏛️', 'Leaning Tower 🗼', 'Venice Canals 🛶'],
    'Brazil': ['Christ the Redeemer ✝️', 'Amazon Rainforest 🌴', 'Copacabana Beach 🏖️']
  };
  
  return landmarks[country] || ['Local attractions 🏞️'];
}

function getSpecialNotes(ip, ipData) {
  const notes = [];
  
  if (isPrivateIP(ip)) notes.push('🔒 Private network IP');
  if (ipData.isp && ipData.isp.includes('Google')) notes.push('☁️ Google infrastructure');
  if (ipData.isp && ipData.isp.includes('Amazon')) notes.push('☁️ AWS cloud services');
  if (ipData.country === 'United States') notes.push('🇺🇸 US-based infrastructure');
  if (ipData.country === 'China') notes.push('🇨🇳 China-based infrastructure');
  
  if (notes.length === 0) notes.push('🌐 Standard public IP address');
  return notes;
}

function getRandomFunFact(ipData) {
  const facts = [
    "🌐 IP stands for Internet Protocol",
    "🔢 IPv4 has 4.3 billion possible addresses",
    "🚀 IPv6 has 340 undecillion possible addresses",
    "📡 The first IP address was 0.0.0.0",
    "🔒 Your IP can reveal your approximate location",
    "🌍 There are IP addresses in space (satellites)",
    "💾 IP addresses are assigned by IANA",
    "🕵️ IP tracing is used for security and analytics"
  ];
  
  return facts[Math.floor(Math.random() * facts.length)];
}