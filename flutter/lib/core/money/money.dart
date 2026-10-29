import 'package:intl/intl.dart';

/// Formats integer minor units (100 per major unit) as "AED 3,200". Money is never a double
/// outside this function.
String formatMinor(int minor, String currency) {
  final major = minor ~/ 100;
  final cents = minor % 100;
  final f = NumberFormat.decimalPattern('en');
  final number = cents == 0
      ? f.format(major)
      : '${f.format(major)}.${cents.toString().padLeft(2, '0')}';
  return '$currency $number';
}
