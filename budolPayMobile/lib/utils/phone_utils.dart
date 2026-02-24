
class PhoneUtils {
  static String? normalizePhoneNumber(String? phone) {
    if (phone == null || phone.isEmpty) return null;

    // Remove all non-digit characters except '+'
    String cleaned = phone.replaceAll(RegExp(r'[^0-9+]'), '');

    // Handle standard Philippine formats
    if (cleaned.startsWith('+63')) {
      // Already in international format, just ensure length is correct if needed
      // +63 9XX XXX XXXX (13 chars)
      if (cleaned.length == 13) return cleaned;
    } else if (cleaned.startsWith('63')) {
      // 63 9XX XXX XXXX -> +63 9XX XXX XXXX
      if (cleaned.length == 12) return '+$cleaned';
    } else if (cleaned.startsWith('09')) {
      // 09XX XXX XXXX -> +63 9XX XXX XXXX
      if (cleaned.length == 11) return '+63${cleaned.substring(1)}';
    } else if (cleaned.startsWith('9')) {
      // 9XX XXX XXXX -> +63 9XX XXX XXXX
      if (cleaned.length == 10) return '+63$cleaned';
    }

    // Return original if it doesn't match known patterns, 
    // but cleaner to return the cleaned version if it looks like a number
    return cleaned;
  }

  static bool isValidPhilippineNumber(String phone) {
    final normalized = normalizePhoneNumber(phone);
    if (normalized == null) return false;
    // Must start with +639 and have 13 characters total
    return normalized.startsWith('+639') && normalized.length == 13;
  }
}
