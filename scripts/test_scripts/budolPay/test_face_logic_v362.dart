import 'dart:math';
import 'package:flutter_test/flutter_test.dart';

// Mock similarity logic from face_embedding_service.dart
double calculateSimilarity(List<double> emb1, List<double> emb2) {
  double dotProduct = 0.0;
  double normA = 0.0;
  double normB = 0.0;
  for (int i = 0; i < emb1.length; i++) {
    dotProduct += emb1[i] * emb2[i];
    normA += pow(emb1[i], 2);
    normB += pow(emb2[i], 2);
  }
  return dotProduct / (sqrt(normA) * sqrt(normB));
}

void main() {
  group('Face Recognition Logic Tests (v362)', () {
    test('Cosine Similarity - Perfect Match', () {
      final emb1 = List<double>.filled(128, 0.5);
      final emb2 = List<double>.filled(128, 0.5);
      
      final result = calculateSimilarity(emb1, emb2);
      expect(result, closeTo(1.0, 0.0001));
    });

    test('Cosine Similarity - High Match (>0.8)', () {
      final emb1 = List<double>.filled(128, 0.5);
      final emb2 = List<double>.from(emb1);
      emb2[0] = 0.45; // Slight variation
      
      final result = calculateSimilarity(emb1, emb2);
      expect(result, greaterThan(0.8));
    });

    test('Cosine Similarity - Dissimilar (<0.5)', () {
      final emb1 = List<double>.filled(128, 1.0);
      final emb2 = List<double>.filled(128, -1.0); // Opposite
      
      final result = calculateSimilarity(emb1, emb2);
      expect(result, lessThan(0.0));
    });
  });
}
