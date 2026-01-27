class TimezoneUtils {
  /// Returns the current time in Asia/Manila (UTC+8)
  static DateTime getManilaNow() {
    final now = DateTime.now().toUtc();
    return now.add(const Duration(hours: 8));
  }

  /// Converts any DateTime to Asia/Manila (UTC+8)
  static DateTime toManila(DateTime dateTime) {
    final utc = dateTime.toUtc();
    return utc.add(const Duration(hours: 8));
  }

  /// Formats a DateTime to ISO 8601 string in Manila time
  static String toManilaIsoString(DateTime dateTime) {
    final manilaTime = toManila(dateTime);
    return manilaTime.toIso8601String();
  }
}
