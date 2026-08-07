// Comprehensive list of major world cities mapped to IANA timezones.
// Search matches city names, country, IATA airport codes, and aliases (nearby towns, regions, zipcodes).
// When a user types a smaller town or zipcode, it matches to the nearest major city.

export type ZoneOption = {
  zone: string;
  label: string;
  codes?: string[];
  aliases?: string[]; // nearby towns, regions, zipcodes, alternate names
};

export const COMMON_ZONES: ZoneOption[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // NORTH AMERICA
  // ═══════════════════════════════════════════════════════════════════════════

  // United States - Pacific
  { zone: 'America/Los_Angeles', label: 'Los Angeles, CA, USA', codes: ['LAX'], aliases: ['hollywood', 'beverly hills', 'santa monica', 'long beach', 'pasadena', 'burbank', 'glendale', 'anaheim', 'irvine', 'orange county', '90001', '90210', '91101'] },
  { zone: 'America/Los_Angeles', label: 'San Francisco, CA, USA', codes: ['SFO'], aliases: ['sf', 'bay area', 'soma', 'mission', 'castro', 'haight', '94102', '94103', '94110'] },
  { zone: 'America/Los_Angeles', label: 'San Diego, CA, USA', codes: ['SAN'], aliases: ['la jolla', 'coronado', 'pacific beach', '92101'] },
  { zone: 'America/Los_Angeles', label: 'San Jose, CA, USA', codes: ['SJC'], aliases: ['silicon valley', 'cupertino', 'sunnyvale', 'mountain view', 'palo alto', 'santa clara', '95101'] },
  { zone: 'America/Los_Angeles', label: 'Oakland, CA, USA', codes: ['OAK'], aliases: ['east bay', 'berkeley', 'alameda', 'emeryville', '94601'] },
  { zone: 'America/Los_Angeles', label: 'Sacramento, CA, USA', codes: ['SMF'], aliases: ['95814'] },
  { zone: 'America/Los_Angeles', label: 'Seattle, WA, USA', codes: ['SEA'], aliases: ['bellevue', 'tacoma', 'redmond', 'kirkland', 'everett', '98101'] },
  { zone: 'America/Los_Angeles', label: 'Portland, OR, USA', codes: ['PDX'], aliases: ['beaverton', 'hillsboro', '97201'] },
  { zone: 'America/Los_Angeles', label: 'Las Vegas, NV, USA', codes: ['LAS'], aliases: ['vegas', 'henderson', 'the strip', '89101'] },

  // United States - Mountain
  { zone: 'America/Denver', label: 'Denver, CO, USA', codes: ['DEN'], aliases: ['boulder', 'aurora', 'lakewood', 'colorado springs', '80201'] },
  { zone: 'America/Denver', label: 'Salt Lake City, UT, USA', codes: ['SLC'], aliases: ['park city', 'provo', '84101'] },
  { zone: 'America/Denver', label: 'Albuquerque, NM, USA', codes: ['ABQ'], aliases: ['santa fe', '87101'] },
  { zone: 'America/Phoenix', label: 'Phoenix, AZ, USA', codes: ['PHX'], aliases: ['scottsdale', 'tempe', 'mesa', 'chandler', 'tucson', '85001'] },
  { zone: 'America/Boise', label: 'Boise, ID, USA', codes: ['BOI'], aliases: ['83701'] },

  // United States - Central
  { zone: 'America/Chicago', label: 'Chicago, IL, USA', codes: ['ORD', 'MDW'], aliases: ['evanston', 'naperville', 'oak park', 'wrigleyville', '60601'] },
  { zone: 'America/Chicago', label: 'Houston, TX, USA', codes: ['IAH', 'HOU'], aliases: ['the woodlands', 'sugar land', 'galveston', '77001'] },
  { zone: 'America/Chicago', label: 'Dallas, TX, USA', codes: ['DFW', 'DAL'], aliases: ['fort worth', 'plano', 'arlington', 'irving', 'dfw', '75201'] },
  { zone: 'America/Chicago', label: 'Austin, TX, USA', codes: ['AUS'], aliases: ['round rock', 'cedar park', '78701'] },
  { zone: 'America/Chicago', label: 'San Antonio, TX, USA', codes: ['SAT'], aliases: ['78201'] },
  { zone: 'America/Chicago', label: 'Minneapolis, MN, USA', codes: ['MSP'], aliases: ['st paul', 'saint paul', 'twin cities', '55401'] },
  { zone: 'America/Chicago', label: 'Kansas City, MO, USA', codes: ['MCI'], aliases: ['overland park', '64101'] },
  { zone: 'America/Chicago', label: 'St. Louis, MO, USA', codes: ['STL'], aliases: ['saint louis', '63101'] },
  { zone: 'America/Chicago', label: 'New Orleans, LA, USA', codes: ['MSY'], aliases: ['nola', 'french quarter', '70112'] },
  { zone: 'America/Chicago', label: 'Milwaukee, WI, USA', codes: ['MKE'], aliases: ['53201'] },
  { zone: 'America/Chicago', label: 'Nashville, TN, USA', codes: ['BNA'], aliases: ['music city', '37201'] },
  { zone: 'America/Chicago', label: 'Memphis, TN, USA', codes: ['MEM'], aliases: ['38101'] },
  { zone: 'America/Chicago', label: 'Oklahoma City, OK, USA', codes: ['OKC'], aliases: ['73101'] },

  // United States - Eastern
  { zone: 'America/New_York', label: 'New York, NY, USA', codes: ['JFK', 'LGA', 'EWR'], aliases: ['nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'harlem', 'soho', 'tribeca', 'chelsea', 'times square', 'wall street', '10001', '10011', '10036'] },
  { zone: 'America/New_York', label: 'Washington, DC, USA', codes: ['DCA', 'IAD', 'BWI'], aliases: ['dc', 'capitol', 'arlington', 'bethesda', 'alexandria', '20001'] },
  { zone: 'America/New_York', label: 'Boston, MA, USA', codes: ['BOS'], aliases: ['cambridge', 'somerville', 'brookline', '02101'] },
  { zone: 'America/New_York', label: 'Philadelphia, PA, USA', codes: ['PHL'], aliases: ['philly', '19101'] },
  { zone: 'America/New_York', label: 'Atlanta, GA, USA', codes: ['ATL'], aliases: ['atl', 'buckhead', 'midtown', 'decatur', '30301'] },
  { zone: 'America/New_York', label: 'Miami, FL, USA', codes: ['MIA'], aliases: ['south beach', 'coral gables', 'fort lauderdale', 'brickell', '33101'] },
  { zone: 'America/New_York', label: 'Orlando, FL, USA', codes: ['MCO'], aliases: ['disney world', 'universal', '32801'] },
  { zone: 'America/New_York', label: 'Tampa, FL, USA', codes: ['TPA'], aliases: ['st petersburg', 'clearwater', '33601'] },
  { zone: 'America/New_York', label: 'Charlotte, NC, USA', codes: ['CLT'], aliases: ['28201'] },
  { zone: 'America/New_York', label: 'Raleigh, NC, USA', codes: ['RDU'], aliases: ['durham', 'chapel hill', 'research triangle', '27601'] },
  { zone: 'America/New_York', label: 'Baltimore, MD, USA', codes: ['BWI'], aliases: ['21201'] },
  { zone: 'America/New_York', label: 'Pittsburgh, PA, USA', codes: ['PIT'], aliases: ['15201'] },
  { zone: 'America/New_York', label: 'Cleveland, OH, USA', codes: ['CLE'], aliases: ['44101'] },
  { zone: 'America/New_York', label: 'Columbus, OH, USA', codes: ['CMH'], aliases: ['43201'] },
  { zone: 'America/New_York', label: 'Cincinnati, OH, USA', codes: ['CVG'], aliases: ['45201'] },
  { zone: 'America/New_York', label: 'Detroit, MI, USA', codes: ['DTW'], aliases: ['48201'] },
  { zone: 'America/New_York', label: 'Indianapolis, IN, USA', codes: ['IND'], aliases: ['indy', '46201'] },
  { zone: 'America/New_York', label: 'Buffalo, NY, USA', codes: ['BUF'], aliases: ['14201'] },
  { zone: 'America/New_York', label: 'Hartford, CT, USA', codes: ['BDL'], aliases: ['06101'] },
  { zone: 'America/New_York', label: 'Providence, RI, USA', codes: ['PVD'], aliases: ['02901'] },

  // United States - Other
  { zone: 'Pacific/Honolulu', label: 'Honolulu, HI, USA', codes: ['HNL'], aliases: ['hawaii', 'waikiki', 'oahu', 'maui', 'kauai', 'big island', '96801'] },
  { zone: 'America/Anchorage', label: 'Anchorage, AK, USA', codes: ['ANC'], aliases: ['alaska', 'fairbanks', 'juneau', '99501'] },

  // Canada
  { zone: 'America/Vancouver', label: 'Vancouver, BC, Canada', codes: ['YVR'], aliases: ['burnaby', 'richmond', 'surrey', 'whistler', 'victoria'] },
  { zone: 'America/Edmonton', label: 'Edmonton, AB, Canada', codes: ['YEG'], aliases: ['alberta'] },
  { zone: 'America/Edmonton', label: 'Calgary, AB, Canada', codes: ['YYC'], aliases: ['banff'] },
  { zone: 'America/Winnipeg', label: 'Winnipeg, MB, Canada', codes: ['YWG'], aliases: ['manitoba'] },
  { zone: 'America/Toronto', label: 'Toronto, ON, Canada', codes: ['YYZ', 'YTZ'], aliases: ['ontario', 'mississauga', 'brampton', 'scarborough', 'north york'] },
  { zone: 'America/Toronto', label: 'Ottawa, ON, Canada', codes: ['YOW'], aliases: ['gatineau'] },
  { zone: 'America/Toronto', label: 'Montreal, QC, Canada', codes: ['YUL'], aliases: ['quebec', 'laval'] },
  { zone: 'America/Halifax', label: 'Halifax, NS, Canada', codes: ['YHZ'], aliases: ['nova scotia'] },
  { zone: 'America/St_Johns', label: "St. John's, NL, Canada", codes: ['YYT'], aliases: ['newfoundland'] },

  // Mexico
  { zone: 'America/Mexico_City', label: 'Mexico City, CDMX, Mexico', codes: ['MEX'], aliases: ['df', 'ciudad de mexico', 'cdmx'] },
  { zone: 'America/Mexico_City', label: 'Guadalajara, Jalisco, Mexico', codes: ['GDL'], aliases: ['jalisco'] },
  { zone: 'America/Mexico_City', label: 'Monterrey, NL, Mexico', codes: ['MTY'], aliases: ['nuevo leon'] },
  { zone: 'America/Cancun', label: 'Cancun, QR, Mexico', codes: ['CUN'], aliases: ['quintana roo', 'playa del carmen', 'tulum', 'riviera maya'] },
  { zone: 'America/Tijuana', label: 'Tijuana, BC, Mexico', codes: ['TIJ'], aliases: ['baja california'] },

  // Central America & Caribbean
  { zone: 'America/Guatemala', label: 'Guatemala City, Guatemala', codes: ['GUA'] },
  { zone: 'America/El_Salvador', label: 'San Salvador, El Salvador', codes: ['SAL'] },
  { zone: 'America/Tegucigalpa', label: 'Tegucigalpa, Honduras', codes: ['TGU'] },
  { zone: 'America/Managua', label: 'Managua, Nicaragua', codes: ['MGA'] },
  { zone: 'America/Costa_Rica', label: 'San Jose, Costa Rica', codes: ['SJO'] },
  { zone: 'America/Panama', label: 'Panama City, Panama', codes: ['PTY'] },
  { zone: 'America/Havana', label: 'Havana, Cuba', codes: ['HAV'], aliases: ['habana'] },
  { zone: 'America/Jamaica', label: 'Kingston, Jamaica', codes: ['KIN'] },
  { zone: 'America/Santo_Domingo', label: 'Santo Domingo, Dominican Republic', codes: ['SDQ'], aliases: ['punta cana'] },
  { zone: 'America/Puerto_Rico', label: 'San Juan, Puerto Rico', codes: ['SJU'] },

  // South America
  { zone: 'America/Bogota', label: 'Bogota, Colombia', codes: ['BOG'], aliases: ['medellin', 'cartagena'] },
  { zone: 'America/Lima', label: 'Lima, Peru', codes: ['LIM'], aliases: ['cusco', 'machu picchu'] },
  { zone: 'America/Guayaquil', label: 'Quito, Ecuador', codes: ['UIO'], aliases: ['guayaquil'] },
  { zone: 'America/Caracas', label: 'Caracas, Venezuela', codes: ['CCS'] },
  { zone: 'America/La_Paz', label: 'La Paz, Bolivia', codes: ['LPB'] },
  { zone: 'America/Santiago', label: 'Santiago, Chile', codes: ['SCL'], aliases: ['valparaiso'] },
  { zone: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires, Argentina', codes: ['EZE', 'AEP'], aliases: ['ba', 'bsas'] },
  { zone: 'America/Montevideo', label: 'Montevideo, Uruguay', codes: ['MVD'] },
  { zone: 'America/Asuncion', label: 'Asuncion, Paraguay', codes: ['ASU'] },
  { zone: 'America/Sao_Paulo', label: 'Sao Paulo, SP, Brazil', codes: ['GRU', 'CGH'], aliases: ['são paulo', 'sampa'] },
  { zone: 'America/Sao_Paulo', label: 'Rio de Janeiro, RJ, Brazil', codes: ['GIG', 'SDU'], aliases: ['rio', 'copacabana', 'ipanema'] },
  { zone: 'America/Fortaleza', label: 'Fortaleza, CE, Brazil', codes: ['FOR'] },
  { zone: 'America/Recife', label: 'Recife, PE, Brazil', codes: ['REC'] },
  { zone: 'America/Manaus', label: 'Manaus, AM, Brazil', codes: ['MAO'], aliases: ['amazon'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // EUROPE
  // ═══════════════════════════════════════════════════════════════════════════

  // Western Europe
  { zone: 'Europe/London', label: 'London, England, UK', codes: ['LHR', 'LGW', 'STN', 'LCY'], aliases: ['uk', 'united kingdom', 'britain', 'westminster', 'soho', 'camden', 'shoreditch', 'kensington', 'chelsea'] },
  { zone: 'Europe/London', label: 'Manchester, England, UK', codes: ['MAN'], aliases: [] },
  { zone: 'Europe/London', label: 'Birmingham, England, UK', codes: ['BHX'], aliases: [] },
  { zone: 'Europe/London', label: 'Edinburgh, Scotland, UK', codes: ['EDI'], aliases: ['scotland'] },
  { zone: 'Europe/London', label: 'Glasgow, Scotland, UK', codes: ['GLA'], aliases: [] },
  { zone: 'Europe/Dublin', label: 'Dublin, Ireland', codes: ['DUB'], aliases: ['eire'] },
  { zone: 'Atlantic/Reykjavik', label: 'Reykjavik, Iceland', codes: ['KEF'], aliases: ['iceland'] },
  { zone: 'Europe/Lisbon', label: 'Lisbon, Portugal', codes: ['LIS'], aliases: ['lisboa', 'porto'] },
  { zone: 'Europe/Madrid', label: 'Madrid, Spain', codes: ['MAD'], aliases: [] },
  { zone: 'Europe/Madrid', label: 'Barcelona, Spain', codes: ['BCN'], aliases: ['catalonia', 'catalunya'] },
  { zone: 'Atlantic/Canary', label: 'Las Palmas, Canary Islands, Spain', codes: ['LPA'], aliases: ['tenerife', 'canarias', 'gran canaria'] },
  { zone: 'Europe/Paris', label: 'Paris, France', codes: ['CDG', 'ORY'], aliases: ['france', 'ile de france'] },
  { zone: 'Europe/Paris', label: 'Lyon, France', codes: ['LYS'], aliases: [] },
  { zone: 'Europe/Paris', label: 'Marseille, France', codes: ['MRS'], aliases: ['provence'] },
  { zone: 'Europe/Paris', label: 'Nice, France', codes: ['NCE'], aliases: ['cote d azur', 'french riviera', 'cannes', 'monaco'] },
  { zone: 'Europe/Brussels', label: 'Brussels, Belgium', codes: ['BRU'], aliases: ['bruxelles', 'belgium'] },
  { zone: 'Europe/Amsterdam', label: 'Amsterdam, Netherlands', codes: ['AMS'], aliases: ['holland', 'netherlands', 'rotterdam', 'the hague', 'den haag'] },
  { zone: 'Europe/Luxembourg', label: 'Luxembourg City, Luxembourg', codes: ['LUX'] },

  // Central Europe
  { zone: 'Europe/Berlin', label: 'Berlin, Germany', codes: ['BER'], aliases: ['germany', 'deutschland'] },
  { zone: 'Europe/Berlin', label: 'Munich, Germany', codes: ['MUC'], aliases: ['munchen', 'bayern', 'bavaria'] },
  { zone: 'Europe/Berlin', label: 'Frankfurt, Germany', codes: ['FRA'], aliases: ['hessen'] },
  { zone: 'Europe/Berlin', label: 'Hamburg, Germany', codes: ['HAM'], aliases: [] },
  { zone: 'Europe/Berlin', label: 'Cologne, Germany', codes: ['CGN'], aliases: ['koln'] },
  { zone: 'Europe/Berlin', label: 'Dusseldorf, Germany', codes: ['DUS'], aliases: [] },
  { zone: 'Europe/Vienna', label: 'Vienna, Austria', codes: ['VIE'], aliases: ['wien', 'austria', 'osterreich'] },
  { zone: 'Europe/Zurich', label: 'Zurich, Switzerland', codes: ['ZRH'], aliases: ['switzerland', 'schweiz', 'suisse'] },
  { zone: 'Europe/Zurich', label: 'Geneva, Switzerland', codes: ['GVA'], aliases: ['geneve'] },
  { zone: 'Europe/Prague', label: 'Prague, Czech Republic', codes: ['PRG'], aliases: ['praha', 'czechia'] },
  { zone: 'Europe/Budapest', label: 'Budapest, Hungary', codes: ['BUD'], aliases: ['hungary'] },
  { zone: 'Europe/Warsaw', label: 'Warsaw, Poland', codes: ['WAW'], aliases: ['warszawa', 'poland', 'polska', 'krakow', 'cracow'] },

  // Northern Europe
  { zone: 'Europe/Stockholm', label: 'Stockholm, Sweden', codes: ['ARN'], aliases: ['sweden', 'sverige'] },
  { zone: 'Europe/Oslo', label: 'Oslo, Norway', codes: ['OSL'], aliases: ['norway', 'norge'] },
  { zone: 'Europe/Copenhagen', label: 'Copenhagen, Denmark', codes: ['CPH'], aliases: ['denmark', 'danmark', 'kobenhavn'] },
  { zone: 'Europe/Helsinki', label: 'Helsinki, Finland', codes: ['HEL'], aliases: ['finland', 'suomi'] },
  { zone: 'Europe/Tallinn', label: 'Tallinn, Estonia', codes: ['TLL'], aliases: ['estonia'] },
  { zone: 'Europe/Riga', label: 'Riga, Latvia', codes: ['RIX'], aliases: ['latvia'] },
  { zone: 'Europe/Vilnius', label: 'Vilnius, Lithuania', codes: ['VNO'], aliases: ['lithuania'] },

  // Southern Europe
  { zone: 'Europe/Rome', label: 'Rome, Italy', codes: ['FCO', 'CIA'], aliases: ['roma', 'italy', 'italia'] },
  { zone: 'Europe/Rome', label: 'Milan, Italy', codes: ['MXP', 'LIN'], aliases: ['milano', 'lombardy'] },
  { zone: 'Europe/Rome', label: 'Venice, Italy', codes: ['VCE'], aliases: ['venezia'] },
  { zone: 'Europe/Rome', label: 'Florence, Italy', codes: ['FLR'], aliases: ['firenze', 'tuscany', 'toscana'] },
  { zone: 'Europe/Rome', label: 'Naples, Italy', codes: ['NAP'], aliases: ['napoli', 'amalfi', 'pompeii'] },
  { zone: 'Europe/Malta', label: 'Valletta, Malta', codes: ['MLA'], aliases: ['malta'] },
  { zone: 'Europe/Athens', label: 'Athens, Greece', codes: ['ATH'], aliases: ['greece', 'hellas', 'santorini', 'mykonos'] },
  { zone: 'Europe/Istanbul', label: 'Istanbul, Turkey', codes: ['IST', 'SAW'], aliases: ['turkey', 'turkiye', 'constantinople'] },
  { zone: 'Europe/Bucharest', label: 'Bucharest, Romania', codes: ['OTP'], aliases: ['romania'] },
  { zone: 'Europe/Sofia', label: 'Sofia, Bulgaria', codes: ['SOF'], aliases: ['bulgaria'] },
  { zone: 'Europe/Belgrade', label: 'Belgrade, Serbia', codes: ['BEG'], aliases: ['serbia'] },
  { zone: 'Europe/Zagreb', label: 'Zagreb, Croatia', codes: ['ZAG'], aliases: ['croatia', 'dubrovnik', 'split'] },
  { zone: 'Europe/Ljubljana', label: 'Ljubljana, Slovenia', codes: ['LJU'], aliases: ['slovenia'] },
  { zone: 'Europe/Sarajevo', label: 'Sarajevo, Bosnia', codes: ['SJJ'], aliases: ['bosnia', 'herzegovina'] },
  { zone: 'Europe/Skopje', label: 'Skopje, North Macedonia', codes: ['SKP'], aliases: ['macedonia'] },
  { zone: 'Europe/Podgorica', label: 'Podgorica, Montenegro', codes: ['TGD'], aliases: ['montenegro'] },
  { zone: 'Europe/Tirane', label: 'Tirana, Albania', codes: ['TIA'], aliases: ['albania'] },

  // Eastern Europe
  { zone: 'Europe/Moscow', label: 'Moscow, Russia', codes: ['SVO', 'DME', 'VKO'], aliases: ['russia', 'moskva', 'rossiya'] },
  { zone: 'Europe/Moscow', label: 'St. Petersburg, Russia', codes: ['LED'], aliases: ['saint petersburg', 'petersburg', 'leningrad'] },
  { zone: 'Europe/Kiev', label: 'Kyiv, Ukraine', codes: ['KBP', 'IEV'], aliases: ['kiev', 'ukraine'] },
  { zone: 'Europe/Minsk', label: 'Minsk, Belarus', codes: ['MSQ'], aliases: ['belarus'] },
  { zone: 'Europe/Chisinau', label: 'Chisinau, Moldova', codes: ['KIV'], aliases: ['moldova', 'kishinev'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // MIDDLE EAST & AFRICA
  // ═══════════════════════════════════════════════════════════════════════════

  // Middle East
  { zone: 'Asia/Dubai', label: 'Dubai, UAE', codes: ['DXB'], aliases: ['uae', 'united arab emirates', 'burj khalifa'] },
  { zone: 'Asia/Dubai', label: 'Abu Dhabi, UAE', codes: ['AUH'], aliases: [] },
  { zone: 'Asia/Qatar', label: 'Doha, Qatar', codes: ['DOH'], aliases: ['qatar'] },
  { zone: 'Asia/Bahrain', label: 'Manama, Bahrain', codes: ['BAH'], aliases: ['bahrain'] },
  { zone: 'Asia/Kuwait', label: 'Kuwait City, Kuwait', codes: ['KWI'], aliases: ['kuwait'] },
  { zone: 'Asia/Muscat', label: 'Muscat, Oman', codes: ['MCT'], aliases: ['oman'] },
  { zone: 'Asia/Riyadh', label: 'Riyadh, Saudi Arabia', codes: ['RUH'], aliases: ['saudi arabia', 'ksa'] },
  { zone: 'Asia/Riyadh', label: 'Jeddah, Saudi Arabia', codes: ['JED'], aliases: ['mecca', 'makkah', 'medina'] },
  { zone: 'Asia/Jerusalem', label: 'Tel Aviv, Israel', codes: ['TLV'], aliases: ['israel', 'jerusalem'] },
  { zone: 'Asia/Amman', label: 'Amman, Jordan', codes: ['AMM'], aliases: ['jordan', 'petra'] },
  { zone: 'Asia/Beirut', label: 'Beirut, Lebanon', codes: ['BEY'], aliases: ['lebanon'] },
  { zone: 'Asia/Baghdad', label: 'Baghdad, Iraq', codes: ['BGW'], aliases: ['iraq'] },
  { zone: 'Asia/Tehran', label: 'Tehran, Iran', codes: ['IKA', 'THR'], aliases: ['iran', 'persia'] },

  // Africa - North
  { zone: 'Africa/Cairo', label: 'Cairo, Egypt', codes: ['CAI'], aliases: ['egypt', 'pyramids', 'giza', 'alexandria'] },
  { zone: 'Africa/Casablanca', label: 'Casablanca, Morocco', codes: ['CMN'], aliases: ['morocco', 'marrakech', 'marrakesh', 'fez', 'rabat'] },
  { zone: 'Africa/Tunis', label: 'Tunis, Tunisia', codes: ['TUN'], aliases: ['tunisia'] },
  { zone: 'Africa/Algiers', label: 'Algiers, Algeria', codes: ['ALG'], aliases: ['algeria'] },
  { zone: 'Africa/Tripoli', label: 'Tripoli, Libya', codes: ['TIP'], aliases: ['libya'] },

  // Africa - Sub-Saharan
  { zone: 'Africa/Lagos', label: 'Lagos, Nigeria', codes: ['LOS'], aliases: ['nigeria', 'abuja'] },
  { zone: 'Africa/Accra', label: 'Accra, Ghana', codes: ['ACC'], aliases: ['ghana'] },
  { zone: 'Africa/Dakar', label: 'Dakar, Senegal', codes: ['DSS'], aliases: ['senegal'] },
  { zone: 'Africa/Abidjan', label: 'Abidjan, Ivory Coast', codes: ['ABJ'], aliases: ['ivory coast', 'cote d ivoire'] },
  { zone: 'Africa/Nairobi', label: 'Nairobi, Kenya', codes: ['NBO'], aliases: ['kenya', 'safari', 'masai mara'] },
  { zone: 'Africa/Addis_Ababa', label: 'Addis Ababa, Ethiopia', codes: ['ADD'], aliases: ['ethiopia'] },
  { zone: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam, Tanzania', codes: ['DAR'], aliases: ['tanzania', 'zanzibar', 'serengeti', 'kilimanjaro'] },
  { zone: 'Africa/Kampala', label: 'Kampala, Uganda', codes: ['EBB'], aliases: ['uganda'] },
  { zone: 'Africa/Kigali', label: 'Kigali, Rwanda', codes: ['KGL'], aliases: ['rwanda'] },
  { zone: 'Africa/Johannesburg', label: 'Johannesburg, South Africa', codes: ['JNB'], aliases: ['south africa', 'joburg', 'jozi'] },
  { zone: 'Africa/Johannesburg', label: 'Cape Town, South Africa', codes: ['CPT'], aliases: ['table mountain'] },
  { zone: 'Africa/Harare', label: 'Harare, Zimbabwe', codes: ['HRE'], aliases: ['zimbabwe', 'victoria falls'] },
  { zone: 'Indian/Mauritius', label: 'Port Louis, Mauritius', codes: ['MRU'], aliases: ['mauritius'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASIA
  // ═══════════════════════════════════════════════════════════════════════════

  // South Asia
  { zone: 'Asia/Kolkata', label: 'Mumbai, India', codes: ['BOM'], aliases: ['bombay', 'india', 'bollywood'] },
  { zone: 'Asia/Kolkata', label: 'New Delhi, India', codes: ['DEL'], aliases: ['delhi', 'ncr'] },
  { zone: 'Asia/Kolkata', label: 'Bangalore, India', codes: ['BLR'], aliases: ['bengaluru', 'silicon valley of india'] },
  { zone: 'Asia/Kolkata', label: 'Chennai, India', codes: ['MAA'], aliases: ['madras'] },
  { zone: 'Asia/Kolkata', label: 'Hyderabad, India', codes: ['HYD'], aliases: [] },
  { zone: 'Asia/Kolkata', label: 'Kolkata, India', codes: ['CCU'], aliases: ['calcutta'] },
  { zone: 'Asia/Kolkata', label: 'Pune, India', codes: ['PNQ'], aliases: [] },
  { zone: 'Asia/Colombo', label: 'Colombo, Sri Lanka', codes: ['CMB'], aliases: ['sri lanka', 'ceylon'] },
  { zone: 'Asia/Dhaka', label: 'Dhaka, Bangladesh', codes: ['DAC'], aliases: ['bangladesh'] },
  { zone: 'Asia/Karachi', label: 'Karachi, Pakistan', codes: ['KHI'], aliases: ['pakistan'] },
  { zone: 'Asia/Karachi', label: 'Lahore, Pakistan', codes: ['LHE'], aliases: [] },
  { zone: 'Asia/Karachi', label: 'Islamabad, Pakistan', codes: ['ISB'], aliases: [] },
  { zone: 'Asia/Kathmandu', label: 'Kathmandu, Nepal', codes: ['KTM'], aliases: ['nepal', 'everest'] },

  // Southeast Asia
  { zone: 'Asia/Bangkok', label: 'Bangkok, Thailand', codes: ['BKK', 'DMK'], aliases: ['thailand', 'siam', 'phuket', 'chiang mai', 'pattaya'] },
  { zone: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City, Vietnam', codes: ['SGN'], aliases: ['vietnam', 'saigon'] },
  { zone: 'Asia/Ho_Chi_Minh', label: 'Hanoi, Vietnam', codes: ['HAN'], aliases: ['ha long bay'] },
  { zone: 'Asia/Singapore', label: 'Singapore', codes: ['SIN'], aliases: ['sg', 'lion city'] },
  { zone: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur, Malaysia', codes: ['KUL'], aliases: ['malaysia', 'kl', 'penang', 'langkawi'] },
  { zone: 'Asia/Jakarta', label: 'Jakarta, Indonesia', codes: ['CGK'], aliases: ['indonesia', 'java'] },
  { zone: 'Asia/Jakarta', label: 'Bali, Indonesia', codes: ['DPS'], aliases: ['denpasar', 'ubud', 'seminyak'] },
  { zone: 'Asia/Manila', label: 'Manila, Philippines', codes: ['MNL'], aliases: ['philippines', 'cebu', 'boracay'] },
  { zone: 'Asia/Phnom_Penh', label: 'Phnom Penh, Cambodia', codes: ['PNH'], aliases: ['cambodia', 'siem reap', 'angkor wat'] },
  { zone: 'Asia/Yangon', label: 'Yangon, Myanmar', codes: ['RGN'], aliases: ['myanmar', 'burma', 'rangoon'] },

  // East Asia
  { zone: 'Asia/Tokyo', label: 'Tokyo, Japan', codes: ['HND', 'NRT'], aliases: ['japan', 'nippon', 'shibuya', 'shinjuku', 'ginza', 'akihabara', 'harajuku'] },
  { zone: 'Asia/Tokyo', label: 'Osaka, Japan', codes: ['KIX', 'ITM'], aliases: ['kansai', 'kyoto', 'nara'] },
  { zone: 'Asia/Seoul', label: 'Seoul, South Korea', codes: ['ICN', 'GMP'], aliases: ['korea', 'south korea', 'gangnam', 'busan'] },
  { zone: 'Asia/Shanghai', label: 'Shanghai, China', codes: ['PVG', 'SHA'], aliases: ['china', 'pudong', 'bund'] },
  { zone: 'Asia/Shanghai', label: 'Beijing, China', codes: ['PEK', 'PKX'], aliases: ['peking', 'forbidden city', 'great wall'] },
  { zone: 'Asia/Shanghai', label: 'Guangzhou, China', codes: ['CAN'], aliases: ['canton', 'shenzhen'] },
  { zone: 'Asia/Shanghai', label: 'Shenzhen, China', codes: ['SZX'], aliases: ['tech hub'] },
  { zone: 'Asia/Shanghai', label: 'Chengdu, China', codes: ['CTU'], aliases: ['sichuan', 'pandas'] },
  { zone: 'Asia/Hong_Kong', label: 'Hong Kong', codes: ['HKG'], aliases: ['hk', 'kowloon', 'central'] },
  { zone: 'Asia/Macau', label: 'Macau', codes: ['MFM'], aliases: ['macao'] },
  { zone: 'Asia/Taipei', label: 'Taipei, Taiwan', codes: ['TPE'], aliases: ['taiwan', 'formosa'] },
  { zone: 'Asia/Ulaanbaatar', label: 'Ulaanbaatar, Mongolia', codes: ['ULN'], aliases: ['mongolia'] },

  // Central Asia
  { zone: 'Asia/Almaty', label: 'Almaty, Kazakhstan', codes: ['ALA'], aliases: ['kazakhstan'] },
  { zone: 'Asia/Tashkent', label: 'Tashkent, Uzbekistan', codes: ['TAS'], aliases: ['uzbekistan', 'samarkand'] },
  { zone: 'Asia/Tbilisi', label: 'Tbilisi, Georgia', codes: ['TBS'], aliases: ['georgia'] },
  { zone: 'Asia/Yerevan', label: 'Yerevan, Armenia', codes: ['EVN'], aliases: ['armenia'] },
  { zone: 'Asia/Baku', label: 'Baku, Azerbaijan', codes: ['GYD'], aliases: ['azerbaijan'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // OCEANIA
  // ═══════════════════════════════════════════════════════════════════════════

  // Australia
  { zone: 'Australia/Sydney', label: 'Sydney, NSW, Australia', codes: ['SYD'], aliases: ['australia', 'new south wales', 'opera house', 'bondi'] },
  { zone: 'Australia/Melbourne', label: 'Melbourne, VIC, Australia', codes: ['MEL'], aliases: ['victoria'] },
  { zone: 'Australia/Brisbane', label: 'Brisbane, QLD, Australia', codes: ['BNE'], aliases: ['queensland', 'gold coast', 'sunshine coast'] },
  { zone: 'Australia/Perth', label: 'Perth, WA, Australia', codes: ['PER'], aliases: ['western australia'] },
  { zone: 'Australia/Adelaide', label: 'Adelaide, SA, Australia', codes: ['ADL'], aliases: ['south australia'] },
  { zone: 'Australia/Darwin', label: 'Darwin, NT, Australia', codes: ['DRW'], aliases: ['northern territory'] },
  { zone: 'Australia/Hobart', label: 'Hobart, TAS, Australia', codes: ['HBA'], aliases: ['tasmania'] },

  // New Zealand & Pacific
  { zone: 'Pacific/Auckland', label: 'Auckland, New Zealand', codes: ['AKL'], aliases: ['new zealand', 'nz', 'kiwi'] },
  { zone: 'Pacific/Auckland', label: 'Wellington, New Zealand', codes: ['WLG'], aliases: [] },
  { zone: 'Pacific/Fiji', label: 'Suva, Fiji', codes: ['SUV'], aliases: ['fiji', 'nadi'] },
  { zone: 'Pacific/Guam', label: 'Hagatna, Guam', codes: ['GUM'], aliases: ['guam'] },
  { zone: 'Pacific/Port_Moresby', label: 'Port Moresby, Papua New Guinea', codes: ['POM'], aliases: ['papua new guinea', 'png'] },
  { zone: 'Pacific/Tahiti', label: 'Papeete, Tahiti', codes: ['PPT'], aliases: ['tahiti', 'french polynesia', 'bora bora'] },
];

/** Lowercased haystack for searching a zone option by name, IANA zone, code, or alias. */
export function zoneHaystack(z: ZoneOption): string {
  return `${z.label} ${z.zone} ${(z.codes ?? []).join(' ')} ${(z.aliases ?? []).join(' ')}`.toLowerCase();
}

/** Best-effort friendly label for a zone, falling back to the city segment. */
export function labelForZone(zone: string): string {
  const found = COMMON_ZONES.find((z) => z.zone === zone);
  if (found) return found.label;
  const city = zone.split('/').pop() ?? zone;
  return city.replace(/_/g, ' ');
}

/** Get airport code for a zone, or null if none. */
export function codeForZone(zone: string): string | null {
  const found = COMMON_ZONES.find((z) => z.zone === zone);
  return found?.codes?.[0] ?? null;
}

/** Get airport code for a specific location (by name and zone). */
export function codeForLocation(name: string, ianaZone: string): string | null {
  const found = COMMON_ZONES.find((z) => z.zone === ianaZone && z.label === name);
  return found?.codes?.[0] ?? null;
}

/** Format location name as "City (CODE)" - e.g. "San Francisco (SFO)" */
export function formatLocationName(name: string, ianaZone: string): string {
  const found = COMMON_ZONES.find((z) => z.zone === ianaZone && z.label === name);
  if (found?.codes?.length) {
    // Extract just the city name (first part before comma)
    const city = name.split(',')[0];
    return `${city} (${found.codes[0]})`;
  }
  // Fallback: just the city part
  const city = name.split(',')[0];
  return city;
}

/** Get display name for a zone - "City (CODE)" format */
export function displayNameForZone(ianaZone: string): string {
  const found = COMMON_ZONES.find((z) => z.zone === ianaZone);
  if (!found) {
    const city = ianaZone.split('/').pop() ?? ianaZone;
    return city.replace(/_/g, ' ');
  }
  const city = found.label.split(',')[0];
  if (found.codes?.length) {
    return `${city} (${found.codes[0]})`;
  }
  return city;
}

/** Find the best zone match for a timezone + optional city hint from geolocation */
export function findBestZoneForLocation(ianaZone: string, cityHint?: string): ZoneOption | null {
  const matches = COMMON_ZONES.filter((z) => z.zone === ianaZone);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  
  // If we have a city hint, try to find a match
  if (cityHint) {
    const hint = cityHint.toLowerCase();
    // First try exact city name match
    const exactMatch = matches.find((z) => z.label.toLowerCase().startsWith(hint));
    if (exactMatch) return exactMatch;
    
    // Try alias match (nearby cities, neighborhoods)
    const aliasMatch = matches.find((z) => 
      z.aliases?.some((a) => a.toLowerCase().includes(hint) || hint.includes(a.toLowerCase()))
    );
    if (aliasMatch) return aliasMatch;
  }
  
  // Default to first match
  return matches[0];
}

/** Get display name for a zone with city hint - "City (CODE)" format */
export function displayNameForZoneWithHint(ianaZone: string, cityHint?: string): string {
  const found = findBestZoneForLocation(ianaZone, cityHint);
  if (!found) {
    const city = ianaZone.split('/').pop() ?? ianaZone;
    return city.replace(/_/g, ' ');
  }
  const city = found.label.split(',')[0];
  if (found.codes?.length) {
    return `${city} (${found.codes[0]})`;
  }
  return city;
}

/** Get full label for a zone with city hint */
export function labelForZoneWithHint(ianaZone: string, cityHint?: string): string {
  const found = findBestZoneForLocation(ianaZone, cityHint);
  if (found) return found.label;
  const city = ianaZone.split('/').pop() ?? ianaZone;
  return city.replace(/_/g, ' ');
}

/** Find matching zones for a search query (city, town, zipcode, airport code). */
export function searchZones(query: string): ZoneOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMON_ZONES;
  
  // Score matches by relevance
  const scored = COMMON_ZONES.map((z) => {
    const haystack = zoneHaystack(z);
    let score = 0;
    
    // Exact label match (highest priority)
    if (z.label.toLowerCase().includes(q)) score += 100;
    
    // Airport code match (high priority)
    if (z.codes?.some(c => c.toLowerCase() === q)) score += 90;
    if (z.codes?.some(c => c.toLowerCase().includes(q))) score += 50;
    
    // Alias match (good priority - this handles nearby towns/zipcodes)
    if (z.aliases?.some(a => a.toLowerCase() === q)) score += 80;
    if (z.aliases?.some(a => a.toLowerCase().includes(q))) score += 40;
    
    // Zone name match
    if (z.zone.toLowerCase().includes(q)) score += 30;
    
    // General haystack match
    if (haystack.includes(q)) score += 10;
    
    return { zone: z, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.zone);
}
