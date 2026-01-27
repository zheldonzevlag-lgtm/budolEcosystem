import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io_client;
import 'dart:async';

class SocketService with ChangeNotifier {
  io_client.Socket? _socket;
  String? _userId;
  String? _baseUrl;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  final _balanceController = StreamController<double>.broadcast();
  Stream<double> get balanceStream => _balanceController.stream;

  final _transactionController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get transactionStream => _transactionController.stream;

  void init({required String baseUrl, required String? userId}) {
    if (baseUrl == _baseUrl && userId == _userId && _socket != null) return;

    _baseUrl = baseUrl;
    _userId = userId;

    _disconnect();
    
    if (userId == null) return;

    if (kDebugMode) {
      print('SocketService: Initializing for user $userId at $baseUrl');
    }

    try {
      _socket = io_client.io(baseUrl, io_client.OptionBuilder()
        .setTransports(['websocket', 'polling']) // Allow polling as fallback
        .enableAutoConnect()
        .setReconnectionAttempts(10)
        .setReconnectionDelay(2000)
        .setExtraHeaders({'user-id': userId}) // Optional: for debugging/logging on server
        .build());

      _socket!.onConnect((_) {
        if (kDebugMode) {
          print('SocketService: Connected to gateway. Socket ID: ${_socket!.id}');
        }
        _isConnected = true;
        _socket!.emit('join', userId);
        notifyListeners();
      });

      _socket!.onConnectError((err) {
        if (kDebugMode) {
          print('SocketService: Connection Error: $err');
        }
        _isConnected = false;
        notifyListeners();
      });

      _socket!.onError((err) {
        if (kDebugMode) {
          print('SocketService: Socket Error: $err');
        }
      });

      _socket!.onDisconnect((_) {
        if (kDebugMode) {
          print('SocketService: Disconnected from gateway');
        }
        _isConnected = false;
        notifyListeners();
      });

      _socket!.on('balance_update', (data) {
        if (kDebugMode) {
          print('SocketService: Received balance_update: $data');
        }
        if (data != null && data is Map && data['balance'] != null) {
          final balance = double.tryParse(data['balance'].toString()) ?? 0.0;
          _balanceController.add(balance);
        }
      });

      _socket!.on('transaction_update', (data) {
        if (kDebugMode) {
          print('SocketService: Received transaction_update: $data');
        }
        if (data != null && data is Map) {
          try {
            _transactionController.add(Map<String, dynamic>.from(data));
          } catch (e) {
            if (kDebugMode) print('SocketService: Error parsing transaction_update: $e');
          }
        }
      });

      _socket!.connect();
    } catch (e) {
      if (kDebugMode) {
        print('SocketService: Error initializing socket: $e');
      }
    }
  }

  void _disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }

  void disconnect() {
    _disconnect();
    notifyListeners();
  }

  @override
  void dispose() {
    _disconnect();
    _balanceController.close();
    _transactionController.close();
    super.dispose();
  }
}
