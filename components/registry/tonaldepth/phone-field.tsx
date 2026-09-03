"use client";

import { forwardRef, useMemo, useState } from "react";
import "./tonaldepth-phone-field.css";
import { TonalDepthCombobox } from "./tonaldepth-combobox";
import { TonalDepthInput } from "./tonaldepth-input";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface TonalDepthPhoneCountry {
  /** ISO 3166-1 alpha-2, uppercase. */
  iso: string;
  /** E.164 calling code, without the leading `+`. */
  dial: string;
  name: string;
}

/* ISO, dial and name packed into one string rather than 239 object literals:
   a registry item is a single copied file, and 239 literals would be most of
   it. Split once at module load. */
const TonalDepthPACKED = "AF,93,Afghanistan|AX,358,Åland Islands|AL,355,Albania|DZ,213,Algeria|AS,1,American Samoa|AD,376,Andorra|AO,244,Angola|AI,1,Anguilla|AG,1,Antigua & Barbuda|AR,54,Argentina|AM,374,Armenia|AW,297,Aruba|AU,61,Australia|AT,43,Austria|AZ,994,Azerbaijan|BS,1,Bahamas|BH,973,Bahrain|BD,880,Bangladesh|BB,1,Barbados|BY,375,Belarus|BE,32,Belgium|BZ,501,Belize|BJ,229,Benin|BM,1,Bermuda|BT,975,Bhutan|BO,591,Bolivia|BA,387,Bosnia & Herzegovina|BW,267,Botswana|BR,55,Brazil|VG,1,British Virgin Islands|BN,673,Brunei|BG,359,Bulgaria|BF,226,Burkina Faso|BI,257,Burundi|KH,855,Cambodia|CM,237,Cameroon|CA,1,Canada|CV,238,Cape Verde|BQ,599,Caribbean Netherlands|KY,1,Cayman Islands|CF,236,Central African Republic|TD,235,Chad|CL,56,Chile|CN,86,China|CO,57,Colombia|KM,269,Comoros|CG,242,Congo - Brazzaville|CD,243,Congo - Kinshasa|CK,682,Cook Islands|CR,506,Costa Rica|CI,225,Côte d’Ivoire|HR,385,Croatia|CU,53,Cuba|CW,599,Curaçao|CY,357,Cyprus|CZ,420,Czechia|DK,45,Denmark|DJ,253,Djibouti|DM,1,Dominica|DO,1,Dominican Republic|EC,593,Ecuador|EG,20,Egypt|SV,503,El Salvador|GQ,240,Equatorial Guinea|ER,291,Eritrea|EE,372,Estonia|SZ,268,Eswatini|ET,251,Ethiopia|FK,500,Falkland Islands|FO,298,Faroe Islands|FJ,679,Fiji|FI,358,Finland|FR,33,France|GF,594,French Guiana|PF,689,French Polynesia|GA,241,Gabon|GM,220,Gambia|GE,995,Georgia|DE,49,Germany|GH,233,Ghana|GI,350,Gibraltar|GR,30,Greece|GL,299,Greenland|GD,1,Grenada|GP,590,Guadeloupe|GU,1,Guam|GT,502,Guatemala|GG,44,Guernsey|GN,224,Guinea|GW,245,Guinea-Bissau|GY,592,Guyana|HT,509,Haiti|HN,504,Honduras|HK,852,Hong Kong SAR China|HU,36,Hungary|IS,354,Iceland|IN,91,India|ID,62,Indonesia|IR,98,Iran|IQ,964,Iraq|IE,353,Ireland|IM,44,Isle of Man|IL,972,Israel|IT,39,Italy|JM,1,Jamaica|JP,81,Japan|JE,44,Jersey|JO,962,Jordan|KZ,7,Kazakhstan|KE,254,Kenya|KI,686,Kiribati|XK,383,Kosovo|KW,965,Kuwait|KG,996,Kyrgyzstan|LA,856,Laos|LV,371,Latvia|LB,961,Lebanon|LS,266,Lesotho|LR,231,Liberia|LY,218,Libya|LI,423,Liechtenstein|LT,370,Lithuania|LU,352,Luxembourg|MO,853,Macao SAR China|MG,261,Madagascar|MW,265,Malawi|MY,60,Malaysia|MV,960,Maldives|ML,223,Mali|MT,356,Malta|MH,692,Marshall Islands|MQ,596,Martinique|MR,222,Mauritania|MU,230,Mauritius|YT,262,Mayotte|MX,52,Mexico|FM,691,Micronesia|MD,373,Moldova|MC,377,Monaco|MN,976,Mongolia|ME,382,Montenegro|MS,1,Montserrat|MA,212,Morocco|MZ,258,Mozambique|MM,95,Myanmar (Burma)|NA,264,Namibia|NR,674,Nauru|NP,977,Nepal|NL,31,Netherlands|NC,687,New Caledonia|NZ,64,New Zealand|NI,505,Nicaragua|NE,227,Niger|NG,234,Nigeria|NU,683,Niue|NF,672,Norfolk Island|KP,850,North Korea|MK,389,North Macedonia|MP,1,Northern Mariana Islands|NO,47,Norway|OM,968,Oman|PK,92,Pakistan|PW,680,Palau|PS,970,Palestinian Territories|PA,507,Panama|PG,675,Papua New Guinea|PY,595,Paraguay|PE,51,Peru|PH,63,Philippines|PL,48,Poland|PT,351,Portugal|PR,1,Puerto Rico|QA,974,Qatar|RE,262,Réunion|RO,40,Romania|RU,7,Russia|RW,250,Rwanda|WS,685,Samoa|SM,378,San Marino|ST,239,São Tomé & Príncipe|SA,966,Saudi Arabia|SN,221,Senegal|RS,381,Serbia|SC,248,Seychelles|SL,232,Sierra Leone|SG,65,Singapore|SX,1,Sint Maarten|SK,421,Slovakia|SI,386,Slovenia|SB,677,Solomon Islands|SO,252,Somalia|ZA,27,South Africa|KR,82,South Korea|SS,211,South Sudan|ES,34,Spain|LK,94,Sri Lanka|BL,590,St. Barthélemy|SH,290,St. Helena|KN,1,St. Kitts & Nevis|LC,1,St. Lucia|MF,590,St. Martin|PM,508,St. Pierre & Miquelon|VC,1,St. Vincent & Grenadines|SD,249,Sudan|SR,597,Suriname|SJ,47,Svalbard & Jan Mayen|SE,46,Sweden|CH,41,Switzerland|SY,963,Syria|TW,886,Taiwan|TJ,992,Tajikistan|TZ,255,Tanzania|TH,66,Thailand|TL,670,Timor-Leste|TG,228,Togo|TK,690,Tokelau|TO,676,Tonga|TT,1,Trinidad & Tobago|TN,216,Tunisia|TR,90,Türkiye|TM,993,Turkmenistan|TC,1,Turks & Caicos Islands|TV,688,Tuvalu|VI,1,U.S. Virgin Islands|UG,256,Uganda|UA,380,Ukraine|AE,971,United Arab Emirates|GB,44,United Kingdom|US,1,United States|UY,598,Uruguay|UZ,998,Uzbekistan|VU,678,Vanuatu|VA,39,Vatican City|VE,58,Venezuela|VN,84,Vietnam|WF,681,Wallis & Futuna|YE,967,Yemen|ZM,260,Zambia|ZW,263,Zimbabwe";

