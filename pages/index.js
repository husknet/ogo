import { useEffect, useState } from 'react';

export default function Home() {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch('/api/proxy');
                
                if (response.ok) {
                    const text = await response.text();
                    setContent(text);
                } else {
                    setError(`Error fetching content: ${response.statusText}`);
                }
            } catch (err) {
                setError(`Error fetching content: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h1>Content from Proxy</h1>
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
}
