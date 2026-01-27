import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'tflite_web_stub.dart' if (dart.library.io) 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';
import '../utils/timezone_utils.dart';

class FaceEmbeddingService {
  Interpreter? _interpreter;
  bool _isModelLoaded = false;
  Completer<void>? _loadingCompleter;

  // Debug log stream for UI visibility
  final StreamController<String> _logController = StreamController<String>.broadcast();
  Stream<String> get logStream => _logController.stream;

  FaceEmbeddingService() {
    _initModel();
  }

  void _log(String message) {
    debugPrint('FaceEmbeddingService: $message');
    final now = TimezoneUtils.getManilaNow();
    _logController.add('${now.toString().split(' ').last.substring(0, 8)}: $message');
  }

  Future<void> _initModel() async {
    if (kIsWeb) {
      _log('Face embedding is not supported on web.');
      _isModelLoaded = false;
      return;
    }
    if (_isModelLoaded && _interpreter != null) return;
    
    // If already loading, wait for the existing process
    if (_loadingCompleter != null) {
      _log('Waiting for existing loading process...');
      return _loadingCompleter!.future;
    }
    
    _loadingCompleter = Completer<void>();
    const maxRetries = 2;
    for (int attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        _log('Initialization attempt $attempt/$maxRetries');
        
        // 1. Load asset as byte data
        final ByteData data = await rootBundle.load('assets/models/facenet.tflite');
        final Uint8List bytes = data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes);
        
        if (bytes.isEmpty) {
          throw Exception('Model asset data is empty');
        }
        
        // Check for Git LFS pointer or corrupted file
        if (bytes.length < 1024) {
             String content = String.fromCharCodes(bytes);
             _log('WARNING: Model file is extremely small (${bytes.length} bytes). Content preview: $content');
             throw Exception('Model file is too small (${bytes.length} bytes). This is likely a Git LFS pointer or a corrupted file. Please ensure Git LFS is installed and the file is pulled correctly.');
        }

        // Model size and hash validation guard check
        const expectedSize = 93941044; // Expected size in bytes
        const expectedHash = '54660297ebad23b7106a8ccd05f2f2f616b3d39bf7d7e82e148cf8ed7e27ae1a'; // SHA256 for valid FaceNet model
        
        if (bytes.length != expectedSize) {
          throw Exception('Model file size mismatch. Expected: $expectedSize bytes, Got: ${bytes.length} bytes. The model file may be corrupted or outdated.');
        }
        
        // Calculate SHA256 hash
        final modelHash = await _calculateSHA256(bytes);
        if (modelHash != expectedHash) {
          throw Exception('Model file hash mismatch. Expected: $expectedHash, Got: $modelHash. The model file may be corrupted or tampered with.');
        }
        
        _log('Model validation passed - Size: ${bytes.length} bytes, Hash: $modelHash');

        _log('Asset loaded (${bytes.length} bytes)');

        // 2. Write to a temporary file with attempt suffix to avoid stale locks
        final tempDir = await getTemporaryDirectory();
        final modelFile = File('${tempDir.path}/facenet_attempt_$attempt.tflite');
        await modelFile.writeAsBytes(bytes, flush: true);
        
        if (!await modelFile.exists() || await modelFile.length() != bytes.length) {
          throw Exception('Failed to write or verify model temporary file');
        }
        _log('Model written to ${modelFile.path}');

        // 3. Create interpreter with specific options
        final options = InterpreterOptions()..threads = 2;
        
        _log('Creating interpreter from file...');
        final newInterpreter = Interpreter.fromFile(modelFile, options: options);
        
        // 4. Validate interpreter immediately after creation
        try {
          // Force native call to ensure interpreter is healthy
          newInterpreter.getInputTensors();
        } catch (e) {
          throw Exception('Interpreter health check failed: $e');
        }

        _interpreter = newInterpreter;
        _isModelLoaded = true;
        _log('Initialization complete on attempt $attempt.');
        
        if (!_loadingCompleter!.isCompleted) {
          _loadingCompleter!.complete();
        }
        return; // success
      } catch (e, stack) {
        _log('Attempt $attempt failed: $e');
        if (attempt == maxRetries) {
          _log('All attempts exhausted. Stack trace: $stack');
          _isModelLoaded = false;
          _interpreter = null;
          
          if (_loadingCompleter != null && !_loadingCompleter!.isCompleted) {
            _loadingCompleter!.completeError(e);
          }
          // IMPORTANT: Re-throw the error so the caller knows initialization failed
          throw Exception('TFLite initialization failed after $maxRetries attempts: $e');
        } else {
          _log('Retrying in 200ms...');
          await Future.delayed(const Duration(milliseconds: 200)); // brief pause before retry
        }
      } finally {
        if (attempt == maxRetries) {
          _loadingCompleter = null; // Reset only after last attempt
        }
      }
    }
  }

  /// Generates a 512-dimension embedding from an image.
  /// If [faceArea] is provided, it crops the image to that area before processing.
  Future<List<double>?> generateEmbedding(File imageFile, {Rect? faceArea}) async {
    try {
      _log('Starting embedding generation...');
      // Ensure model is loaded, awaiting any in-progress initialization
      try {
        await _initModel();
      } catch (e) {
        _log('_initModel() threw: $e');
        throw Exception('AI Inference failed to initialize: $e');
      }
      
      if (_interpreter == null) {
        throw Exception('TFLite Interpreter is unavailable (null) even after successful _initModel call');
      }

      // Check if interpreter is actually valid by trying to get input tensors if possible
      // (Some versions might throw if closed or invalid)
      try {
        _interpreter!.getInputTensors();
      } catch (e) {
        _log('Interpreter check failed, re-initializing...');
        _isModelLoaded = false;
        _interpreter = null;
        await _initModel();
        if (_interpreter == null) {
          throw Exception('Interpreter failed health check and re-initialization');
        }
      }

      // 1. Read and decode image
      final imageData = await imageFile.readAsBytes();
      img.Image? originalImage = img.decodeImage(imageData);
      if (originalImage == null) {
        throw Exception('Failed to decode image data');
      }
      _log('Image decoded: ${originalImage.width}x${originalImage.height}');

      // 2. Ensure image is in RGB format
      if (originalImage.format != img.Format.uint8 || originalImage.numChannels != 3) {
        originalImage = originalImage.convert(format: img.Format.uint8, numChannels: 3);
      }

      // 3. Crop face area if provided
      img.Image faceImage;
      if (faceArea != null) {
        _log('Cropping to face area: $faceArea');
        // Add some padding to the crop for better FaceNet performance
        final padding = (faceArea.width * 0.1).toInt();
        faceImage = img.copyCrop(
          originalImage, 
          x: (faceArea.left - padding).toInt().clamp(0, originalImage.width), 
          y: (faceArea.top - padding).toInt().clamp(0, originalImage.height), 
          width: (faceArea.width + padding * 2).toInt().clamp(1, originalImage.width), 
          height: (faceArea.height + padding * 2).toInt().clamp(1, originalImage.height)
        );
      } else {
        faceImage = originalImage;
      }

      // 4. Preprocess: Resize to 160x160 (Standard FaceNet input size)
      _log('Resizing to 160x160...');
      img.Image resizedImage = img.copyResize(faceImage, width: 160, height: 160);
      
      // 5. Convert to Float32List and normalize (-1 to 1)
      var input = _imageToByteListFloat32(resizedImage, 160, 127.5, 127.5);
      
      // 6. Prepare output buffer (512 floats for FaceNet)
      // Using nested list for broader device compatibility
      var output = List<List<double>>.generate(1, (i) => List<double>.filled(512, 0.0));

      // 7. Run inference
      // Ensure input is shaped as [1, 160, 160, 3]
      // Cast to List to ensure the 'reshape' extension from tflite_flutter (or stub) is recognized
      var inputReshaped = (input as List<double>).reshape([1, 160, 160, 3]);
      _log('Running TFLite inference...');
      _interpreter!.run(inputReshaped, output);

      // 8. Return as a flat list
      final result = List<double>.from(output[0]);
      _log('Embedding generated successfully.');
      return result;
    } catch (e) {
      _log('Error generating embedding: $e');
      rethrow; // Rethrow to let the UI know exactly what happened
    }
  }

  Float32List _imageToByteListFloat32(img.Image image, int inputSize, double mean, double std) {
    var convertedBytes = Float32List(1 * inputSize * inputSize * 3);
    var buffer = Float32List.view(convertedBytes.buffer);
    int pixelIndex = 0;
    
    for (var i = 0; i < inputSize; i++) {
      for (var j = 0; j < inputSize; j++) {
        var pixel = image.getPixel(j, i);
        // Ensure we are getting 0-255 values even if image format is different
        buffer[pixelIndex++] = (pixel.r.toDouble() - mean) / std;
        buffer[pixelIndex++] = (pixel.g.toDouble() - mean) / std;
        buffer[pixelIndex++] = (pixel.b.toDouble() - mean) / std;
      }
    }
    return convertedBytes;
  }

  /// Calculates cosine similarity between two embeddings.
  double compare(List<double> emb1, List<double> emb2) {
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

  // SHA256 hash calculation for model validation
  Future<String> _calculateSHA256(Uint8List data) async {
    try {
      // Use compute to avoid blocking the main thread for large files
      return await compute((bytes) {
        try {
          // Robust SHA256 implementation using crypto package
          final hash = sha256.convert(bytes);
          return hash.toString();
        } catch (e) {
          throw Exception('Failed to calculate hash: $e');
        }
      }, data);
    } catch (e) {
      _log('Hash calculation failed: $e');
      throw Exception('Failed to calculate model hash: $e');
    }
  }

  void dispose() {
    _interpreter?.close();
    _logController.close();
  }
}
