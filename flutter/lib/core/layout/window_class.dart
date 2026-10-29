import 'package:flutter/widgets.dart';

/// Window size classes. Layout depends on window width, never on device type, and only
/// `lib/core/layout` and screens that pick a grid column count read it.
enum WindowClass {
  /// Under 600dp: floating bottom bar.
  compact,

  /// 600 to 1199dp: side rail.
  medium,

  /// 1200dp and up: full sidebar.
  expanded;

  static const double mediumBreakpoint = 600;
  static const double expandedBreakpoint = 1200;

  static WindowClass forWidth(double width) {
    if (width >= expandedBreakpoint) return WindowClass.expanded;
    if (width >= mediumBreakpoint) return WindowClass.medium;
    return WindowClass.compact;
  }
}

extension WindowClassContext on BuildContext {
  WindowClass get windowClass =>
      WindowClass.forWidth(MediaQuery.sizeOf(this).width);

  LayoutMetrics get layout => LayoutMetrics.of(windowClass);
}

class LayoutMetrics {
  const LayoutMetrics._(this.windowClass, this.railWidth);

  factory LayoutMetrics.of(WindowClass windowClass) => switch (windowClass) {
    WindowClass.compact => const LayoutMetrics._(WindowClass.compact, 0),
    WindowClass.medium => const LayoutMetrics._(WindowClass.medium, 96),
    WindowClass.expanded => const LayoutMetrics._(WindowClass.expanded, 240),
  };

  final WindowClass windowClass;

  /// Width taken by the side rail or sidebar; 0 when the bottom bar is used.
  final double railWidth;
}
