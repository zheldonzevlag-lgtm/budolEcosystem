import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class UIUtils {
  static void showHostConfigDialog(BuildContext context) {
    final apiService = Provider.of<ApiService>(context, listen: false);
    final controller = TextEditingController(text: apiService.host);
    bool isScanning = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('API Host Configuration'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Enter the IP address and port of your budol₱ay Gateway.'),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                decoration: const InputDecoration(
                  labelText: 'Gateway Host',
                  hintText: 'e.g. 10.0.2.2:8080 or localhost:8080',
                  border: OutlineInputBorder(),
                ),
              ),
              if (isScanning) ...[
                const SizedBox(height: 16),
                const CircularProgressIndicator(),
                const SizedBox(height: 8),
                const Text('Scanning local network...'),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: isScanning ? null : () async {
                setState(() => isScanning = true);
                final found = await apiService.discoverAndSetHost();
                setState(() => isScanning = false);
                if (found) {
                  controller.text = apiService.host;
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Gateway discovered!'), backgroundColor: Colors.green),
                    );
                  }
                } else {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('No gateway found. Try manual entry.'), backgroundColor: Colors.orange),
                    );
                  }
                }
              },
              child: const Text('Scan Network'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                apiService.setHost(controller.text.trim());
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Host updated!'), backgroundColor: Colors.green),
                );
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  static Widget formatBudolPayText(String text, {
    TextStyle? baseStyle,
    bool useColors = true,
    TextAlign textAlign = TextAlign.start,
    int? maxLines,
    TextOverflow? overflow,
  }) {
    // Matches budol followed by optional underscore and suffix (pay, shap, etc.)
    final pattern = RegExp(r'(budol)(_?)([a-zA-Z\₱]+)', caseSensitive: false);
    
    if (!text.contains(pattern)) {
      return Text(
        text,
        style: baseStyle,
        textAlign: textAlign,
        maxLines: maxLines,
        overflow: overflow,
      );
    }

    final List<TextSpan> spans = [];
    final matches = pattern.allMatches(text);
    int lastMatchEnd = 0;

    for (final match in matches) {
      // Add text before the match
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(
          text: text.substring(lastMatchEnd, match.start),
          style: baseStyle,
        ));
      }

      String budolPart = match.group(1) ?? 'budol';
      String suffixPart = match.group(3) ?? '';
      
      // Normalize to branded casing
      budolPart = "budol";
      final String suffixLower = suffixPart.toLowerCase();
      
      if (suffixLower == "pay" || suffixLower == "₱ay") {
        suffixPart = "₱ay";
      } else if (suffixLower == "shap") {
        suffixPart = "Shap";
      } else if (suffixLower == "care") {
        suffixPart = "Care";
      } else if (suffixLower == "express") {
        suffixPart = "Express";
      } else if (suffixLower == "loan") {
        suffixPart = "Loan";
      } else if (suffixLower == "ecosystem") {
        suffixPart = "Ecosystem";
      } else if (suffixLower == "akawntng") {
        suffixPart = "Akawntng";
      }
      
      Color suffixColor;
      if (!useColors) {
        suffixColor = baseStyle?.color ?? Colors.black;
      } else {
        if (suffixLower.contains('pay') || suffixLower.contains('₱ay')) {
          suffixColor = const Color(0xFFF43F5E); // Rose Red
        } else if (suffixLower.contains('shap')) {
          suffixColor = const Color(0xFF10B981); // Emerald
        } else if (suffixLower.contains('care')) {
          suffixColor = const Color.fromARGB(255, 6, 153, 25); // Green
        } else if (suffixLower.contains('express')) {
          suffixColor = const Color(0xFFF59E0B); // Amber (Updated)
        } else if (suffixLower.contains('loan')) {
          suffixColor = const Color(0xFF3B82F6); // Blue (Updated)
        } else if (suffixLower.contains('ecosystem')) {
          suffixColor = const Color.fromARGB(255, 31, 201, 231); // Slate 500
        } else if (suffixLower.contains('akawntng')) {
          suffixColor = const Color(0xFFA855F7); // Purple
        } else {
          suffixColor = const Color(0xFFF43F5E); // Default to budolPay color
        }
      }

      // Add the branded budol* text
      spans.add(TextSpan(
        children: [
          TextSpan(
            text: budolPart.toLowerCase(),
            style: (baseStyle ?? const TextStyle()).copyWith(
              fontWeight: FontWeight.bold,
              color: baseStyle?.color ?? const Color(0xFF475569), // Darker slate (Slate 600)
            ),
          ),
          TextSpan(
            text: suffixPart,
            style: (baseStyle ?? const TextStyle()).copyWith(
              color: suffixColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ));

      lastMatchEnd = match.end;
    }

    // Add remaining text
    if (lastMatchEnd < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastMatchEnd),
        style: baseStyle,
      ));
    }

    return Text.rich(
      TextSpan(
        style: baseStyle ?? const TextStyle(color: Colors.white),
        children: spans,
      ),
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow ?? (maxLines != null ? TextOverflow.ellipsis : TextOverflow.clip),
    );
  }
}
