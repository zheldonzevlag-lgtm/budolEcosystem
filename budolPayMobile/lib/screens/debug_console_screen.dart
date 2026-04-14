import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';

class DebugConsoleScreen extends StatefulWidget {
  const DebugConsoleScreen({super.key});

  @override
  State<DebugConsoleScreen> createState() => _DebugConsoleScreenState();
}

class _DebugConsoleScreenState extends State<DebugConsoleScreen> {
  bool _showSystemInfo = false;

  @override
  Widget build(BuildContext context) {
    final apiService = context.watch<ApiService>();
    final logs = apiService.debugLogs.reversed.toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Debug Console', style: TextStyle(color: Colors.white, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep, color: Colors.white70),
            onPressed: () => apiService.clearDebugLogs(),
            tooltip: 'Clear Logs',
          ),
          IconButton(
            icon: Icon(_showSystemInfo ? Icons.info : Icons.info_outline, color: Colors.white70),
            onPressed: () => setState(() => _showSystemInfo = !_showSystemInfo),
            tooltip: 'System Info',
          ),
        ],
      ),
      body: Column(
        children: [
          if (_showSystemInfo) _buildSystemInfo(apiService),
          Expanded(
            child: logs.isEmpty
                ? const Center(
                    child: Text(
                      'No logs captured yet.\nTry performing some actions.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white38),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: logs.length,
                    separatorBuilder: (context, index) => const Divider(height: 24, color: Colors.white10),
                    itemBuilder: (context, index) => _buildLogItem(logs[index]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSystemInfo(ApiService apiService) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        border: Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _infoRow('Base URL', apiService.baseUrl),
          _infoRow('Auth URL', apiService.authUrl),
          _infoRow('Device ID', apiService.deviceId),
          _infoRow('App Version', apiService.appVersion),
          _infoRow('Connection', apiService.isAuthenticated ? 'Authenticated' : 'Guest'),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: const TextStyle(color: Colors.white38, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
          Expanded(
            child: SelectableText(value, style: const TextStyle(color: Colors.white70, fontSize: 12, fontFamily: 'monospace')),
          ),
        ],
      ),
    );
  }

  Widget _buildLogItem(ApiLog log) {
    final color = _getLogColor(log.type);
    final timeStr = DateFormat('HH:mm:ss.SSS').format(log.timestamp);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: color.withValues(alpha: 0.5)),
              ),
              child: Text(
                log.type.name.toUpperCase(),
                style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 8),
            Text(timeStr, style: const TextStyle(color: Colors.white38, fontSize: 11)),
            const Spacer(),
            if (log.statusCode != null)
              Text(
                'HTTP ${log.statusCode}',
                style: TextStyle(
                  color: log.statusCode! >= 200 && log.statusCode! < 300 ? Colors.greenAccent : Colors.redAccent,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        SelectableText(
          '${log.method ?? ''} ${log.url}',
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
        ),
        if (log.requestBody != null) ...[
          const SizedBox(height: 8),
          const Text('REQUEST BODY:', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
          _buildCodeBlock(log.requestBody!),
        ],
        if (log.responseBody != null) ...[
          const SizedBox(height: 8),
          const Text('RESPONSE:', style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold)),
          _buildCodeBlock(log.responseBody!),
        ],
        if (log.error != null) ...[
          const SizedBox(height: 8),
          const Text('ERROR:', style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold)),
          _buildCodeBlock(log.error!, isError: true),
        ],
      ],
    );
  }

  Widget _buildCodeBlock(String content, {bool isError = false}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 4),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(4),
      ),
      child: SelectableText(
        content,
        style: TextStyle(
          color: isError ? Colors.redAccent.shade100 : Colors.greenAccent.shade100,
          fontSize: 11,
          fontFamily: 'monospace',
        ),
      ),
    );
  }

  Color _getLogColor(LogType type) {
    switch (type) {
      case LogType.request: return Colors.blueAccent;
      case LogType.response: return Colors.greenAccent;
      case LogType.error: return Colors.redAccent;
      case LogType.info: return Colors.orangeAccent;
    }
  }
}
