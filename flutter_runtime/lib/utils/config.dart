/// Central configuration using --dart-define with localhost defaults.
class AppConfig {
  static const String goServerUrl = String.fromEnvironment(
    'GO_SERVER_URL',
    defaultValue: 'http://localhost:3000',
  );
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );
}
