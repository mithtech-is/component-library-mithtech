import 'package:flutter/material.dart';
import 'generated/tonaldepth_tokens.dart';

@immutable
class TonalDepthTheme extends ThemeExtension<TonalDepthTheme> {
  const TonalDepthTheme({required this.background, required this.surface, required this.ink, required this.inkMuted, required this.brand, required this.accent, required this.error, required this.success});
  final Color background, surface, ink, inkMuted, brand, accent, error, success;
  static const light = TonalDepthTheme(background: TonalDepthGeneratedColors.bgLight, surface: TonalDepthGeneratedColors.surfaceLight, ink: TonalDepthGeneratedColors.inkLight, inkMuted: TonalDepthGeneratedColors.ink2Light, brand: TonalDepthGeneratedColors.brandLight, accent: TonalDepthGeneratedColors.accentLight, error: TonalDepthGeneratedColors.errorLight, success: TonalDepthGeneratedColors.greenLight);
  static const dark = TonalDepthTheme(background: TonalDepthGeneratedColors.bgDark, surface: TonalDepthGeneratedColors.surfaceDark, ink: TonalDepthGeneratedColors.inkDark, inkMuted: TonalDepthGeneratedColors.ink2Dark, brand: TonalDepthGeneratedColors.brandDark, accent: TonalDepthGeneratedColors.accentDark, error: TonalDepthGeneratedColors.errorDark, success: TonalDepthGeneratedColors.greenDark);
  static ThemeData material({Brightness brightness = Brightness.light}) {
    final tokens = brightness == Brightness.dark ? dark : light;
    return ThemeData(brightness: brightness, scaffoldBackgroundColor: tokens.background, colorScheme: ColorScheme.fromSeed(seedColor: tokens.brand, brightness: brightness, error: tokens.error), extensions: [tokens], fontFamily: 'Hanken Grotesk');
  }
  @override TonalDepthTheme copyWith({Color? background, Color? surface, Color? ink, Color? inkMuted, Color? brand, Color? accent, Color? error, Color? success}) => TonalDepthTheme(background: background ?? this.background, surface: surface ?? this.surface, ink: ink ?? this.ink, inkMuted: inkMuted ?? this.inkMuted, brand: brand ?? this.brand, accent: accent ?? this.accent, error: error ?? this.error, success: success ?? this.success);
  @override TonalDepthTheme lerp(covariant TonalDepthTheme? other, double t) { if (other == null) return this; return TonalDepthTheme(background: Color.lerp(background, other.background, t)!, surface: Color.lerp(surface, other.surface, t)!, ink: Color.lerp(ink, other.ink, t)!, inkMuted: Color.lerp(inkMuted, other.inkMuted, t)!, brand: Color.lerp(brand, other.brand, t)!, accent: Color.lerp(accent, other.accent, t)!, error: Color.lerp(error, other.error, t)!, success: Color.lerp(success, other.success, t)!); }
}

extension TonalDepthThemeContext on BuildContext {
  TonalDepthTheme get tonalDepth => Theme.of(this).extension<TonalDepthTheme>() ?? TonalDepthTheme.light;
}
