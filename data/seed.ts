import type {
  Activity,
  BioSection,
  ElectoralRow,
  FocusArea,
  GalleryPhoto,
  InstagramPost,
  PosterCategory,
  Settings,
  TimelineEvent,
  UpdateItem,
} from "@/types";

/**
 * Default content. Every factual statement here maps to a fact ID in research/research-report.md.
 * The admin dashboard copies this into the database the first time a collection is opened, after which
 * the database is the source of truth.
 */

export const seedBio: BioSection[] = [
  {
    id: "bio-intro",
    key: "intro",
    order: 1,
    published: true,
    title: { en: "Introduction", te: "పరిచయం" },
    body: {
      en: "Paritala Sreeram is a Telugu Desam Party leader from Andhra Pradesh. He is the party's in-charge for the Dharmavaram constituency and the son of the late Paritala Ravindra and Paritala Sunitha.",
      te: "పరిటాల శ్రీరామ్ ఆంధ్రప్రదేశ్‌కు చెందిన తెలుగుదేశం పార్టీ నాయకుడు. ఆయన ధర్మవరం నియోజకవర్గ పార్టీ ఇన్‌చార్జ్‌గా ఉన్నారు; దివంగత పరిటాల రవీంద్ర, పరిటాల సునీత గార్ల కుమారుడు.",
    },
    sourceIds: ["S01", "S04", "S05", "S12"],
  },
  {
    id: "bio-background",
    key: "background",
    order: 2,
    published: true,
    title: { en: "Personal background", te: "వ్యక్తిగత నేపథ్యం" },
    body: {
      en: "In his 2019 election affidavit he declared business and agriculture as his profession. On his official Instagram profile he describes himself as the elder son of Paritala Ravindra.",
      te: "2019 ఎన్నికల అఫిడవిట్‌లో ఆయన తన వృత్తిని వ్యాపారం, వ్యవసాయంగా పేర్కొన్నారు. తన అధికారిక ఇన్‌స్టాగ్రామ్ ప్రొఫైల్‌లో పరిటాల రవీంద్ర పెద్ద కుమారుడిగా తనను పరిచయం చేసుకున్నారు.",
    },
    sourceIds: ["S01", "S12"],
  },
  {
    id: "bio-education",
    key: "education",
    order: 3,
    published: true,
    title: { en: "Education", te: "విద్యార్హతలు" },
    body: {
      en: "As declared in his 2019 election affidavit, he is a graduate and holds a diploma in international business from MDIS, completed in August 2009.",
      te: "2019 ఎన్నికల అఫిడవిట్ ప్రకారం ఆయన పట్టభద్రుడు; 2009 ఆగస్టులో MDIS నుండి ఇంటర్నేషనల్ బిజినెస్‌లో డిప్లొమా పూర్తి చేశారు.",
    },
    sourceIds: ["S01"],
  },
  {
    id: "bio-family",
    key: "family",
    order: 4,
    published: true,
    title: { en: "Family background", te: "కుటుంబ నేపథ్యం" },
    body: {
      en: "His father, Paritala Ravindra, was a Telugu Desam Party leader who was assassinated on 24 January 2005. His mother, Paritala Sunitha, served as a minister in the Andhra Pradesh government from 2014 to 2019 and was elected MLA for Raptadu in 2024.",
      te: "ఆయన తండ్రి పరిటాల రవీంద్ర తెలుగుదేశం పార్టీ నాయకుడు; 2005 జనవరి 24న హత్యకు గురయ్యారు. తల్లి పరిటాల సునీత 2014 నుండి 2019 వరకు ఆంధ్రప్రదేశ్ ప్రభుత్వంలో మంత్రిగా పనిచేశారు; 2024లో రాప్తాడు ఎమ్మెల్యేగా ఎన్నికయ్యారు.",
    },
    sourceIds: ["S02", "S05", "S10", "S11"],
  },
  {
    id: "bio-journey",
    key: "journey",
    order: 5,
    published: true,
    title: { en: "Political journey", te: "రాజకీయ ప్రయాణం" },
    body: {
      en: "In 2019 his mother stepped aside from Raptadu and he contested the seat as the TDP candidate. When the Dharmavaram seat went to the BJP under the 2024 alliance, he said he would keep working with party cadres in the constituency. In October 2026 he filed his nomination for the Nallacheruvu ZPTC seat in the local body elections.",
      te: "2019లో ఆయన తల్లి రాప్తాడు స్థానం నుండి పక్కకు తప్పుకోగా, ఆయన టీడీపీ అభ్యర్థిగా పోటీ చేశారు. 2024 పొత్తులో ధర్మవరం స్థానం బీజేపీకి వెళ్లినప్పుడు, నియోజకవర్గంలో పార్టీ శ్రేణులతో కలిసి పనిచేస్తూనే ఉంటానని ఆయన చెప్పారు. 2026 అక్టోబర్‌లో స్థానిక సంస్థల ఎన్నికల్లో నల్లచెరువు జడ్పీటీసీ స్థానానికి నామినేషన్ దాఖలు చేశారు.",
    },
    sourceIds: ["S02", "S04", "S05", "S09", "S10"],
  },
  {
    id: "bio-roles",
    key: "roles",
    order: 6,
    published: true,
    title: { en: "Public roles and responsibilities", te: "ప్రజా బాధ్యతలు" },
    body: {
      en: "Telugu Desam Party in-charge, Dharmavaram constituency.\n\nChairman, Paritala Ravindra Memorial Trust (as stated on his official Instagram profile).",
      te: "తెలుగుదేశం పార్టీ ఇన్‌చార్జ్, ధర్మవరం నియోజకవర్గం.\n\nపరిటాల రవీంద్ర మెమోరియల్ ట్రస్ట్ ఛైర్మన్ (ఆయన అధికారిక ఇన్‌స్టాగ్రామ్ ప్రొఫైల్‌లో పేర్కొన్న ప్రకారం).",
    },
    sourceIds: ["S04", "S05", "S12"],
  },
];

