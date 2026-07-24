/**
 * DiagnosticErrorBoundary — TEMPORAL (diagnóstico de crash al arrancar).
 *
 * En un APK release, un error de JS no muestra la pantalla roja de dev: la app
 * queda en blanco o se cierra. Este boundary atrapa:
 *   1. Errores de render de React (getDerivedStateFromError / componentDidCatch).
 *   2. Errores globales de JS (ErrorUtils.setGlobalHandler) — async, listeners,
 *      cosas fuera del árbol de render.
 * y en vez de cerrar la app, pinta el mensaje + stack en pantalla para poder
 * fotografiarlo. QUITAR una vez identificado el crash.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

type Props = { children: React.ReactNode };
type State = { error: Error | null; source: string; componentStack: string };

export class DiagnosticErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, source: '', componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, source: 'render' };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ error, source: 'render', componentStack: info?.componentStack ?? '' });
  }

  componentDidMount() {
    // Atrapar errores globales de JS (fuera del render) para que también se vean.
    const g: any = (global as any).ErrorUtils;
    if (g?.setGlobalHandler) {
      const prev = g.getGlobalHandler?.();
      g.setGlobalHandler((error: any, isFatal?: boolean) => {
        if (!this.state.error) {
          this.setState({
            error: error instanceof Error ? error : new Error(String(error)),
            source: isFatal ? 'global-fatal' : 'global',
          });
        }
        try { prev?.(error, isFatal); } catch { /* no-op */ }
      });
    }
  }

  render() {
    const { error, source, componentStack } = this.state;
    if (!error) return this.props.children;
    return (
      <ScrollView style={s.wrap} contentContainerStyle={s.content}>
        <Text style={s.title}>⚠️ Crash capturado ({source})</Text>
        <Text style={s.label}>Mensaje</Text>
        <Text style={s.mono}>{error.name}: {error.message}</Text>
        {!!error.stack && (
          <>
            <Text style={s.label}>Stack</Text>
            <Text style={s.mono}>{error.stack}</Text>
          </>
        )}
        {!!componentStack && (
          <>
            <Text style={s.label}>Componentes</Text>
            <Text style={s.mono}>{componentStack}</Text>
          </>
        )}
      </ScrollView>
    );
  }
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#7f1d1d' },
  content: { padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 16 },
  label: { color: '#fecaca', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 16, marginBottom: 4 },
  mono: { color: '#fff', fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
});
