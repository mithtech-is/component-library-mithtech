import 'package:flutter/material.dart';
import '../tonaldepth_theme.dart';
class TdTextField extends StatelessWidget {
  const TdTextField({required this.label, this.controller, this.helperText, this.errorText, this.enabled = true, this.maxLines = 1, super.key});
  final String label; final TextEditingController? controller; final String? helperText, errorText; final bool enabled; final int maxLines;
  @override Widget build(BuildContext context) { final td=context.tonalDepth; return TextField(controller: controller, enabled: enabled, maxLines: maxLines, decoration: InputDecoration(labelText: label, helperText: helperText, errorText: errorText, filled: true, fillColor: td.surface, border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none))); }
}