/**
 * Areas of focus: informational categories only. Descriptions are intentionally empty — they must be written
 * and approved by the office before publication (Admin → Areas of focus). They are not promises or claims.
 */
/** Path of the official portrait supplied by the site owner (bundled in /public so it works on every deployment). */
export const PORTRAIT_PATH = "/images/portraits/paritala-sreeram-official-portrait.webp";

/**
 * Photographs supplied by the site owner. No caption, event date or original post URL is recorded because none
 * was provided - those stay empty until the owner confirms them (see research/photo-register.md).
 */
export const seedGallery: GalleryPhoto[] = [
  {
    id: "gal-official-portrait",
    order: 1,
    published: true,
    title: { en: "Official portrait", te: "అధికారిక చిత్రం" },
    category: "portraits",
    image: PORTRAIT_PATH,
    width: 1500,
    height: 844,
    alt: {
      en: "Paritala Sreeram in a white shirt with hands folded in a namaste greeting, against a yellow background",
      te: "పసుపు నేపథ్యంలో తెల్ల చొక్కా ధరించి చేతులు జోడించి నమస్కరిస్తున్న పరిటాల శ్రీరామ్",
    },
    date: "",
    sourceUrl: "",
    credit: "Supplied by the site owner",
    permission: "authorised",
    allowDownload: false,
    featured: true,
  },
];

export const seedFocus: FocusArea[] = [
  { id: "focus-economic", order: 1, published: true, title: { en: "Economic Development", te: "ఆర్థికాభివృద్ధి" }, description: { en: "", te: "" } },
  { id: "focus-infrastructure", order: 2, published: true, title: { en: "Infrastructure Development", te: "మౌలిక సదుపాయాల అభివృద్ధి" }, description: { en: "", te: "" } },
  { id: "focus-welfare", order: 3, published: true, title: { en: "Social Welfare", te: "సామాజిక సంక్షేమం" }, description: { en: "", te: "" } },
  { id: "focus-governance", order: 4, published: true, title: { en: "Good Governance", te: "సుపరిపాలన" }, description: { en: "", te: "" } },
  { id: "focus-culture", order: 5, published: true, title: { en: "Telugu Cultural Heritage", te: "తెలుగు సాంస్కృతిక వారసత్వం" }, description: { en: "", te: "" } },
  { id: "focus-community", order: 6, published: true, title: { en: "Community Engagement", te: "ప్రజలతో అనుసంధానం" }, description: { en: "", te: "" } },
];

