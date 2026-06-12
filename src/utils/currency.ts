// src/utils/currency.ts

export interface CurrencyConfig {
  code: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalDigits: number;
  thousandsSep: string;
  decimalSep: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Complete ISO 4217 currency list — 150+ currencies
// Prioritized list first, then alphabetical by code
// ---------------------------------------------------------------------------

export const CURRENCY_LIST: CurrencyConfig[] = [
  // ── Priority currencies (most common globally + African focus) ────────────
  { code: 'EUR', symbol: '€',     symbolPosition: 'after',  decimalDigits: 2, thousandsSep: ' ',  decimalSep: ',',  name: 'Euro' },
  { code: 'USD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'US Dollar' },
  { code: 'GBP', symbol: '£',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'British Pound' },
  { code: 'XAF', symbol: 'FCFA',  symbolPosition: 'after',  decimalDigits: 0, thousandsSep: ' ',  decimalSep: ',',  name: 'CFA Franc BEAC' },
  { code: 'XOF', symbol: 'FCFA',  symbolPosition: 'after',  decimalDigits: 0, thousandsSep: ' ',  decimalSep: ',',  name: 'CFA Franc BCEAO' },
  { code: 'NGN', symbol: '₦',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Nigerian Naira' },
  { code: 'GHS', symbol: 'GH₵',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'South African Rand' },
  { code: 'MAD', symbol: 'د.م.',  symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Moroccan Dirham' },
  { code: 'DZD', symbol: 'دج',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Algerian Dinar' },
  { code: 'TND', symbol: 'DT',    symbolPosition: 'before', decimalDigits: 3, thousandsSep: ',',  decimalSep: '.',  name: 'Tunisian Dinar' },
  { code: 'EGP', symbol: 'E£',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Egyptian Pound' },

  // ── Rest alphabetical by code ─────────────────────────────────────────────
  { code: 'AED', symbol: 'AED',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'UAE Dirham' },
  { code: 'AFN', symbol: '؋',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Afghan Afghani' },
  { code: 'ALL', symbol: 'L',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Albanian Lek' },
  { code: 'AMD', symbol: '֏',     symbolPosition: 'after',  decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Armenian Dram' },
  { code: 'ANG', symbol: 'ƒ',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Netherlands Antillean Guilder' },
  { code: 'AOA', symbol: 'Kz',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Angolan Kwanza' },
  { code: 'ARS', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Argentine Peso' },
  { code: 'AUD', symbol: 'A$',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Australian Dollar' },
  { code: 'AWG', symbol: 'ƒ',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Aruban Florin' },
  { code: 'AZN', symbol: '₼',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Azerbaijani Manat' },
  { code: 'BAM', symbol: 'KM',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Bosnian Mark' },
  { code: 'BBD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Barbadian Dollar' },
  { code: 'BDT', symbol: '৳',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Bangladeshi Taka' },
  { code: 'BGN', symbol: 'лв',    symbolPosition: 'after',  decimalDigits: 2, thousandsSep: ' ',  decimalSep: ',',  name: 'Bulgarian Lev' },
  { code: 'BHD', symbol: 'BD',    symbolPosition: 'before', decimalDigits: 3, thousandsSep: ',',  decimalSep: '.',  name: 'Bahraini Dinar' },
  { code: 'BIF', symbol: 'Fr',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Burundian Franc' },
  { code: 'BMD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Bermudian Dollar' },
  { code: 'BND', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Brunei Dollar' },
  { code: 'BOB', symbol: 'Bs.',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Bolivian Boliviano' },
  { code: 'BRL', symbol: 'R$',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Brazilian Real' },
  { code: 'BSD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Bahamian Dollar' },
  { code: 'BTN', symbol: 'Nu',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Bhutanese Ngultrum' },
  { code: 'BWP', symbol: 'P',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Botswana Pula' },
  { code: 'BYN', symbol: 'Br',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ' ',  decimalSep: ',',  name: 'Belarusian Ruble' },
  { code: 'BZD', symbol: 'BZ$',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Belize Dollar' },
  { code: 'CAD', symbol: 'CA$',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Canadian Dollar' },
  { code: 'CDF', symbol: 'Fr',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Congolese Franc' },
  { code: 'CHF', symbol: 'CHF',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: "'",  decimalSep: '.',  name: 'Swiss Franc' },
  { code: 'CKD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Cook Islands Dollar' },
  { code: 'CLP', symbol: '$',     symbolPosition: 'before', decimalDigits: 0, thousandsSep: '.',  decimalSep: ',',  name: 'Chilean Peso' },
  { code: 'CNY', symbol: '¥',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Chinese Yuan' },
  { code: 'COP', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Colombian Peso' },
  { code: 'CRC', symbol: '₡',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Costa Rican Colón' },
  { code: 'CUP', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Cuban Peso' },
  { code: 'CVE', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Cape Verdean Escudo' },
  { code: 'CZK', symbol: 'Kč',    symbolPosition: 'after',  decimalDigits: 2, thousandsSep: ' ',  decimalSep: ',',  name: 'Czech Koruna' },
  { code: 'DJF', symbol: 'Fdj',   symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Djiboutian Franc' },
  { code: 'DKK', symbol: 'kr',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Danish Krone' },
  { code: 'DOP', symbol: 'RD$',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Dominican Peso' },
  { code: 'ERN', symbol: 'Nfk',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Eritrean Nakfa' },
  { code: 'ETB', symbol: 'Br',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Ethiopian Birr' },
  { code: 'FJD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Fijian Dollar' },
  { code: 'FKP', symbol: '£',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Falkland Islands Pound' },
  { code: 'GEL', symbol: '₾',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Georgian Lari' },
  { code: 'GGP', symbol: '£',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Guernsey Pound' },
  { code: 'GIP', symbol: '£',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Gibraltar Pound' },
  { code: 'GMD', symbol: 'D',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Gambian Dalasi' },
  { code: 'GNF', symbol: 'FG',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Guinean Franc' },
  { code: 'GTQ', symbol: 'Q',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Guatemalan Quetzal' },
  { code: 'GYD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Guyanese Dollar' },
  { code: 'HKD', symbol: 'HK$',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Hong Kong Dollar' },
  { code: 'HNL', symbol: 'L',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Honduran Lempira' },
  { code: 'HRK', symbol: 'kn',    symbolPosition: 'after',  decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Croatian Kuna' },
  { code: 'HTG', symbol: 'G',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Haitian Gourde' },
  { code: 'HUF', symbol: 'Ft',    symbolPosition: 'after',  decimalDigits: 0, thousandsSep: ' ',  decimalSep: ',',  name: 'Hungarian Forint' },
  { code: 'IDR', symbol: 'Rp',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: '.',  decimalSep: ',',  name: 'Indonesian Rupiah' },
  { code: 'ILS', symbol: '₪',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Israeli New Shekel' },
  { code: 'IMP', symbol: '£',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Isle of Man Pound' },
  { code: 'INR', symbol: '₹',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Indian Rupee' },
  { code: 'IQD', symbol: 'ID',    symbolPosition: 'before', decimalDigits: 3, thousandsSep: ',',  decimalSep: '.',  name: 'Iraqi Dinar' },
  { code: 'IRR', symbol: '﷼',     symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Iranian Rial' },
  { code: 'ISK', symbol: 'kr',    symbolPosition: 'after',  decimalDigits: 0, thousandsSep: '.',  decimalSep: ',',  name: 'Icelandic Króna' },
  { code: 'JMD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Jamaican Dollar' },
  { code: 'JOD', symbol: 'JD',    symbolPosition: 'before', decimalDigits: 3, thousandsSep: ',',  decimalSep: '.',  name: 'Jordanian Dinar' },
  { code: 'JPY', symbol: '¥',     symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Japanese Yen' },
  { code: 'KGS', symbol: 'с',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Kyrgyzstani Som' },
  { code: 'KHR', symbol: '៛',     symbolPosition: 'after',  decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Cambodian Riel' },
  { code: 'KMF', symbol: 'CF',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Comorian Franc' },
  { code: 'KRW', symbol: '₩',     symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'South Korean Won' },
  { code: 'KWD', symbol: 'KD',    symbolPosition: 'before', decimalDigits: 3, thousandsSep: ',',  decimalSep: '.',  name: 'Kuwaiti Dinar' },
  { code: 'KYD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Cayman Islands Dollar' },
  { code: 'KZT', symbol: '₸',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ' ',  decimalSep: '.',  name: 'Kazakhstani Tenge' },
  { code: 'LAK', symbol: '₭',     symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Lao Kip' },
  { code: 'LBP', symbol: 'LL',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Lebanese Pound' },
  { code: 'LKR', symbol: '₨',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Sri Lankan Rupee' },
  { code: 'LRD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Liberian Dollar' },
  { code: 'LSL', symbol: 'M',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Lesotho Loti' },
  { code: 'LYD', symbol: 'LD',    symbolPosition: 'before', decimalDigits: 3, thousandsSep: ',',  decimalSep: '.',  name: 'Libyan Dinar' },
  { code: 'MGA', symbol: 'Ar',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Malagasy Ariary' },
  { code: 'MKD', symbol: 'ден',   symbolPosition: 'after',  decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Macedonian Denar' },
  { code: 'MMK', symbol: 'K',     symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Myanmar Kyat' },
  { code: 'MNT', symbol: '₮',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Mongolian Tögrög' },
  { code: 'MOP', symbol: 'P',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Macanese Pataca' },
  { code: 'MRU', symbol: 'UM',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Mauritanian Ouguiya' },
  { code: 'MUR', symbol: '₨',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Mauritian Rupee' },
  { code: 'MVR', symbol: 'Rf',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Maldivian Rufiyaa' },
  { code: 'MWK', symbol: 'MK',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Malawian Kwacha' },
  { code: 'MXN', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Mexican Peso' },
  { code: 'MYR', symbol: 'RM',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Malaysian Ringgit' },
  { code: 'MZN', symbol: 'MT',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Mozambican Metical' },
  { code: 'NAD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Namibian Dollar' },
  { code: 'NIO', symbol: 'C$',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Nicaraguan Córdoba' },
  { code: 'NOK', symbol: 'kr',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ' ',  decimalSep: ',',  name: 'Norwegian Krone' },
  { code: 'NPR', symbol: '₨',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Nepalese Rupee' },
  { code: 'NZD', symbol: 'NZ$',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'New Zealand Dollar' },
  { code: 'OMR', symbol: 'OMR',   symbolPosition: 'before', decimalDigits: 3, thousandsSep: ',',  decimalSep: '.',  name: 'Omani Rial' },
  { code: 'PAB', symbol: 'B/.',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Panamanian Balboa' },
  { code: 'PEN', symbol: 'S/',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Peruvian Sol' },
  { code: 'PGK', symbol: 'K',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Papua New Guinean Kina' },
  { code: 'PHP', symbol: '₱',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Philippine Peso' },
  { code: 'PKR', symbol: '₨',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Pakistani Rupee' },
  { code: 'PLN', symbol: 'zł',    symbolPosition: 'after',  decimalDigits: 2, thousandsSep: ' ',  decimalSep: ',',  name: 'Polish Zloty' },
  { code: 'PYG', symbol: 'Gs',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: '.',  decimalSep: ',',  name: 'Paraguayan Guaraní' },
  { code: 'QAR', symbol: 'QR',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Qatari Riyal' },
  { code: 'RON', symbol: 'lei',   symbolPosition: 'after',  decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Romanian Leu' },
  { code: 'RSD', symbol: 'din',   symbolPosition: 'after',  decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Serbian Dinar' },
  { code: 'RUB', symbol: '₽',     symbolPosition: 'after',  decimalDigits: 2, thousandsSep: ' ',  decimalSep: ',',  name: 'Russian Ruble' },
  { code: 'RWF', symbol: 'RF',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Rwandan Franc' },
  { code: 'SAR', symbol: 'SR',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Saudi Riyal' },
  { code: 'SBD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Solomon Islands Dollar' },
  { code: 'SCR', symbol: '₨',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Seychellois Rupee' },
  { code: 'SDG', symbol: 'SDG',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Sudanese Pound' },
  { code: 'SEK', symbol: 'kr',    symbolPosition: 'after',  decimalDigits: 2, thousandsSep: ' ',  decimalSep: ',',  name: 'Swedish Krona' },
  { code: 'SGD', symbol: 'S$',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Singapore Dollar' },
  { code: 'SHP', symbol: '£',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Saint Helena Pound' },
  { code: 'SLL', symbol: 'Le',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Sierra Leonean Leone' },
  { code: 'SOS', symbol: 'Sh',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Somali Shilling' },
  { code: 'SRD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Surinamese Dollar' },
  { code: 'SSP', symbol: '£',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'South Sudanese Pound' },
  { code: 'STN', symbol: 'Db',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'São Tomé and Príncipe Dobra' },
  { code: 'SVC', symbol: '₡',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Salvadoran Colón' },
  { code: 'SYP', symbol: 'LS',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Syrian Pound' },
  { code: 'SZL', symbol: 'L',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Swazi Lilangeni' },
  { code: 'THB', symbol: '฿',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Thai Baht' },
  { code: 'TJS', symbol: 'SM',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Tajikistani Somoni' },
  { code: 'TMT', symbol: 'T',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Turkmenistani Manat' },
  { code: 'TOP', symbol: 'T$',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Tongan Paʻanga' },
  { code: 'TRY', symbol: '₺',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Turkish Lira' },
  { code: 'TTD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Trinidad and Tobago Dollar' },
  { code: 'TWD', symbol: 'NT$',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'New Taiwan Dollar' },
  { code: 'TZS', symbol: 'TSh',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Tanzanian Shilling' },
  { code: 'UAH', symbol: '₴',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ' ',  decimalSep: ',',  name: 'Ukrainian Hryvnia' },
  { code: 'UGX', symbol: 'USh',   symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Ugandan Shilling' },
  { code: 'UYU', symbol: '$U',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: '.',  decimalSep: ',',  name: 'Uruguayan Peso' },
  { code: 'UZS', symbol: 'soʻm',  symbolPosition: 'after',  decimalDigits: 2, thousandsSep: ' ',  decimalSep: '.',  name: 'Uzbekistani Som' },
  { code: 'VES', symbol: 'Bs.S',  symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Venezuelan Bolívar Soberano' },
  { code: 'VND', symbol: '₫',     symbolPosition: 'after',  decimalDigits: 0, thousandsSep: '.',  decimalSep: ',',  name: 'Vietnamese Dong' },
  { code: 'VUV', symbol: 'Vt',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Vanuatu Vatu' },
  { code: 'WST', symbol: 'WS$',   symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Samoan Tālā' },
  { code: 'XCD', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'East Caribbean Dollar' },
  { code: 'XPF', symbol: 'Fr',    symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'CFP Franc' },
  { code: 'YER', symbol: '﷼',     symbolPosition: 'before', decimalDigits: 0, thousandsSep: ',',  decimalSep: '.',  name: 'Yemeni Rial' },
  { code: 'ZMW', symbol: 'ZK',    symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Zambian Kwacha' },
  { code: 'ZWL', symbol: '$',     symbolPosition: 'before', decimalDigits: 2, thousandsSep: ',',  decimalSep: '.',  name: 'Zimbabwean Dollar' },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Find a currency config by ISO 4217 code.
 * Returns EUR config as fallback for unknown codes.
 */
export function getCurrencyConfig(code: string): CurrencyConfig {
  const found = CURRENCY_LIST.find((c) => c.code === code.toUpperCase());
  if (found) return found;
  // Fallback: EUR
  return CURRENCY_LIST.find((c) => c.code === 'EUR') as CurrencyConfig;
}

/**
 * Format an amount as a display string using the given currency config.
 * Never hardcodes currency symbols — always uses config.symbol.
 *
 * Examples:
 *   formatCurrency(1234.5,  getCurrencyConfig('EUR')) → "1 234,50 €"
 *   formatCurrency(1234.5,  getCurrencyConfig('USD')) → "$1,234.50"
 *   formatCurrency(150000,  getCurrencyConfig('XAF')) → "150 000 FCFA"
 *   formatCurrency(1500.75, getCurrencyConfig('KWD')) → "KD1,500.750"
 */
export function formatCurrency(amount: number, config: CurrencyConfig): string {
  const { symbol, symbolPosition, decimalDigits, thousandsSep, decimalSep } = config;

  // Round to the correct number of decimal places
  const factor = Math.pow(10, decimalDigits);
  const rounded = Math.round(amount * factor) / factor;

  // Split into integer and decimal parts
  const fixed = rounded.toFixed(decimalDigits);
  const dotIndex = fixed.indexOf('.');
  const intPart = dotIndex >= 0 ? fixed.slice(0, dotIndex) : fixed;
  const decPart = dotIndex >= 0 ? fixed.slice(dotIndex + 1) : '';

  // Apply thousands separator to integer part
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);

  const formattedNumber =
    decimalDigits > 0
      ? `${formattedInt}${decimalSep}${decPart}`
      : formattedInt;

  if (symbolPosition === 'before') {
    return `${symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${symbol}`;
}

/**
 * Returns a prioritized list of the first 20 currencies for display in pickers.
 * Priority order matches CURRENCY_LIST top section:
 * EUR, USD, GBP, XAF, XOF, NGN, GHS, KES, ZAR, MAD, DZD, TND, EGP
 * followed by the next most-used global currencies.
 */
export function getDefaultCurrencies(): CurrencyConfig[] {
  return CURRENCY_LIST.slice(0, 20);
}
