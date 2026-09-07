import 'package:flutter/material.dart';
import '../views/login_view.dart';

/// Global navigator key so services outside the widget tree (ApiService's
/// dio interceptor) can redirect to the login screen after a session is
/// forcibly cleared (e.g. refresh token expired/revoked).
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class NavigationService {
  static void redirectToLogin() {
    final state = navigatorKey.currentState;
    if (state == null) return;
    state.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginView()),
      (route) => false,
    );
  }
}