export const seedTimeline: TimelineEvent[] = [
  {
    id: "tl-2005",
    year: "2005",
    date: "2005-01-24",
    order: 1,
    published: true,
    title: { en: "Loss of his father", te: "తండ్రి పరిటాల రవీంద్ర హత్య" },
    body: {
      en: "His father, Telugu Desam Party leader Paritala Ravindra, was assassinated on 24 January 2005.",
      te: "ఆయన తండ్రి, తెలుగుదేశం పార్టీ నాయకుడు పరిటాల రవీంద్ర 2005 జనవరి 24న హత్యకు గురయ్యారు.",
    },
    sourceIds: ["S05", "S11"],
  },
  {
    id: "tl-2009",
    year: "2009",
    date: "2009-08-01",
    order: 2,
    published: true,
    title: { en: "Diploma in international business", te: "ఇంటర్నేషనల్ బిజినెస్‌లో డిప్లొమా" },
    body: {
      en: "Completed a diploma in international business at MDIS (August 2009), as declared in his election affidavit.",
      te: "MDIS నుండి ఇంటర్నేషనల్ బిజినెస్‌లో డిప్లొమా పూర్తి చేశారు (2009 ఆగస్టు) — ఎన్నికల అఫిడవిట్‌లో పేర్కొన్న ప్రకారం.",
    },
    sourceIds: ["S01"],
  },
  {
    id: "tl-2019",
    year: "2019",
    order: 3,
    published: true,
    title: { en: "TDP candidate for Raptadu", te: "రాప్తాడు టీడీపీ అభ్యర్థి" },
    body: {
      en: "With his mother stepping aside, he contested the Raptadu Assembly seat for the TDP and finished second with 85,626 votes.",
      te: "తల్లి పక్కకు తప్పుకోవడంతో రాప్తాడు అసెంబ్లీ స్థానానికి టీడీపీ తరఫున పోటీ చేసి 85,626 ఓట్లతో రెండో స్థానంలో నిలిచారు.",
    },
    sourceIds: ["S02", "S03", "S10"],
  },
  {
    id: "tl-2024",
    year: "2024",
    date: "2024-03-31",
    order: 4,
    published: true,
    title: { en: "Dharmavaram seat allotted to the BJP", te: "ధర్మవరం స్థానం బీజేపీకి కేటాయింపు" },
    body: {
      en: "Under the alliance seat-sharing, Dharmavaram went to the BJP. He stayed in the constituency and said he would continue working with party cadres.",
      te: "పొత్తులో భాగంగా ధర్మవరం స్థానం బీజేపీకి వెళ్లింది. ఆయన నియోజకవర్గంలోనే ఉంటూ పార్టీ శ్రేణులతో కలిసి పనిచేస్తానని చెప్పారు.",
    },
    sourceIds: ["S09", "S05"],
  },
  {
    id: "tl-2026",
    year: "2026",
    date: "2026-10-23",
    order: 5,
    published: true,
    title: { en: "Nomination for Nallacheruvu ZPTC", te: "నల్లచెరువు జడ్పీటీసీకి నామినేషన్" },
    body: {
      en: "On 23 October 2026 he filed his nomination for the Nallacheruvu ZPTC seat (Kadiri constituency, Sri Sathya Sai district), accompanied by Kadiri MLA Kandikunta Venkata Prasad and TDP district president M.S. Raju.",
      te: "2026 అక్టోబర్ 23న నల్లచెరువు జడ్పీటీసీ స్థానానికి (కదిరి నియోజకవర్గం, శ్రీ సత్యసాయి జిల్లా) నామినేషన్ దాఖలు చేశారు; కదిరి ఎమ్మెల్యే కందికుంట వెంకటప్రసాద్, టీడీపీ జిల్లా అధ్యక్షుడు ఎం.ఎస్. రాజు ఆయన వెంట ఉన్నారు.",
    },
    sourceIds: ["S04", "S05", "S06", "S07"],
  },
];

export const seedElectoral: ElectoralRow[] = [
  {
    id: "el-2019",
    year: "2019",
    order: 1,
    published: true,
    election: { en: "Andhra Pradesh Assembly — Raptadu", te: "ఆంధ్రప్రదేశ్ శాసనసభ — రాప్తాడు" },
    party: "TDP",
    outcome: { en: "Runner-up", te: "ద్వితీయ స్థానం" },
    detail: {
      en: "85,626 votes. Winner: Thopudurthi Prakash Reddy (YSRCP), 111,201 votes. Margin: 25,575.",
      te: "85,626 ఓట్లు. విజేత: తోపుదుర్తి ప్రకాష్ రెడ్డి (వైఎస్సార్‌సీపీ), 1,11,201 ఓట్లు. మెజారిటీ: 25,575.",
    },
    sourceIds: ["S02", "S03"],
  },
  {
    id: "el-2024",
    year: "2024",
    order: 2,
    published: true,
    election: { en: "Andhra Pradesh Assembly — Dharmavaram", te: "ఆంధ్రప్రదేశ్ శాసనసభ — ధర్మవరం" },
    party: "TDP",
    outcome: { en: "Did not contest", te: "పోటీ చేయలేదు" },
    detail: {
      en: "The seat was allotted to the BJP under the alliance; BJP's Satya Kumar Yadav won.",
      te: "పొత్తులో భాగంగా ఈ స్థానం బీజేపీకి కేటాయించారు; బీజేపీకి చెందిన సత్యకుమార్ యాదవ్ గెలిచారు.",
    },
    sourceIds: ["S02", "S09"],
  },
  {
    id: "el-2026",
    year: "2026",
    order: 3,
    published: true,
    election: { en: "Local bodies — Nallacheruvu ZPTC (Sri Sathya Sai district)", te: "స్థానిక సంస్థలు — నల్లచెరువు జడ్పీటీసీ (శ్రీ సత్యసాయి జిల్లా)" },
    party: "TDP",
    outcome: { en: "Candidate — result awaited", te: "అభ్యర్థి — ఫలితం రావాల్సి ఉంది" },
    detail: {
      en: "Nomination filed on 23 October 2026. Polling is reported for 5 November and counting for 7 November 2026.",
      te: "2026 అక్టోబర్ 23న నామినేషన్ దాఖలు చేశారు. పోలింగ్ నవంబర్ 5న, ఓట్ల లెక్కింపు నవంబర్ 7న జరుగుతాయని వార్తలు తెలిపాయి.",
    },
    sourceIds: ["S04", "S05", "S08"],
  },
];

