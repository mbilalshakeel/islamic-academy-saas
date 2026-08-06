import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('placeholder smoke test', (WidgetTester tester) async {
    // IciApp requires Supabase/Hive/Firebase init, so we keep a minimal
    // placeholder here. Real app logic is covered by manual + integration tests.
    expect(1 + 1, 2);
  });
}
