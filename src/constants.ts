import { Tour, BlogPost } from './types';

export const SAMPLE_TOURS: Tour[] = [
  {
    id: "pyramids-tour-from-cairo-airport",
    title: "Pyramids Tour from Cairo Airport",
    description: "Arriving in Cairo with a long layover? Make the most of your time with a direct Pyramids excursion from the airport. See the world's greatest ancient wonder and return in time for your connecting flight. Smooth, efficient, and unforgettable.",
    price: 100,
    duration: "1 Day",
    location: "Cairo",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=1200",
    rating: 4.7,
    reviewsCount: 204,
    itinerary: [
      {
        day: 1,
        title: "Itinerary: Pyramids Tour from Cairo Airport",
        description: "Arriving in Cairo with a long layover? Make the most of your time with a direct Pyramids excursion from the airport. See the world's greatest ancient wonder and return in time for your connecting flight. Smooth, efficient, and unforgettable.",
        activities: [
          {
            title: "Pyramids Tour from Cairo Airport Main Excursion",
            description: "Arriving in Cairo with a long layover? Make the most of your time with a direct Pyramids excursion from the airport. See the world's greatest ancient wonder and return in time for your connecting flight. Smooth, efficient, and unforgettable.",
            icon: "tour"
          }
        ]
      }
    ],
    highlights: [
      "Giza Pyramids",
      "Sphinx — no hotel stay required."
    ]
  },
  {
    id: "day-trip-to-giza-pyramids-from-cairo",
    title: "Day Trip to Pyramids from Cairo",
    description: "The essential Cairo day trip. Visit the Great Pyramid of Khufu, the Pyramid of Khafre, the Pyramid of Menkaure, and the iconic Great Sphinx with your private expert guide. Includes the Valley Temple and an optional camel ride on the plateau. One of the world's greatest experiences, perfectly organized for a single memorable day.",
    price: 80,
    duration: "1 Day",
    location: "Cairo, Giza",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=1200",
    rating: 4.9,
    reviewsCount: 104,
    itinerary: [
      {
        day: 1,
        title: "Itinerary: Day Trip to Giza Pyramids from Cairo",
        description: "The essential Cairo day trip. Visit the Great Pyramid of Khufu, the Pyramid of Khafre, the Pyramid of Menkaure, and the iconic Great Sphinx with your private expert guide. Includes the Valley Temple and an optional camel ride on the plateau. One of the world's greatest experiences, perfectly organized for a single memorable day.",
        activities: [
          {
            title: "Day Trip to Giza Pyramids from Cairo Main Excursion",
            description: "The essential Cairo day trip. Visit the Great Pyramid of Khufu, the Pyramid of Khafre, the Pyramid of Menkaure, and the iconic Great Sphinx with your private expert guide. Includes the Valley Temple and an optional camel ride on the plateau. One of the world's greatest experiences, perfectly organized for a single memorable day.",
            icon: "tour"
          }
        ]
      }
    ],
    highlights: [
      "Great Pyramid",
      "Sphinx",
      "Valley Temple",
      "optional camel ride."
    ]
  },
  {
    id: "tour-to-giza-pyramids-old-cairo",
    title: "Tour to Giza Pyramids & Old Cairo",
    description: "Combine Egypt's ancient pharaonic heritage with its Coptic and Islamic past in one packed day. Start at the Pyramids and Sphinx, then explore the Hanging Church, the Coptic Museum, and the vibrant Khan El Khalili bazaar.",
    price: 70,
    duration: "1 Day",
    location: "Cairo, Giza",
    category: "historical",
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=1200",
    rating: 4.8,
    reviewsCount: 146,
    itinerary: [
      {
        day: 1,
        title: "Itinerary: Tour to Giza Pyramids & Old Cairo",
        description: "Combine Egypt's ancient pharaonic heritage with its Coptic and Islamic past in one packed day. Start at the Pyramids and Sphinx, then explore the Hanging Church, the Coptic Museum, and the vibrant Khan El Khalili bazaar.",
        activities: [
          {
            title: "Tour to Giza Pyramids & Old Cairo Main Excursion",
            description: "Combine Egypt's ancient pharaonic heritage with its Coptic and Islamic past in one packed day. Start at the Pyramids and Sphinx, then explore the Hanging Church, the Coptic Museum, and the vibrant Khan El Khalili bazaar.",
            icon: "tour"
          }
        ]
      }
    ],
    highlights: [
      "Pyramids",
      "Sphinx",
      "Hanging Church",
      "Khan El Khalili."
    ]
  },
  {
    id: "4-days-cairo-giza-pyramids-tour",
    title: "Giza Pyramids and Old Cairo Private Tour",
    description: "A perfectly crafted short break for those who want to experience the magic of Cairo and the iconic Giza Pyramids. In just four days, you'll stand before the last remaining wonder of the ancient world, explore the corridors of the Egyptian Museum, and wander through the ancient streets of Old Cairo. Ideal for first-time visitors or travelers with limited time who refuse to miss Egypt's greatest highlights.",
    price: 370,
    duration: "4 Days / 3 Nights",
    location: "Cairo, Giza",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=1200",
    rating: 4.5,
    reviewsCount: 93,
    itinerary: [
      {
        day: 1,
        title: "Day 1: Arrive Cairo",
        description: "Private airport transfer to hotel. Welcome briefing with your guide. Overnight Cairo.",
        activities: [
          {
            title: "Arrive Cairo Highlights",
            description: "Private airport transfer to hotel. Welcome briefing with your guide. Overnight Cairo.",
            icon: "transfer"
          }
        ]
      },
      {
        day: 2,
        title: "Day 2: Full day at the Giza Plateau — Great Pyramid of Khufu, Pyramid of Khafre, Pyramid of Menkaure, the Great Sphinx, and the Valley Temple",
        description: "Optional camel ride. Overnight Cairo.",
        activities: [
          {
            title: "Full day at the Giza Plateau — Great Pyramid of Khufu, Pyramid of Khafre, Pyramid of Menkaure, the Great Sphinx, and the Valley Temple Highlights",
            description: "Optional camel ride. Overnight Cairo.",
            icon: "tour"
          }
        ]
      },
      {
        day: 3,
        title: "Day 3: Egyptian Museum (including the Tutankhamun treasures and Royal Mummies Hall), Citadel of Saladin, Mohamed Ali Mosque, Khan El Khalili Bazaar",
        description: "Overnight Cairo.",
        activities: [
          {
            title: "Egyptian Museum (including the Tutankhamun treasures and Royal Mummies Hall), Citadel of Saladin, Mohamed Ali Mosque, Khan El Khalili Bazaar Highlights",
            description: "Overnight Cairo.",
            icon: "tour"
          }
        ]
      },
      {
        day: 4,
        title: "Day 4: Optional morning visit to Old Cairo (Hanging Church, Coptic Museum, Ben Ezra Synagogue)",
        description: "Transfer to Cairo Airport. Departure.",
        activities: [
          {
            title: "Optional morning visit to Old Cairo (Hanging Church, Coptic Museum, Ben Ezra Synagogue) Highlights",
            description: "Transfer to Cairo Airport. Departure.",
            icon: "transfer"
          }
        ]
      }
    ],
    inclusions: [
      "Hotel accommodation (3 nights)",
      "private Egyptologist guide",
      "daily breakfast",
      "all entrance fees",
      "all transfers."
    ]
  },
  {
    id: "pkg-7-5-days-cairo--luxor---abu-simbel-tour",
    title: "Cairo, Abu Simbel, and Luxor Private Tour",
    description: "Immersive 5-day classic travel package exploring the wonders of Cairo, Luxor, Abu Simbel.",
    price: 960,
    duration: "5 Days / 4 Nights",
    location: "Cairo, Luxor, Abu Simbel",
    category: "historical",
    image: "https://images.unsplash.com/photo-1506466010722-395aa2bef877?auto=format&fit=crop&q=80&w=1200",
    rating: 4.8,
    reviewsCount: 205,
    itinerary: [
      {
        day: 1,
        title: "Day One: Arrival",
        description: "Start your 5 Days Cairo, Luxor & Abu Simbel Tour.",
        activities: [
          {
            title: "Arrival Highlights",
            description: "Start your 5 Days Cairo, Luxor & Abu Simbel Tour.",
            icon: "tour"
          }
        ]
      },
      {
        day: 2,
        title: "Day Two: Exploration",
        description: "Guided tours and activities.",
        activities: [
          {
            title: "Exploration Highlights",
            description: "Guided tours and activities.",
            icon: "tour"
          }
        ]
      },
      {
        day: 5,
        title: "Day Five: Departure",
        description: "End of your magnificent journey.",
        activities: [
          {
            title: "Departure Highlights",
            description: "End of your magnificent journey.",
            icon: "tour"
          }
        ]
      }
    ]
  },
  {
    id: "6-days-cairo-luxor-aswan",
    title: "Cairo, Luxor, Aswan, and Abu Simbel Guided Tour",
    description: "A comprehensive 6-day package exploring Upper and Lower Egypt. From the Great Pyramids to the colossal temples of Ramses II at Abu Simbel, witness the pinnacle of Pharaonic civilization.",
    price: 1070,
    duration: "6 Days / 5 Nights",
    location: "Cairo, Luxor, Aswan",
    category: "historical",
    image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&q=80&w=1200",
    rating: 4.8,
    reviewsCount: 185,
    itinerary: [
      {
        day: 1,
        title: "Day One: Arrival to Egypt Land of Pharaohs",
        description: "As soon as you arrive at Cairo Airport, our \"Travision Tours\" representative will be waiting for you at your gate where he will help you complete all of your passport control formalities and luggage identification and carry. You will then be transferred by a private air-conditioned car to your 5* hotel reservation for checking-in.",
        image: "https://www.egypttoursportal.com/images/2019/01/Arrival-to-Cairo-International-Airport-Egypt-Tours-Portal.jpg",
        activities: [
          {
            title: "Dinner Time",
            description: "In the evening, you will begin your tour by a Dinner cruise on the blessed Nile as you will get to chill and observe a colorful belly dancing show with a folklore band featuring the amazing Tannoura spin in keeping with Egypt's whirling dervishes' tradition.",
            icon: "dinner"
          },
          {
            title: "Overnight",
            description: "End the first day of your Cairo, Luxor, Aswan & Abu Simbel tour by returning to your hotel for the overnight.",
            icon: "overnight"
          }
        ],
        meals: "Dinner",
        overnight: "Cairo Hotel"
      },
      {
        day: 2,
        title: "Day Two: Tour to Giza Pyramids & The Egyptian Museum",
        description: "You will begin your second day by enjoying your breakfast, and check-out from the hotel then join your private tour guide to discover the wonders of Ancient Egypt starting with:",
        image: "https://www.egypttoursportal.com/images/2020/04/The-Great-Pyramids-of-Giza-Egypt-Tours-Portal.jpg",
        activities: [
          {
            title: "Giza Pyramids Complex",
            description: "The Giza Pyramids Complex will be in your presence, the complex has existed for 4000 years which makes it one of the oldest structures on the face of the planet. The Giza complex consists of three main pyramids, six little pyramids, the great sphinx, and the place of immortal preservation of the valley temple.",
            icon: "tour"
          },
          {
            title: "The Great Pyramid",
            description: "The Great Pyramid of Khufu lies among the skies of paradise, it is known for being the last intact structure of the Seven Wonders of the Ancient World. It is older than 4500 years old which makes it the world's oldest mystery because of the fringe theories attached to its origin, and its complex interior compared to its magnitude. It was constructed in 2580 BC for 20 years using 2,300,000 pieces of limestone each weighing 2.5 tons and a workforce of 100,000 free skilled workers resulting in making the height of the pyramid 147 m (481 ft) which made it the tallest building in the world for 3800 years until the construction of the Lincoln Cathedral in England in 1311.",
            icon: "dinner"
          },
          {
            title: "The Great Sphinx",
            description: "The Great Sphinx is one of the most mysterious objects in existence, it has the shape of a mythical creature called the sphinx that has the body of a lion and the head of a man who is believed to be king Khafre to represent power and wisdom. It is known as Abu Al-Hawl which is Arabic for The Father of terror. The sphinx is at the height of 73 m (240 ft) and 19 m (66 ft) and was carved out of single limestone rock.",
            icon: "tour"
          },
          {
            title: "The Valley Temple",
            description: "The Valley temple is home to the Mummification process, it was constructed within Egypt's Old Kingdom (2686 2134 BC) within the complex. It's one of the best-preserved archeological sites of the ancient Egyptian civilization and the source of great information about the mummification of Ancient Egypt. The valley is made of limestone, and granite and holds unique diorite statues of King Khafre.",
            icon: "tour"
          },
          {
            title: "The Grand Egyptian Museum",
            description: "GEM is designed to have one of the biggest conservation centers in the Middle East, along with research labs and educational facilities dedicated to preserving Egypt’s heritage. Everyone can marvel at treasures such as the Hanging Obelisk, the 11-meter colossus of Ramses II, and the complete collection of over 5,000 artifacts from Tutankhamun.",
            icon: "tour"
          },
          {
            title: "Lunch Time",
            description: "Proceed to have your lunch at a local restaurant in Cairo. Then we will move to continue your Cairo, Luxor, Aswan & Abu Simbel holiday by visiting:",
            icon: "dinner"
          },
          {
            title: "The Egyptian Museum",
            description: "The Egyptian Museum contains the largest collection of ancient Egyptian artifacts and monuments in the world dating back to more than 4000 years across. Inside the two-level building are a collection of rare & priceless archeological wonders that stood the test of time.",
            icon: "tour"
          },
          {
            title: "Overnight",
            description: "Finally, you will drive to Cairo Airport then catch your flight to Luxor then check-in 5* hotel for spending the overnight.",
            icon: "overnight"
          }
        ],
        meals: "Breakfast, Lunch",
        overnight: "Luxor Hotel"
      },
      {
        day: 3,
        title: "Day Three: Tour to Luxor East & West Attractions",
        description: "On day three, you will enjoy your breakfast at the hotel, then accompany your Egyptologist tour guide to explore all the famous Luxor tourist attractions such as:",
        image: "https://www.egypttoursportal.com/images/2020/04/Tutankhamun-Tomb-in-Valley-of-the-Kings-Egypt-Tours-Portal.jpg",
        activities: [
          {
            title: "Valley of the Kings",
            description: "The valley of the kings is like a time capsule located in the heart of the holy mountain which has acted as the final resting place of the greatest kings and queens of Egypt's new kingdom (1570-1070 BC). It holds 63 tombs filled with various enchanting treasures, artifacts, statues, hypnotically beautiful decorations, and the remains of pharaohs like Rameses (I, II, III, IV, V, VI, VII, IX, X), Amenhotep I, Hatshepsut, and the famous King Tutankhamun which all resulted in the valley becoming a World Heritage Site by the UNESCO in 1979.",
            icon: "tour"
          },
          {
            title: "Queen Hatshepsut Temple",
            description: "The Hatshepsut Temple is renowned for being the beauty of Luxor, it gained the name Djoser-Djeseru (Holy of Holies) and showcases the might & will of one of the most successful rulers in the history of ancient Egypt Queen Hatshepsut. The temple was designed in 1479 BC and took 15 years to construct. The design of the temple is based on the concept of Classical Architecture of the new kingdom and within the temple lies some of the most impressive statues, decorations, and artifacts in all of Egypt.",
            icon: "tour"
          },
          {
            title: "Colossi of Memnon",
            description: "Colossi of Memnon is different than most of the monuments in Upper Egypt, it has been known as the colossal guardians of Luxor. They are basically two massive blocks of quartzite sandstone standing at the height of 18 m (60ft) weighing 720 tons each and have the shape of Pharaoh Amenhotep III(1386-1350). The colossi were damaged due to a large earthquake in 27 BC but were rebuilt again in 199 AD. The statues gained quite a fame during the Greco-Roman period due to The Vocal Memnon which resulted from the statues singing from time to time which were nothing more than the sound of the wind passing through the statue at dawn.",
            icon: "tour"
          },
          {
            title: "Lunch Time",
            description: "Then move to have your lunch on an island, so your tour includes a boat trip in the Nile River followed by a tour to:",
            icon: "dinner"
          },
          {
            title: "Karnak Temple",
            description: "Karnak temple is one of the holiest places on the face of the planet, it was known as Ipet-isu The Most Selected Of Places, and Pr-Imn House Of Amon, it dates to more than 4000 years and is the largest religious man-made construction in the world & also the biggest open-air museums on earth. It was the heart of the religious worship of the entire ancient Egyptian kingdom for more than 1500 years to various deities but was dedicated primarily to the Theban triad that consisted of God Amun with his wife the Goddess of Justice Mut and his son the moon god Khnsou, plus other gods like the great Osiris, Montu, Ptah and Isis.",
            icon: "tour"
          },
          {
            title: "Overnight",
            description: "You will spend your overnight at your hotel in Luxor.",
            icon: "overnight"
          }
        ],
        meals: "Breakfast, Lunch",
        overnight: "Luxor Hotel"
      },
      {
        day: 4,
        title: "Day Four: Transfer to Aswan by Train - Tour to Aswan Landmarks",
        description: "In the morning time, you will have your breakfast and check out from the hotel in Luxor to continue Cairo, Luxor, Aswan & Abu Simbel tour by boarding a 1*class train to Aswan, the moment you arrive you will join your private Egyptologist tour guide to enjoy a tour around all Aswan tourist attractions such as:",
        image: "https://www.egypttoursportal.com/images/2020/04/Philae-Temple-Egypt-Tours-Portal-1.jpg",
        activities: [
          {
            title: "The High Dam",
            description: "The High Dam represents the modern might of the city of Aswan, the dam was constructed between 1960 & 1970 during the reign of president Gamal Adel-Nasser. The dam was designed as a cooperation project with the Moscow-based Hydro project Institute to have better control over Nile flooding, generate Hydroelectricity, and provide increased water storage for irrigation in its reservoir lake Nasser.",
            icon: "tour"
          },
          {
            title: "The Unfinished Obelisk",
            description: "The Unfinished Obelisk is a tale that was sadly left unfinished, it was ordered by Queen Hatshepsut (1508-1458 BC) to stand at the entrance of the Karnak temple. It was known as \"Tekhenu\" which means to pierce the sky\" and shows how obelisks were created from scratch and the method of construction of Ancient Egypt, it reached the height of 42 m and weighed 1200 tons. Unfortunately, the obelisk was cracked during construction and remained at the same location even today.",
            icon: "tour"
          },
          {
            title: "Lunch Time",
            description: "You will enjoy your lunch in a local restaurant in Aswan to get ready to complete your day by visiting:",
            icon: "dinner"
          },
          {
            title: "Philae Temple",
            description: "Philea Temple is truly the essence of myth, allure, and charm in the city of Aswan, it is famous for spreading the\" Myth of Osiris\" which entails the husband of Isis \"Osiris\" Is killed by His brother Set out of pure hatred & envy then Osiris is resurrected to be the ruler of the underworld afterward Set is defeated by Isis and Osiris Son Hours the sky God ending an age of tyranny & injustice. The temple was relocated in the 60s to the island of Agilkia as a part of a rescue mission led by UNESCO after the construction of the Aswan High Dam.",
            icon: "tour"
          },
          {
            title: "Overnight",
            description: "You will then check in at Aswan 5* hotel to spend your overnight.",
            icon: "overnight"
          }
        ],
        meals: "Breakfast, Lunch",
        overnight: "Aswan Hotel"
      },
      {
        day: 5,
        title: "Day Five: Tour to the Two Temples of Abu Simbel + Fly Back to Cairo",
        description: "Morning time, check out from the hotel before you will be transferred with your breakfast boxes to Abu Simbel by a private air-conditioned car joined by your private tour guide.",
        image: "https://www.egypttoursportal.com/images/2018/06/Abu-Simbel-Two-Days-Luxor-Abu-Simbel-Trips-from-Cairo-Egypt-Tours-Portal.jpg",
        activities: [
          {
            title: "Abu Simbel Temples",
            description: "The two great Abu Simbel Temples have been the final frontier & the guardian of the southern border since its creation by King Ramses II (1279-1213 BCE) during the new kingdom to immortalize his legacy till the end of times. Everything about this temple reflects the ultimate concept of greatness & glory. The temple was called the \"Temple of Ramesses, beloved by Amun\". Abu Simbel consists of two temples, the bigger one is for Ramses where the sun festival takes place on the 22 of February & October of each year when the sun shines on the faces of the four seated statues of Ramses II, Ptah (God of creation), Amun (The Creator God), and Ra (Sun God), the smaller temple is dedicated to his wife Queen Nefertari. The temple was part of a rescue mission led by UNESCO in the mid-60s in what is referred to as the most challenging archeological rescue operation in history.",
            icon: "tour"
          },
          {
            title: "Lunch Time",
            description: "Finally, return to Aswan city by A/C vehicle to have your lunch at a local restaurant.",
            icon: "dinner"
          },
          {
            title: "Overnight",
            description: "Catch your flight back to Cairo and transfer to your hotel for spending overnight.",
            icon: "overnight"
          }
        ],
        meals: "Breakfast, Lunch",
        overnight: "Cairo Hotel"
      },
      {
        day: 6,
        title: "Day Six : End of Cairo, Luxor, Aswan & Abu Simbel Package",
        description: "On your final day, you have your breakfast then our representative of \"Travision Tours\" will transfer you to the airport so you can return home safely with the finest memories.",
        image: "https://www.egypttoursportal.com/images/2020/04/Departure-Day-Egypt-Tours-Portal.jpg",
        activities: [],
        meals: "Breakfast",
        overnight: ""
      }
    ]
  },
  {
    id: "7-days-cairo-luxor-aswan-abu-simbel-edfu-kom-ombo",
    title: "Cairo and Upper Egypt with Edfu & Kom Ombo Tour",
    description: "Take the full scenic route through ancient Egypt. This seven-day tour adds the remarkably preserved Temple of Edfu and the unique double-deity Temple of Kom Ombo to the classic itinerary — giving you a richer, more complete picture of ancient Egyptian civilization along the Nile Valley.",
    price: 1140,
    duration: "7 Days / 6 Nights",
    location: "Cairo, Luxor, Aswan, Abu Simbel",
    category: "historical",
    image: "https://images.unsplash.com/photo-1600577916048-804c9191e36c?auto=format&fit=crop&q=80&w=1200",
    rating: 4.7,
    reviewsCount: 170,
    itinerary: [
      {
        day: 1,
        title: "Day 1: Arrive Cairo",
        description: "Transfer and welcome.",
        activities: [
          {
            title: "Arrive Cairo Highlights",
            description: "Transfer and welcome.",
            icon: "transfer"
          }
        ]
      },
      {
        day: 2,
        title: "Day 2: Giza Pyramids, Sphinx, Saqqara, Memphis",
        description: "Overnight Cairo.",
        activities: [
          {
            title: "Giza Pyramids, Sphinx, Saqqara, Memphis Highlights",
            description: "Overnight Cairo.",
            icon: "tour"
          }
        ]
      },
      {
        day: 3,
        title: "Day 3: Egyptian Museum, Citadel of Saladin, Old Cairo",
        description: "Fly to Luxor. Overnight Luxor.",
        activities: [
          {
            title: "Egyptian Museum, Citadel of Saladin, Old Cairo Highlights",
            description: "Fly to Luxor. Overnight Luxor.",
            icon: "tour"
          }
        ]
      },
      {
        day: 4,
        title: "Day 4: Valley of the Kings, Hatshepsut Temple, Colossi of Memnon, Karnak Temple",
        description: "Overnight Luxor.",
        activities: [
          {
            title: "Valley of the Kings, Hatshepsut Temple, Colossi of Memnon, Karnak Temple Highlights",
            description: "Overnight Luxor.",
            icon: "tour"
          }
        ]
      },
      {
        day: 5,
        title: "Day 5: Drive south",
        description: "Visit Edfu Temple (dedicated to Horus) and Kom Ombo Temple (dedicated to Sobek & Haroeris). Arrive Aswan. Overnight Aswan.",
        activities: [
          {
            title: "Drive south Highlights",
            description: "Visit Edfu Temple (dedicated to Horus) and Kom Ombo Temple (dedicated to Sobek & Haroeris). Arrive Aswan. Overnight Aswan.",
            icon: "transfer"
          }
        ]
      },
      {
        day: 6,
        title: "Day 6: Philae Temple, High Dam, Nubian Village",
        description: "Abu Simbel excursion. Overnight Aswan.",
        activities: [
          {
            title: "Philae Temple, High Dam, Nubian Village Highlights",
            description: "Abu Simbel excursion. Overnight Aswan.",
            icon: "tour"
          }
        ]
      },
      {
        day: 7,
        title: "Day 7: Fly to Cairo",
        description: "Departure.",
        activities: [
          {
            title: "Fly to Cairo Highlights",
            description: "Departure.",
            icon: "tour"
          }
        ]
      }
    ],
    inclusions: [
      "Hotel accommodation",
      "domestic flights",
      "private Egyptologist guide",
      "daily breakfast",
      "entrance fees",
      "all transfers."
    ]
  },
  {
    id: "8-days-budget-egypt-complete-tour",
    title: "Private Tour to Cairo, Giza Pyramids & Nile Cruise",
    description: "Cover Cairo, Luxor, and Aswan at an affordable price on this eight-day budget adventure. Stay in comfortable hotels, travel by domestic flights, and explore the key monuments with an expert local guide.",
    price: 1200,
    duration: "8 Days / 7 Nights",
    location: "Cairo, Luxor, Aswan",
    category: "adventure",
    image: "https://images.unsplash.com/photo-1600577916048-804c9191e36c?auto=format&fit=crop&q=80&w=1200",
    rating: 4.8,
    reviewsCount: 214,
    itinerary: [
      {
        day: 1,
        title: "Day 1: Arrival & Welcome",
        description: "Arrive and check into your accommodation. Meet your guide for a brief introduction to your tour details.",
        activities: [
          {
            title: "Arrival & Welcome Highlights",
            description: "Arrive and check into your accommodation. Meet your guide for a brief introduction to your tour details.",
            icon: "transfer"
          }
        ]
      },
      {
        day: 2,
        title: "Day 2: Visit Pyramids",
        description: "Take a guided tour to experience the majestic Pyramids in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Pyramids Highlights",
            description: "Take a guided tour to experience the majestic Pyramids in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 3,
        title: "Day 3: Visit Nile Valley temples",
        description: "Take a guided tour to experience the majestic Nile Valley temples in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Nile Valley temples Highlights",
            description: "Take a guided tour to experience the majestic Nile Valley temples in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 4,
        title: "Day 4: Visit Abu Simbel",
        description: "Take a guided tour to experience the majestic Abu Simbel in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Abu Simbel Highlights",
            description: "Take a guided tour to experience the majestic Abu Simbel in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 5,
        title: "Day 5: Visit Aswan",
        description: "Take a guided tour to experience the majestic Aswan in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Aswan Highlights",
            description: "Take a guided tour to experience the majestic Aswan in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 6,
        title: "Day 6: Visit Hurghada option.",
        description: "Take a guided tour to experience the majestic Hurghada option. in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Hurghada option. Highlights",
            description: "Take a guided tour to experience the majestic Hurghada option. in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 7,
        title: "Day 7: Visit Pyramids",
        description: "Take a guided tour to experience the majestic Pyramids in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Pyramids Highlights",
            description: "Take a guided tour to experience the majestic Pyramids in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 8,
        title: "Day 8: Departure",
        description: "Complete your final sightseeing and transfer to the airport for departure.",
        activities: [
          {
            title: "Departure Highlights",
            description: "Complete your final sightseeing and transfer to the airport for departure.",
            icon: "transfer"
          }
        ]
      }
    ],
    highlights: [
      "Pyramids",
      "Nile Valley temples",
      "Abu Simbel",
      "Aswan",
      "Hurghada option."
    ]
  },
  {
    id: "9-days-cairo-alexandria-luxor-aswan-trip",
    title: "Cairo, Alexandria, Luxor, and Aswan Private Trip",
    description: "Go beyond the pyramids and explore Egypt in full dimension. This nine-day journey adds the magnificent Mediterranean city of Alexandria — with its ancient library, Roman ruins, and seaside citadel — to the classic Upper Egypt circuit. A truly well-rounded adventure spanning thousands of years of civilization.",
    price: 1370,
    duration: "9 Days / 8 Nights",
    location: "Cairo, Alexandria, Luxor, Aswan",
    category: "historical",
    image: "https://images.unsplash.com/photo-1599957134371-55cc0d6f281e?auto=format&fit=crop&q=80&w=1200",
    rating: 4.6,
    reviewsCount: 146,
    itinerary: [
      {
        day: 1,
        title: "Day 1: Arrive Cairo",
        description: "Transfer and welcome.",
        activities: [
          {
            title: "Arrive Cairo Highlights",
            description: "Transfer and welcome.",
            icon: "transfer"
          }
        ]
      },
      {
        day: 2,
        title: "Day 2: Giza Pyramids, Sphinx, Egyptian Museum",
        description: "Overnight Cairo.",
        activities: [
          {
            title: "Giza Pyramids, Sphinx, Egyptian Museum Highlights",
            description: "Overnight Cairo.",
            icon: "tour"
          }
        ]
      },
      {
        day: 3,
        title: "Day 3: Day trip to Alexandria — Bibliotheca Alexandrina, Qaitbay Citadel, Pompey's Pillar, Montaza Gardens",
        description: "Return to Cairo. Overnight Cairo.",
        activities: [
          {
            title: "Day trip to Alexandria — Bibliotheca Alexandrina, Qaitbay Citadel, Pompey's Pillar, Montaza Gardens Highlights",
            description: "Return to Cairo. Overnight Cairo.",
            icon: "tour"
          }
        ]
      },
      {
        day: 4,
        title: "Day 4: Saqqara, Memphis, Old Cairo",
        description: "Overnight Cairo.",
        activities: [
          {
            title: "Saqqara, Memphis, Old Cairo Highlights",
            description: "Overnight Cairo.",
            icon: "tour"
          }
        ]
      },
      {
        day: 5,
        title: "Day 5: Fly to Luxor",
        description: "Karnak Temple, Luxor Temple. Overnight Luxor.",
        activities: [
          {
            title: "Fly to Luxor Highlights",
            description: "Karnak Temple, Luxor Temple. Overnight Luxor.",
            icon: "tour"
          }
        ]
      },
      {
        day: 6,
        title: "Day 6: Valley of the Kings, Hatshepsut Temple, Colossi of Memnon",
        description: "Overnight Luxor.",
        activities: [
          {
            title: "Valley of the Kings, Hatshepsut Temple, Colossi of Memnon Highlights",
            description: "Overnight Luxor.",
            icon: "tour"
          }
        ]
      },
      {
        day: 7,
        title: "Day 7: Travel to Aswan via Edfu and Kom Ombo",
        description: "Overnight Aswan.",
        activities: [
          {
            title: "Travel to Aswan via Edfu and Kom Ombo Highlights",
            description: "Overnight Aswan.",
            icon: "tour"
          }
        ]
      },
      {
        day: 8,
        title: "Day 8: Abu Simbel excursion",
        description: "Philae Temple, Unfinished Obelisk. Nubian Village visit. Overnight Aswan.",
        activities: [
          {
            title: "Abu Simbel excursion Highlights",
            description: "Philae Temple, Unfinished Obelisk. Nubian Village visit. Overnight Aswan.",
            icon: "tour"
          }
        ]
      },
      {
        day: 9,
        title: "Day 9: Fly to Cairo",
        description: "Departure.",
        activities: [
          {
            title: "Fly to Cairo Highlights",
            description: "Departure.",
            icon: "tour"
          }
        ]
      }
    ],
    inclusions: [
      "Hotel accommodation",
      "domestic flights",
      "private Egyptologist guide",
      "daily breakfast",
      "all entrance fees",
      "all transfers."
    ]
  },
  {
    id: "12-days-family-egypt-red-sea-holiday",
    title: "Cairo, Nile Cruise, and Hurghada Vacation",
    description: "Combine Egypt's ancient wonders with a family beach holiday at the Red Sea. After exploring the Pyramids, Luxor, and Aswan, the whole family will love snorkeling the vibrant coral reefs of Hurghada, enjoying water parks, and relaxing on beautiful sandy beaches.",
    price: 1740,
    duration: "12 Days / 11 Nights",
    location: "Cairo, Luxor, Aswan, Hurghada",
    category: "adventure",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=1200",
    rating: 4.5,
    reviewsCount: 286,
    itinerary: [
      {
        day: 1,
        title: "Day 1: Arrival & Welcome",
        description: "Arrive and check into your accommodation. Meet your guide for a brief introduction to your tour details.",
        activities: [
          {
            title: "Arrival & Welcome Highlights",
            description: "Arrive and check into your accommodation. Meet your guide for a brief introduction to your tour details.",
            icon: "transfer"
          }
        ]
      },
      {
        day: 2,
        title: "Day 2: Visit Pyramids",
        description: "Take a guided tour to experience the majestic Pyramids in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Pyramids Highlights",
            description: "Take a guided tour to experience the majestic Pyramids in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 3,
        title: "Day 3: Visit temples",
        description: "Take a guided tour to experience the majestic temples in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit temples Highlights",
            description: "Take a guided tour to experience the majestic temples in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 4,
        title: "Day 4: Visit Red Sea snorkeling",
        description: "Take a guided tour to experience the majestic Red Sea snorkeling in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Red Sea snorkeling Highlights",
            description: "Take a guided tour to experience the majestic Red Sea snorkeling in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 5,
        title: "Day 5: Visit beach resort",
        description: "Take a guided tour to experience the majestic beach resort in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit beach resort Highlights",
            description: "Take a guided tour to experience the majestic beach resort in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 6,
        title: "Day 6: Visit water sports",
        description: "Take a guided tour to experience the majestic water sports in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit water sports Highlights",
            description: "Take a guided tour to experience the majestic water sports in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 7,
        title: "Day 7: Visit family entertainment.",
        description: "Take a guided tour to experience the majestic family entertainment. in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit family entertainment. Highlights",
            description: "Take a guided tour to experience the majestic family entertainment. in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 8,
        title: "Day 8: Visit Pyramids",
        description: "Take a guided tour to experience the majestic Pyramids in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Pyramids Highlights",
            description: "Take a guided tour to experience the majestic Pyramids in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 9,
        title: "Day 9: Visit temples",
        description: "Take a guided tour to experience the majestic temples in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit temples Highlights",
            description: "Take a guided tour to experience the majestic temples in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 10,
        title: "Day 10: Visit Red Sea snorkeling",
        description: "Take a guided tour to experience the majestic Red Sea snorkeling in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit Red Sea snorkeling Highlights",
            description: "Take a guided tour to experience the majestic Red Sea snorkeling in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 11,
        title: "Day 11: Visit beach resort",
        description: "Take a guided tour to experience the majestic beach resort in detail, including historical briefings and photo sessions.",
        activities: [
          {
            title: "Visit beach resort Highlights",
            description: "Take a guided tour to experience the majestic beach resort in detail, including historical briefings and photo sessions.",
            icon: "tour"
          }
        ]
      },
      {
        day: 12,
        title: "Day 12: Departure",
        description: "Complete your final sightseeing and transfer to the airport for departure.",
        activities: [
          {
            title: "Departure Highlights",
            description: "Complete your final sightseeing and transfer to the airport for departure.",
            icon: "transfer"
          }
        ]
      }
    ],
    highlights: [
      "Pyramids",
      "temples",
      "Red Sea snorkeling",
      "beach resort",
      "water sports",
      "family entertainment."
    ]
  },
  {
    id: "14-days-trip-to-the-best-of-egypt",
    title: "Marvelous of Egypt Pyramids Tour",
    description: "Two full weeks to experience everything Egypt has to offer — pyramids, Nile cruises, Mediterranean coastlines, and Red Sea beaches. This is the definitive Egypt journey, covering every major region of the country while leaving room to breathe and truly savor each destination.",
    price: 1920,
    duration: "14 Days / 13 Nights",
    location: "Cairo, Nile River",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1605649440417-513b636030c1?auto=format&fit=crop&q=80&w=1200",
    rating: 4.8,
    reviewsCount: 48,
    itinerary: [
      {
        day: 1,
        title: "Day 1: Arrive Cairo",
        description: "Transfer and welcome.",
        activities: [
          {
            title: "Arrive Cairo Highlights",
            description: "Transfer and welcome.",
            icon: "transfer"
          }
        ]
      },
      {
        day: 2,
        title: "Day 2: Giza Pyramids, Sphinx, Solar Boat Museum",
        description: "",
        activities: [
          {
            title: "Giza Pyramids, Sphinx, Solar Boat Museum Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 3,
        title: "Day 3: Egyptian Museum, Islamic Cairo, Khan El Khalili",
        description: "",
        activities: [
          {
            title: "Egyptian Museum, Islamic Cairo, Khan El Khalili Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 4,
        title: "Day 4: Saqqara, Memphis, Dahshur",
        description: "",
        activities: [
          {
            title: "Saqqara, Memphis, Dahshur Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 5,
        title: "Day 5: Day trip to Alexandria",
        description: "",
        activities: [
          {
            title: "Day trip to Alexandria Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 6,
        title: "Day 6: Fly to Luxor",
        description: "Karnak and Luxor Temples.",
        activities: [
          {
            title: "Fly to Luxor Highlights",
            description: "Karnak and Luxor Temples.",
            icon: "tour"
          }
        ]
      },
      {
        day: 7,
        title: "Day 7: Valley of the Kings, Hatshepsut, Deir el-Medina",
        description: "",
        activities: [
          {
            title: "Valley of the Kings, Hatshepsut, Deir el-Medina Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 8,
        title: "Day 8: Board Nile Cruise",
        description: "Sail toward Edfu.",
        activities: [
          {
            title: "Board Nile Cruise Highlights",
            description: "Sail toward Edfu.",
            icon: "tour"
          }
        ]
      },
      {
        day: 9,
        title: "Day 9: Edfu Temple, Kom Ombo",
        description: "Sail to Aswan.",
        activities: [
          {
            title: "Edfu Temple, Kom Ombo Highlights",
            description: "Sail to Aswan.",
            icon: "tour"
          }
        ]
      },
      {
        day: 10,
        title: "Day 10: Philae Temple, High Dam, Nubian Village",
        description: "Overnight onboard.",
        activities: [
          {
            title: "Philae Temple, High Dam, Nubian Village Highlights",
            description: "Overnight onboard.",
            icon: "tour"
          }
        ]
      },
      {
        day: 11,
        title: "Day 11: Abu Simbel excursion",
        description: "Fly to Cairo. Overnight Cairo.",
        activities: [
          {
            title: "Abu Simbel excursion Highlights",
            description: "Fly to Cairo. Overnight Cairo.",
            icon: "tour"
          }
        ]
      },
      {
        day: 12,
        title: "Day 12: Fly to Hurghada or Sharm El Sheikh",
        description: "Beach resort. Overnight.",
        activities: [
          {
            title: "Fly to Hurghada or Sharm El Sheikh Highlights",
            description: "Beach resort. Overnight.",
            icon: "tour"
          }
        ]
      },
      {
        day: 13,
        title: "Day 13: Free leisure day — snorkeling, diving, spa, or desert safari",
        description: "",
        activities: [
          {
            title: "Free leisure day — snorkeling, diving, spa, or desert safari Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 14,
        title: "Day 14: Transfer to airport",
        description: "Departure.",
        activities: [
          {
            title: "Transfer to airport Highlights",
            description: "Departure.",
            icon: "transfer"
          }
        ]
      }
    ],
    inclusions: [
      "Hotel accommodation",
      "full-board Nile cruise",
      "domestic flights",
      "private guide",
      "daily breakfast",
      "entrance fees",
      "all transfers."
    ]
  },
  {
    id: "15-days-marvelous-egypt-tour-package",
    title: "Best of Egypt Private Tour",
    description: "The grand Egypt experience — fifteen days of pure wonder across every corner of this extraordinary country. From the pyramids of Giza and the temples of Luxor to the Red Sea coast and the Western Desert, this tour is for the adventurous traveler who refuses to miss a single thing.",
    price: 1930,
    duration: "15 Days / 14 Nights",
    location: "Cairo, Giza, Luxor, Western Desert",
    category: "cultural",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=1200",
    rating: 4.5,
    reviewsCount: 210,
    itinerary: [
      {
        day: 1,
        title: "Day 1: Arrive Cairo",
        description: "Welcome transfer.",
        activities: [
          {
            title: "Arrive Cairo Highlights",
            description: "Welcome transfer.",
            icon: "transfer"
          }
        ]
      },
      {
        day: 2,
        title: "Day 2: Giza Pyramids, Sphinx, Valley Temple, Solar Boat Museum",
        description: "",
        activities: [
          {
            title: "Giza Pyramids, Sphinx, Valley Temple, Solar Boat Museum Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 3,
        title: "Day 3: Egyptian Museum, Coptic Cairo, Islamic Cairo, Khan El Khalili",
        description: "",
        activities: [
          {
            title: "Egyptian Museum, Coptic Cairo, Islamic Cairo, Khan El Khalili Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 4,
        title: "Day 4: Saqqara, Memphis, Dahshur Pyramids",
        description: "",
        activities: [
          {
            title: "Saqqara, Memphis, Dahshur Pyramids Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 5,
        title: "Day 5: Day trip to Alexandria — Library, Citadel, Roman ruins",
        description: "",
        activities: [
          {
            title: "Day trip to Alexandria — Library, Citadel, Roman ruins Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 6,
        title: "Day 6: Fly to Luxor",
        description: "Karnak Temple, Luxor Temple.",
        activities: [
          {
            title: "Fly to Luxor Highlights",
            description: "Karnak Temple, Luxor Temple.",
            icon: "tour"
          }
        ]
      },
      {
        day: 7,
        title: "Day 7: Valley of the Kings, Hatshepsut Temple, Colossi of Memnon",
        description: "",
        activities: [
          {
            title: "Valley of the Kings, Hatshepsut Temple, Colossi of Memnon Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 8,
        title: "Day 8: Board Nile Cruise",
        description: "Edfu Temple. Sail to Kom Ombo.",
        activities: [
          {
            title: "Board Nile Cruise Highlights",
            description: "Edfu Temple. Sail to Kom Ombo.",
            icon: "tour"
          }
        ]
      },
      {
        day: 9,
        title: "Day 9: Kom Ombo Temple",
        description: "Sail to Aswan. Philae Temple.",
        activities: [
          {
            title: "Kom Ombo Temple Highlights",
            description: "Sail to Aswan. Philae Temple.",
            icon: "tour"
          }
        ]
      },
      {
        day: 10,
        title: "Day 10: Abu Simbel full excursion",
        description: "Nubian Village. Overnight Aswan.",
        activities: [
          {
            title: "Abu Simbel full excursion Highlights",
            description: "Nubian Village. Overnight Aswan.",
            icon: "tour"
          }
        ]
      },
      {
        day: 11,
        title: "Day 11: Fly to Cairo",
        description: "Optional bazaar visit.",
        activities: [
          {
            title: "Fly to Cairo Highlights",
            description: "Optional bazaar visit.",
            icon: "tour"
          }
        ]
      },
      {
        day: 12,
        title: "Day 12: Drive to Bahariya Oasis / Western Desert Safari",
        description: "Overnight desert camp.",
        activities: [
          {
            title: "Drive to Bahariya Oasis / Western Desert Safari Highlights",
            description: "Overnight desert camp.",
            icon: "tour"
          }
        ]
      },
      {
        day: 13,
        title: "Day 13: Return to Cairo",
        description: "Fly to Hurghada or Sharm.",
        activities: [
          {
            title: "Return to Cairo Highlights",
            description: "Fly to Hurghada or Sharm.",
            icon: "tour"
          }
        ]
      },
      {
        day: 14,
        title: "Day 14: Red Sea leisure — snorkeling, beach, optional diving or hike",
        description: "",
        activities: [
          {
            title: "Red Sea leisure — snorkeling, beach, optional diving or hike Highlights",
            description: "",
            icon: "tour"
          }
        ]
      },
      {
        day: 15,
        title: "Day 15: Transfer to airport",
        description: "Departure.",
        activities: [
          {
            title: "Transfer to airport Highlights",
            description: "Departure.",
            icon: "transfer"
          }
        ]
      }
    ],
    inclusions: [
      "Hotels + desert camp + full-board Nile cruise",
      "domestic flights",
      "private Egyptologist guide",
      "daily breakfast",
      "entrance fees",
      "all transfers."
    ]
  }
];

export const SAMPLE_BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Decoding the Book of the Dead",
    excerpt: "Understanding the journey through the Duat and the weighing of the heart.",
    content: "...",
    author: "Dr. Sarah Amin",
    date: "2024-03-15",
    image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&q=80&w=1200",
    tags: [
      "History",
      "Spirituality"
    ]
  },
  {
    id: "2",
    title: "5 Tips for Sustainable Travel in Egypt",
    excerpt: "How to respect local customs and minimize your footprint.",
    content: "...",
    author: "Ahmed Hassan",
    date: "2024-03-10",
    image: "https://images.unsplash.com/photo-1541410965313-d53b3c16ef17?auto=format&fit=crop&q=80&w=1200",
    tags: [
      "Tips",
      "Sustainability"
    ]
  }
];
