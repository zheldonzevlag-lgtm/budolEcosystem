import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

class PhoneNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    final text = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (text.length > 11) return oldValue;

    String formatted = '';
    for (int i = 0; i < text.length; i++) {
      if (i == 4) formatted += '-';
      if (i == 7) formatted += '-';
      formatted += text[i];
    }

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class CurrencyInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    if (newValue.text.isEmpty) {
      return newValue.copyWith(text: '');
    }

    // Handle backspace or empty
    String text = newValue.text.replaceAll(RegExp(r'[^\d]'), '');
    if (text.isEmpty) {
      return const TextEditingValue(
        text: '',
        selection: TextSelection.collapsed(offset: 0),
      );
    }

    // Convert to double (treating as cents)
    double value = double.parse(text) / 100;
    
    // Format with commas and 2 decimals
    final formatter = NumberFormat("#,##0.00", "en_US");
    String formatted = formatter.format(value);

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class AmountUtils {
  static String format(double amount) {
    return NumberFormat.currency(
      locale: 'en_PH',
      symbol: '₱',
      decimalDigits: 2,
    ).format(amount);
  }

  static String formatNoSymbol(double amount) {
    return NumberFormat('###0.00', 'en_US').format(amount);
  }

  static double parse(String text) {
    if (text.isEmpty) return 0.0;
    // Remove commas added by the CurrencyInputFormatter
    final cleanText = text.replaceAll(',', '');
    return double.tryParse(cleanText) ?? 0.0;
  }
}

class DateUtils {
  static DateTime toManila(DateTime dateTime) {
    return dateTime.toUtc().add(const Duration(hours: 8));
  }

  static String formatDateTime(DateTime dateTime) {
    return DateFormat('MMM dd, yyyy hh:mm a').format(toManila(dateTime));
  }

  static String formatTimeOnly(DateTime dateTime) {
    return DateFormat('hh:mm a').format(toManila(dateTime));
  }
}
