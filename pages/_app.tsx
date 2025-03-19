import '../styles/globals.css';
import type { AppProps } from 'next/app'; // Correct import

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}