export const seedUpdates: UpdateItem[] = [
  {
    id: "up-2026-10-23",
    date: "2026-10-23",
    order: 1,
    published: true,
    title: { en: "Files nomination for Nallacheruvu ZPTC", te: "నల్లచెరువు జడ్పీటీసీకి నామినేషన్ దాఖలు" },
    body: {
      en: "The Dharmavaram TDP in-charge filed his nomination at the Zilla Parishad office in Kothacheruvu. Press reports say he is expected to be the party's Sri Sathya Sai Zilla Parishad chairperson candidate if he wins.",
      te: "ధర్మవరం టీడీపీ ఇన్‌చార్జ్ కొత్తచెరువులోని జిల్లా పరిషత్ కార్యాలయంలో నామినేషన్ దాఖలు చేశారు. ఆయన గెలిస్తే శ్రీ సత్యసాయి జిల్లా పరిషత్ ఛైర్మన్ అభ్యర్థిగా ఉండే అవకాశం ఉందని వార్తలు పేర్కొన్నాయి.",
    },
    sourceName: "Deccan Chronicle",
    sourceUrl:
      "https://www.deccanchronicle.com/southern-states/andhra-pradesh/kadiri-tdps-paritala-sriram-to-contest-as-nallacheruvu-zptc-chairman-1998140",
  },
  {
    id: "up-2026-10-28",
    date: "2026-10-28",
    order: 2,
    published: true,
    title: { en: "MPTC/ZPTC polling moved to 5 November", te: "ఎంపీటీసీ/జడ్పీటీసీ పోలింగ్ నవంబర్ 5కు మార్పు" },
    body: {
      en: "The State Election Commission rescheduled rural local body polling to 5 November, with counting on 7 November, to avoid overlap with urban local body counting.",
      te: "పట్టణ స్థానిక సంస్థల ఓట్ల లెక్కింపుతో కలవకుండా రాష్ట్ర ఎన్నికల సంఘం గ్రామీణ స్థానిక సంస్థల పోలింగ్‌ను నవంబర్ 5కు, లెక్కింపును నవంబర్ 7కు మార్చినట్లు వార్తలు తెలిపాయి.",
    },
    sourceName: "Deccan Chronicle",
    sourceUrl:
      "https://www.deccanchronicle.com/southern-states/andhra-pradesh/ap-sec-reschedules-mptc-zptc-polls-to-november-5-1999650",
  },
];

export const seedActivities: Activity[] = [
  {
    id: "act-2026-zptc",
    category: "party",
    order: 1,
    published: true,
    title: { en: "Nomination for Nallacheruvu ZPTC", te: "నల్లచెరువు జడ్పీటీసీకి నామినేషన్" },
    description: {
      en: "Filed nomination at the Zilla Parishad office in Kothacheruvu for the local body elections, with Kadiri MLA Kandikunta Venkata Prasad and TDP district president M.S. Raju.",
      te: "స్థానిక సంస్థల ఎన్నికల కోసం కొత్తచెరువులోని జిల్లా పరిషత్ కార్యాలయంలో కదిరి ఎమ్మెల్యే కందికుంట వెంకటప్రసాద్, టీడీపీ జిల్లా అధ్యక్షుడు ఎం.ఎస్. రాజుతో కలిసి నామినేషన్ దాఖలు చేశారు.",
    },
    date: "2026-10-23",
    location: { en: "Kothacheruvu, Sri Sathya Sai district", te: "కొత్తచెరువు, శ్రీ సత్యసాయి జిల్లా" },
    sourceName: "Deccan Chronicle",
    sourceUrl:
      "https://www.deccanchronicle.com/southern-states/andhra-pradesh/paritala-sreeram-enters-fray-for-nallacheruvu-zptc-seat-as-td-nominee-1998264",
  },
];

