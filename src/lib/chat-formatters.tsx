import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

export function formatShortTime(iso?: string | null, isVi = true): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isSameDay) {
    return d.toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatMessageTime(iso: string, isVi = true): string {
  return new Date(iso).toLocaleTimeString(isVi ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function translateItemStatus(status: number, fallback: string, isVi: boolean): string {
  if (isVi) {
    switch (status) {
      case 1:
        return 'Đang bán';
      case 2:
        return 'Đã gỡ';
      case 3:
        return 'Đã đặt';
      case 4:
        return 'Đã bán';
      default:
        return fallback;
    }
  }
  switch (status) {
    case 1:
      return 'Available';
    case 2:
      return 'Removed';
    case 3:
      return 'Reserved';
    case 4:
      return 'Sold';
    default:
      return fallback;
  }
}

const ADDRESS_ADMIN_REGEX =
  /(?:^|[\s,])(?:phường|p\.\s*[\p{L}\d]|xã|thị trấn|quận|q\.\s*[\p{L}\d]|huyện|thị xã|tx\.?|thành phố|tp\.?|tỉnh|đường|hẻm|ngõ|khu phố|kp\.?|ktx|chung cư|tòa nhà|hồ chí minh|tp\.?\s*hcm|hcm|sài gòn|hà nội|đà nẵng|thủ đức|bình thạnh|tân bình|phú nhuận|gò vấp|bình tân|tân phú|bình dương|dĩ an|biên hòa|cần thơ|ward|district|street|st\.|ave|avenue|road|rd\.|ho chi minh|hanoi)(?=$|[\s,.])/iu;

const ADDRESS_START_REGEX =
  /(?:^|(?:[:\-]\s*|(?<![\p{L}\d])(?:[Oo]k(?:ay)?|[Ởở]|[Tt]ại|[Ll]à|[Đđ]ến|[Tt]ới|[Qq]ua|[Gg]ần|[Nn]gay|[Cc]hỗ|[Ss]ang|[Vv]ề|[Aa]t|[Ii]n|[Tt]o)\s+))((?:(?:\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)*)(?:\s*,\s*|\s+(?=[\p{Lu}\d]))|(?:[Ss]ố\s+\d+[\w/]*|[Ll]ô\s+[A-Z0-9]+|[Đđ]ường\s+\p{Lu}|[Hh]ẻm\s+\d+|[Nn]gõ\s+\d+|Khu\s+(?:A|B|C|đô thị|công nghiệp)|KTX\s+[\p{L}\d]|Ký túc xá\s+[\p{L}\d]|Tòa\s+nhà\s+[\p{L}\d]|Chung cư\s+[\p{L}\d]|Cổng\s+[\p{L}\d]|Đại học\s+[\p{L}\d]|ĐH\s+[\p{L}\d]|Trường\s+[\p{L}\d]|Landmark\s*\d*|Vincom\s+[\p{L}\d]|Gigamall))[^\r\n]{4,220})/u;

const ADDRESS_TRAILING_REGEX =
  /(?:\s+(?:lúc|vào lúc|tầm|khoảng|trước|sau|hôm|ngày|nhé|nha|nhe|ạ|ha|hen|nhỉ|nhá|được không|đc ko|đc k|ko|k|ok|nè|này|vậy|nha bạn|nhé bạn)(?=$|[\s,.!?]).*|[.,!?;:\s]+)$/iu;

const STREET_CUED_REGEX =
  /(?:[:\-]\s*|(?<![\p{L}\d])(?:[Ởở]|[Tt]ại|[Đđ]ịa\s+chỉ(?:\s+là)?|[Đđ]ến|[Tt]ới|[Qq]ua|[Gg]ần|[Nn]gay|[Cc]hỗ|[Aa]t|[Tt]o)\s+)(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)*(?:\s*,\s*|\s+)\p{Lu}[\p{L}\d]+(?:\s+\p{Lu}[\p{L}\d]+){1,5})/u;

const GOOGLE_MAPS_URL_REGEX =
  /https?:\/\/(?:www\.)?(?:google\.com\/maps[^\s]*|maps\.google\.com[^\s]*|maps\.app\.goo\.gl\/[^\s]+|goo\.gl\/maps\/[^\s]+)/i;

export function extractTypedAddressMatch(
  line: string
): { start: number; end: number; text: string } | null {
  const match = ADDRESS_START_REGEX.exec(line);
  if (match) {
    const raw = match[1];
    const start = match.index + (match[0].length - raw.length);
    const cleaned = raw.replace(ADDRESS_TRAILING_REGEX, '').trim();

    if (
      cleaned.length >= 10 &&
      cleaned.length <= 240 &&
      ADDRESS_ADMIN_REGEX.test(cleaned) &&
      (cleaned.includes(',') || /\d/.test(cleaned))
    ) {
      return { start, end: start + cleaned.length, text: cleaned };
    }
  }

  const cued = STREET_CUED_REGEX.exec(line);
  if (cued) {
    const raw = cued[1];
    const start = cued.index + (cued[0].length - raw.length);
    const cleaned = raw.replace(ADDRESS_TRAILING_REGEX, '').trim();
    if (cleaned.length >= 8 && cleaned.length <= 240) {
      return { start, end: start + cleaned.length, text: cleaned };
    }
  }

  return null;
}

function renderInlineLocationLine(
  line: string,
  lineIdx: number,
  isVi: boolean,
  isMine: boolean
): React.ReactNode {
  const linkClass = isMine
    ? 'text-[#FFF8EE] hover:text-white underline decoration-[#FFF8EE] underline-offset-2 font-medium break-words transition-colors'
    : 'text-[#A65A24] hover:text-[#844519] dark:text-[#F5A764] dark:hover:text-[#FBD6B0] underline underline-offset-2 font-medium break-words transition-colors';
  const titleText = isVi ? 'Mở trên Google Maps' : 'Open in Google Maps';

  const urlMatch = GOOGLE_MAPS_URL_REGEX.exec(line);
  if (urlMatch) {
    const rawUrl = urlMatch[0].replace(/[.,!?;:)]+$/, '');
    const start = urlMatch.index;
    const end = start + rawUrl.length;
    return (
      <React.Fragment key={lineIdx}>
        {line.slice(0, start)}
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={titleText}
          className={linkClass}
        >
          {rawUrl}
        </a>
        {line.slice(end)}
      </React.Fragment>
    );
  }

  const addressMatch = extractTypedAddressMatch(line);
  if (!addressMatch) return line;

  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressMatch.text)}`;
  return (
    <React.Fragment key={lineIdx}>
      {line.slice(0, addressMatch.start)}
      <a
        href={mapSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={titleText}
        className={linkClass}
      >
        {addressMatch.text}
      </a>
      {line.slice(addressMatch.end)}
    </React.Fragment>
  );
}

export function renderMessageContent(
  content: string,
  isVi: boolean,
  isMine: boolean
): React.ReactNode {
  const match = content.match(
    /^(?:Địa chỉ giao nhận đề xuất:|Proposed handover address:)\s*(.+)\r?\nGoogle Maps:\s*(https:\/\/[^\s]+)$/u
  );

  if (!match) {
    const lines = content.split(/\r?\n/);
    if (lines.length === 1) {
      return renderInlineLocationLine(lines[0], 0, isVi, isMine);
    }
    return lines.map((line, idx) => (
      <React.Fragment key={idx}>
        {idx > 0 && '\n'}
        {renderInlineLocationLine(line, idx, isVi, isMine)}
      </React.Fragment>
    ));
  }

  const address = match[1].trim();
  const mapUrl = match[2];

  try {
    const url = new URL(mapUrl);

    if (
      url.origin !== 'https://www.google.com' ||
      url.pathname !== '/maps/search/' ||
      !url.searchParams.get('query')
    ) {
      return content;
    }
  } catch {
    return content;
  }

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center gap-1.5 font-bold">
        <MapPin className="w-4 h-4 shrink-0" />
        <span>
          {isVi ? 'Địa chỉ giao nhận đề xuất' : 'Proposed handover address'}
        </span>
      </div>

      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded-xl px-3 py-2 border underline underline-offset-2 font-medium break-words transition-colors ${
          isMine
            ? 'bg-[#FAF7F2] border-[#F3DEC7] text-[#A65A24] hover:bg-white hover:text-[#844519]'
            : 'bg-[#FAF7F2] dark:bg-stone-900 border-[#EADBCE] dark:border-stone-700 text-[#A65A24] dark:text-[#F5A764] hover:bg-[#F3EADF] dark:hover:bg-stone-800'
        }`}
      >
        {address}
      </a>

      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 font-semibold text-xs transition-colors ${
          isMine
            ? 'bg-white text-[#A65A24] hover:bg-[#FAF7F2]'
            : 'bg-[#FAF7F2] dark:bg-stone-900 border border-[#EADBCE] dark:border-stone-700 text-[#A65A24] dark:text-[#F5A764] hover:bg-[#F3EADF] dark:hover:bg-stone-800'
        }`}
      >
        <span>{isVi ? 'Mở Google Maps' : 'Open Google Maps'}</span>
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
      </a>
    </div>
  );
}
