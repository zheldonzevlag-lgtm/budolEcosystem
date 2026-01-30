import 'package:flutter/material.dart';
import '../utils/ui_utils.dart';
import '../utils/formatters.dart' as budol_format;
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class TransactionDetailsScreen extends StatefulWidget {
  final dynamic transaction;

  const TransactionDetailsScreen({super.key, required this.transaction});

  @override
  State<TransactionDetailsScreen> createState() => _TransactionDetailsScreenState();
}

class _TransactionDetailsScreenState extends State<TransactionDetailsScreen> {
  bool _isFavoriting = false;
  bool _isFavorite = false;

  @override
  void initState() {
    super.initState();
    _checkIfFavorite();
  }

  Future<void> _checkIfFavorite() async {
    if (widget.transaction['type'] != 'P2P_TRANSFER' || widget.transaction['receiverId'] == null) return;
    
    final apiService = Provider.of<ApiService>(context, listen: false);
    final favorites = await apiService.getFavorites();
    if (mounted) {
      setState(() {
        _isFavorite = favorites.any((f) => f['recipientId'] == widget.transaction['receiverId']);
      });
    }
  }

  Future<void> _toggleFavorite() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    final recipientId = widget.transaction['receiverId'];
    if (recipientId == null) return;

    setState(() => _isFavoriting = true);
    try {
      if (_isFavorite) {
        await apiService.removeFavorite(recipientId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Removed from favorites')),
          );
        }
      } else {
        await apiService.addFavorite(recipientId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Added to favorites')),
          );
        }
      }
      if (mounted) {
        setState(() {
          _isFavorite = !_isFavorite;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isFavoriting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isIncome = widget.transaction['isIncome'] ?? false;
    final String amountPrefix = isIncome ? '+' : '-';
    final Color amountColor = isIncome ? Colors.green : Colors.red;
    
    // Safe parsing of amount
    double amount = 0.0;
    if (widget.transaction['amount'] != null) {
      if (widget.transaction['amount'] is num) {
        amount = (widget.transaction['amount'] as num).toDouble();
      } else {
        amount = double.tryParse(widget.transaction['amount'].toString()) ?? 0.0;
      }
    }

    final String amountStr = '$amountPrefix ₱${NumberFormat('#,##0.00').format(amount)}';
    
    // Parse date
    String dateStr = 'N/A';
    String timeStr = 'N/A';
    if (widget.transaction['createdAt'] != null) {
      try {
        final date = DateTime.parse(widget.transaction['createdAt']);
        dateStr = DateFormat('MMMM d, yyyy').format(budol_format.DateUtils.toManila(date));
        timeStr = budol_format.DateUtils.formatTimeOnly(date);
      } catch (e) {
        dateStr = widget.transaction['createdAt'].toString();
      }
    }

    final bool canFavorite = !isIncome && 
                           widget.transaction['type'] == 'P2P_TRANSFER' && 
                           widget.transaction['receiverId'] != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transaction Details'),
        backgroundColor: const Color(0xFFF43F5E),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(13),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 35,
                    backgroundColor: const Color(0xFFF43F5E).withAlpha(26),
                    child: const Icon(Icons.payment, size: 35, color: Color(0xFFF43F5E)),
                  ),
                  const SizedBox(height: 16),
                  UIUtils.formatBudolPayText(
                    isIncome 
                      ? (widget.transaction['sender'] != null 
                          ? '${widget.transaction['sender']['firstName'] ?? ''} ${widget.transaction['sender']['lastName'] ?? ''}'.trim()
                          : widget.transaction['description'] ?? 'Money Received')
                      : (widget.transaction['receiver'] != null
                          ? '${widget.transaction['receiver']['firstName'] ?? ''} ${widget.transaction['receiver']['lastName'] ?? ''}'.trim()
                          : (widget.transaction['storeName'] ?? widget.transaction['description'] ?? 'Money Sent')),
                    baseStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    amountStr,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: amountColor,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.green.withAlpha(26),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.green.withAlpha(50), width: 1),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.check_circle, size: 14, color: Colors.green),
                        SizedBox(width: 6),
                        Text(
                          'COMPLETED',
                          style: TextStyle(
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'DETAILS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                      letterSpacing: 1.2,
                    ),
                  ),
                  if (widget.transaction['receiver'] != null && !isIncome)
                    _buildDetailRow('Recipient Full Name', '${widget.transaction['receiver']['firstName'] ?? ''} ${widget.transaction['receiver']['lastName'] ?? ''}'.trim()),
                  if (widget.transaction['sender'] != null && isIncome)
                    _buildDetailRow('Sender Full Name', '${widget.transaction['sender']['firstName'] ?? ''} ${widget.transaction['sender']['lastName'] ?? ''}'.trim()),
                  
                  // Store Name (Prominent if exists)
                  if (widget.transaction['storeName'] != null)
                    _buildDetailRow('Store Name', widget.transaction['storeName']),
                  
                  // ID and Reference merged if possible for cleaner look
                  _buildDetailRow('Transaction ID', widget.transaction['id'] ?? 'N/A'),
                  // Reference No (Generated by budolPay)
                  // _buildDetailRow('Reference No.', widget.transaction['reference'] ?? widget.transaction['id']?.toString().substring(0, 8).toUpperCase() ?? 'N/A'),
                  
                  // Added Order # and Reference ID as requested
                  if (widget.transaction['orderId'] != null)
                    _buildDetailRow('Order #', widget.transaction['orderId']),
                  if (widget.transaction['referenceId'] != null)
                    _buildDetailRow('Reference ID', widget.transaction['referenceId']),

                  _buildDetailRow('Date', dateStr),
                  _buildDetailRow('Time', timeStr),
                  _buildDetailRow('Type', isIncome ? 'Cash In / Received' : 'Payment / Sent'),
                  const SizedBox(height: 32),
                  
                  Row(
                    children: [
                      Expanded(
                        child: canFavorite 
                          ? ElevatedButton(
                              onPressed: _isFavoriting ? null : _toggleFavorite,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                backgroundColor: _isFavorite ? Colors.grey : const Color(0xFFF43F5E),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: _isFavoriting 
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(_isFavorite ? Icons.favorite : Icons.favorite_border, size: 18),
                                      const SizedBox(width: 8),
                                      Flexible(
                                        child: Text(
                                          _isFavorite ? 'Remove' : 'Favorite',
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                            )
                          : ElevatedButton(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Share feature coming soon!')),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                backgroundColor: const Color(0xFFF43F5E),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.share, size: 18),
                                  SizedBox(width: 8),
                                  Flexible(
                                    child: Text(
                                      'Share',
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Receipt feature coming soon!')),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFFF43F5E),
                            elevation: 0,
                            side: const BorderSide(color: Color(0xFFF43F5E)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.receipt, size: 18),
                              SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  'Receipt',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    const slate600 = Color(0xFF475569);
    const slate400 = Color(0xFF94A3B8);
    const fontSize = 8.0;
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Colors.grey.withAlpha(26), width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: fontSize,
              color: slate400,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 16),
          Flexible(
            child: UIUtils.formatBudolPayText(
              value,
              baseStyle: const TextStyle(
                fontSize: fontSize,
                fontWeight: FontWeight.w600,
                color: slate600,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
