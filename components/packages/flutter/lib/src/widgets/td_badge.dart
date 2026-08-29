import 'package:flutter/material.dart';
import '../tonaldepth_theme.dart';
enum TdBadgeVariant { neutral, brand, success, danger }
class TdBadge extends StatelessWidget {
  const TdBadge(this.label, {this.variant = TdBadgeVariant.neutral, super.key});
  final String label; final TdBadgeVariant variant;
  @override Widget build(BuildContext context) { final td=context.tonalDepth; final color=switch(variant){TdBadgeVariant.neutral=>td.inkMuted,TdBadgeVariant.brand=>td.brand,TdBadgeVariant.success=>td.success,TdBadgeVariant.danger=>td.error}; return Semantics(label: label, child: DecoratedBox(decoration: BoxDecoration(color: color.withValues(alpha:.14), borderRadius: BorderRadius.circular(999)), child: Padding(padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4), child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600))))); }
}