const igBase = "https://www.instagram.com/paritalasreeramofficial";
export const seedInstagram: InstagramPost[] = [
  { id: "ig-1", url: `${igBase}/reel/DYud-a9Nx-7/`, order: 1, published: true },
  { id: "ig-2", url: `${igBase}/reel/DWtAQVxkWVz/`, order: 2, published: true },
  { id: "ig-3", url: `${igBase}/reel/DU8bJxlki9W/`, order: 3, published: true },
  { id: "ig-4", url: `${igBase}/p/DfPsAk6Eyrj/`, order: 4, published: true },
  { id: "ig-5", url: `${igBase}/p/DfPNB9bmnBp/`, order: 5, published: true },
];

export const seedPosterCategories: PosterCategory[] = [
  { id: "festival-greetings", order: 1, published: true, name: { en: "Festival greetings", te: "పండుగ శుభాకాంక్షలు" } },
  { id: "party-programmes", order: 2, published: true, name: { en: "Party programmes", te: "పార్టీ కార్యక్రమాలు" } },
  { id: "public-messages", order: 3, published: true, name: { en: "Public messages", te: "ప్రజా సందేశాలు" } },
  { id: "general", order: 4, published: true, name: { en: "General", te: "సాధారణ" } },
];

export const defaultSettings: Settings = {
  site: {
    name: { en: "Paritala Sreeram", te: "పరిటాల శ్రీరామ్" },
    tagline: { en: "Serving Dharmavaram and the people of Andhra Pradesh", te: "ధర్మవరం, ఆంధ్రప్రదేశ్ ప్రజల సేవలో" },
    designation: { en: "TDP In-charge, Dharmavaram", te: "టీడీపీ ఇన్‌చార్జ్, ధర్మవరం" },
    disclaimer: {
      en: "This is an independent public-profile website. It is not the official website of the Telugu Desam Party and does not imply party authorisation or endorsement.",
      te: "ఇది స్వతంత్ర ప్రజా పరిచయ వెబ్‌సైట్. ఇది తెలుగుదేశం పార్టీ అధికారిక వెబ్‌సైట్ కాదు; పార్టీ అనుమతి లేదా ఆమోదం ఉన్నట్లు సూచించదు.",
    },
  },
  social: {
    instagram: "https://www.instagram.com/paritalasreeramofficial/",
    telegram: "https://t.me/iParitalaSriram",
    facebook: "",
    x: "",
    youtube: "",
    whatsapp: "",
  },
  contact: {
    email: "",
    phone: "",
    address: { en: "", te: "" },
    note: { en: "", te: "" },
  },
  seo: {
    title: { en: "Paritala Sreeram — Telugu Desam Party, Dharmavaram", te: "పరిటాల శ్రీరామ్ — తెలుగుదేశం పార్టీ, ధర్మవరం" },
    description: {
      en: "Public profile of Paritala Sreeram, Telugu Desam Party in-charge for Dharmavaram, Andhra Pradesh: biography, political journey, public activities, posters and gallery.",
      te: "ధర్మవరం తెలుగుదేశం పార్టీ ఇన్‌చార్జ్ పరిటాల శ్రీరామ్ ప్రజా పరిచయం: జీవిత చరిత్ర, రాజకీయ ప్రయాణం, ప్రజా కార్యక్రమాలు, పోస్టర్లు, గ్యాలరీ.",
    },
    keywords: "Paritala Sreeram, Paritala Sriram, పరిటాల శ్రీరామ్, Dharmavaram, TDP, Telugu Desam Party",
    ogImage: "",
  },
  home: {
    heroImages: [PORTRAIT_PATH],
    heroImageAlt: { en: "Portrait of Paritala Sreeram", te: "పరిటాల శ్రీరామ్ చిత్రం" },
    heroIntro: {
      en: "Telugu Desam Party in-charge for Dharmavaram — public profile, activities and updates.",
      te: "ధర్మవరం తెలుగుదేశం పార్టీ ఇన్‌చార్జ్ — ప్రజా పరిచయం, కార్యక్రమాలు, తాజా సమాచారం.",
    },
  },
};
