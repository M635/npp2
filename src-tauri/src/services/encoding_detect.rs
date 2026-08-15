use encoding_rs::{GBK, UTF_16BE, UTF_16LE, UTF_8};
use chardetng::EncodingDetector;

pub fn is_binary(data: &[u8]) -> bool {
    if data.is_empty() { return false; }
    // Check for null bytes (common in binary files)
    let null_count = data.iter().filter(|&&b| b == 0).count();
    if data.len() > 100 && null_count as f64 / data.len() as f64 > 0.1 {
        return true;
    }
    // Check for high concentration of non-printable chars
    let non_printable = data.iter().filter(|&&b| {
        !matches!(b, 0x09 | 0x0A | 0x0D | 0x20..=0x7E | 0xA0..=0xFF)
    }).count();
    non_printable as f64 / data.len() as f64 > 0.3
}

pub fn detect_encoding(data: &[u8]) -> crate::models::file_meta::Encoding {
    // Check BOM first
    if data.starts_with(&[0xEF, 0xBB, 0xBF]) {
        return crate::models::file_meta::Encoding::Utf8Bom;
    }
    if data.starts_with(&[0xFF, 0xFE]) && data.len() >= 2 {
        return crate::models::file_meta::Encoding::Utf16Le;
    }
    if data.starts_with(&[0xFE, 0xFF]) {
        return crate::models::file_meta::Encoding::Utf16Be;
    }

    // Use chardetng (Firefox/WHATWG detector) on a sample
    let sample_len = std::cmp::min(data.len(), 4096);
    let mut detector = EncodingDetector::new();
    let _ = detector.feed(&data[..sample_len], true);
    let name = detector.guess(None, true).name();

    match name {
        "GBK" | "gb18030" | "GB18030" => crate::models::file_meta::Encoding::Gbk,
        "GB2312" => crate::models::file_meta::Encoding::Gb2312,
        "UTF-16LE" => crate::models::file_meta::Encoding::Utf16Le,
        "UTF-16BE" => crate::models::file_meta::Encoding::Utf16Be,
        "ASCII" | "ISO-8859-1" | "windows-1252" | "Windows-1252" => crate::models::file_meta::Encoding::Ascii,
        _ => crate::models::file_meta::Encoding::Utf8,
    }
}

pub fn decode_bytes(bytes: &[u8], encoding: &crate::models::file_meta::Encoding) -> String {
    let (enc, strip_bom) = match encoding {
        crate::models::file_meta::Encoding::Utf8 | crate::models::file_meta::Encoding::Ascii | crate::models::file_meta::Encoding::Unknown => (UTF_8, false),
        crate::models::file_meta::Encoding::Utf8Bom => (UTF_8, true),
        crate::models::file_meta::Encoding::Gbk | crate::models::file_meta::Encoding::Gb2312 => (GBK, false),
        crate::models::file_meta::Encoding::Utf16Le => (UTF_16LE, true),
        crate::models::file_meta::Encoding::Utf16Be => (UTF_16BE, true),
    };
    let (decoded, _, _) = enc.decode(bytes);
    let mut text = decoded.into_owned();
    if strip_bom && text.starts_with('\u{FEFF}') {
        text.drain(..1);
    }
    text
}

pub fn encode_string(text: &str, encoding: &crate::models::file_meta::Encoding) -> Vec<u8> {
    let (enc, bom): (&'static encoding_rs::Encoding, Option<&[u8]>) = match encoding {
        crate::models::file_meta::Encoding::Utf8 | crate::models::file_meta::Encoding::Ascii | crate::models::file_meta::Encoding::Unknown => (UTF_8, None),
        crate::models::file_meta::Encoding::Utf8Bom => (UTF_8, Some(&[0xEF, 0xBB, 0xBF][..])),
        crate::models::file_meta::Encoding::Gbk => (GBK, None),
        crate::models::file_meta::Encoding::Gb2312 => (GBK, None),
        crate::models::file_meta::Encoding::Utf16Le => (UTF_16LE, Some(&[0xFF, 0xFE][..])),
        crate::models::file_meta::Encoding::Utf16Be => (UTF_16BE, Some(&[0xFE, 0xFF][..])),
    };
    let (bytes, _, _) = enc.encode(text);
    let mut result = Vec::new();
    if let Some(bom) = bom { result.extend_from_slice(bom); }
    result.extend_from_slice(&bytes);
    result
}
