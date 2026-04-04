// Currency data and utilities for the invoicing application
// ISO 4217 currency codes with symbols and formatting information

export interface Currency {
  code: string; // ISO 4217 currency code
  name: string; // Currency name
  symbol: string; // Currency symbol
  symbolNative: string; // Native symbol (e.g., ¥ for JPY, $ for USD)
  decimalDigits: number; // Number of decimal digits to display
  rounding: number; // Rounding increment (0 = no rounding)
  namePlural: string; // Plural name
  countries: string[]; // Countries using this currency
}

// Comprehensive list of currencies used worldwide
export const currencies: Currency[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'US dollars',
    countries: ['United States', 'Ecuador', 'El Salvador', 'Panama', 'Puerto Rico', 'Timor-Leste', 'Zimbabwe'],
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolNative: '€',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'euros',
    countries: ['European Union', 'Andorra', 'Monaco', 'San Marino', 'Vatican City'],
  },
  {
    code: 'GBP',
    name: 'British Pound Sterling',
    symbol: '£',
    symbolNative: '£',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'British pounds sterling',
    countries: ['United Kingdom', 'Isle of Man', 'Jersey', 'Guernsey'],
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Canadian dollars',
    countries: ['Canada'],
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'AU$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Australian dollars',
    countries: ['Australia', 'Christmas Island', 'Cocos (Keeling) Islands', 'Norfolk Island'],
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    symbolNative: '￥',
    decimalDigits: 0,
    rounding: 0,
    namePlural: 'Japanese yen',
    countries: ['Japan'],
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: 'CN¥',
    symbolNative: 'CN¥',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Chinese yuan',
    countries: ['China'],
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbolNative: '₹',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Indian rupees',
    countries: ['India', 'Bhutan'],
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Singapore dollars',
    countries: ['Singapore'],
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Hong Kong dollars',
    countries: ['Hong Kong'],
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    symbolNative: 'CHF',
    decimalDigits: 2,
    rounding: 0.05,
    namePlural: 'Swiss francs',
    countries: ['Switzerland', 'Liechtenstein'],
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'New Zealand dollars',
    countries: ['New Zealand', 'Cook Islands', 'Niue', 'Pitcairn Islands', 'Tokelau'],
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: 'MX$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Mexican pesos',
    countries: ['Mexico'],
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    symbolNative: 'R$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Brazilian reals',
    countries: ['Brazil'],
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    symbolNative: 'R',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'South African rand',
    countries: ['South Africa', 'Lesotho', 'Namibia'],
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: 'RUB',
    symbolNative: '₽',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Russian rubles',
    countries: ['Russia'],
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    symbolNative: '₩',
    decimalDigits: 0,
    rounding: 0,
    namePlural: 'South Korean won',
    countries: ['South Korea'],
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    symbolNative: '₺',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Turkish Lira',
    countries: ['Turkey', 'Northern Cyprus'],
  },
  {
    code: 'AED',
    name: 'United Arab Emirates Dirham',
    symbol: 'AED',
    symbolNative: 'د.إ.‏',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'UAE dirhams',
    countries: ['United Arab Emirates'],
  },
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'Skr',
    symbolNative: 'kr',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Swedish kronor',
    countries: ['Sweden'],
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'Nkr',
    symbolNative: 'kr',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Norwegian kroner',
    countries: ['Norway', 'Svalbard and Jan Mayen', 'Bouvet Island'],
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'Dkr',
    symbolNative: 'kr',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Danish kroner',
    countries: ['Denmark', 'Faroe Islands', 'Greenland'],
  },
  {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    symbolNative: 'zł',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Polish zlotys',
    countries: ['Poland'],
  },
  {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    symbolNative: '฿',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Thai baht',
    countries: ['Thailand'],
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    symbolNative: 'Rp',
    decimalDigits: 0,
    rounding: 0,
    namePlural: 'Indonesian rupiahs',
    countries: ['Indonesia'],
  },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    symbolNative: 'RM',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Malaysian ringgits',
    countries: ['Malaysia'],
  },
  {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    symbolNative: '₱',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Philippine pesos',
    countries: ['Philippines'],
  },
  {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    symbolNative: '₫',
    decimalDigits: 0,
    rounding: 0,
    namePlural: 'Vietnamese dong',
    countries: ['Vietnam'],
  },
  {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: 'E£',
    symbolNative: 'ج.م.‏',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Egyptian pounds',
    countries: ['Egypt'],
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SR',
    symbolNative: 'ر.س.‏',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Saudi riyals',
    countries: ['Saudi Arabia'],
  },
  {
    code: 'ILS',
    name: 'Israeli New Shekel',
    symbol: '₪',
    symbolNative: '₪',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Israeli new shekels',
    countries: ['Israel', 'Palestine'],
  },
];

