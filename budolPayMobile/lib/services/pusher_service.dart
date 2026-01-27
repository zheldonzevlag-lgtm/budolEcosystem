import 'package:flutter/foundation.dart';
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import 'dart:async';
import 'dart:convert';

class PusherService with ChangeNotifier {
  PusherChannelsFlutter pusher = PusherChannelsFlutter.getInstance();
  String? _userId;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  final _balanceController = StreamController<double>.broadcast();
  Stream<double> get balanceStream => _balanceController.stream;

  final _transactionController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get transactionStream => _transactionController.stream;

  Future<void> init({
    required String apiKey,
    required String cluster,
    required String? userId,
  }) async {
    if (userId == null) return;
    if (userId == _userId && _isConnected) return;

    _userId = userId;

    try {
      await pusher.init(
        apiKey: apiKey,
        cluster: cluster,
        onConnectionStateChange: onConnectionStateChange,
        onError: onError,
        onSubscriptionSucceeded: onSubscriptionSucceeded,
        onEvent: onEvent,
        onSubscriptionError: onSubscriptionError,
        onDecryptionFailure: onDecryptionFailure,
        onMemberAdded: onMemberAdded,
        onMemberRemoved: onMemberRemoved,
      );

      await pusher.subscribe(channelName: 'user-$userId');
      await pusher.connect();
    } catch (e) {
      if (kDebugMode) {
        print('PusherService: Error initializing: $e');
      }
    }
  }

  void onConnectionStateChange(dynamic currentState, dynamic previousState) {
    if (kDebugMode) {
      print("PusherService: Connection state changed from $previousState to $currentState");
    }
    _isConnected = currentState == 'CONNECTED';
    notifyListeners();
  }

  void onError(String message, int? code, dynamic e) {
    if (kDebugMode) {
      print("PusherService: Error: $message code: $code exception: $e");
    }
  }

  void onSubscriptionSucceeded(String channelName, dynamic data) {
    if (kDebugMode) {
      print("PusherService: Subscription succeeded for $channelName");
    }
  }

  void onEvent(PusherEvent event) {
    if (kDebugMode) {
      print("PusherService: Received event: ${event.eventName} on ${event.channelName}");
    }

    if (event.eventName == 'balance_update') {
      try {
        final data = json.decode(event.data);
        if (data != null && data['balance'] != null) {
          final balance = double.tryParse(data['balance'].toString()) ?? 0.0;
          _balanceController.add(balance);
        }
      } catch (e) {
        if (kDebugMode) print('PusherService: Error parsing balance_update: $e');
      }
    } else if (event.eventName == 'transaction_update') {
      try {
        final data = json.decode(event.data);
        if (data != null) {
          _transactionController.add(Map<String, dynamic>.from(data));
        }
      } catch (e) {
        if (kDebugMode) print('PusherService: Error parsing transaction_update: $e');
      }
    }
  }

  void onSubscriptionError(String message, dynamic e) {
    if (kDebugMode) {
      print("PusherService: Subscription error: $message exception: $e");
    }
  }

  void onDecryptionFailure(String event, String reason) {
    if (kDebugMode) {
      print("PusherService: Decryption failure: $event reason: $reason");
    }
  }

  void onMemberAdded(String channelName, PusherMember member) {
    if (kDebugMode) {
      print("PusherService: Member added to $channelName: ${member.userInfo}");
    }
  }

  void onMemberRemoved(String channelName, PusherMember member) {
    if (kDebugMode) {
      print("PusherService: Member removed from $channelName: ${member.userInfo}");
    }
  }

  Future<void> disconnect() async {
    try {
      if (_userId != null) {
        await pusher.unsubscribe(channelName: 'user-$_userId');
      }
      await pusher.disconnect();
      _isConnected = false;
      _userId = null;
      notifyListeners();
    } catch (e) {
      if (kDebugMode) print('PusherService: Error disconnecting: $e');
    }
  }

  @override
  void dispose() {
    disconnect();
    _balanceController.close();
    _transactionController.close();
    super.dispose();
  }
}