export const protectedRoute = [
  "/dashboard",
  "/payout",
  "/transactions",
  "/users",
  "/commission",
  "/reports",
  "/kyc",
  "/members",
  "/settings",
  "/employee-management",
  "/wallet",
  "/kyc-request",
  "/request-fund",
  "/permission",
  "/profile/:id",
  "/logs",
  "/card-payout",
  "/verify-reset-password",
];

import {
  Wallet,
  ArrowDownCircle,
  Users,
  Percent,
  BarChart3,
  Shield,
  FileText,
  Settings,
  User,
  BadgeIndianRupee,
  LogIn,
  Activity,
  Landmark,
} from "lucide-react";

export const navbarTitleConfig = {
  "/dashboard": {
    title: "Dashboard",
    tagLine: "Overview of your system",
    icon: BarChart3,
  },
  "/request-fund": {
    title: "Add Fund Request",
    tagLine: "Manage fund request",
    icon: BadgeIndianRupee,
  },
  "/card-payout": {
    title: "Payout",
    tagLine: "Manage outgoing transactions",
    icon: ArrowDownCircle,
  },
  "/transactions": {
    title: "Transactions",
    tagLine: "All payment history",
    icon: FileText,
  },
  "/members": {
    title: "Members",
    tagLine: "Manage all members",
    icon: User,
  },
  "/users": {
    title: "Users",
    tagLine: "Manage your platform users",
    icon: Users,
  },
  "/commission": {
    title: "Commission Settings",
    tagLine: "Configure your commission rates",
    icon: Percent,
  },
  "/reports": {
    title: "Reports",
    tagLine: "Analytics & insights",
    icon: BarChart3,
  },
  "/kyc-request": {
    title: "KYC Verification",
    tagLine: "Verify your customers",
    icon: Shield,
  },
  "/wallet": {
    title: "Wallet",
    tagLine: "Wallet Management System",
    icon: Wallet,
  },
  "/settings": {
    title: "Settings",
    tagLine: "Manage application settings",
    icon: Settings,
  },
  "/employee-management": {
    title: "Employee Management",
    tagLine: "Manage Employee",
    icon: Users,
  },
  "/profile/:id": {
    title: "Profile",
    tagLine: "View and manage your profile",
    icon: User,
  },
  "/logs": {
    title: "Audit logs",
    tagLine: "View and manage your audit logs",
    icon: Activity,
  },
};

