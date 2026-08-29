import 'package:flutter/material.dart';
import '../tonaldepth_theme.dart';
class TdCard extends StatelessWidget {
  const TdCard({required this.child, this.padding = const EdgeInsets.all(16), super.key});
  final Widget child; final EdgeInsetsGeometry padding;
  @override Widget build(BuildContext context) { final td=context.tonalDepth; return DecoratedBox(decoration: BoxDecoration(color: td.surface, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha:.14), offset: const Offset(3,3), blurRadius: 8), BoxShadow(color: Colors.white.withValues(alpha:.35), offset: const Offset(-2,-2), blurRadius: 6)]), child: Padding(padding: padding, child: child)); }
}
