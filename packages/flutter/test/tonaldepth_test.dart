import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tonaldepth_flutter/tonaldepth_flutter.dart';
void main() {
  test('theme modes retain canonical brand', () { expect(TonalDepthTheme.light.brand, const Color(0xFFFF5E29)); expect(TonalDepthTheme.dark.background, const Color(0xFF1A1815)); });
  testWidgets('widgets expose semantics and state', (tester) async { var presses=0; await tester.pumpWidget(MaterialApp(theme:TonalDepthTheme.material(), home:Scaffold(body:Column(children:[TdButton(label:'Save',onPressed:(){presses++;},variant:TdButtonVariant.primary),const TdBadge('Ready',variant:TdBadgeVariant.success),const TdTextField(label:'Email',errorText:'Required')])))); expect(find.text('Save'),findsOneWidget); await tester.tap(find.text('Save')); expect(presses,1); expect(find.text('Required'),findsOneWidget); expect(tester.getSemantics(find.byType(TdButton)),matchesSemantics(isButton:true,isEnabled:true,hasEnabledState:true)); });
  testWidgets('loading disables activation', (tester) async { var presses=0; await tester.pumpWidget(MaterialApp(theme:TonalDepthTheme.material(),home:TdButton(label:'Save',loading:true,onPressed:(){presses++;}))); await tester.tap(find.byType(TdButton)); expect(presses,0); expect(find.byType(CircularProgressIndicator),findsOneWidget); });
}
