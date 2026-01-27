import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:budol_pay_mobile/utils/ui_utils.dart';

void main() {
  group('UIUtils.formatBudolPayText Tests', () {
    test('Should return normal Text widget if BUDOL_PAY is not present', () {
      const text = 'Normal Transaction';
      final widget = UIUtils.formatBudolPayText(text);
      
      expect(widget, isA<Text>());
      expect((widget as Text).data, text);
    });

    test('Should return Text with textSpan if BUDOL_PAY is present', () {
      const text = 'Payment to BUDOL_PAY';
      final widget = UIUtils.formatBudolPayText(text);
      
      expect(widget, isA<Text>());
      expect((widget as Text).textSpan, isNotNull);
    });

    test('Should correctly format budolPay with rose red color', () {
      const text = 'BUDOL_PAY';
      final widget = UIUtils.formatBudolPayText(text) as Text;
      final textSpan = widget.textSpan as TextSpan;
      
      // The implementation of Text.rich wraps the children spans
      expect(textSpan.children!.length, 1); 
      
      final replacementSpan = textSpan.children![0] as TextSpan;
      expect(replacementSpan.children!.length, 2);
      
      final budolSpan = replacementSpan.children![0] as TextSpan;
      final paySpan = replacementSpan.children![1] as TextSpan;
      
      expect(budolSpan.text, 'budol');
      expect(paySpan.text, '₱ay'); // It uses the peso sign Pay
      expect(paySpan.style!.color, const Color(0xFFF43F5E));
    });
  });
}
