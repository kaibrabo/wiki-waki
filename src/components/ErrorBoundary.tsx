import { Component, type ReactNode } from 'react';
import { Appearance, Pressable, StyleSheet, Text, View } from 'react-native';
import { logError } from '../lib/log';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Top-level safety net: if a render throws, show a calm fallback instead of a
 * white screen, report it through logError, and let the user retry. Built on
 * plain react-native primitives so the fallback still renders even if the UI kit
 * or theme provider was the thing that failed.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string }): void {
    logError(error, { tag: 'ErrorBoundary', extra: { componentStack: info?.componentStack } });
  }

  private reset = (): void => this.setState({ hasError: false });

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const dark = Appearance.getColorScheme() === 'dark';
    const c = dark ? palette.dark : palette.light;
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Text style={[styles.title, { color: c.text }]}>Something went wrong</Text>
        <Text style={[styles.body, { color: c.muted }]}>
          The app hit an unexpected error. Your alarms and saved places are safe.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={this.reset}
          style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const palette = {
  light: { bg: '#ffffff', text: '#0f172a', muted: '#59637a' },
  dark: { bg: '#000000', text: '#e7ecf5', muted: '#9aa7bd' },
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
