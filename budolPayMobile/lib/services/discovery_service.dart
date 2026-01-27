import 'package:multicast_dns/multicast_dns.dart';
import 'package:flutter/foundation.dart';
import 'dart:async';

class DiscoveryService {
  static const String serviceType = '_budolpay._tcp.local';
  
  /// Discovers the budol₱ay API Gateway on the local network.
  /// Returns the IP address and port of the discovered service, or null if not found.
  Future<String?> discoverGateway() async {
    if (kIsWeb) return null;

    final MDnsClient client = MDnsClient();
    try {
      await client.start();
      
      if (kDebugMode) {
        print('Discovery: Looking for $serviceType...');
      }

      // Create a completer to handle the discovery result
      final completer = Completer<String?>();
      
      // Start lookup streams
      final ptrStream = client.lookup<PtrResourceRecord>(
        ResourceRecordQuery.serverPointer(serviceType)
      );

      final subscription = ptrStream.listen((ptr) async {
        final srvStream = client.lookup<SrvResourceRecord>(
          ResourceRecordQuery.service(ptr.domainName)
        );
        
        await for (final srv in srvStream) {
          final ipStream = client.lookup<IPAddressResourceRecord>(
            ResourceRecordQuery.addressIPv4(srv.target)
          );
          
          await for (final ip in ipStream) {
            final discoveredHost = '${ip.address.address}:${srv.port}';
            if (!completer.isCompleted) {
              completer.complete(discoveredHost);
            }
            return;
          }
        }
      });

      // Timeout after 2 seconds
      Timer(const Duration(seconds: 2), () {
        if (!completer.isCompleted) {
          if (kDebugMode) print('Discovery: Timed out');
          completer.complete(null);
        }
      });

      final result = await completer.future;
      await subscription.cancel();
      return result;
    } catch (e) {
      if (kDebugMode) {
        print('Discovery: Error during mDNS lookup: $e');
      }
    } finally {
      client.stop();
    }
    
    return null;
  }
}
