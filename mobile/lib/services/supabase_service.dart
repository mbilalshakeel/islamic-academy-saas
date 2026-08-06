import 'package:supabase_flutter/supabase_flutter.dart';
import '../flavors/app_config.dart';

/// Singleton Supabase client configured from the white-label [AppConfig].
///
/// Uses only the PUBLIC anon key (same as the web app). RLS enforces tenant
/// isolation at the database level, so a client build can only ever see its
/// own tenant's data.
class SupabaseService {
  SupabaseService._();
  static final SupabaseService instance = SupabaseService._();

  SupabaseClient? _client;

  SupabaseClient get client {
    final c = _client;
    if (c != null) return c;
    throw StateError('Supabase not initialised. Call init() first.');
  }

  /// Initialises the Supabase client with the app config's URL + anon key.
  Future<void> init() async {
    await Supabase.initialize(
      url: AppConfig.current.supabaseUrl,
      publishableKey: AppConfig.current.supabaseAnonKey,
    );
    _client = Supabase.instance.client;
  }

  /// The tenant-scoped RLS boundary. All content reads filter on this.
  String get tenantId => AppConfig.current.tenantId;

  Future<Map<String, dynamic>?> fetchTenantBySlug() async {
    final rows = await client.rpc('get_tenant_by_slug', params: {
      'p_slug': AppConfig.current.tenantSlug,
    });
    if (rows is List && rows.isNotEmpty) {
      return (rows.first as Map).cast<String, dynamic>();
    }
    return null;
  }
}
