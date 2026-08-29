import 'package:flutter/material.dart';
import '../tonaldepth_theme.dart';
enum TdButtonVariant { primary, secondary, destructive }
class TdButton extends StatelessWidget {
  const TdButton({required this.label, required this.onPressed, this.variant = TdButtonVariant.secondary, this.loading = false, super.key});
  final String label; final VoidCallback? onPressed; final TdButtonVariant variant; final bool loading;
  @override Widget build(BuildContext context) {
    final td = context.tonalDepth;
    final fill = switch (variant) { TdButtonVariant.primary => td.brand, TdButtonVariant.destructive => td.error, TdButtonVariant.secondary => td.surface };
    final foreground = variant == TdButtonVariant.secondary ? td.ink : Colors.white;
    return Semantics(button: true, enabled: onPressed != null && !loading, child: FilledButton(style: FilledButton.styleFrom(backgroundColor: fill, foregroundColor: foreground, minimumSize: const Size(0, 44), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))), onPressed: loading ? null : onPressed, child: loading ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)) : Text(label)));
  }
}
