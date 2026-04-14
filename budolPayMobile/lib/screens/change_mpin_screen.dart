import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class ChangeMpinScreen extends StatefulWidget {
  const ChangeMpinScreen({super.key});

  @override
  State<ChangeMpinScreen> createState() => _ChangeMpinScreenState();
}

class _ChangeMpinScreenState extends State<ChangeMpinScreen> {
  final _formKey = GlobalKey<FormState>();
  final _oldPinController = TextEditingController();
  final _newPinController = TextEditingController();
  final _confirmPinController = TextEditingController();
  bool _isLoading = false;
  bool _showOldPin = false;
  bool _showNewPin = false;
  bool _showConfirmPin = false;

  @override
  void dispose() {
    _oldPinController.dispose();
    _newPinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  Future<void> _updateMpin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      await apiService.updateMpin(
        oldPin: _oldPinController.text,
        newPin: _newPinController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('MPIN updated successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Change MPIN', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFFF43F5E),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Update your security PIN to keep your wallet safe.',
                style: TextStyle(color: Color(0xFF64748B), fontSize: 16),
              ),
              const SizedBox(height: 32),

              // Old MPIN
              const Text(
                'Current MPIN',
                style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _oldPinController,
                obscureText: !_showOldPin,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: InputDecoration(
                  hintText: 'Enter current 6-digit MPIN',
                  filled: true,
                  fillColor: Colors.white,
                  counterText: '',
                  prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFFF43F5E)),
                  suffixIcon: IconButton(
                    icon: Icon(_showOldPin ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _showOldPin = !_showOldPin),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please enter current MPIN';
                  if (value.length != 6) return 'MPIN must be 6 digits';
                  return null;
                },
              ),
              const SizedBox(height: 24),

              // New MPIN
              const Text(
                'New MPIN',
                style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _newPinController,
                obscureText: !_showNewPin,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: InputDecoration(
                  hintText: 'Enter new 6-digit MPIN',
                  filled: true,
                  fillColor: Colors.white,
                  counterText: '',
                  prefixIcon: const Icon(Icons.security, color: Color(0xFFF43F5E)),
                  suffixIcon: IconButton(
                    icon: Icon(_showNewPin ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _showNewPin = !_showNewPin),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please enter new MPIN';
                  if (value.length != 6) return 'MPIN must be 6 digits';
                  if (value == _oldPinController.text) return 'New MPIN cannot be the same as old MPIN';
                  return null;
                },
              ),
              const SizedBox(height: 24),

              // Confirm New MPIN
              const Text(
                'Confirm New MPIN',
                style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _confirmPinController,
                obscureText: !_showConfirmPin,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: InputDecoration(
                  hintText: 'Re-enter new 6-digit MPIN',
                  filled: true,
                  fillColor: Colors.white,
                  counterText: '',
                  prefixIcon: const Icon(Icons.check_circle_outline, color: Color(0xFFF43F5E)),
                  suffixIcon: IconButton(
                    icon: Icon(_showConfirmPin ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _showConfirmPin = !_showConfirmPin),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please confirm new MPIN';
                  if (value != _newPinController.text) return 'MPINs do not match';
                  return null;
                },
              ),
              const SizedBox(height: 48),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _updateMpin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF43F5E),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Update MPIN',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