export const TonalDepthPHONE_COUNTRIES: TonalDepthPhoneCountry[] = TonalDepthPACKED.split("|").map(row => {
  const [iso, dial, ...name] = row.split(",");
  return { iso: iso!, dial: dial!, name: name.join(",") };
});

/** Delivery countries first — the six a reader here is most likely to want. */
export const TonalDepthPRIORITY_ISO = ["IN", "AE", "SA", "SG", "GB", "US"];

const TonalDepthBY_ISO = new Map(TonalDepthPHONE_COUNTRIES.map(c => [c.iso, c]));

export const TonalDepthORDERED_COUNTRIES: TonalDepthPhoneCountry[] = [
  ...TonalDepthPRIORITY_ISO.map(iso => TonalDepthBY_ISO.get(iso)).filter((c): c is TonalDepthPhoneCountry => !!c),
  ...TonalDepthPHONE_COUNTRIES.filter(c => !TonalDepthPRIORITY_ISO.includes(c.iso)),
];

/**
 * The flag emoji for an ISO pair, derived rather than stored — it is just the
 * two regional-indicator code points. Windows ships no flag font and renders
 * the pair as letters, which is why every row shows the ISO code as well.
 */
export function TonalDepthflagOf(iso: string): string {
  return String.fromCodePoint(...[...iso.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export interface TonalDepthPhoneValue {
  /** For submission, e.g. `+919008770738`. Empty while unfilled. */
  e164: string;
  /** The national part as typed. */
  national: string;
  iso: string;
  dial: string;
}

export function TonalDepthemptyPhone(iso = "IN"): TonalDepthPhoneValue {
  const country = TonalDepthBY_ISO.get(iso) ?? TonalDepthORDERED_COUNTRIES[0]!;
  return { e164: "", national: "", iso: country.iso, dial: country.dial };
}

const TonalDepthcompose = (country: TonalDepthPhoneCountry, national: string): TonalDepthPhoneValue => {
  const digits = national.replace(/\D/g, "");
  return { e164: digits ? `+${country.dial}${digits}` : "", national, iso: country.iso, dial: country.dial };
};

export interface TonalDepthPhoneFieldProps {
  value?: TonalDepthPhoneValue;
  onValueChange?: (value: TonalDepthPhoneValue) => void;
  /** Restrict the country list — a form that only ships to three places. */
  countries?: TonalDepthPhoneCountry[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export const TonalDepthPhoneField = forwardRef<HTMLInputElement, TonalDepthPhoneFieldProps>(function TonalDepthPhoneField(
  { value, onValueChange, countries = TonalDepthORDERED_COUNTRIES, label = "Phone", placeholder = "90087 70738", disabled, invalid, className, id, name },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState<TonalDepthPhoneValue>(() => TonalDepthemptyPhone());
  const current = value ?? uncontrolled;
  const country = countries.find(c => c.iso === current.iso) ?? countries[0]!;

  const set = (next: TonalDepthPhoneValue) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  /* The dial code is searchable as well as the name and the ISO pair, because
     somebody who knows "+971" should not have to remember which country it is. */
  const options = useMemo(
    () => countries.map(c => ({
      value: c.iso,
      // Searchable by NAME — which is what a person types.
      label: `${TonalDepthflagOf(c.iso)}  ${c.name}`,
      // Chosen state: the flag and the code, nothing else. The country's name
      // beside a number you are about to type is the one word in the row that
      // carries no information — you already know which country you picked.
      display: `${TonalDepthflagOf(c.iso)} +${c.dial}`,
      mark: `+${c.dial}`,
    })),
    [countries],
  );

  return (
    <div className={cx("td-registry-phone", className)} data-disabled={disabled || undefined}>
      <TonalDepthCombobox
        className="td-registry-phone-country"
        containerClassName="td-registry-phone-combo"
        options={options}
        value={current.iso}
        onValueChange={iso => {
          const picked = countries.find(c => c.iso === iso);
          if (picked) set(TonalDepthcompose(picked, current.national));
        }}
        label={`${label} country`}
        placeholder={`${TonalDepthflagOf(country.iso)} +${country.dial}`}
        listClassName="td-registry-phone-list"
        disabled={disabled}
      />
      <TonalDepthInput
        ref={ref}
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        containerClassName="td-registry-phone-number"
        className="td-registry-phone-input"
        placeholder={placeholder}
        disabled={disabled}
        invalid={invalid}
        aria-label={label}
        value={current.national}
        onChange={event => set(TonalDepthcompose(country, event.target.value))}
      />
    </div>
  );
});