/**
 * Get currency by code
 */
export function getCurrencyByCode(code: string): Currency | undefined {
  return currencies.find(currency => currency.code === code);
}

/**
 * Get currencies by country
 */
export function getCurrenciesByCountry(country: string): Currency[] {
  return currencies.filter(currency => 
    currency.countries.some(c => 
      c.toLowerCase().includes(country.toLowerCase())
    )
  );
}

/**
 * Format amount with currency symbol
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string = 'USD',
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    locale = 'en-US',
  } = options;

  const currency = getCurrencyByCode(currencyCode) || currencies[0];
  
  // Format the number with proper decimal digits
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: currency.decimalDigits,
    maximumFractionDigits: currency.decimalDigits,
  }).format(amount);

  if (showSymbol && showCode) {
    return `${currency.symbol}${formattedNumber} (${currency.code})`;
  } else if (showSymbol) {
    return `${currency.symbol}${formattedNumber}`;
  } else if (showCode) {
    return `${formattedNumber} ${currency.code}`;
  } else {
    return formattedNumber;
  }
}

/**
 * Convert amount from one currency to another
 * Note: In a real application, this would use live exchange rates
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  // Mock exchange rates for demonstration
  const rates: Record<string, number> = exchangeRates || {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150.5,
    CAD: 1.36,
    AUD: 1.52,
    CHF: 0.88,
    CNY: 7.24,
    INR: 83.2,
    SGD: 1.34,
    HKD: 7.82,
    NZD: 1.64,
    MXN: 17.1,
    BRL: 4.95,
    ZAR: 18.9,
    RUB: 91.5,
    KRW: 1332,
    TRY: 32.1,
    AED: 3.67,
    SEK: 10.5,
    NOK: 10.7,
    DKK: 6.9,
    PLN: 4.02,
    THB: 35.9,
    IDR: 15650,
    MYR: 4.72,
    PHP: 56.8,
    VND: 24450,
    EGP: 30.9,
    SAR: 3.75,
    ILS: 3.73,
  };

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

/**
 * Get popular currencies for dropdown selection
 */
export function getPopularCurrencies(): Currency[] {
  const popularCodes = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'SGD', 'HKD'];
  return currencies.filter(currency => popularCodes.includes(currency.code));
}

/**
 * Validate currency code
 */
export function isValidCurrencyCode(code: string): boolean {
  return currencies.some(currency => currency.code === code);
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  const currency = getCurrencyByCode(code);
  return currency?.symbol || '$';
}

/**
 * Get currency native symbol by code
 */
export function getCurrencyNativeSymbol(code: string): string {
  const currency = getCurrencyByCode(code);
  return currency?.symbolNative || '$';
}

/**
 * Get all currency codes
 */
export function getAllCurrencyCodes(): string[] {
  return currencies.map(currency => currency.code);
}

/**
 * Get currencies grouped by region
 */
export function getCurrenciesByRegion(): Record<string, Currency[]> {
  const regions: Record<string, Currency[]> = {
    'Americas': [],
    'Europe': [],
    'Asia': [],
    'Africa': [],
    'Oceania': [],
    'Middle East': [],
  };

  currencies.forEach(currency => {
    // Simple region detection based on countries
    const firstCountry = currency.countries[0] || '';
    
    if (firstCountry.includes('United States') || 
        firstCountry.includes('Canada') || 
        firstCountry.includes('Brazil') || 
        firstCountry.includes('Mexico')) {
      regions['Americas'].push(currency);
    } else if (firstCountry.includes('European') || 
               firstCountry.includes('United Kingdom') || 
               firstCountry.includes('Switzerland') || 
               firstCountry.includes('Sweden') || 
               firstCountry.includes('Poland')) {
      regions['Europe'].push(currency);
    } else if (firstCountry.includes('Japan') || 
               firstCountry.includes('China') || 
               firstCountry.includes('India') || 
               firstCountry.includes('Singapore') || 
               firstCountry.includes('South Korea')) {
      regions['Asia'].push(currency);
    } else if (firstCountry.includes('South Africa') || 
               firstCountry.includes('Egypt')) {
      regions['Africa'].push(currency);
    } else if (firstCountry.includes('Australia') || 
               firstCountry.includes('New Zealand')) {
      regions['Oceania'].push(currency);
    } else if (firstCountry.includes('Saudi') || 
               firstCountry.includes('United Arab') || 
               firstCountry.includes('Turkey') || 
               firstCountry.includes('Israel')) {
      regions['Middle East'].push(currency);
    } else {
      regions['Americas'].push(currency); // Default
    }
  });

  return regions;
}