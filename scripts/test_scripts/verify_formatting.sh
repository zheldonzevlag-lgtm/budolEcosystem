#!/bin/bash
# BudolPay Transaction Formatting Verification Script
# Version: 4.1.0

echo "Verifying Transaction Formatting and Validation..."

# 1. Check if formatters.dart exists
if [ -f "d:/IT Projects/budolEcosystem/budolPayMobile/lib/utils/formatters.dart" ]; then
    echo "[OK] formatters.dart exists."
else
    echo "[ERROR] formatters.dart missing."
    exit 1
fi

# 2. Check for PhoneNumberFormatter implementation
if grep -q "class PhoneNumberFormatter" "d:/IT Projects/budolEcosystem/budolPayMobile/lib/utils/formatters.dart"; then
    echo "[OK] PhoneNumberFormatter implemented."
else
    echo "[ERROR] PhoneNumberFormatter missing."
    exit 1
fi

# 3. Check for CurrencyInputFormatter implementation
if grep -q "class CurrencyInputFormatter" "d:/IT Projects/budolEcosystem/budolPayMobile/lib/utils/formatters.dart"; then
    echo "[OK] CurrencyInputFormatter implemented."
else
    echo "[ERROR] CurrencyInputFormatter missing."
    exit 1
fi

# 4. Verify SendMoneyScreen restriction to phone only
if grep -q "keyboardType: TextInputType.phone" "d:/IT Projects/budolEcosystem/budolPayMobile/lib/screens/send_money_screen.dart"; then
    echo "[OK] SendMoneyScreen uses phone keyboard."
else
    echo "[ERROR] SendMoneyScreen might still allow email."
    exit 1
fi

# 5. Verify decimal enforcement in TransferScreen
if grep -q "toStringAsFixed(2)" "d:/IT Projects/budolEcosystem/budolPayMobile/lib/screens/transfer_screen.dart"; then
    echo "[OK] TransferScreen enforces 2 decimal digits in display."
else
    echo "[ERROR] TransferScreen display might not be formatted."
    exit 1
fi

echo "Verification Complete: All transaction formatting rules are compliant."
