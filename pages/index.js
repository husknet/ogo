import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [content, setContent] = useState('');

  useEffect(() => {
    // Fetch the proxied content from the API route
    async function fetchProxiedContent() {
      try {
        const response = await fetch('/api/proxy');
        const data = await response.text();
        setContent(data);
      } catch (error) {
        console.error('Error fetching proxied content:', error);
        setContent('Failed to load content.');
      }
    }

    fetchProxiedContent();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Proxied Content</title>
        <meta name="description" content="Displaying content from an upstream URL through a proxy." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Proxied Content from Upstream
        </h1>

        <div className={styles.content}>
          <p>{content}</p>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <img src="/vercel.svg" alt="Vercel Logo" />
          </span>
        </a>
      </footer>
    </div>
  );
}
