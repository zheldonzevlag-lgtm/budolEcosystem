import 'package:flutter/foundation.dart';
import 'dart:async';
import 'api_service.dart';
import 'socket_service.dart';
import 'pusher_service.dart';

class RealtimeService with ChangeNotifier {
  final ApiService _apiService;
  final SocketService _socketService;
  final PusherService _pusherService;

  StreamSubscription? _balanceSubscription;
  StreamSubscription? _transactionSubscription;
  String? _currentMethod;
  String? _currentUserId;

  final _balanceController = StreamController<double>.broadcast();
  Stream<double> get balanceStream => _balanceController.stream;

  final _transactionController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get transactionStream => _transactionController.stream;

  RealtimeService(this._apiService, this._socketService, this._pusherService) {
    _apiService.addListener(_onApiServiceChanged);
  }

  void _onApiServiceChanged() {
    final settings = _apiService.systemSettings;
    final method = settings?['realtime']?['method'] ?? 'SWR';
    final userId = _apiService.user?['id']?.toString();

    if (method != _currentMethod || userId != _currentUserId) {
      if (kDebugMode) {
        print('RealtimeService: Settings changed. Method: $_currentMethod -> $method, User: $_currentUserId -> $userId');
      }
      init();
    }
  }

  void init() {
    if (!_apiService.isAuthenticated) {
      _disconnectAll();
      return;
    }

    final settings = _apiService.systemSettings;
    final method = settings?['realtime']?['method'] ?? 'SWR';
    final userId = _apiService.user?['id']?.toString();

    // If already initialized with same parameters, skip
    if (method == _currentMethod && userId == _currentUserId) return;

    if (kDebugMode) {
      print('RealtimeService: Initializing for method: $method, userId: $userId');
    }

    _disconnectAll();
    
    _currentMethod = method;
    _currentUserId = userId;

    if (method == 'SOCKETIO') {
      final socketioConfig = settings?['realtime']?['socketio'];
      final socketUrl = (socketioConfig != null && socketioConfig['url'] != null && socketioConfig['url'].isNotEmpty)
          ? socketioConfig['url']
          : _apiService.baseUrl;

      if (kDebugMode) {
        print('RealtimeService: Initializing Socket.io at $socketUrl');
      }

      _socketService.init(
        baseUrl: socketUrl,
        userId: userId,
      );
      _balanceSubscription = _socketService.balanceStream.listen((b) => _balanceController.add(b));
      _transactionSubscription = _socketService.transactionStream.listen((t) => _transactionController.add(t));
    } else if (method == 'PUSHER') {
      final pusherConfig = settings?['realtime']?['pusher'];
      if (pusherConfig != null) {
        _pusherService.init(
          apiKey: pusherConfig['key'] ?? '',
          cluster: pusherConfig['cluster'] ?? '',
          userId: userId,
        );
        _balanceSubscription = _pusherService.balanceStream.listen((b) => _balanceController.add(b));
        _transactionSubscription = _pusherService.transactionStream.listen((t) => _transactionController.add(t));
      }
    }
  }

  void _disconnectAll() {
    _cancelSubscriptions();
    _socketService.disconnect();
    _pusherService.disconnect();
    _currentMethod = null;
    _currentUserId = null;
  }

  void _cancelSubscriptions() {
    _balanceSubscription?.cancel();
    _transactionSubscription?.cancel();
    _balanceSubscription = null;
    _transactionSubscription = null;
  }

  @override
  void dispose() {
    _apiService.removeListener(_onApiServiceChanged);
    _disconnectAll();
    _balanceController.close();
    _transactionController.close();
    super.dispose();
  }
}