{
  /* <select class="form-control" id="bankselect">
  <option>select</option>
  <option value="SBIN0000001">STATE BANK OF INDIA</option>
  <option value="BARB0HEADOF">BANK OF BARODA</option>
  <option value="PUNB0244200">Punjab National Bank</option>
  <option value="UBIN0550451">UNION BANK OF INDIA</option>
  <option value="IDIB000L003">INDIAN BANK</option>
  <option value="BKID0000150">BANK OF INDIA</option>
  <option value="CBIN0281102">CENTRAL BANK OF INDIA</option>
  <option value="BARB0BUPGBX">BARODA UP BANK</option>
  <option value="HDFC0999999">HDFC BANK</option>
  <option value="KKBK0RTGSMI">Kotak Mahindra Bank</option>
  <option value="IPOS0000001">INDIA POST PAYMENTS BANK</option>
  <option value="CNRB0000002">CANARA BANK</option>
  <option value="PYTM0123456">PAYTM PAYMENTS BANK</option>
  <option value="ICIC0000011">ICICI Bank</option>
  <option value="UCBA0000001">UCO BANK</option>
  <option value="IOBA0009016">INDIAN OVERSEAS BANK</option>
  <option value="UTIB0000248">Axis Bank</option>
  <option value="INDB0000001">IndusInd Bank</option>
  <option value="FINO0000001">FINO PAYMENTS BANK</option>
  <option value="PUNB0MBGB06">DAKSHIN BIHAR GRAMIN BANK</option>
  <option value="IBKL0000039">IDBI BANK</option>
  <option value="CBIN0R10001">UTTAR BIHAR GRAMIN BANK</option>
  <option value="MAHB0000978">BANK OF MAHARASHTRA</option>
  <option value="KVBL0001254">KARUR VYSYA BANK</option>
  <option value="FDRL0000035">FEDERAL BANK</option>
  <option value="BARB0BRGBXX">BARODA RAJASTHAN KSHETRIYA GRAMIN BANK</option>
  <option value="PUNB0SUPGB5">PRATHAMA UP GRAMIN BANK</option>
  <option value="BDBL0001118">BANDHAN BANK</option>
  <option value="TMBL0000001">TAMILNAD MERCANTILE BANK</option>
  <option value="PSIB0000001">PUNJAB AND SIND BANK</option>
  <option value="CIUB0000001">CITY UNION BANK</option>
  <option value="AIRP0000001">AIRTEL PAYMENTS BANK</option>
  <option value="IDFB0010201">IDFC FIRST BANK</option>
  <option value="SIBL0000001">SOUTH INDIAN BANK</option>
  <option value="AUBL0000001">AU SMALL FINANCE BANK</option>
  <option value="BKID0ARYAGB">ARYAVART BANK</option>
  <option value="YESB0000001">Yes Bank</option>
  <option value="BARB0BGGBXX">BARODA GUJARAT GRAMIN BANK</option>
  <option value="BARB0BGGBXX">DENA GUJARAT GRAMIN BANK</option>
  <option value="UJVN0000001">UJJIVAN SMALL FINANCE BANK</option>
  <option value="JAKA0AALLAH">JAMMU AND KASHMIR BANK</option>
  <option value="RMGB0010001">RAJASTHAN MARUDHARA GRAMIN BANK</option>
  <option value="KARB0000001">KARNATAKA BANK</option>
  <option value="SRCB0000001">SARASWAT BANK</option>
  <option value="ESFB0000002">EQUITAS SMALL FINANCE BANK</option>
  <option value="PUNB0HGB001">SARVA HARYANA GRAMIN BANK</option>
  <option value="SBIN0RRMBGB">MADHYANCHAL GRAMIN BANK</option>
  <option value="SBIN0RRMBGB">MADHYA BHARAT GRAMIN BANK</option>
  <option value="MAHG0000001">MAHARASHTRA GRAMEEN BANK</option>
  <option value="COSB0000019">COSMOS BANK</option>
  <option value="PUNB0PGB003">PUNJAB GRAMIN BANK</option>
  <option value="ESMF0000001">ESAF SMALL FINANCE BANK</option>
  <option value="IBKL0497LUC">LATUR URBAN CO-OP BANK</option>
  <option value="DBSS0IN0811">DEVELOPMENT BANK OF SINGAPORE (DBS)</option>
  <option value="SBIN0RRVCGB">JHARKHAND RAJYA GRAMIN BANK</option>
  <option value="APGV0001101">ANDHRA PRADESH GRAMEENA VIKAS BANK</option>
  <option value="RATN0000001">RBL BANK</option>
  <option value="BACB0000001">BASSEIN CATHOLIC BANK</option>
  <option value="IOBA0ROGB01">ODISHA GRAMYA BANK</option>
  <option value="GSCB0UTMNBL">THE MANDVI NAGRIK SAHAKARI BANK</option>
  <option value="SBIN0RRSRGB">SAURASHTRA GRAMIN BANK</option>
  <option value="SBIN0RRUKGB">UTKAL GRAMEEN BANK</option>
  <option value="UCBA0RRBPBG">PASCHIM BANGA GRAMIN BANK</option>
  <option value="LAVB0000999">LAKSHMI VILAS BANK</option>
  <option value="DLXB0000001">DHANLAXMI BANK</option>
  <option value="PUNB0RRBBGB">BANGIYA GRAMIN VIKASH BANK</option>
  <option value="RNSB0000001">RAJKOT NAGARIK SAHAKARI BANK</option>
  <option value="DCBL0000001">DCB BANK</option>
  <option value="FSFB0000001">FINCARE SMALL FINANCE BANK</option>
  <option value="HDFC0CTUCBL">FINGROWTH CO-OP BANK</option>
  <option value="UTKS0000001">UTKARSH SMALL FINANCE BANK</option>
  <option value="GSCB0RJT001">RAJKOT DISTRICT CENTRAL CO-OP BANK</option>
  <option value="GSCB0UNNCBL">THE NARODA NAGRIK CO-OP BANK</option>
  <option value="GSCB0000001">THE GUJARAT STATE CO-OP BANK</option>
  <option value="APGB0000001">ANDHRA PRAGATHI GRAMEENA BANK</option>
  <option value="PJSB0000001">GP PARSIK SAHAKARI BANK</option>
  <option value="CLBL0000001">CAPITAL SMALL FINANCE BANK</option>
  <option value="SBIN0RRUTGB">UTTARAKHAND GRAMIN BANK</option>
  <option value="SCBL0036001">STANDARD CHARTERED BANK</option>
  <option value="GSCB0ADC001">THE AHMEDABAD DISTRICT CO-OP BANK</option>
  <option value="CSBK0000001">CSB BANK</option>
  <option value="KLGB0040101">KERALA GRAMIN BANK</option>
  <option value="HDFC0CAACOB">AKHAND ANAND CO-OP BANK</option>
  <option value="ABHY0065001">ABHYUDAYA CO-OP BANK</option>
  <option value="WBSC0BUCB01">BHATPARA NAIHATI CO-OP BANK</option>
  <option value="ICIC00MORAD">DISTRICT COOPERATIVE BANK (MORADABAD)</option>
  <option value="ICIC00HSBLW">HUTATMA SAHAKARI BANK</option>
  <option value="HDFC0CJBMLG">JANATA CO-OP BANK (MALEGAON)</option>
  <option value="KCCB0KLP001">THE KALUPUR COMMERCIAL CO-OP BANK</option>
  <option value="PKGB0010500">KARNATAKA GRAMIN BANK</option>
  <option value="HDFC0CCUB01">CHIKHLI URBAN CO-OP BANK</option>
  <option value="HDFC0CPUB03">PALI URBAN CO-OP BANK</option>
  <option value="NVNM0000001">THE NAVNIRMAN CO-OP BANK</option>
  <option value="GSCB0PDC001">PANCHMAHAL DISTRICT CO-OP BANK</option>
  <option value="YESB0AZSB01">ZILA SAHAKARI BANK (ALMORA)</option>
  <option value="HDFC0CIUCBL">INTEGRAL URBAN CO-OP BANK</option>
  <option value="ADCC0000001">THE AKOLA DISTRICT CENTRAL CO-OP BANK</option>
  <option value="APMC0000001">THE AP MAHESH CO-OP URBAN BANK</option>
  <option value="KACE0000002">THE KANGRA CENTRAL CO-OP BANK</option>
  <option value="NTBL0DEL080">THE NAINITAL BANK</option>
  <option value="HDFC0CPCUBL">THE POCHAMPALLY CO-OPERATIVE URBAN BANK</option>
  <option value="SURY0000001">SURYODAY SMALL FINANCE BANK</option>
  <option value="IBKL0063JCB">JHARKHAND STATE CO-OP BANK</option>
  <option value="HDFC0CAPCBL">AMBAJOGAI PEOPLES CO-OP BANK</option>
  <option value="ICIC00DDNSB">DEENDAYAL NAGARI SAHAKARI BANK</option>
  <option value="IBKL0218HNS">HIMATNAGAR NAGARIK SAHAKARI BANK</option>
  <option value="YESB0KCUB01">KHATTRI CO-OP URBAN BANK</option>
  <option value="SRCB0SSB001">SUNDARLAL SAWJI URBAN CO-OP BANK</option>
  <option value="HDFC0CTBCBL">THE BHAGYODAYA CO-OP BANK</option>
  <option value="YESB0FINCO2">FINANCIAL CO-OP BANK</option>
  <option value="YESB0SMCB05">SURAT MERCANTILE CO-OP BANK</option>
  <option value="HDFC0CTVCBL">THE VIJAY CO-OP BANK</option>
  <option value="GSCB0VDC001">VALSAD DISTRICT CENTRAL CO-OP BANK</option>
  <option value="UTIB0SKCU78">KOTTAKKAL CO-OP URBAN BANK</option>
  <option value="UTIB0SVNS01">VAISHYA NAGARI SAHAKARI BANK</option>
  <option value="TSAB0020001">
    THE KARIMNAGAR DISTRICT CO-OP CENTRAL BANK
  </option>
  <option value="IBKL0116DPC">DAPOLI URBAN CO-OP BANK</option>
  <option value="IBKL0116AUC">THE AJARA URBAN CO-OP BANK</option>
  <option value="CITI0000002">CITIBANK</option>
  <option value="KAIJ0000001">
    KALLAPPANNA AWADE ICHALKARANJI JANATA SAHAKARI BANK
  </option>
  <option value="NNSB0128002">NUTAN NAGARIK SAHAKARI BANK</option>
  <option value="YESB0NBL002">THE NATIONAL CO-OPERATIVE BANK</option>
  <option value="HDFC0CADARS">ADARSH CO-OP BANK (RAJASTHAN)</option>
  <option value="NKGS0000001">NKGSB CO-OP BANK</option>
  <option value="SBIN0RRDCGB">TELANGANA GRAMEENA BANK</option>
  <option value="PUNB0RRBTGB">TRIPURA GRAMIN BANK</option>
  <option value="ICIC00TSCBL">TRIPURA STATE CO-OP BANK</option>
  <option value="TJSB0000001">TJSB SAHAKARI BANK</option>
  <option value="KNSB0000001">THE KURMANCHAL NAGAR SAHKARI BANK</option>
  <option value="YESB0KNB006">SHREE KADI NAGARIK SAHAKARI BANK</option>
  <option value="HDFC0CSWSBL">SHREE WARANA SAHAKARI BANK</option>
  <option value="GSCB0BRC001">BHARUCH DISTRICT CENTRAL CO-OP BANK</option>
  <option value="HDFC0CTSMCB">THE SANGAMNER MERCHANTS CO-OP BANK</option>
  <option value="CBIN0MPDCAJ">JILA SAHAKARI KENDRIYA BANK (DEWAS)</option>
  <option value="HDFC0CTKNSB">THE KUKARWADA NAGRIK SAH BANK</option>
  <option value="HDFC0CBNSBL">BALASINOR NAGRIK SAHKARI BANK</option>
  <option value="YESB0URBAN1">URBAN CO-OP BANK (BASTI)</option>
  <option value="BCBM0000002">BHARAT CO-OP BANK (MUMBAI)</option>
  <option value="HDFC0CJALOR">JALORE NAGRIK SAHKARI BANK</option>
  <option value="HDFC0CSUCOB">SUCO SOUHARDA SAHAKARI BANK</option>
  <option value="KKBK0KMCB02">KOKAN MERCANTILE CO-OP BANK</option>
  <option value="IBKL0087PSB">PAVANA SAHAKARI BANK</option>
  <option value="GSCB0SKB001">
    THE SABARKANTHA DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="ICIC00ARIHT">SHRI ARIHANT CO-OP BANK</option>
  <option value="IBKL0150KMC">THE KANAKAMAHALAKSHMI CO-OP BANK</option>
  <option value="GSCB0USAURA">THE SAURASHTRA CO-OP BANK</option>
  <option value="HDFC0CSUVRN">SUVARNAYUG SAHAKARI BANK</option>
  <option value="HPSC0000001">THE HIMACHAL PRADESH STATE CO-OP BANK</option>
  <option value="HSBC0110002">HSBC BANK</option>
  <option value="IBKL0548PPC">PUNE PEOPLES CO-OP BANK</option>
  <option value="JSBL0000002">JANAKALYAN SAHAKARI BANK</option>
  <option value="KJSB0000002">THE KALYAN JANATA SAHAKARI BANK</option>
  <option value="KUCB0488000">THE KARAD URBAN CO-OP BANK</option>
  <option value="MUBL0000001">THE MUNICIPAL CO-OP BANK</option>
  <option value="SMCB0001000">SHIVALIK MERCANTILE CO-OP BANK</option>
  <option value="TBSB0000001">THANE BHARAT SAHAKARI BANK</option>
  <option value="VARA0000001">THE VARACHHA CO-OP BANK</option>
  <option value="VSBL0000001">THE VISHWESHWAR SAHAKARI BANK</option>
  <option value="PUNB0HPGB04">HIMACHAL PRADESH GRAMIN BANK</option>
  <option value="IDIB0PLB001">TAMIL NADU GRAMA BANK</option>
  <option value="IDIB0SGB001">SAPTAGIRI GRAMEENA BANK</option>
  <option value="HDFC0CANSCB">ANDAMAN &amp; NICOBAR STATE CO-OP BANK</option>
  <option value="RSCB0000001">THE RAJASTHAN STATE CO-OP BANK</option>
  <option value="WBSC0000001">THE WEST BENGAL STATE CO-OP BANK</option>
  <option value="JIOP0000001">JIO PAYMENTS BANK</option>
  <option value="SVCB0001002">THE HINDUSTAN CO-OP BANK</option>
  <option value="JSFB0CPC002">JANA SMALL FINANCE BANK</option>
  <option value="IBKL01066RC">THE ROHIKA CENTRAL CO-OP BANK</option>
  <option value="CBIN0MPDCAE">BHOPAL CO-OP CENTRAL BANK</option>
  <option value="HDFC0CCBL06">CITIZEN CO-OP BANK (NOIDA)</option>
  <option value="IBKL01642C1">CITIZENS CO-OP BANK</option>
  <option value="IBKL0JIVAN1">JIVAN COMMERCIAL CO-OP BANK</option>
  <option value="HDFC0CJCCBL">THE JUNAGADH COMM CO-OP BANK</option>
  <option value="MSBL0000001">MAHESH SAHAKARI BANK (PUNE)</option>
  <option value="HDFC0CMCBLD">MANSING CO-OP BANK</option>
  <option value="UTIB0SSNS01">SAIBABA NAGARI SAHAKARI BANK</option>
  <option value="IBKL0443SCC">SARVODAYA CO-OP BANK</option>
  <option value="YESB0SSBL01">SARVODAYA SAHAKARI BANK</option>
  <option value="SHBK0000001">SHINHAN BANK</option>
  <option value="YESB0CDC016">
    THE CHANDRAPUR DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="HDFC0CKUB01">KHAMGAON URBAN CO-OP BANK</option>
  <option value="IBKL0065SDC">
    THE SAMASTIPUR DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="CBIN0MPDCAO">INDORE PREMIER CO-OP BANK</option>
  <option value="JAKA0GRAMEN">JAMMU AND KASHMIR GRAMEEN BANK</option>
  <option value="NMCB0000001">
    THE NASIK MERCHANTS CO-OP BANK (NAMCO BANK)
  </option>
  <option value="HDFC0CPRCBL">PRERANA CO-OP BANK</option>
  <option value="ICIC00SIDRH">URBAN CO-OP BANK (SIDDHARTHANAGAR)</option>
  <option value="UTIB0SIPSB1">INDRAPRASTHA SEHKARI BANK</option>
  <option value="IBKL070CZSB">ZILA SAHAKARI BANK (CHAMOLI)</option>
  <option value="UTIB0SKDC01">KANNUR DISTRICT CO-OP BANK</option>
  <option value="GSCB0KDT001">KODINAR TALUKA CO-OP BANKING UNION</option>
  <option value="YESB0AUBHO1">AKOLA URBAN CO-OP BANK</option>
  <option value="MSNU0000029">THE MEHSANA URBAN CO-OP BANK</option>
  <option value="WBSC0MCCB15">MURSHIDABAD DISTRICT CENTRAL CO-OP BANK</option>
  <option value="IBKL0463KDC">KOLHAPUR DISTRICT CENTRAL CO-OP BANK</option>
  <option value="CBIN0MPDCAS">JILA SAHAKARI KENDRIYA BANK (KHARGONE)</option>
  <option value="HDFC0CSAMAT">SAMATA CO-OP DEVELOPMENT BANK</option>
  <option value="IBKL0116APC">THE ASTHA PEOPLES CO-OP BANK</option>
  <option value="HDFC0CPNSBL">POORNAWADI NAGRIK SAHAKARI BANK</option>
  <option value="GSCB0BKD001">BANASKANTHA DISTRICT CENTRAL CO-OP BANK</option>
  <option value="AJHC0001002">AMBARNATH JAI HIND CO-OP BANK</option>
  <option value="SBIN0RRARGB">ARUNACHAL PRADESH RURAL BANK</option>
  <option value="CBIN0R20002">CENTRAL MADHYA PRADESH GRAMIN BANK</option>
  <option value="SRCB0CNS001">CHEMBUR NAGARIK SAHAKARI BANK</option>
  <option value="CRGB0000101">CHHATTISGARH RAJYA GRAMIN BANK</option>
  <option value="SBIN0RRELGB">ELLAQUAI DEHATI BANK</option>
  <option value="ICIC00ETAWH">ETAWAH DISTRICT CO-OP BANK</option>
  <option value="HDFC0CJMCBL">JALNA MERCHANTS CO-OP BANK</option>
  <option value="JSBP0000098">JANATA SAHAKARI BANK</option>
  <option value="HDFC0CPCSBL">PUNE CANTONMENT SAHAKARI BANK</option>
  <option value="SBIN0RRMEGB">MEGHALAYA RURAL BANK</option>
  <option value="SBIN0RRMIGB">MIZORAM RURAL BANK</option>
  <option value="SVCB0000001">SVC CO-OP BANK</option>
  <option value="KKBK0PNSB01">PRIYADARSHANI NAGARI SAHAKARI BANK</option>
  <option value="HDFC0CSBL02">SADHANA SAHAKARI BANK (PUNE)</option>
  <option value="HDFC0CSHSBL">SHARAD SAHAKARI BANK</option>
  <option value="SIDC0001046">SINDHUDURG DISTRICT CENTRAL CO-OP BANK</option>
  <option value="YESB0SHBK01">SHREE SHARADA SAHAKARI BANK (PUNE)</option>
  <option value="HDFC0CSTUCB">STERLING URBAN CO-OP BANK</option>
  <option value="HDFC0CBCBBK">THE BANTRA CO-OPERTIVE BANK</option>
  <option value="HDFC0CEENAD">THE EENADU CO-OP URBAN BANK</option>
  <option value="HDFC0CTGCUB">THE GAYATRI CO-OPERATIVE URBAN BANK</option>
  <option value="KKBK0SPCB01">THE SHIRPUR PEOPLES CO-OP BANK</option>
  <option value="ICIC00VSCBL">VIKAS SOUHARDA CO-OP BANK</option>
  <option value="AMCB0660001">THE AHMEDABAD MERCANTILE CO-OP BANK</option>
  <option value="APBL0000001">THE ANDHRA PRADESH STATE CO-OP BANK</option>
  <option value="CCBL0209002">CITIZEN CREDIT CO-OP BANK</option>
  <option value="CRUB0000001">
    SHRI CHHATRAPATI RAJARSHI SHAHU URBAN CO-OP BANK
  </option>
  <option value="DNSB0000002">DOMBIVLI NAGARI SAHAKARI BANK</option>
  <option value="GBCB0000001">THE GREATER BOMBAY CO-OPERATIVE BANK</option>
  <option value="JANA0000002">JANASEVA SAHAKARI BANK</option>
  <option value="JPCB0000001">THE JALGAON PEOPLES CO-OP BANK</option>
  <option value="KVGB0000001">KARNATAKA VIKAS GRAMEENA BANK</option>
  <option value="MCBL0960002">MAHANAGAR CO-OP BANK</option>
  <option value="PMEC0000001">PRIME CO-OP BANK</option>
  <option value="RABO0000001">RABOBANK INTERNATIONAL</option>
  <option value="RSBL0000001">RAJGURUNAGAR SAHAKARI BANK</option>
  <option value="SDCB0000001">THE SURAT DISTRICT CO-OP BANK</option>
  <option value="SUTB0000001">THE SUTEX CO-OP BANK</option>
  <option value="TNSC0000001">
    TAMILNADU STATE APEX CO-OP BANK (TNSC BANK)
  </option>
  <option value="TSAB0000001">TELANGANA STATE CO-OP APEX BANK</option>
  <option value="PUNB0RRBAGB">ASSAM GRAMIN VIKASH BANK</option>
  <option value="UBIN0CG7999">CHAITANYA GODAVARI GRAMEENA BANK</option>
  <option value="BKID0NAMRGB">MADHYA PRADESH GRAMIN BANK</option>
  <option value="YESB0BSCB01">BIHAR STATE CO-OP BANK</option>
  <option value="SPCB0251001">THE SURAT PEOPLES CO-OP BANK</option>
  <option value="CBIN0R40012">UTTAR BANGA KSHETRIYA GRAMIN BANK</option>
  <option value="BKID0WAINGB">VIDHARBHA KONKAN GRAMIN BANK</option>
  <option value="HDFC0CPDCCB">PUNE DISTRICT CENTRAL CO-OP BANK</option>
  <option value="DLSC0000001">THE DELHI STATE CO-OP BANK</option>
  <option value="HARC0000001">HARYANA STATE CO-OP APEX BANK</option>
  <option value="IBKL046KS01">KERALA STATE CO-OP BANK</option>
  <option value="CBIN0MPABAA">MADHYA PRADESH RAJYA SAHAKARI BANK</option>
  <option value="UTIB0PSCB01">THE PUNJAB STATE CO-OP BANK</option>
  <option value="ICIC00USCBD">UTTARAKHAND STATE CO-OP BANK</option>
  <option value="YESB0PUCB01">THE PANIPAT URBAN CO-OP BANK</option>
  <option value="TDCB0000001">THE THANE DISTRICT CENTRAL CO-OP BANK</option>
  <option value="NESF0000001">NORTH EAST SMALL FINANCE BANK</option>
  <option value="JJSB0000001">JALGAON JANATA SAHKARI BANK</option>
  <option value="ICIC00KHIRI">DISTRICT CO-OP BANK (LAKHIMPUR KHERI)</option>
  <option value="IBKL01076SB">SIWAN CENTRAL CO-OP BANK</option>
  <option value="KANG0000001">THE KANGRA CO-OP BANK</option>
  <option value="GSCB0BRD001">BARODA CENTRAL CO-OP BANK</option>
  <option value="SRCB0BCB808">BHADRADRI CO-OP URBAN BANK</option>
  <option value="HDFC0CBNBNK">BHAGINI NIVEDITA SAHAKARI BANK</option>
  <option value="HDFC0CDUCBL">DARUSSALAM CO-OP URBAN BANK</option>
  <option value="HDFC0CKMNSB">KANKARIA MANINAGAR NAGRIK SAHAKARI BANK</option>
  <option value="HDFC0CKNB02">KOTA NAGRIK SAHAKARI BANK</option>
  <option value="YESB0KURLA1">KURLA NAGRIK CO-OP BANK</option>
  <option value="HDFC0CMUCBL">MALVIYA URBAN CO-OP BANK</option>
  <option value="YESB0NDCB01">NAINITAL DISTRICT CO-OP BANK</option>
  <option value="GSCB0UPATAN">PATAN NAGARIK SAHAKARI BANK</option>
  <option value="IBKL0299RDC">THE RAIGAD DISTRICT CENTRAL CO-OP BANK</option>
  <option value="ICIC00ADCCB">THE AHMEDNAGAR DISTRICT CEN CO-OP BANK</option>
  <option value="HDFC0CBCCBL">THE BURDWAN CENTRAL CO-OP BANK</option>
  <option value="ICIC00JDCCB">THE JALGAON DISTRICT CENTRAL CO-OP BANK</option>
  <option value="KSCB0016001">KANARA DISTRICT CENTRAL CO-OP BANK</option>
  <option value="GSCB0MSN001">MEHSANA DISTRICT CENTRAL CO-OP BANK</option>
  <option value="MSLM0000001">THE MUSLIM CO-OP BANK</option>
  <option value="IBKL0763OCB">THE OTTAPALAM CO-OP BANK</option>
  <option value="IBKL0140PCC">PATLIPUTRA CENTRAL CO-OP BANK</option>
  <option value="HDFC0CUCBNR">THE UNION CO-OP BANK</option>
  <option value="HDFC0CWUCBL">THE WASHIM URBAN CO-OP BANK</option>
  <option value="ICIC00USNDC">UDHAM SINGH NAGAR DISTRICT CO-OP BANK</option>
  <option value="HDFC0CUCOBL">UTTRAKHAND CO-OP BANK</option>
  <option value="UTIB0SVAUB1">VALMIKI URBAN CO-OP BANK</option>
  <option value="HDFC0CVMCBA">THE VERAVAL MERCANTILE CO-OP BANK</option>
  <option value="IBKL0031VCB">THE VISAKHAPATNAM CO-OP BANK</option>
  <option value="ICIC00ADRSH">ADARSH CO-OP BANK (HYDERABAD)</option>
  <option value="SVCB0008011">AHMEDNAGAR SHAHAR SAHAKARI BANK</option>
  <option value="DMKJ0000002">DMK JAOLI BANK</option>
  <option value="GSCB0UGACBL">GUJARAT AMBUJA CO-OP BANK</option>
  <option value="IBKL0768PJS">JILA SAHKARI BANK (PITHORAGARH)</option>
  <option value="TTCB0000001">TEXTILE TRADERS CO-OP BANK </option>
  <option value="MSCI0082002">THE MAHARASHTRA STATE CO-OP BANK</option>
  <option value="GDCB0000001">
    THE GADCHIROLI DISTRICT CENTRAL CO-O BANK (GDCC BANK)
  </option>
  <option value="NSPB0000002">NSDL PAYMENTS BANK</option>
  <option value="HDFC0CDUCBE">THE DAHOD URBAN CO-OP BANK</option>
  <option value="HDFC0CSMSSB">SHRI MAHILA SEWA SAHAKARI BANK</option>
  <option value="GSCB0UCOBML">THE COOPERATIVE BANK OF MEHSANA</option>
  <option value="YESB0MNSB01">MAHANAGAR NAGRIK SAHAKARI BANK</option>
  <option value="SUNB0000002">SURAT NATIONAL CO-OP BANK</option>
  <option value="SMNB0000002">SMRITI NAGRIK SAHAKARI BANK</option>
  <option value="HDFC0CTUB02">TIRUPATI URBAN CO-OP BANK</option>
  <option value="GSCB0UGMCBL">THE GANDHIDHAM MERCANTILE CO-OP BANK</option>
  <option value="IBKL070TGZS">ZILA SAHAKARI BANK (TEHRI GARHWAL)</option>
  <option value="CBIN0MPDCAV">JILA SAHAKARI KENDRIYA BANK (MORENA)</option>
  <option value="CBIN0MPDCAK">JILA SAHAKARI KENDRIYA BANK (DHAR)</option>
  <option value="CBIN0MPDCAH">JILA SAHAKARI KENDRIYA BANK (DAMOH)</option>
  <option value="TNSC0010000">
    THE COIMBATORE DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="HDFC0CBUCBG">THE BICHOLIUM URBAN CO-OP BANK</option>
  <option value="GSCB0AMR001">AMRELI JILLA SAHAKARI BANK</option>
  <option value="IBKL0123NMC">NAVI MUMBAI CO-OP BANK</option>
  <option value="ICIC00NIDHI">NIDHI CO-OP BANK</option>
  <option value="ICIC00ZSKTW">ZILA SAHAKARI BANK (KOTDWARA)</option>
  <option value="KSCB0011001">KODAGU CENTRAL CO-OP BANK</option>
  <option value="UTIB0JSBR01">JILA SAHAKARI KENDRIYA BANK (RAIPUR)</option>
  <option value="STCB0000065">SBM BANK</option>
  <option value="CNRB000SGB7">SHREYAS GRAMIN BANK</option>
  <option value="UTIB0BHIW01">THE BHIWANI CENTRAL CO-OP BANK</option>
  <option value="ICIC00RAMPR">ZILA SAHAKARI BANK (RAMPUR)</option>
  <option value="HDFC0CDMCBL">THE DHANERA MERCANTILE CO-OP BANK</option>
  <option value="UTIB0SJSD01">JILA SAHAKARI KENDRIYA BANK (DURG)</option>
  <option value="IBKL01011GC">THE GOPALGANJ CENTRAL CO-OP BANK</option>
  <option value="DURG0000001">DURGAPUR STEEL PEOPLES CO-OP BANK</option>
  <option value="TNSC0011200">THE CUDDALORE DISTRICT CENTRAL CO-OP BANK</option>
  <option value="TNSC0012200">
    THE VILLUPURAM DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="CBIN0MPDCAB">JILA SAHAKARI KENDRIYA BANK (BALAGHAT)</option>
  <option value="ICIC00SHNSB">SHIVAJI NAGARI SAHAKARI BANK</option>
  <option value="BMCB0000002">BOMBAY MERCANTILE CO-OP BANK</option>
  <option value="IBKL0574RDC">RATNAGIRI DISTRICT CENTRAL CO-OP BANK</option>
  <option value="ASBL0000001">APNA SAHAKARI BANK</option>
  <option value="HDFC0CMAN01">ABHINANDAN URBAN CO-OP BANK</option>
  <option value="HDFC0CMBANK">AHMEDNAGAR MERCHANTS CO-OP BANK</option>
  <option value="YESB0BBCB00">BALASORE BHADRAK CENTRAL CO-OP BANK</option>
  <option value="HDFC0CBHLUB">BHILWARA URBAN CO-OP BANK</option>
  <option value="SBIN0RRCKGB">CAUVERI KALPATARU GRAMEENA BANK</option>
  <option value="IBKL0217C01">CUTTACK CENTRAL CO-OP BANK</option>
  <option value="HDFC0CDACUB">DR ANNASAHEB CHOUGULE URBAN CO-OP BANK</option>
  <option value="YESB0GUCB01">GODAVARI URBAN CO-OP BANK</option>
  <option value="ITBL0000001">IRINJALAKUDA TOWN CO-OP BANK (ITU BANK)</option>
  <option value="ICIC00BHCCB">THE BHAWANIPATNA CENTRAL CO-OP BANK</option>
  <option value="BKID0JHARGB">JHARKHAND GRAMIN BANK</option>
  <option value="KSCB0015001">KARNATAKA CENTRAL CO-OP BANK</option>
  <option value="UTIB0SKCCBL">KEONJHAR CENTRAL CO-OP BANK</option>
  <option value="HDFC0CKUCBL">THE KOLHAPUR URBAN CO-OP BANK</option>
  <option value="IBKL0027K01">KOTTAYAM CO-OP URBAN BANK</option>
  <option value="SBIN0RRLDGB">LANGPI DEHANGI RURAL BANK</option>
  <option value="IBKL0478LOK">LOKMANGAL CO-OP BANK</option>
  <option value="IBKL0553MSC">M S CO-OP BANK (MSC BANK)</option>
  <option value="HDFC0CMPSSB">MANVI PATTANA SOUHARDA SAHKARI BANK</option>
  <option value="IBKL0101MCB">MARATHA CO-OP BANK</option>
  <option value="SBIN0RRNLGB">NAGALAND RURAL BANK</option>
  <option value="TMSB0000002">THE MALAD SAHAKARI BANK</option>
  <option value="">PARSHWANATH CO-OP BANK</option>
  <option value="IBKL0548PMC">PUNE MERCHANTS CO-OP BANK</option>
  <option value="HDFC0CTRUMC">RAIPUR URBAN MERCHANTILE CO-OP BANK</option>
  <option value="ICIC00RUCBL">RAJAPUR URBAN CO-OP BANK</option>
  <option value="RRBP0000001">RAJARAMBAPU SAHAKARI BANK</option>
  <option value="">SARDAR BHILADWALA PARDI PEOPLES CO-OP BANK</option>
  <option value="HDFC0CSBB01">SHIVAJIRAO BHOSALE SAHAKARI BANK</option>
  <option value="ICIC00BNDCB">THE BHAVNAGAR DISTRICT CO-OP BANK</option>
  <option value="IBKL0116MCO">SHRI MAHALAXMI CO-OP BANK</option>
  <option value="SVSH0000001">SHRI VEERSHAIV CO-OP BANK</option>
  <option value="BARA0000001">THE BARAMATI SAHAKARI BANK</option>
  <option value="HDFC0CSUCUB">SUDHA CO-OP URBAN BANK</option>
  <option value="HDFC0CS1812">SUMERPUR MERCHANTILE URBAN CO-OP BANK</option>
  <option value="ICIC00SBSBN">BASAVA BANK</option>
  <option value="UTIB0SASKAC">THE ASKA CO-OP CENTRAL BANK</option>
  <option value="YESB0BCBL02">THE BUSINESS CO-OP BANK</option>
  <option value="HCBL0000101">THE HASTI CO-OP BANK</option>
  <option value="IBKL0068GP1">THE GANDEVI PEOPLES CO-OP BANK</option>
  <option value="UTIB0SKOCBL">THE KORAPUT CENTRAL CO-OP BANK</option>
  <option value="ICIC00TMUCB">THE MAYANI URBAN CO-OP BANK</option>
  <option value="PUCB0000001">THE PANDHARPUR MERCHANTS CO-OP BANK</option>
  <option value="GSCB0UTPNBL">THE PATDI NAGRIK SAHAKARI BANK</option>
  <option value="HDFC0CVVCCB">
    THE VALLABH VIDYANAGAR COMMERCIAL CO-OP BANK
  </option>
  <option value="ICIC00UMUCB">UDAIPUR MAHILA URBAN CO-OP BANK</option>
  <option value="UTIB0S63SBC">BELAGAVI SHREE BASAVESHWAR CO-OP BANK</option>
  <option value="AKJB0000001">AKOLA JANATA COMMERCIAL CO-OP BANK</option>
  <option value="BARC0INBB01">BARCLAYS BANK</option>
  <option value="BNPA0009008">BNP PARIBAS</option>
  <option value="JASB0000001">JANASEVA SAHAKARI BANK - BORIVLI</option>
  <option value="PMCB0000001">PUNJAB AND MAHARASHTRA CO-OP BANK</option>
  <option value="ICIC00PUCCB">THE PANDHARPUR URBAN CO-OP BANK</option>
  <option value="VVSB0000001">VASAI VIKAS SAHAKARI BANK</option>
  <option value="IBKL0216BCB">BERHAMPORE CENTRAL CO-OP BANK</option>
  <option value="YESB0ACCB01">ANGUL UNITED CENTRAL CO-OP BANK</option>
  <option value="YESB0BCCB00">BOUDH CENTRAL CO-OP BANK</option>
  <option value="YESB0BDCB00">BOLANGIR DISTRICT CENTRAL CO-OP BANK</option>
  <option value="YESB0BNKCCB">THE BANKI CENTRAL CO-OP BANK</option>
  <option value="YESB0KDCC01">KAIRA DISTRICT CENTRAL CO-OP BANK</option>
  <option value="YESB0KHCB01">KHURDA CENTRAL CO-OP BANK</option>
  <option value="YESB0MCCBHO">MAYURBHANJ CENTRAL CO-OP BANK</option>
  <option value="YESB0NDB001">NAYAGARH CENTRAL CO-OP BANK</option>
  <option value="YESB0SBPBHO">THE SAMBALPUR DISTRICT CO-OP CENTRAL BANK</option>
  <option value="YESB0SNGB13">SUNDARGARH CENTRAL CO-OP BANK</option>
  <option value="YESB0UPNC01">UNITED PURI NIMAPARA CENTRAL CO-OP BANK</option>
  <option value="YESB0UUCB07">THE UDAIPUR URBAN CO-OP BANK</option>
  <option value="">
    THE YADAGIRI LAKSHMI NARASIMHA SWAMY CO-OP URBAN BANK
  </option>
  <option value="PUNB0RRBMRB">MANIPUR RURAL BANK</option>
  <option value="IOBA0PGB001">PANDYAN GRAMA BANK</option>
  <option value="IBKL0269TDC">THRISSUR DISTRICT CO-OP BANK</option>
  <option value="ORCB0000001">THE ODISHA STATE CO-OP BANK</option>
  <option value="IBKL0041SCB">SAMRUDDHI SAHAKARI BANK</option>
  <option value="IDIB0PBG001">PUDUVAI BHARATHIAR GRAMA BANK</option>
  <option value="YESB0ARCB01">ARUNACHAL PRADESH STATE CO-OP APEX BANK</option>
  <option value="HDFC0CACABL">ASSAM CO-OP APEX BANK</option>
  <option value="UTIB0CSCB22">CHANDIGARH STATE CO-OP BANK</option>
  <option value="CBINOCGDCBN">CHHATTISGARH STATE CO-OP BANK</option>
  <option value="YESB0GSCB32">GOA STATE CO-OP BANK</option>
  <option value="UTIB0SJKCB1">THE JAMMU AND KASHMIR STATE CO-OP BANK</option>
  <option value="KSCB0000001">THE KARNATAKA STATE CO-OP APEX BANK</option>
  <option value="YESB0MSCB01">MANIPUR STATE CO-OP BANK</option>
  <option value="MCAB0000001">MEGHALAYA CO-OP APEX BANK</option>
  <option value="YESB0MAB001">MIZORAM CO-OP APEX BANK</option>
  <option value="UTIB0SNSCB1">NAGALAND STATE CO-OP BANK</option>
  <option value="TNSC0160101">PONDICHERRY CO-OP URBAN BANK</option>
  <option value="YESB0SSCB01">THE SIKKIM STATE CO-OP BANK</option>
  <option value="ICIC00UPSCB">UTTAR PRADESH CO-OP BANK</option>
  <option value="YESB0RNSB01">RAJDHANI NAGAR SAHKARI BANK</option>
  <option value="IBKL0745LIC">LIC OF INDIA STAFF CO-OP BANK</option>
  <option value="ICIC00FDCBL">FARUKKHABAD DISTRICT CO-OP BANK</option>
  <option value="ADCB0000001">ABU DHABI COMMERCIAL BANK</option>
  <option value="AUCB0000001">ALMORA URBAN CO-OP BANK</option>
  <option value="ANZB0000001">AUSTRALIA AND NEW ZEALAND BANKING GROUP</option>
  <option value="BOFA0MM6205">BANK OF AMERICA</option>
  <option value="PUNB0RGB002">RAJASTHAN GRAMIN BANK</option>
  <option value="HVBK0000001">WOORI BANK</option>
  <option value="WPAC0000001">WESTPAC BANKING CORPORATION</option>
  <option value="TGMB0000001">TUMKUR GRAIN MERCHANTS CP-OP BANK</option>
  <option value="ZCBL0000002">THE ZOROASTRIAN CO-OP BANK</option>
  <option value="SVBL0000001">THE SEVA VIKAS CO-OP BANK</option>
  <option value="KDCB0000001">KOZHIKODE DISTRICT CO-OP BANK (KDC BANK)</option>
  <option value="BBKM0000001">BANK OF BAHRAIN AND KUWAIT</option>
  <option value="BCEY0000001">BANK OF CEYLON</option>
  <option value="BOTM0003611">BANK OF TOKYO MITSUBISHI</option>
  <option value="">DEOGIRI NAGARI SAHAKARI BANK</option>
  <option value="NGSB0000001">NAGPUR NAGRIK SAHAKARI BANK</option>
  <option value="HDFC0CSSBMJ">SAMARTH SAH BANK - JALNA</option>
  <option value="SKSB0000001">SHIKSHAK SAHAKARI BANK</option>
  <option value="SJSB0000001">SOLAPUR JANATA SAHKARI BANK</option>
  <option value="UTIB0NBGKP1">THE NAGAR SAHAKARI BANK (GORAKHPUR)</option>
  <option value="UTIB0SFCB01">THE FARIDABAD CENTRAL CO-OP BANK</option>
  <option value="DEUT0000PBC">DEUSTCHE BANK</option>
  <option value="SDCE0000001">SATARA DISTRICT CENTRAL CO-OP BANK</option>
  <option value="RSCB0034099">THE CENTRAL CO-OP BANK</option>
  <option value="HDFC0CRSSBL">RAJARSHI SHAHU SAHAKARI BANK</option>
  <option value="HDFC0CPDPBK">ADARNIYA P D PATILSAHEB SAHAKARI BANK</option>
  <option value="YESB0AMSB01">ADARSH MAHILA NAGARI SAHAKARI BANK</option>
  <option value="YESB0AUCB01">AJANTHA URBAN CO-OP BANK</option>
  <option value="UTIB0SADC83">ALAPUZHA DISTRICT CO-OP BANK</option>
  <option value="ICIC00AMSBL">AMAN SAHAKARI BANK</option>
  <option value="YESB0ASCB02">ASSOCIATE CO-OP BANK</option>
  <option value="ICIC00BALUC">BALOTRA URBAN CO-OP BANK</option>
  <option value="IBKL0364BCB">BAPUJI CO-OP BANK</option>
  <option value="CBIN0CGDCBN">CG RAJYA SAHAKRI BANK</option>
  <option value="IBKL0722CCB">CENTRAL CO-OP BANK</option>
  <option value="YESB0CSB001">CHARTERED SAHAKARI BANK</option>
  <option value="HDFC0CCUCBL">CHITTORGARH URBAN CO-OP BANK</option>
  <option value="MAHB000CB01">COASTAL LOCAL AREA BANK</option>
  <option value="ICIC00JUSBL">JAYSINGPUR UDGAON SAHAKARI BANK</option>
  <option value="EBIL0000001">EMIRATES NBD BANK</option>
  <option value="IBKL0116JSB">JANATA SAHAKARI BANK (AJARA)</option>
  <option value="IBKL0116JCB">JAWAHAR CO-OP BANK</option>
  <option value="HDFC0CJMS01">JIJAMATA MAHILA SAHAKARI BANK</option>
  <option value="HDFC0CJNB08">JODHPUR NAGRIK SAHAKARI BANK</option>
  <option value="UTIB0SKCUB1">THE KAKATIYA CO-OP URBAN BANK</option>
  <option value="HDFC0CKAMCO">KASHMIR MERCANTILE CO-OP BANK</option>
  <option value="IBKL01077KD">THE KHAGARIA DISTRICT CENTRAL CO-OP BANK</option>
  <option value="GSCB0UKPCBL">KHEDA PEOPLES CO-OP BANK</option>
  <option value="HDFC0CKMB01">KOLHAPUR MAHILA SAHAKARI BANK</option>
  <option value="UTIB0SKRN01">THE KRANTHI CO-OP URBAN BANK</option>
  <option value="ICIC00LKUCB">LAKHIMPUR URBAN CO-OP BANK</option>
  <option value="HDFC0CMCUBL">MAHAVEER CO-OP URBAN BANK</option>
  <option value="ICIC00MCUBL">THE MANJERI CO-OP URBAN BANK</option>
  <option value="HDFC0CMANCB">MANORAMA CO-OP BANK</option>
  <option value="UTIB0SMUB01">MUDGAL URBAN CO-OP BANK</option>
  <option value="HDFC0CNICBL">NAVSARJAN INDUSTRIAL CO-OP BANK</option>
  <option value="NCUB0000001">THE NILAMBUR CO-OP URBAN BANK</option>
  <option value="HDFC0CNB311">NIRMAL URBAN CO-OP BANK</option>
  <option value="IBKL0341PUB">THE PEOPLES URBAN CO-OP BANK</option>
  <option value="IBKL0087PCS">PIMPRI CHINCHWAD SAHAKARI BANK</option>
  <option value="">PRAGATI SAHAKARI BANK</option>
  <option value="IBKL01642RP">RAJKOT PEOPLES CO-OP BANK</option>
  <option value="SRCB0SAM001">SAMATA SAHAKARI BANK</option>
  <option value="IBKL0459SBS">SAMPADA SAHAKARI BANK</option>
  <option value="IBKL0776SPS">SANDUR PATTANA SOUHARDA SAHAKARI BANK</option>
  <option value="GSCB0USNCBL">SARASPUR NAGARIK CO-OP BANK</option>
  <option value="UTIB0SSMC01">THE SARDARGANJ MERCANTILE CO-OP BANK</option>
  <option value="YESB0SDB002">SHREE DHARTI CO-OP BANK</option>
  <option value="IBKL0464PNS">SHRI PANCHGANGA NAGARI SAHKARI BANK</option>
  <option value="YESB0SANB99">SHRI ANAND NAGARI SAHAKARI BANK</option>
  <option value="HDFC0CSACBL">SHRI ADINATH CO-OP BANK</option>
  <option value="ICIC00SMSBL">SHRIMANT MALOJIRAJE SAHAKARI BANK</option>
  <option value="HDFC0CSSSBN">SHUSHRUTI SOUAHRDA SAHAKRA BANK</option>
  <option value="HDFC0CSIDDH">SOLAPUR SIDDHESHWAR SAH BANK</option>
  <option value="IBKL01192AC">
    THE AURANGABAD DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="">BANASKANTHA MERCANTILE CO-OP BANK</option>
  <option value="GSCB0UTBNBL">THE BARDOLI NAGRIK SAHAKARI BANK</option>
  <option value="KKBK0BCCB04">THE BARODA CITY CO-OP BANK</option>
  <option value="HDFC0CBLMSB">THE BHAGYALAKSHMI MAHILA SAHAKARI BANK</option>
  <option value="YESB0BHN001">THE BHANDARA DISTRICT CENTRAL CO-OP BANK</option>
  <option value="YESB0BRCB01">BHAVANA RISHI CO-OP BANK</option>
  <option value="HDFC0COMMCO">THE COMMERCIAL CO-OP BANK</option>
  <option value="IBKL0157001">THE DEOLA MERCHANTS CO-OP BANK</option>
  <option value="HDFC0CGNCBL">GANDHINAGAR NAG CO-OP BANK</option>
  <option value="UTIB0SGUCB1">GODHRA URBAN CO-OP BANK</option>
  <option value="KKBK0TKCB01">THE KARNAVATI CO-OP BANK</option>
  <option value="IBKL0269KTC">THE KODUNGALLUR TOWN CO-OP BANK</option>
  <option value="HDFC0CMPLTB">THE MADANAPALLE CO-OP TOWN BANK</option>
  <option value="IBLK0031MCB">THE MAHARAJA CO-OP URBAN BANK</option>
  <option value="IBKL0078MCC">THE MANGALORE CATHOLIC CO-OP BANK</option>
  <option value="ICIC0006405">THE MANMANDIR CO-OP BANK</option>
  <option value="YESBONCCB01">THE NAWADA CENTRAL CO-OP BANK</option>
  <option value="IBKL0427NCB">THE NAWANAGAR CO-OP BANK</option>
  <option value="YESB0PMCB02">PANCHSHEEL CO-OP BANK</option>
  <option value="ICIC00RCCBL">THE RAJKOT COMMERCIAL CO-OP BANK</option>
  <option value="HDFC0CRANUJ">THE RANUJ NAGRIK SAHAKARI BANK</option>
  <option value="GSCB0UTSNBL">THE SARVODAYA NAGRIK SAHKARI BANK</option>
  <option value="ICIC00SEVUC">THE SEVALIA URBAN CO-OP BANK</option>
  <option value="UTIB0SSSKCB">THE SSK CO-OP BANK</option>
  <option value="UTIB0SUCTBL">THE UDUPI CO-OP TOWN BANK</option>
  <option value="UTIB0SUPCB1">THE UTTARSANDA PEOPLES CO-OP BANK</option>
  <option value="IBKL0041Y01">THE YAVATMAL URBAN CO-OP BANK</option>
  <option value="GSCB0UUNJBL">UNJHA NAGARIK SAHAKARI BANK</option>
  <option value="IBKL0232UCB">URBAN CO-OP BANK (BAREILLY)</option>
  <option value="HDFC0CSVCBA">SRI VASAVAMBA CO-OP BANK</option>
  <option value="SVCB0016101">WAI URBAN CO-OP BANK</option>
  <option value="IBKL01064NS">NAGAR SAHKARI BANK</option>
  <option value="ICIC00DCBLS">DISTRICT COOPERATIVE BANK (SAHARANPUR)</option>
  <option value="UTIB0SBCB01">THE BATHINDA CENTRAL CO-OP BANK</option>
  <option value="YESB0DZSB01">DEHRADUN DISTRICT CO-OP BANK</option>
  <option value="IDUK0000055">THE IDUKKI DISTRICT CO-OP BANK</option>
  <option value="ICIC00INPRS">INDORE PARASPAR SAHAKARI BANK</option>
  <option value="UTIB0SJCUB2">THE JAMPETA CO-OP URBAN BANK</option>
  <option value="">THE UDAIPUR MAHILA SAMRIDHI URBAN CO-OP BANK</option>
  <option value="IBKL0008BCB">THE BHARAT CO-OP BANK (IDBI)</option>
  <option value="IBKL0101BZR">RANI CHANNAMMA MAHILA SAHAKARI BANK </option>
  <option value="IBKL0510WUC">WARDHAMAN URBAN CO-OP BANK</option>
  <option value="IBKL0452ND1">THE NAVAL DOCKYARD CO-OP BANK</option>
  <option value="">VARDHAMAN MAHILA CO-OP URBAN BANK</option>
  <option value="MDCB0680265">PRATAP CO-OP BANK</option>
  <option value="HDFC0CMFUCB">MAHATMA FULE DISTRICT URBAN CO-OP BANK</option>
  <option value="IBKL0029T03">THE TIRUVALLA EAST CO-OP BANK</option>
  <option value="YESB0GCUB01">THE GANDHI CO-OP URBAN BANK</option>
  <option value="HDFC0CAMCBK">THE ANAND MERCANTILE CO-OP BANK</option>
  <option value="HDFC0CNSBMV">NAGRIK SAHAKARI BANK (MARYADHIT VIDISHA)</option>
  <option value="HDFC0CUDYAM">UDYAM VIKAS SAHAKARI BANK</option>
  <option value="YESB0TCB002">THE TEXCO CO-OP BANK</option>
  <option value="YESB0UMA002">UMA CO-OP BANK</option>
  <option value="HDFC0CSSMSB">
    SHRI SHIVAYOGI MURUGHENDRA SWAMI URBAN CO-OP BANK
  </option>
  <option value="IBKL01708SB">THE SULTANS BATTERY CO-OP URBAN BANK</option>
  <option value="TSSB0000001">THE SATARA SAHAKARI BANK</option>
  <option value="HDFC0CSRCBL">SRI RAMA CO-OP BANK</option>
  <option value="IBKL0868GRS">SRI GURU RAGHAVENDRA SAHAKARA BANK</option>
  <option value="IBKL0069S01">THE SIRSI URBAN SAHAKARI BANK</option>
  <option value="HDFC0CNUCBK">NAVANAGARA URBAN CO-OP BANK</option>
  <option value="HDFC0CSLABK">SUBHADRA LOCAL AREA BANK</option>
  <option value="HDFC0CPCBLD">PEOPLES CO-OP BANK</option>
  <option value="HDFC0CPIMCO">PIMPALGOAN MERCHANTS CO-OP BANK</option>
  <option value="YESB0MUDC01">MIZORAM URBAN CO-OP DEVELOPMENT BANK</option>
  <option value="KKBK0VCCB01">VIJAY COMMERCIAL CO-OP BANK</option>
  <option value="UTIB0SAPRR2">AP RAJARAJESWARI MAHILA CO-OP URBAN BANK</option>
  <option value="HDFC0CTMCBL">THE MAHAVEER CO-OP BANK</option>
  <option value="KKBK0MNSB01">THE MODASA NAGARIK SAHAKARI BANK</option>
  <option value="ICIC00TPZCB">THE THODUPUZHA CO-OP BANK</option>
  <option value="UTIB0SPSB01">PALUS SAHAKARI BANK</option>
  <option value="HDFC0CNUCBN">THE NANDURA URBAN CO-OP BANK</option>
  <option value="YESB0DUCB01">URBAN CO-OP BANK (DEHRADUN)</option>
  <option value="IBKL0041SSB">SADHANA SAHAKARI BANK (NAGPUR)</option>
  <option value="YESB0MAN001">MANNDESHI MAHILA SAHAKARI BANK</option>
  <option value="IBKL01248NC">THE NATIONAL CENTRAL CO-OP BANK</option>
  <option value="IBKL0452JSB">THE JAIN SAHKARI BANK</option>
  <option value="YESB0NCB001">NOBLE CO-OP BANK</option>
  <option value="KKBK0SMSB01">SHREE MAHAVIR SAHAKARI BANK</option>
  <option value="UTIB0SRECB1">RAILWAY EMPLOYEE CO-OP BANK</option>
  <option value="YESB0ASSB01">
    AMRAVATI ZILLA PARISHAD SHIKSHAK SAHAKARI BANK
  </option>
  <option value="UTIB0SMCB51">THE MERCHANTS SOUHARDA SAHAKARI BANK</option>
  <option value="YESB0KLMDCB">THE KOLLAM DISTRICT CO-OP BANK</option>
  <option value="ICIC00ZSBLL">ZILA SAHAKARI BANK (LUCKNOW)</option>
  <option value="ICIC00ZSBHA">ZILA SAHAKARI BANK (HARIDWAR)</option>
  <option value="YESB0DCBU01">ZILA SAHAKARI BANK (UTTARKASHI)</option>
  <option value="ICIC00AGDCB">ZILA SAHAKARI BANK (AGRA)</option>
  <option value="CBIN0MPDCAR">JILA SAHAKARI KENDRIYA BANK (KHANDWA)</option>
  <option value="CBIN0MPDCBM">JILA SAHAKARI KENDRIYA BANK (VIDISHA)</option>
  <option value="CBIN0MPDCBL">JILA SAHAKARI KENDRIYA BANK (UJJAIN)</option>
  <option value="CBIN0MPDCAN">JILA SAHAKARI KENDRIYA BANK (HOSHANGABAD)</option>
  <option value="CBIN0MPDCAW">JILA SAHAKARI KENDRIYA BANK (NARSINGHPUR)</option>
  <option value="UTIB0SSSN01">SHRI SHIVESHWAR NAGRI SAHAKARI BANK</option>
  <option value="UTIB0SKCTBL">THE KAKINADA CO-OPERATIVE TOWN BANK</option>
  <option value="GSCB0UCHANA">THE CHANASMA NAGARIK SAHAKARI BANK</option>
  <option value="INDB0BCCB02">BANGALORE CITY CO-OP BANK</option>
  <option value="HDFC0CMNSBM">MAHILA NAGRIK SAHAKARI BANK</option>
  <option value="HDFC0CNUCBL">THE NEW URBAN CO-OP BANK</option>
  <option value="UTIB0SSVA01">SHIVA SAHAKARI BANK (NIYAMITA TARIKERE)</option>
  <option value="ICIC00GCUBL">THE GURUVAYUR CO-OP URBAN BANK</option>
  <option value="IBKL0773BCB">THE BHAGAT CO-OP BANK</option>
  <option value="KKBK0MSCB01">THE MATTANCHERRY SARVAJANIK CO-OP BANK</option>
  <option value="HDFC0CSVSBL">SARDAR VALLABHBHAI SAHAKARI BANK</option>
  <option value="HDFC0CAUB01">AGRASEN CO-OP URBAN BANK</option>
  <option value="IBKL0078GOK">SRI GOKARNATH CO-OP BANK</option>
  <option value="ICIC00TJUCB">THE JAMKHANDI URBAN CO-OP BANK</option>
  <option value="MDBK0000001">MODEL CO-OP BANK</option>
  <option value="UTIB0SSMCBL">SHREE MURUGHARAJENDRA CO-OP BANK</option>
  <option value="">SHIMSHA SAHAKARA BANK</option>
  <option value="CBIN0MPDCAZ">JILA SAHAKARI KENDRIYA BANK (RAJGRAH)</option>
  <option value="INDB0NSBG01">NAGRIK SAHKARI BANK (GWALIOR)</option>
  <option value="GSCB0JND001">JUNAGADH JILLA SAHAKARI BANK</option>
  <option value="UTIB0SSBDVG">SHIVA SAHAKARI BANK (NIYAMITA DAVANA)</option>
  <option value="HDFC0CLSABL">LONAVALA SAHAKARI BANK</option>
  <option value="WBSC0VCCB27">VIDYASAGAR CENTRAL CO-OP BANK</option>
  <option value="UTIB0SYDC01">THE YAVATMAL DISTRICT CENTRAL CO-OP BANK</option>
  <option value="CBIN0MPDCAQ">JILA SAHAKARI KENDRIYA BANK (JHABUA)</option>
  <option value="YESB0KHBKMW">KHALILABAD NAGAR SAH BANK</option>
  <option value="ICIC00FDCCB">DISTRICT COOPERATIVE BANK (FAIZABAD)</option>
  <option value="TSAB0018018">THE NIZAMABAD DISTRICT CO-OP CENTRAL BANK</option>
  <option value="">SHRI BALAJI URBAN CO-OP BANK</option>
  <option value="YESB0UMCBRP">UNITED MERC CO-OP BANK</option>
  <option value="">RAE BARELI DISTRICT CO-OP BANK </option>
  <option value="CBIN0MPDCAD">JILA SAHAKARI KENDRIYA BANK (BHIND)</option>
  <option value="TNSC0010800">ERODE DISTRICT CENTRAL CO-OP BANK</option>
  <option value="UTIB0SSNSBK">SARAKARI NAUKARARA SAHAKARI BANK</option>
  <option value="IBKL01992L1">LOKNETE DATTAJI PATIL SAHKARI BANK</option>
  <option value="UTIB0SHUCBL">HANAMASAGAR URBAN CO-OP BANK</option>
  <option value="HDFC0CSUDHA">SRI SUDHA CO-OP BANK</option>
  <option value="UTIB0BCCB01">THE BHUJ COMMERCIAL CO-OP BANK</option>
  <option value="HDFC0CBHRAT">SHRI BHARAT URBAN CO-OP BANK</option>
  <option value="">SREE CHARAN SOUH CO-OP BANK</option>
  <option value="NICB0000001">NEW INDIA CO-OP BANK</option>
  <option value="HDFC0CSMNSB">SANMITRA MAHILA NAGARI SAHAKARI BANK</option>
  <option value="IBKL0004MCB">
    THE MAHARASHTRA MANTRALAYA AND ALLIED OFFICES CO-OP BANK
  </option>
  <option value="HDFC0CICBLP">INDRAYANI CO-OP BANK</option>
  <option value="HDFC0CCMCBL">COLOUR MERCHANTS CO-OP BANK</option>
  <option value="UTIB0SBUBRN">SHREE BASAVESHWAR URBAN CO-OP BANK</option>
  <option value="UTIB0SICB25">ILKAL COOPERATIVE BANK</option>
  <option value="UTIB0SSUSSB">SADALGA URBAN SOUHARDA SAHAKARI BANK</option>
  <option value="HDFC0CGCBLG">THE GANDHIDHAM CO-OPERATIVE BANK</option>
  <option value="UTIB0SCJMSB">CHIKMAGALUR JILLA MAHILA SAHAKARA BANK</option>
  <option value="CBIN0MPDCAL">JILA SAHAKARI KENDRIYA BANK (GUNA)</option>
  <option value="IBKL0158SCU">SHILLONG COOPERATIVE URBAN BANK</option>
  <option value="IBKL0103901">THE BELLARY DISTRICT CENTRAL CO-OP BANK</option>
  <option value="UTIB0SCSMSB">
    SHRI CHATRAPATI SHIVAJI MAHARAJ SAHAKARI BANK
  </option>
  <option value="YESB0RAJ001">THE CO-OP BANK OF RAJKOT</option>
  <option value="INDB0SSBN01">SREENIDHI SOUHARDA SAHAKARI BANK</option>
  <option value="IBKL0101BBU">
    BELLAD BAGEWADI URBAN SOUHARDA SAHAKARI BANK
  </option>
  <option value="HDFC0CGCCB1">THE GODHRA CITY CO-OP BANK</option>
  <option value="YESB0SDC001">THE SOLAPUR DISTRICT CENTRAL CO-OP BANK</option>
  <option value="HDFC0CSLKUB">SHRI LAXMIKRUPA URBAN CO-OP BANK</option>
  <option value="ICIC00MEWAR">MEWAR AANCHALIK GRAMIN BANK</option>
  <option value="UTIB0SSSB05">SANGLI SAHAKARI BANK</option>
  <option value="UTIB0SCPSBN">CHIKMAGALUR PATTANA SAHAKARA BANK</option>
  <option value="HDFC0CVSBHO">VEERASHAIVA SAHAKARI BANK</option>
  <option value="MDCB0680035">MUMBAI DISTRICT CENTRAL CO-OP BANK</option>
  <option value="HDFC0CSSBNK">SHREE SAMARTH SAHAKARI BANK</option>
  <option value="HDFC0CDMCBD">THE DAHOD MERCANTILE CO-OP BANK</option>
  <option value="SAHE0000001">THE SAHEBRAO DESHMUKH CO-OP BANK</option>
  <option value="TNSC0010100">DHARMAPURI CENTRAL CO-OP BANK</option>
  <option value="TNSC0010300">
    THE KANYAKUMARI DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="TNSC0010400">THE KUMBAKONAM CENTRAL CO-OP BANK</option>
  <option value="TNSC0012100">
    THE THOOTHUKUDI DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="TNSC0011500">
    THE TIRUNELVELI DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="TNSC0011600">THE VELLORE DISTRICT CENTRAL CO-OP BANK</option>
  <option value="ZSBL0000001">ZILA SAHAKARI BANK (GHAZIABAD)</option>
  <option value="">JANATHA SEVA CO-OP BANK</option>
  <option value="">VASAI JANATA SAHAKARI BANK</option>
  <option value="YESB0VSBL02">VYAVSAYIK SAHAKARI BANK</option>
  <option value="CRLY0000002">
    CREDIT AGRICOLE CORPORATE AND INVESTMENT BANK
  </option>
  <option value="UTIB0SDUCB3">DAUSA URBAN COOPERATIVE BANK</option>
  <option value="YESB0VNSB01">VIKRAMADITYA NAGRIK SAHAKARI BANK</option>
  <option value="CBIN0MPDCBC">JILA SAHAKARI KENDRIYA BANK (SAGAR)</option>
  <option value="YESB0RUCB05">RAJSAMAND URBAN CO-OP BANK</option>
  <option value="SVCB0037002">SHRI KRISHNA CO-OP BANK</option>
  <option value="UTIB0SGUB02">THE GUNTUR CO-OP URBAN BANK</option>
  <option value="CBIN0MPDCBE">JILA SAHAKARI KENDRIYA BANK (SEHORE)</option>
  <option value="IBKL0100ACB">ACE CO-OP BANK</option>
  <option value="IBKL0467BDS">THE BABASAHEB DESHMUKH SAHAKARI BANK</option>
  <option value="IBKL0697ANS">AMRELI NAGRIK SAHKARI BANK</option>
  <option value="YESB0IMRC01">INDIAN MERCANTILE CO-OP BANK</option>
  <option value="HDFC0CMNSAA">SHREE MAHUVA NAGRIK SAHKARI BANK</option>
  <option value="YESB0HCBL01">HCBL CO-OP BANK</option>
  <option value="HDFC0CTJCBL">THE JANATA CO-OP BANK</option>
  <option value="YESB0PUB001">THE PUSAD URBAN CO-OP BANK</option>
  <option value="IBKL0724VDC">
    THE VAISHALI DISTRICT CENTRAL CO-&ZeroWidthSpace;OP BANK
  </option>
  <option value="HDFC0CSSNSB">SARDAR SINGH NAGRIK SAHAKARI BANK</option>
  <option value="HDFC0CBNB01">BARAN NAGRIK SAHKARI BANK</option>
  <option value="KKBK0SUCB01">SHRIRAM URBAN CO-OP BANK</option>
  <option value="HDFC0CTANSB">THE AGRASEN NAGARI SAHAKARI BANK</option>
  <option value="ICIC00PPCBL">UP POSTAL PRIMARY CO-OP BANK</option>
  <option value="UTIB0PKDU97">PALGHAT CO-OP URBAN BANK</option>
  <option value="TNSC0011100">THE SALEM DISTRICT CENTRAL CO-OP BANK</option>
  <option value="TNSC0010600">THE TAMILNADU STATE APEX CO-OP BANK</option>
  <option value="TNSC0011000">
    THE RAMANATHAPURAM DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="TNSC0012000">
    THE TIRUVANNAMALAI DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="TNSC0010500">THE TAMILNADU STATE APEX CO-OP BANK</option>
  <option value="TNSC0011300">THE THANJAVUR CENTRAL CO-OP BANK</option>
  <option value="TNSC0011800">
    THE VIRUDHUNAGAR DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="TNSC0011700">THE DINDIGUL CENTRAL CO-OP BANK</option>
  <option value="TNSC0010200">THE KANCHIPURAM CENTRAL CO-OP BANK</option>
  <option value="TNSC0010700">THE NILGIRIS DISTRICT CENTRAL CO-OP BANK</option>
  <option value="TNSC0010900">
    THE PUDUKKOTTAI DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="TNSC0011400">
    THE TIRUCHIRAPALLI DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="TNSC0011900">
    THE SIVAGANGAI DISTRICT CENTRAL CO-OP BANK
  </option>
  <option value="IBKL0JCB001">JIJAU COMMERCIAL CO-OP BANK</option>
  <option value="UTIB0SSKPCB">SRI KANYAKAPARAMESWARI CO-OP BANK</option>
  <option value="YESB0SPCB01">SHAHADA PEOPLES CO-OP BANK</option>
  <option value="YESB0DNB014">DELHI NAGRIK SEHKARI BANK</option>
  <option value="SVCB0012002">SHREE MAHALAXMI URBAN CO-OP CREDIT BANK</option>
  <option value="">ARVIND SAHAKARI BANK</option>
  <option value="UTIB0SJSJ01">JILA SAHAKARI KENDRIYA BANK (JAGDALPUR)</option>
  <option value="IBKL0546WCB">THE WOMENS CO-OP BANK</option>
  <option value="IBKL0189PUC">THE PANVEL URBAN CO-OP BANK</option>
  <option value="YESB0WANA01">WANA NAGRI SAHKARI BANK</option>
  <option value="HDFC0CBUCBL">THE BIJNOR URBAN CO-OP BANK</option>
  <option value="">ABHINAV SAHKARI BANK</option>
  <option value="HDFC0CVSVCB">THE VSV CO-OP BANK</option>
  <option value="URBN00000B1">THE URBAN CO-OP BANK</option>
  <option value="YESB0PMNSB1">PRAGATI MAHILA NAGRIK SAHAKARI BANK</option>
  <option value="IBKL0443MNB">THE MEHSANA NAGRIK SAHAKARI BANK</option>
  <option value="UTIB0SAVB01">SREE MAHAYOGI LAKSHMAMMA CO-OP BANK</option>
  <option value="TSAB0017001">DISTRICT COOPERATIVE BANK (MEDAK)</option>
  <option value="IBKL0186MC2">MAHALAKSHMI CO-OP BANK (UDUPI)</option>
  <option value="SVCB0002001">GUARDIAN BANK</option>
  <option value="YESB0ICMB02">INDORE CLOTH MARKET CO-OP BANK</option>
  <option value="IBKL01543SR">SRIRAMANAGAR PATTANA SAHAKARA BANK</option>
  <option value="HDFC0CNSBLN">NANDANI SAHAKARI BANK</option>
</select>; */
}
